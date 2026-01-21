import React, { useState } from 'react';
import { LayoutDashboard, AlertCircle } from 'lucide-react';
import { API } from '../../services/api';

export default function LoginView({ onLogin, isLoading }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onLogin(username, password);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-blue-600 p-8 text-center">
                    <div className="inline-flex p-3 bg-white/20 rounded-full mb-4">
                        <LayoutDashboard className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Project Follow-up</h1>
                    <p className="text-blue-100 mt-2">เข้าสู่ระบบเพื่อจัดการโปรเจกต์</p>
                </div>
                <div className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อผู้ใช้ (Username)</label>
                            <input
                                type="text"
                                placeholder="เช่น admin"
                                className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">รหัสผ่าน</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors flex justify-center items-center"
                        >
                            {isLoading ? <span className="animate-spin mr-2">⏳</span> : null}
                            {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                        </button>
                    </form>
                    {API.isDemo && (
                        <div className="mt-6 p-3 bg-yellow-50 text-yellow-800 text-sm rounded-lg flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <div className="text-xs">
                                <p className="font-bold mb-1">Demo Mode Credentials:</p>
                                <p>Admin: admin / admin</p>
                                <p>User: user / user</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
