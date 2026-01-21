import React, { useState, useEffect } from 'react';
import { Tag } from '../ui/Tag';
import { MessageSquare, Send, Plus, User, Paperclip, FileText, Image as ImageIcon, X, Link as LinkIcon, Trash2, StickyNote, Check, Pencil } from 'lucide-react';

export default function TaskModal({ isOpen, onClose, task, projects, onSave, onDelete, onAddComment, onEditComment, onDeleteComment, onCreateProject, currentUser, users }) {
    if (!isOpen) return null;

    const [tags, setTags] = useState([]);
    const [newTag, setNewTag] = useState('');
    const [followers, setFollowers] = useState([]);
    const [commentText, setCommentText] = useState('');
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editingCommentText, setEditingCommentText] = useState('');
    const [attachments, setAttachments] = useState([]);
    const [newLink, setNewLink] = useState('');
    const [newLinkName, setNewLinkName] = useState('');
    const [activeTab, setActiveTab] = useState('details');
    const [progress, setProgress] = useState(0);
    const [isRejecting, setIsRejecting] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');

    useEffect(() => {
        if (task) {
            setTags(Array.isArray(task.tags) ? task.tags : []);

            // Sanitize Followers - Strict Whitelist Mode
            const safeFollowers = (Array.isArray(task.followers) ? task.followers : [])
                .filter(f => f && typeof f === 'object')
                .map(f => {
                    let name = String(f.name || '').trim();

                    // Whitelist: Allow only Thai, English, Numbers, Space, and basic punctuation
                    // Reject if it contains ANYTHING else (including quotes, braces, colons, special symbols)
                    // This guarantees that JSON artifacts like "bg":"..." cannot survive.
                    if (/[^a-zA-Z0-9\u0E00-\u0E7F\s()._-]/.test(name)) {
                        return null;
                    }

                    if (name.length < 2) return null;
                    return { ...f, name };
                })
                .filter(Boolean); // Filter nulls

            setFollowers(safeFollowers);

            setAttachments(Array.isArray(task.attachments) ? task.attachments : []);
            setProgress(parseInt(task.progress) || 0);

            // Mark as Read
            if (currentUser) {
                const key = `read_receipt_${currentUser.email}_${task.id}`;
                localStorage.setItem(key, new Date().toISOString());
            }
        } else {
            setTags([]);
            setFollowers([]);
            setAttachments([]);
            setProgress(0);
        }
    }, [task, currentUser]);

    // Helper to format date for input (YYYY-MM-DD)
    const toInputDate = (dateStr) => {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return '';
            return date.toISOString().split('T')[0];
        } catch (e) {
            return '';
        }
    };

    const initialData = task || {
        title: '',
        projectId: projects[0]?.id || '',
        assignee: '',
        approver: '',
        priority: 'Medium',
        dueDate: '',
        startDate: '',
        progress: 0,
        description: ''
    };

    // Sanitize progress
    const safeProgress = isNaN(parseInt(initialData.progress)) ? 0 : parseInt(initialData.progress);

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        const newData = {
            id: task?.id,
            projectId: formData.get('projectId'),
            title: formData.get('title'),
            assignee: formData.get('assignee'),
            approver: formData.get('approver'),
            startDate: formData.get('startDate'),
            dueDate: formData.get('dueDate'),
            priority: formData.get('priority'),
            progress: parseInt(formData.get('progress') || 0),
            description: formData.get('description'),
            status: task?.status || 'To Do',
            tags: tags,
            followers: followers,
            comments: task?.comments || [],
            attachments: attachments
        };

        // Notifications System
        import('../../services/api').then(({ API }) => {
            const linkId = newData.id || 'new'; // Should effectively contain the ID if it's editing, or 'new' if creating? Wait, backend creates ID. If it's new, we don't have ID yet for linkId. 
            // Limitation: If creating new task, we don't know ID until saving. BUT `TaskModal` usually has `task.id` if editing. If creating, `task` is null.
            // If creating, we can't deep-link until we get ID from response.
            // But usually Followers are added to existing tasks? No, could be new.
            // For now, let's use `newData.id` which `TaskModal` tries to construct? No, `App.jsx` constructs it.
            // Optimization: Only notify if `task.id` (editing). If creating, maybe skip notification or send 'General' message?
            // Actually, `App.jsx` creates ID `T${Date.now()}`.
            // `TaskModal` doesn't know the ID if it's purely new and `task` prop is null.
            // Oh, the `handleSubmit` logic in `TaskModal` builds `newData` with `id: task?.id`.
            // If `task` is null, `id` is undefined.

            // NOTE: For now, I will include `linkId: newData.id` which might be undefined for new tasks.
            // Notifications for NEW tasks might not have a clickable link until refreshed.

            // 1. Notify Approver
            if (newData.approver && newData.approver !== task?.approver) {
                API.addNotification({ recipient: newData.approver, message: `คุณได้รับมอบหมายให้อนุมัติงาน: ${newData.title}`, type: 'warning', linkId: newData.id });
            }
            // 2. Notify New Followers
            const oldFollowerNames = (task?.followers || []).map(f => f.name);
            followers.forEach(f => {
                if (!oldFollowerNames.includes(f.name) && f.name !== currentUser?.name) {
                    API.addNotification({ recipient: f.name, message: `คุณถูกเพิ่มเป็นผู้เกี่ยวข้องในงาน: ${newData.title}`, type: 'info', linkId: newData.id });
                }
            });
            // 3. Notify Assignee
            if (newData.assignee && newData.assignee !== task?.assignee && newData.assignee !== currentUser?.name) {
                API.addNotification({ recipient: newData.assignee, message: `คุณได้รับมอบหมายงานใหม่: ${newData.title}`, type: 'info', linkId: newData.id });
            }
        });

        onSave(newData);
    };
    const handleAddTag = () => {
        if (newTag.trim()) {
            setTags([...tags, { id: `tag${Date.now()}`, name: newTag, color: 'blue' }]);
            setNewTag('');
        }
    };


    const handleAddFollower = (e) => {
        const userName = e.target.value;
        if (!userName) return;
        const user = users.find(u => u.name === userName);
        if (user && !followers.some(f => f.name === user.name)) {
            setFollowers([...followers, { name: user.name, avatar: user.avatar }]);
        }
        e.target.value = "";
    };

    const removeFollower = (name) => {
        setFollowers(followers.filter(f => f.name !== name));
    };

    const handleSendComment = (e) => {
        e.preventDefault();
        if (commentText.trim()) {
            onAddComment(task.id, commentText);
            setCommentText('');
        }
    };

    const handleAddLink = () => {
        if (!newLink.trim()) return;
        setAttachments(prev => [...prev, {
            id: `link${Date.now()}`,
            name: newLinkName.trim() || newLink,
            type: 'link', // marker for link
            url: newLink,
            size: 0
        }]);
        setNewLink('');
        setNewLinkName('');
    };

    const removeAttachment = (id) => {
        setAttachments(prev => prev.filter(a => a.id !== id));
    };

    // Determine if this is a Note
    // Check state tags OR initial task tags to avoid initial render flash
    const isNote = tags.some(t => t === 'Note' || t.name === 'Note') ||
        (task?.tags && Array.isArray(task.tags) && task.tags.includes('Note'));

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        {isNote ? <StickyNote className="text-amber-500" size={20} /> : <FileText className="text-blue-600" size={20} />}
                        {task ? (isNote ? 'แก้ไขบันทึก' : 'รายละเอียดงาน') : (isNote ? 'เพิ่มบันทึกใหม่' : 'เพิ่มงานใหม่')}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">×</button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row min-h-0">
                    {/* Mobile Tabs */}
                    <div className="flex border-b border-slate-200 md:hidden flex-shrink-0 bg-white">
                        <button
                            type="button"
                            onClick={() => setActiveTab('details')}
                            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'details' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        >
                            รายละเอียด
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('comments')}
                            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'comments' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        >
                            <MessageSquare size={16} />
                            Comments
                            {task?.comments?.length > 0 && (
                                <span className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded-full">{task.comments.length}</span>
                            )}
                        </button>
                    </div>

                    {/* LEFT COLUMN: FORM */}
                    <div className={`flex-1 overflow-y-auto p-6 border-r border-slate-100 ${activeTab === 'details' ? '' : 'hidden'} md:block scrollbar-hide`}>
                        <form id="taskForm" onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{isNote ? 'หัวข้อบันทึก' : 'ชื่องาน'}</label>
                                <input name="title" defaultValue={initialData.title} className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium" required autoFocus placeholder={isNote ? "พิมพ์หัวข้อบันทึก..." : "รายละเอียดงาน..."} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">รายละเอียด</label>
                                <textarea name="description" defaultValue={initialData.description} rows={isNote ? 4 : 3} className="w-full p-2.5 border border-slate-200 rounded-lg outline-none resize-none" placeholder={isNote ? "ใส่รายละเอียดของบันทึก..." : "เพิ่มรายละเอียดงาน..."} />
                            </div>

                            <div className={`grid grid-cols-1 ${isNote ? '' : 'md:grid-cols-2'} gap-4`}>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">โปรเจกต์</label>
                                    <select
                                        name="projectId"
                                        defaultValue={initialData.projectId}
                                        className="w-full h-11 px-3 border border-slate-200 rounded-lg outline-none bg-white"
                                        onChange={(e) => {
                                            if (e.target.value === 'NEW_PROJECT') {
                                                if (onCreateProject) onCreateProject();
                                                e.target.value = ""; // Reset to empty or handle gracefully
                                            }
                                        }}
                                    >
                                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        <option value="NEW_PROJECT" className="text-blue-600 font-bold">+ สร้างโปรเจกต์ใหม่</option>
                                    </select>
                                </div>
                                {!isNote && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">ความสำคัญ</label>
                                        <select name="priority" defaultValue={initialData.priority} className="w-full h-11 px-3 border border-slate-200 rounded-lg outline-none bg-white">
                                            <option value="Low">ต่ำ</option>
                                            <option value="Medium">ปานกลาง</option>
                                            <option value="High">สูง</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className={`grid grid-cols-1 ${isNote ? '' : 'md:grid-cols-2'} gap-4`}>
                                {!isNote && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">วันที่เริ่ม (Start Date)</label>
                                        <input type="date" name="startDate" defaultValue={toInputDate(initialData.startDate)} className="w-full h-11 px-3 border border-slate-200 rounded-lg outline-none" />
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{isNote ? 'วันที่ (Date)' : 'กำหนดส่ง (Due Date)'}</label>
                                    <input type="date" name="dueDate" defaultValue={toInputDate(initialData.dueDate)} className="w-full h-11 px-3 border border-slate-200 rounded-lg outline-none" required />
                                </div>
                            </div>

                            <div className={`grid grid-cols-1 ${isNote ? '' : 'md:grid-cols-2'} gap-4`}>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{isNote ? 'ผู้บันทึก (Creator)' : 'ผู้รับผิดชอบ'}</label>
                                    <select
                                        name="assignee"
                                        defaultValue={initialData.assignee || (isNote ? currentUser?.name : '')}
                                        className="w-full h-11 px-3 border border-slate-200 rounded-lg outline-none bg-white"
                                        disabled={isNote && initialData.assignee && initialData.assignee !== currentUser?.name} // Lock if editing someone else's note? Or just leave open. user said "Creator (who logged in)". Auto-default is good.
                                    >
                                        <option value="">-- เลือก{isNote ? 'ผู้บันทึก' : 'ผู้รับผิดชอบ'} --</option>
                                        {(users || []).map(u => (
                                            <option key={u.id} value={u.name}>
                                                {u.name} ({u.role})
                                            </option>
                                        ))}
                                    </select>
                                    {isNote && !initialData.assignee && <input type="hidden" name="assignee" value={currentUser?.name} />}
                                </div>
                                {!isNote && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">ผู้อนุมัติ (Approver)</label>
                                        <select name="approver" defaultValue={initialData.approver || ''} className="w-full h-11 px-3 border border-slate-200 rounded-lg outline-none bg-white">
                                            <option value="">-- เลือกผู้อนุมัติ --</option>
                                            {(users || []).filter(u => u.role === 'admin' || u.permissions?.canApprove).map(u => (
                                                <option key={u.id} value={u.name}>
                                                    {u.name} ({u.role})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">รายชื่อผู้เกี่ยวข้อง</label>
                                <div className="flex flex-wrap gap-2 mb-2 p-2 border border-slate-200 rounded-lg min-h-[46px] bg-white">
                                    {followers.map((f, i) => {
                                        // Parse Avatar Configuration
                                        let ava = { text: (f.name || '??').substring(0, 2).toUpperCase(), bg: '#e2e8f0', fg: '#475569' };
                                        if (f.avatar && typeof f.avatar === 'string' && f.avatar.startsWith('{')) {
                                            try {
                                                const parsed = JSON.parse(f.avatar);
                                                ava = { ...ava, ...parsed };
                                            } catch (e) { }
                                        } else if (f.avatar) {
                                            ava.text = f.avatar;
                                        }

                                        return (
                                            <span key={`${f.name}-${i}`} className="bg-slate-100 border border-slate-200 text-slate-700 pl-1 pr-2 py-1 rounded-full text-xs flex items-center gap-1 max-w-[180px]">
                                                <div
                                                    className="w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center flex-shrink-0 overflow-hidden"
                                                    style={{ backgroundColor: ava.bg, color: ava.fg }}
                                                >
                                                    {ava.text}
                                                </div>
                                                <span className="truncate">{f.name}</span>
                                                <button type="button" onClick={() => removeFollower(f.name)} className="ml-1 text-slate-400 hover:text-red-500 font-bold flex-shrink-0">×</button>
                                            </span>
                                        );
                                    })}
                                    <select onChange={handleAddFollower} className="outline-none bg-transparent text-sm min-w-[120px] py-1 text-slate-500 hover:text-blue-600 cursor-pointer">
                                        <option value="">+ เพิ่มผู้เกี่ยวข้อง</option>
                                        {(users || [])
                                            .filter(u => !followers.some(f => f.name === u.name))
                                            .filter(u => !/[{}":]/.test(u.name))
                                            .map(u => (
                                                <option key={u.id} value={u.name}>{u.name}</option>
                                            ))}
                                    </select>
                                </div>
                            </div>

                            {!isNote && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Labels</label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {tags.map(tag => (
                                            <Tag key={tag.id} name={tag.name} color={tag.color} onRemove={() => setTags(tags.filter(t => t.id !== tag.id))} />
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            value={newTag}
                                            onChange={(e) => setNewTag(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                                            className="flex-1 p-2 text-sm border border-slate-200 rounded-lg outline-none"
                                            placeholder="Add label..."
                                        />
                                        <button type="button" onClick={handleAddTag} className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200">
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {!isNote && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">ความคืบหน้า (%)</label>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="range"
                                            name="progress"
                                            min="0"
                                            max="100"
                                            value={progress}
                                            onChange={(e) => setProgress(parseInt(e.target.value))}
                                            className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                        />
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={progress}
                                                onChange={(e) => {
                                                    let val = parseInt(e.target.value);
                                                    if (isNaN(val)) val = 0;
                                                    if (val > 100) val = 100;
                                                    if (val < 0) val = 0;
                                                    setProgress(val);
                                                }}
                                                className="w-20 pl-3 pr-8 py-1.5 border border-slate-200 rounded-lg text-right text-sm font-bold text-blue-600 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">%</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Attachments Section */}
                            <div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">ลิ้งค์แนบ (Attachments)</label>
                                    <div className="space-y-3">
                                        {/* Existing Links List */}
                                        {attachments.map(file => (
                                            <div key={file.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg group">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0 text-blue-500">
                                                        <LinkIcon size={20} />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:underline truncate block">
                                                            {file.name}
                                                        </a>
                                                        <p className="text-xs text-slate-400 truncate">{file.url}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeAttachment(file.id)}
                                                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}

                                        {/* Add Link Input */}
                                        <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/50 space-y-2">
                                            <input
                                                value={newLinkName}
                                                onChange={(e) => setNewLinkName(e.target.value)}
                                                placeholder="ชื่อลิ้งค์ (Optional)"
                                                className="w-full text-sm p-2 border border-slate-200 rounded-md outline-none focus:border-blue-500 bg-white"
                                            />
                                            <div className="flex gap-2">
                                                <input
                                                    value={newLink}
                                                    onChange={(e) => setNewLink(e.target.value)}
                                                    placeholder="วาง URL ที่นี่ (https://...)"
                                                    className="flex-1 text-sm p-2 border border-slate-200 rounded-md outline-none focus:border-blue-500 bg-white"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleAddLink}
                                                    disabled={!newLink.trim()}
                                                    className="px-4 py-2 bg-slate-800 text-white text-sm rounded-md hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                                >
                                                    <Plus size={16} /> เพิ่ม
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form >
                    </div >

                    {/* RIGHT COLUMN: COMMENTS */}
                    < div className={`w-full md:w-1/3 bg-slate-50 flex-col ${activeTab === 'comments' ? 'flex' : 'hidden'} md:flex flex-1 overflow-hidden min-h-0`} >
                        <div className="p-4 border-b border-slate-200 font-medium text-slate-700 flex items-center gap-2">
                            <MessageSquare size={16} /> Comments
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {task && task.comments && task.comments.length > 0 ? (
                                task.comments.map(comment => (
                                    <div key={comment.id} className="flex gap-3 group">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                            {comment.user?.avatar || '?'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-baseline justify-between gap-2">
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-sm font-bold text-slate-800">{comment.user?.name}</span>
                                                    <span className="text-xs text-slate-400">{new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                                {/* Edit/Delete Actions */}
                                                {(currentUser?.name === comment.user?.name || currentUser?.role === 'admin') && !editingCommentId && (
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => {
                                                                setEditingCommentId(comment.id);
                                                                setEditingCommentText(comment.text);
                                                            }}
                                                            className="p-1 text-slate-400 hover:text-blue-500 rounded"
                                                        >
                                                            <Pencil size={12} />
                                                        </button>
                                                        <button
                                                            onClick={() => onDeleteComment(task.id, comment.id)}
                                                            className="p-1 text-slate-400 hover:text-red-500 rounded"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {editingCommentId === comment.id ? (
                                                <div className="mt-2 space-y-2">
                                                    <textarea
                                                        value={editingCommentText}
                                                        onChange={(e) => setEditingCommentText(e.target.value)}
                                                        className="w-full p-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-100"
                                                        rows={2}
                                                        autoFocus
                                                    />
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => setEditingCommentId(null)}
                                                            className="text-xs px-3 py-1.5 text-slate-500 hover:bg-slate-100 rounded-md"
                                                        >
                                                            ยกเลิก
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                if (editingCommentText.trim()) {
                                                                    onEditComment(task.id, comment.id, editingCommentText);
                                                                    setEditingCommentId(null);
                                                                }
                                                            }}
                                                            className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                                        >
                                                            บันทึก
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="bg-white p-2.5 rounded-lg text-sm text-slate-600 shadow-sm mt-1 border border-slate-100 break-words whitespace-pre-wrap">
                                                    {comment.text}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center text-slate-400 text-sm py-8">
                                    ยังไม่มีคอมเมนต์
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-slate-200 bg-white">
                            <form onSubmit={handleSendComment} className="flex gap-2">
                                <input
                                    className="flex-1 bg-slate-100 border-0 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                    placeholder="เขียนคอมเมนต์..."
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    disabled={!task}
                                />
                                <button type="submit" disabled={!task || !commentText.trim()} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                                    <Send size={16} />
                                </button>
                            </form>
                            {!task && <p className="text-xs text-slate-400 mt-2 text-center">บันทึกงานก่อนเพื่อเริ่มใช้งานคอมเมนต์</p>}
                        </div>
                    </div >
                </div >

                <div className="relative p-4 border-t border-slate-100 flex justify-between items-center bg-white">
                    <div className="flex items-center gap-6">
                        {/* Approve / Reject Group */}
                        {currentUser?.name === initialData.approver && task && task.status === 'Pending Review' && (
                            <div className="flex items-center gap-2">
                                {isRejecting ? (
                                    <div className="absolute bottom-full left-0 mb-4 w-80 p-4 bg-white border border-slate-200 shadow-xl z-50 rounded-xl">
                                        <h4 className="text-sm font-bold text-slate-700 mb-2">ระบุสิ่งที่ต้องการให้แก้ไข:</h4>
                                        <textarea
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            className="w-full p-2 border border-slate-200 rounded-lg text-sm mb-2 focus:ring-2 focus:ring-red-100 outline-none"
                                            rows={3}
                                            placeholder="ตัวอย่าง: แก้ไขสีปุ่ม, ตรวจสอบตัวสะกด..."
                                            autoFocus
                                        />
                                        <div className="flex justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => { setIsRejecting(false); setRejectionReason(''); }}
                                                className="px-3 py-1.5 text-slate-500 hover:bg-slate-100 rounded-lg text-sm"
                                            >
                                                ย้อนกลับ
                                            </button>
                                            <button
                                                type="button"
                                                disabled={!rejectionReason.trim()}
                                                onClick={() => {
                                                    if (!rejectionReason.trim()) return;
                                                    onAddComment(task.id, `[สิ่งที่ต้องแก้ไข] ${rejectionReason}`);
                                                    const updated = { ...task, status: 'Doing', progress: 50 };
                                                    onSave(updated);
                                                    import('../../services/api').then(({ API }) => {
                                                        API.addNotification({
                                                            recipient: task.assignee,
                                                            message: `งาน "${task.title}" ถูกส่งกลับแก้ไข: ${rejectionReason}`,
                                                            type: 'error',
                                                            linkId: task.id
                                                        });
                                                    });
                                                    setIsRejecting(false);
                                                    setRejectionReason('');
                                                    onClose();
                                                }}
                                                className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm disabled:opacity-50"
                                            >
                                                ยืนยันส่งแก้ไข
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const updated = { ...task, status: 'Done', progress: 100 };
                                                onSave(updated);
                                                import('../../services/api').then(({ API }) => {
                                                    API.addNotification({
                                                        recipient: task.assignee,
                                                        message: `งาน "${task.title}" ได้รับการอนุมัติแล้ว โดย ${currentUser.name}`,
                                                        type: 'success',
                                                        linkId: task.id
                                                    });
                                                });
                                                onClose();
                                            }}
                                            className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl shadow-md hover:shadow-lg hover:shadow-emerald-200 hover:-translate-y-0.5 transition-all duration-200 font-bold flex items-center gap-2"
                                        >
                                            <Check size={20} strokeWidth={2.5} /> อนุมัติ
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsRejecting(true)}
                                            className="px-5 py-2.5 bg-white border border-rose-100 text-rose-500 rounded-xl hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 shadow-sm hover:shadow transition-all duration-200 font-medium flex items-center gap-2"
                                        >
                                            <X size={20} /> ส่งแก้ไข
                                        </button>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Delete Button */}
                        {task && onDelete && (currentUser?.role === 'admin' || currentUser?.permissions?.canDelete) && (
                            <button
                                type="button"
                                onClick={() => onDelete(task.id)}
                                className="px-4 py-2.5 bg-white text-slate-400 border border-slate-200 rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-200 font-medium flex items-center gap-2 transition-all opacity-80 hover:opacity-100"
                                title="ลบงานนี้"
                            >
                                <Trash2 size={20} />
                                <span className="hidden sm:inline">ลบ</span>
                            </button>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <button type="button" onClick={onClose} className="px-6 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-medium">ยกเลิก</button>
                        <button type="submit" form="taskForm" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm shadow-blue-200">บันทึก</button>
                    </div>
                </div>
            </div >
        </div >
    );
}
