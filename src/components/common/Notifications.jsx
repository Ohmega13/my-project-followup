import React, { useState, useEffect } from 'react';
import { Bell, Check } from 'lucide-react';
import { API } from '../../services/api';

export const NotificationDropdown = ({ currentUser, tasks = [], onOpenTask }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [localNotifications, setLocalNotifications] = useState([]);
    const [serverNotifications, setServerNotifications] = useState([]);

    // Poll Server Notifications
    useEffect(() => {
        if (!currentUser) return;
        const fetchNotifs = async () => {
            try {
                const res = await API.getNotifications(currentUser.name);
                if (res.success) {
                    setServerNotifications(res.notifications || []);
                }
            } catch (e) { console.error(e); }
        };
        fetchNotifs();
        const interval = setInterval(fetchNotifs, 10000); // 10s
        return () => clearInterval(interval);
    }, [currentUser]);

    // Local Logic (Deadlines)
    useEffect(() => {
        if (!currentUser) return;
        const newNotifs = [];
        const now = new Date();
        const readIds = JSON.parse(localStorage.getItem('read_notifications') || '[]');

        // Deadline Notifications
        const myTasks = tasks.filter(t => t.assignee === currentUser.name && t.status !== 'Done');
        myTasks.forEach(task => {
            if (task.dueDate) {
                const due = new Date(task.dueDate);
                const diffTime = due - now;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays >= 0 && diffDays <= 3) {
                    newNotifs.push({
                        id: `due-${task.id}`,
                        linkId: task.id,
                        text: `⚠️ งาน "${task.title}" ครบกำหนดใน ${diffDays === 0 ? 'วันนี้' : diffDays + ' วัน'}`,
                        time: 'แจ้งเตือนระบบ',
                        read: readIds.includes(`due-${task.id}`),
                        type: 'alert',
                        isLocal: true
                    });
                }
            }
        });
        setLocalNotifications(newNotifs);
    }, [currentUser, tasks]);

    // Combine
    const notifications = [
        ...serverNotifications.map(n => ({
            id: n.id,
            text: n.message,
            time: new Date(n.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
            read: n.isRead === 'true' || n.isRead === true,
            type: n.type,
            linkId: n.linkId,
            isLocal: false
        })),
        ...localNotifications
    ].sort((a, b) => {
        if (a.read === b.read) return 0;
        return a.read ? 1 : -1;
    });

    const unreadCount = notifications.filter(n => !n.read).length;

    const handleMarkRead = async (notification) => {
        if (notification.isLocal) {
            const readIds = JSON.parse(localStorage.getItem('read_notifications') || '[]');
            if (!readIds.includes(notification.id)) {
                localStorage.setItem('read_notifications', JSON.stringify([...readIds, notification.id]));
                setLocalNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true } : n));
            }
        } else {
            setServerNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n));
            await API.markNotificationRead(notification.id);
        }
    };

    const handleMarkAllRead = async () => {
        // Local
        const localIds = localNotifications.map(n => n.id);
        const readIds = JSON.parse(localStorage.getItem('read_notifications') || '[]');
        localStorage.setItem('read_notifications', JSON.stringify([...new Set([...readIds, ...localIds])]));
        setLocalNotifications(prev => prev.map(n => ({ ...n, read: true })));

        // Server
        const unreadServer = serverNotifications.filter(n => n.isRead !== 'true' && n.isRead !== true);
        setServerNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        for (const n of unreadServer) {
            await API.markNotificationRead(n.id);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
                title="การแจ้งเตือน"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
                )}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
                    <div className="fixed top-[60px] right-4 w-[calc(100vw-32px)] md:absolute md:top-full md:right-0 md:w-80 md:mt-2 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right">
                        <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h4 className="font-bold text-slate-800 text-sm">การแจ้งเตือน ({unreadCount})</h4>
                            {unreadCount > 0 && (
                                <button onClick={handleMarkAllRead} className="text-xs text-blue-600 hover:underline">อ่านทั้งหมด</button>
                            )}
                        </div>
                        <div className="max-h-[300px] overflow-y-auto">
                            {notifications.length > 0 ? (
                                notifications.map(n => (
                                    <div
                                        key={n.id}
                                        onClick={() => {
                                            handleMarkRead(n);
                                            // Find task and open
                                            if (n.linkId && onOpenTask) {
                                                // Find in tasks prop first
                                                let taskToOpen = tasks.find(t => t.id === n.linkId);
                                                // If not found (lazy loaded?), maybe fetch? But for now reliance on tasks is ok
                                                if (taskToOpen) {
                                                    onOpenTask(taskToOpen);
                                                    setIsOpen(false);
                                                }
                                            }
                                        }}
                                        className={`p-3 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors flex gap-3 ${n.read ? 'opacity-60' : 'bg-blue-50/30'}`}
                                    >
                                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.read ? 'bg-slate-300' : 'bg-blue-500'}`}></div>
                                        <div>
                                            <p className={`text-sm ${n.read ? 'text-slate-600' : 'text-slate-900 font-medium'}`}>{n.text}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] text-slate-400">{n.time}</span>
                                                {n.type === 'warning' && <span className="text-[10px] bg-orange-100 text-orange-600 px-1 rounded">Action</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center text-slate-400 text-sm">ไม่มีการแจ้งเตือนใหม่</div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
