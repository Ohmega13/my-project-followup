import React, { useState, useEffect } from 'react';
import { User, Shield, Settings as SettingsIcon, Save, Key, Plus, Trash2, Edit, ExternalLink, DownloadCloud, Activity, AlertCircle, RefreshCw, Database, UploadCloud } from 'lucide-react';
import { Card } from '../ui/Card';
import { API } from '../../services/api';
import { Badge } from '../ui/Badge';
import { UserAvatar } from '../common/UserAvatar';

export default function SettingsView({ currentUser, onLogout }) {
    const [activeTab, setActiveTab] = useState('profile');
    const [googleScriptUrl, setGoogleScriptUrl] = useState('');
    const [lineToken, setLineToken] = useState('');
    const [users, setUsers] = useState([]);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    // Avatar Config State
    const [avatarConfig, setAvatarConfig] = useState({ text: '', bg: '#3b82f6', fg: '#ffffff' });

    // Initial State for New/Edit User
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        role: 'viewer',
        permissions: {
            canEdit: false,
            canDelete: false,
            pages: ['dashboard']
        }
    });

    // Load settings from localStorage on mount
    useEffect(() => {
        const savedUrl = localStorage.getItem('google_script_url') || '';
        const savedToken = localStorage.getItem('line_notify_token') || '';
        setGoogleScriptUrl(savedUrl);
        setLineToken(savedToken);
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const data = await API.getUsers();
            setUsers(data || []);
        } catch (error) {
            console.error("Failed to load users", error);
            setUsers([]);
        }
    };

    const handleSaveSystem = () => {
        localStorage.setItem('google_script_url', googleScriptUrl);
        localStorage.setItem('line_notify_token', lineToken);
        alert('บันทึกการตั้งค่าเรียบร้อยแล้ว');
    };

    const handleBackup = async () => {
        try {
            const data = await API.backupDatabase();
            if (!data) throw new Error("Connection failed");

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup_projectflow_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (e) {
            alert('Backup Failed: ' + e.message);
        }
    };

    const handleRestore = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const json = JSON.parse(e.target.result);
                if (confirm(`Restore Database from ${file.name}?\n\nThis will OVERWRITE all current data.`)) {
                    await API.restoreDatabase(json);
                    alert('Restore Successful! Reloading...');
                    window.location.reload();
                }
            } catch (err) {
                alert('Invalid Backup File');
            }
        };
        reader.readAsText(file);
    };

    const handleEditUser = (user) => {
        setEditingUser(user);
        setFormData({ ...user });

        // Parse Avatar Config
        let config = { text: '', bg: '#3b82f6', fg: '#ffffff' };
        if (user.avatar && user.avatar.startsWith('{')) {
            try {
                config = JSON.parse(user.avatar);
            } catch (e) {
                config.text = user.avatar.substring(0, 2).toUpperCase();
            }
        } else {
            config.text = user.avatar || (user.name ? user.name.substring(0, 2).toUpperCase() : '??');
            // Infer legacy colors? Or default.
            if (user.role === 'admin') { config.bg = '#eff6ff'; config.fg = '#2563eb'; }
        }
        setAvatarConfig(config);
        setIsUserModalOpen(true);
    };

    const handleAddUser = () => {
        setEditingUser(null);
        setFormData({
            name: '',
            username: '',
            role: 'viewer',
            permissions: {
                canEdit: false,
                canDelete: false,
                canApprove: false,
                pages: ['dashboard', 'kanban', 'calendar', 'timeline']
            }
        });
        setAvatarConfig({ text: '', bg: '#3b82f6', fg: '#ffffff' });
        setIsUserModalOpen(true);
    };

    const handleSaveUser = async (e) => {
        e.preventDefault();

        // Validate Avatar Text
        if (!avatarConfig.text || avatarConfig.text.length > 2) {
            alert('Avatar Text ต้องมี 1-2 ตัวอักษร');
            return;
        }

        // Check Duplicate Avatar Text
        const isDuplicate = users.some(u => {
            if (editingUser && u.id === editingUser.id) return false;
            let uText = '';
            if (u.avatar && u.avatar.startsWith('{')) {
                try { uText = JSON.parse(u.avatar).text; } catch (e) { }
            } else {
                uText = u.avatar;
            }
            return uText === avatarConfig.text;
        });

        if (isDuplicate) {
            alert(`Avatar "${avatarConfig.text}" มีผู้ใช้งานแล้ว กรุณาเปลี่ยนตัวอักษร`);
            return;
        }

        const avatarJson = JSON.stringify(avatarConfig);
        await API.saveUser({ ...formData, avatar: avatarJson });
        setIsUserModalOpen(false);
        loadUsers();
    };

    // ... Other handlers ...

    const handlePermissionChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                [field]: value
            }
        }));
    };

    const handlePagePermissionChange = (page) => {
        if (formData.role === 'admin') return; // Admin always has all pages

        const currentPages = formData.permissions.pages || [];
        const newPages = currentPages.includes(page)
            ? currentPages.filter(p => p !== page)
            : [...currentPages, page];

        handlePermissionChange('pages', newPages);
    };

    const handleRoleChange = (role) => {
        let newPermissions = { ...formData.permissions };

        if (role === 'admin') {
            newPermissions = {
                canEdit: true,
                canDelete: true,
                canApprove: true,
                pages: ['dashboard', 'kanban', 'calendar', 'timeline', 'reports', 'settings']
            };
        } else if (role === 'viewer') {
            newPermissions = {
                ...newPermissions,
                canEdit: false,
                canDelete: false,
                canApprove: false
            };
        }
        // Editor keeps current or default permissions, user modifies them. 
        // If switching from Admin to Editor, might want to reset? 
        // But user can just untick.

        setFormData(prev => ({ ...prev, role, permissions: newPermissions }));
    };

    const tabs = [
        { id: 'profile', label: 'โปรไฟล์ส่วนตัว', icon: User },
        { id: 'permissions', label: 'สิทธิ์การใช้งาน', icon: Shield, hidden: currentUser.role !== 'admin' },
        { id: 'system', label: 'การเชื่อมต่อระบบ', icon: SettingsIcon, hidden: currentUser.role !== 'admin' },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">การตั้งค่า (Settings)</h2>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row min-h-[600px]">
                {/* Sidebar Tabs */}
                <div className="w-full md:w-64 bg-slate-50 border-r border-slate-200 p-4 space-y-2">
                    {tabs.filter(t => !t.hidden).map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-200'}`}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                    <div className="pt-4 mt-4 border-t border-slate-200">
                        <button onClick={onLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg font-medium">
                            ออกจากระบบ
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-8 overflow-y-auto max-h-[800px]">
                    {activeTab === 'profile' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-4 mb-4">ข้อมูลส่วนตัว</h3>
                            <div className="flex items-center gap-6 mb-8">
                                <UserAvatar user={currentUser} size="xl" className="shadow-sm" />
                                <div>
                                    <h4 className="text-2xl font-bold text-slate-800">{currentUser.name}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge type={currentUser.role === 'admin' ? 'primary' : 'default'}>{currentUser.role.toUpperCase()}</Badge>
                                        <span className="text-slate-400 text-sm">@{currentUser.username}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ชื่อ-นามสกุล</label>
                                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium">
                                        {currentUser.name}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">อีเมล / ข้อมูลติดต่อ</label>
                                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium">
                                        {currentUser.email || '-'}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ตำแหน่ง / บทบาท</label>
                                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium capitalize">
                                        {currentUser.role}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Username</label>
                                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium">
                                        {currentUser.username}
                                    </div>
                                </div>

                                <div className="col-span-2 space-y-2 pt-2">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">สิทธิ์การเข้าถึงระบบ</label>
                                    <div className="flex flex-wrap gap-2">
                                        {currentUser.permissions?.canEdit && (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                แก้ไขงานได้
                                            </span>
                                        )}
                                        {currentUser.permissions?.canDelete && (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                ลบข้อมูลได้
                                            </span>
                                        )}
                                        {currentUser.permissions?.pages?.map(page => (
                                            <span key={page} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 capitalize">
                                                {page}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'permissions' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
                                <h3 className="text-lg font-bold text-slate-800">จัดการสิทธิ์ผู้ใช้งาน</h3>
                                <button onClick={handleAddUser} className="flex items-center gap-2 text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors">
                                    <Plus size={16} /> เพิ่มผู้ใช้งาน
                                </button>
                            </div>

                            <div className="space-y-4">
                                {users.map(user => (
                                    <Card key={user.id} className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <UserAvatar user={user} size="md" />
                                            <div>
                                                <p className="font-bold text-slate-800">{user.name}</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-slate-500">@{user.username}</span>
                                                    <Badge type={user.role === 'admin' ? 'primary' : 'default'}>{user.role}</Badge>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleEditUser(user)}
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="แก้ไขสิทธิ์"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            {user.username !== 'admin' && (
                                                <button
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="ลบผู้ใช้งาน"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'system' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-4 mb-4">การเชื่อมต่อระบบ (System Integrations)</h3>

                            <div className="space-y-6">
                                {/* 1. Database Synchronization */}
                                <Card className="p-6 border-orange-200 bg-gradient-to-br from-orange-50 to-white overflow-hidden relative">
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <RefreshCw size={100} className="text-orange-500 -rotate-12" />
                                    </div>
                                    <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center">
                                        <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                                            <RefreshCw size={24} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-bold text-slate-800 text-lg">Database Synchronization</h4>
                                                <Badge type="warning">Maintenance</Badge>
                                            </div>
                                            <p className="text-slate-600 text-sm max-w-xl">
                                                ตรวจสอบความสมบูรณ์ของข้อมูล รวมข้อมูลซ้ำซ้อน และกู้คืนโฟลเดอร์ระบบ
                                            </p>
                                        </div>
                                        <button
                                            onClick={async () => {
                                                if (confirm('ยืนยันการซิงค์ฐานข้อมูล? (Database Sync)\n\nระบบจะทำการตรวจสอบและแก้ไขข้อมูลให้ถูกต้อง')) {
                                                    try {
                                                        const res = await API.syncDatabase();
                                                        if (res.success) {
                                                            const s = res.stats;
                                                            alert(`✅ Sync Complete!\n\nRemoved Duplicates:\n- Projects: ${s.projects}\n- Tasks: ${s.tasks}\n- Folders: ${s.folders}\n\nFolders Restored: ${s.folderSync.added}`);
                                                        } else {
                                                            alert('Failed to sync. Please check connection.');
                                                        }
                                                    } catch (e) {
                                                        alert(e.message);
                                                    }
                                                }
                                            }}
                                            className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold shadow-md shadow-orange-200 transition-all flex items-center gap-2 whitespace-nowrap"
                                        >
                                            <RefreshCw size={18} /> Sync Now
                                        </button>
                                    </div>
                                </Card>

                                {/* 2. Database Management */}
                                <Card className="p-6">
                                    <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2 pb-2 border-b border-slate-100">
                                        <Database size={18} className="text-blue-600" /> Database Management
                                    </h4>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Left: Backup & Restore */}
                                        <div className="space-y-4">
                                            <h5 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Backup & Restore</h5>
                                            <div className="space-y-3">
                                                <button
                                                    onClick={handleBackup}
                                                    className="w-full flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all group"
                                                >
                                                    <span className="flex items-center gap-3 text-slate-700 font-medium group-hover:text-blue-700">
                                                        <div className="bg-slate-100 p-2 rounded-lg text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 icon-transition">
                                                            <DownloadCloud size={18} />
                                                        </div>
                                                        Backup (JSON)
                                                    </span>
                                                    <ExternalLink size={14} className="text-slate-300 group-hover:text-blue-400" />
                                                </button>

                                                <label className="w-full flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all group cursor-pointer">
                                                    <span className="flex items-center gap-3 text-slate-700 font-medium group-hover:text-blue-700">
                                                        <div className="bg-slate-100 p-2 rounded-lg text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 icon-transition">
                                                            <UploadCloud size={18} />
                                                        </div>
                                                        Restore Database
                                                    </span>
                                                    <input type="file" accept=".json" onChange={handleRestore} className="hidden" />
                                                    <Plus size={14} className="text-slate-300 group-hover:text-blue-400" />
                                                </label>
                                            </div>
                                        </div>

                                        {/* Right: Danger Zone */}
                                        <div className="space-y-4">
                                            <h5 className="text-sm font-semibold text-red-500 uppercase tracking-wide flex items-center gap-2">
                                                <AlertCircle size={14} /> Danger Zone
                                            </h5>
                                            <div className="space-y-3">
                                                <button
                                                    onClick={async () => {
                                                        if (confirm('⚠️ DANGER: Reset Data will DELETE ALL projects, tasks, and users (except You/Admin).\n\nAre you sure?')) {
                                                            if (confirm('Confirm one last time: DESTROY ALL DATA?')) {
                                                                try {
                                                                    await API.resetData();
                                                                    alert('Database Reset Successful! Reloading...');
                                                                    window.location.reload();
                                                                } catch (e) { alert(e.message); }
                                                            }
                                                        }
                                                    }}
                                                    className="w-full flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-red-700 hover:bg-red-100 transition-colors text-sm font-medium"
                                                >
                                                    <Trash2 size={18} /> Reset Data <span className="text-xs opacity-70 ml-auto">(Keep Admin)</span>
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        if (confirm('⚠️ Re-New Data will DELETE current data and create Fresh Demo Data.\n\nAre you sure?')) {
                                                            try {
                                                                await API.renewData();
                                                                alert('Database Renewed! Reloading...');
                                                                window.location.reload();
                                                            } catch (e) { alert(e.message); }
                                                        }
                                                    }}
                                                    className="w-full flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-700 hover:bg-amber-100 transition-colors text-sm font-medium"
                                                >
                                                    <RefreshCw size={18} /> Re-New Data <span className="text-xs opacity-70 ml-auto">(Fresh Start)</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </Card>

                                {/* 3. API Connections */}
                                <Card className="p-6">
                                    <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2 pb-2 border-b border-slate-100">
                                        <Activity size={18} className="text-blue-600" /> API Connections
                                    </h4>

                                    <div className="space-y-6">
                                        {/* Google Web App */}
                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <label className="text-sm font-bold text-slate-700">Google Apps Script Web App URL</label>
                                                <a href="https://github.com/Ohmega13/my-project-followup/blob/main/backend_url.json" target="_blank" rel="noreferrer" className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100 flex items-center gap-1 hover:bg-blue-100">
                                                    Managed via GitHub <ExternalLink size={8} />
                                                </a>
                                            </div>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={googleScriptUrl}
                                                    onChange={(e) => setGoogleScriptUrl(e.target.value)}
                                                    placeholder="https://script.google.com/macros/s/..."
                                                    className="flex-1 px-4 py-2 border border-slate-200 rounded-lg font-mono text-xs focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                                />
                                                <button
                                                    onClick={async () => {
                                                        if (!googleScriptUrl) return alert('กรุณาระบุ URL ก่อน');
                                                        try {
                                                            const res = await fetch(googleScriptUrl, { method: 'POST', body: JSON.stringify({ action: 'getData' }) });
                                                            const data = await res.json();
                                                            if (data.projects) {
                                                                alert(`✅ เชื่อมต่อสำเร็จ! Found ${data.projects.length} projects.`);
                                                            } else {
                                                                alert(`❌ เชื่อมต่อล้มเหลว: ${JSON.stringify(data)}`);
                                                            }
                                                        } catch (e) {
                                                            alert(`❌ Error: ${e.message}`);
                                                        }
                                                    }}
                                                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-blue-50 hover:text-blue-600 text-xs font-bold transition-colors whitespace-nowrap"
                                                >
                                                    Check Link
                                                </button>
                                            </div>
                                            <p className="text-xs text-slate-400 mt-2 ml-1">
                                                Deploy as Web App &rarr; Execute as: <b>Me</b> &rarr; Access: <b>Anyone</b>
                                            </p>
                                        </div>

                                        {/* Line Token */}
                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <label className="text-sm font-bold text-slate-700">Line Notify Token</label>
                                                <Badge type="warning">Dev</Badge>
                                            </div>
                                            <div className="flex gap-2">
                                                <input
                                                    type="password"
                                                    value={lineToken}
                                                    onChange={(e) => setLineToken(e.target.value)}
                                                    placeholder="Enter Line Notify Token"
                                                    className="flex-1 px-4 py-2 border border-slate-200 rounded-lg font-mono text-xs focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                                />
                                                <button
                                                    onClick={() => alert('Validation feature coming soon.')}
                                                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-blue-50 hover:text-blue-600 text-xs font-bold transition-colors whitespace-nowrap"
                                                >
                                                    Check Token
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </Card>

                                {/* Footer Actions */}
                                <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-4">
                                    <button
                                        onClick={async () => {
                                            if (confirm('⚠️ สร้างข้อมูลตัวอย่างใหม่ 8 โปรเจกต์?')) {
                                                try {
                                                    await API.generateDemoData();
                                                    alert('✅ Done! Refreshing...');
                                                    window.location.reload();
                                                } catch (e) { alert(e.message); }
                                            }
                                        }}
                                        className="text-xs text-slate-400 hover:text-slate-600 underline"
                                    >
                                        [Dev] Generate Demo Data
                                    </button>

                                    <button
                                        onClick={handleSaveSystem}
                                        className="w-full md:w-auto flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl transform active:scale-95"
                                    >
                                        <Save size={18} />
                                        บันทึกการตั้งค่า
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* User Edit Modal */}
            {isUserModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-800">{editingUser ? 'แก้ไขผู้ใช้งาน' : 'เพิ่มผู้ใช้งานใหม่'}</h3>
                            <button onClick={() => setIsUserModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                &times;
                            </button>
                        </div>
                        <form onSubmit={handleSaveUser} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อ-นามสกุล</label>
                                    <input type="text" required className="w-full p-2 border border-slate-200 rounded-lg" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                                    <input type="text" required className="w-full p-2 border border-slate-200 rounded-lg" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} disabled={!!editingUser && currentUser.role !== 'admin'} />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">รหัสผ่าน (Password)</label>
                                    <input
                                        type="text"
                                        placeholder={editingUser ? "เว้นว่างไว้หากไม่ต้องการเปลี่ยน" : "กำหนดรหัสผ่าน"}
                                        className="w-full p-2 border border-slate-200 rounded-lg font-mono text-sm"
                                        value={formData.password || ''}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        required={!editingUser}
                                    />
                                </div>
                            </div>

                            <div className="py-2">
                                <h4 className="font-bold text-sm text-slate-800 mb-3 block">ตั้งค่ารูปประจำตัว (Avatar)</h4>
                                <div className="flex items-start gap-6 bg-slate-50 p-4 rounded-lg border border-slate-100">
                                    <div className="flex flex-col items-center gap-2">
                                        <UserAvatar
                                            user={{ avatar: JSON.stringify(avatarConfig), name: formData.name }}
                                            size="lg"
                                        />
                                        <span className="text-[10px] text-slate-400">ตัวอย่าง</span>
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        <div className="flex justify-between items-end">
                                            <div className="flex-1 mr-4">
                                                <label className="block text-xs font-medium text-slate-700 mb-1">ตัวอักษรย่อ (Max 2)</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        maxLength={2}
                                                        className="flex-1 p-2 border border-slate-200 rounded-lg uppercase text-center font-bold tracking-widest"
                                                        value={avatarConfig.text}
                                                        onChange={e => setAvatarConfig({ ...avatarConfig, text: e.target.value.toUpperCase() })}
                                                        placeholder="AB"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const nameParts = formData.name.trim().split(/\s+/);
                                                            let txt = (nameParts.length >= 2 ? (nameParts[0][0] + nameParts[1][0]) : (formData.name.substring(0, 2) || '??')).toUpperCase();
                                                            setAvatarConfig(prev => ({ ...prev, text: txt }));
                                                        }}
                                                        className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-blue-600"
                                                        title="สร้างจากชื่อ (Generate)"
                                                    >
                                                        <RefreshCw size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-slate-700 mb-1">สีพื้นหลัง</label>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="color"
                                                        value={avatarConfig.bg}
                                                        onChange={e => setAvatarConfig({ ...avatarConfig, bg: e.target.value })}
                                                        className="h-8 w-12 rounded cursor-pointer border border-slate-200 p-0.5 bg-white"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-slate-700 mb-1">สีตัวอักษร</label>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="color"
                                                        value={avatarConfig.fg}
                                                        onChange={e => setAvatarConfig({ ...avatarConfig, fg: e.target.value })}
                                                        className="h-8 w-12 rounded cursor-pointer border border-slate-200 p-0.5 bg-white"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>


                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">บทบาท (Role)</label>
                                <select className="w-full p-2 border border-slate-200 rounded-lg" value={formData.role} onChange={e => handleRoleChange(e.target.value)}>
                                    <option value="admin">Admin (Full Access)</option>
                                    <option value="editor">Editor (Can Edit)</option>
                                    <option value="viewer">Viewer (Read Only)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">ตำแหน่ง (Position / View Scope)</label>
                                <select
                                    className="w-full p-2 border border-slate-200 rounded-lg outline-none"
                                    value={formData.permissions?.viewScope || 'ASSIGNED'}
                                    onChange={(e) => {
                                        const scope = e.target.value;
                                        setFormData(prev => ({
                                            ...prev,
                                            permissions: {
                                                ...prev.permissions,
                                                viewScope: scope,
                                                canApprove: scope === 'GLOBAL' ? true : prev.permissions?.canApprove
                                            }
                                        }));
                                    }}
                                >
                                    <option value="ASSIGNED">หัวหน้างาน/พนักงาน (Supervisor) - ดูเฉพาะงานที่เกี่ยวข้อง</option>
                                    <option value="GLOBAL">ผู้บริหาร (Executive) - ดูงานทั้งหมด</option>
                                </select>
                            </div>

                            <div className="border-t border-slate-100 pt-4 mt-4">
                                <h4 className="font-bold text-sm text-slate-800 mb-3 block">กำหนดสิทธิ์การเข้าถึง</h4>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            id="perm_edit"
                                            checked={formData.permissions?.canEdit}
                                            onChange={e => handlePermissionChange('canEdit', e.target.checked)}
                                            disabled={formData.role === 'admin' || formData.role === 'viewer'}
                                            className="rounded text-blue-600 disabled:opacity-50 disabled:bg-slate-100"
                                        />
                                        <label htmlFor="perm_edit" className={`text-sm font-medium ${formData.role === 'admin' || formData.role === 'viewer' ? 'text-slate-400' : 'text-slate-700'}`}>อนุญาตให้แก้ไขงาน (Edit Tasks)</label>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            id="perm_delete"
                                            checked={formData.permissions?.canDelete}
                                            onChange={e => handlePermissionChange('canDelete', e.target.checked)}
                                            disabled={formData.role === 'admin' || formData.role === 'viewer'}
                                            className="rounded text-blue-600 disabled:opacity-50 disabled:bg-slate-100"
                                        />
                                        <label htmlFor="perm_delete" className={`text-sm font-medium ${formData.role === 'admin' || formData.role === 'viewer' ? 'text-slate-400' : 'text-slate-700'}`}>อนุญาตให้ลบข้อมูล (Delete Projects)</label>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            id="perm_approve"
                                            checked={formData.permissions?.canApprove}
                                            onChange={e => handlePermissionChange('canApprove', e.target.checked)}
                                            disabled={formData.role === 'admin' || formData.role === 'viewer'}
                                            className="rounded text-blue-600 disabled:opacity-50 disabled:bg-slate-100"
                                        />
                                        <label htmlFor="perm_approve" className={`text-sm font-medium ${formData.role === 'admin' || formData.role === 'viewer' ? 'text-slate-400' : 'text-slate-700'}`}>อนุญาตให้อนุมัติงาน (Approve Tasks)</label>
                                    </div>

                                    <div className="pl-6 pt-2 space-y-2">
                                        <p className="text-xs font-bold text-slate-500 uppercase">หน้าจอที่เข้าถึงได้</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {['dashboard', 'kanban', 'calendar', 'timeline', 'reports', 'settings'].map(page => (
                                                <div key={page} className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.permissions?.pages?.includes(page)}
                                                        onChange={() => handlePagePermissionChange(page)}
                                                        disabled={formData.role === 'admin'}
                                                        className="rounded text-blue-600 disabled:opacity-50 disabled:bg-slate-100"
                                                    />
                                                    <span className={`text-sm capitalize ${formData.role === 'admin' ? 'text-slate-400' : 'text-slate-600'}`}>{page}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsUserModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">ยกเลิก</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg">บันทึก</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
