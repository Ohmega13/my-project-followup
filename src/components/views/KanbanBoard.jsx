import React, { useState } from 'react';
import { MoreVertical, Calendar as CalendarIcon, Plus, Trash2, X, Check } from 'lucide-react';
import { ProgressBar } from '../ui/ProgressBar';
import { Tag } from '../ui/Tag';

export default function KanbanBoard({ data, selectedProject, onEditTask, onUpdateStatus, onDeleteTask, currentUser, canDelete, onRejectTask }) {
    const [activeTab, setActiveTab] = useState('To Do');
    const [rejectingTaskId, setRejectingTaskId] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');

    const filteredTasks = selectedProject === 'All'
        ? data.tasks
        : data.tasks.filter(t => t.projectId === selectedProject);

    const normalizeStatus = (status) => {
        if (!status) return 'To Do';
        const s = status.trim();
        if (s === 'In Progress' || s === 'Doing') return 'Doing';
        if (s === 'Waiting' || s === 'To Do' || s === 'Not Started') return 'To Do';
        if (s === 'Pending' || s === 'Pending Review') return 'Pending Review';
        if (s === 'Done' || s === 'Completed' || s === 'Success') return 'Done';
        return 'To Do'; // Fallback
    };

    const columns = [
        { id: 'To Do', title: 'รอดำเนินการ', color: 'bg-slate-100' },
        { id: 'Doing', title: 'กำลังทำ', color: 'bg-blue-50' },
        { id: 'Pending Review', title: 'รอตรวจสอบ', color: 'bg-yellow-50' },
        { id: 'Done', title: 'เสร็จสิ้น', color: 'bg-green-50' }
    ];

    return (
        <div className="flex-1 overflow-x-auto h-full flex flex-col">
            {/* Mobile Tabs */}
            <div className="flex md:hidden bg-white border-b border-slate-200 p-2 gap-2 sticky top-0 z-10 shrink-0">
                {columns.map(col => (
                    <button
                        key={col.id}
                        onClick={() => setActiveTab(col.id)}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors border ${activeTab === col.id ? 'bg-blue-50 text-blue-600 border-blue-100' : 'text-slate-500 hover:bg-slate-50 border-transparent'}`}
                    >
                        {col.title} <span className="opacity-70 text-xs">({filteredTasks.filter(t => normalizeStatus(t.status) === col.id).length})</span>
                    </button>
                ))}
            </div>

            <div className="flex-1 flex flex-col md:flex-row gap-4 min-w-full md:min-w-[1000px] h-full pb-4 px-2 md:px-0">
                {columns.map(col => (
                    <div key={col.id} className={`${activeTab === col.id ? 'flex' : 'hidden'} md:flex flex-1 bg-slate-50 rounded-xl p-4 flex-col h-full max-h-full shrink-0`}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                                <span className={`w-3 h-3 rounded-full ${col.id === 'To Do' ? 'bg-slate-400' : col.id === 'Doing' ? 'bg-blue-500' : col.id === 'Pending Review' ? 'bg-yellow-500' : 'bg-green-500'}`}></span>
                                {col.title}
                            </h3>
                            <span className="bg-white px-2 py-0.5 rounded-full text-xs font-bold text-slate-500 shadow-sm">
                                {filteredTasks.filter(t => normalizeStatus(t.status) === col.id).length}
                            </span>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                            {filteredTasks.filter(t => normalizeStatus(t.status) === col.id).map(task => (
                                <div
                                    key={task.id}
                                    className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer group"
                                    onClick={() => onEditTask(task)}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-xs px-2 py-0.5 rounded ${task.priority === 'High' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                                            {task.priority === 'High' ? 'สูง' : task.priority === 'Medium' ? 'ปานกลาง' : 'ต่ำ'}
                                        </span>
                                        {canDelete && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }}
                                                className="text-slate-300 hover:text-red-500 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all p-1 hover:bg-red-50 rounded"
                                                title="ลบงาน"
                                            >
                                                <MoreVertical size={16} className="hidden" /> {/* Keep for now if ref issue? No just replace */}
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>

                                    {/* Tags */}
                                    {
                                        task.tags && task.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mb-2">
                                                {task.tags.map(tag => (
                                                    <Tag key={tag.id} name={tag.name} color={tag.color} />
                                                ))}
                                            </div>
                                        )
                                    }

                                    <h4 className="font-medium text-slate-800 mb-2">{task.title}</h4>
                                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                                        <CalendarIcon size={14} />
                                        <span>
                                            {task.dueDate ? new Date(task.dueDate).toLocaleDateString('th-TH') : '-'}
                                        </span>
                                    </div>

                                    {/* Approver & Followers */}
                                    {(task.approver || (task.followers && task.followers.length > 0)) && (
                                        <div className="mb-3 flex flex-col gap-2">
                                            {task.approver && (
                                                <div className="flex items-center gap-1 text-xs">
                                                    <span className="text-slate-400 text-[10px] uppercase">Approver:</span>
                                                    <span className="font-medium text-slate-700 bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded border border-orange-100">{task.approver}</span>
                                                </div>
                                            )}
                                            {task.followers && task.followers.length > 0 && (
                                                <div className="flex items-center gap-2">
                                                    <div className="flex -space-x-1.5 overflow-hidden">
                                                        {task.followers.map((f, i) => {
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
                                                                <div
                                                                    key={i}
                                                                    title={f.name}
                                                                    className="h-5 w-5 rounded-full ring-1 ring-white flex items-center justify-center text-[8px] font-bold overflow-hidden"
                                                                    style={{ backgroundColor: ava.bg, color: ava.fg }}
                                                                >
                                                                    {ava.text}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-50">
                                        <div className="flex items-center gap-1">
                                            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                                                {(task.assignee || "?").charAt(0)}
                                            </div>
                                            <span className="text-xs text-slate-600 truncate max-w-[80px]">{task.assignee || "Unassigned"}</span>
                                        </div>
                                        <div className="text-xs font-bold text-slate-700">{task.progress}%</div>
                                    </div>
                                    <ProgressBar percent={task.progress} />

                                    {/* Action Buttons */}
                                    <div className="mt-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                        {rejectingTaskId === task.id ? (
                                            <div className="bg-white border border-rose-100 rounded-lg p-3 shadow-inner mt-2 cursor-auto" onClick={e => e.stopPropagation()}>
                                                <div className="text-xs font-bold text-slate-700 mb-2">ระบุสิ่งที่ต้องการให้แก้ไข:</div>
                                                <textarea
                                                    value={rejectionReason}
                                                    onChange={e => setRejectionReason(e.target.value)}
                                                    className="w-full text-xs p-2 border border-slate-200 rounded mb-2 focus:ring-1 focus:ring-red-200 outline-none"
                                                    rows={2}
                                                    autoFocus
                                                    placeholder="ระบุเหตุผล..."
                                                    onClick={e => e.stopPropagation()}
                                                />
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setRejectingTaskId(null);
                                                            setRejectionReason('');
                                                        }}
                                                        className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded hover:bg-slate-200"
                                                    >
                                                        ยกเลิก
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (!rejectionReason.trim()) return;
                                                            onRejectTask(task.id, rejectionReason);
                                                            setRejectingTaskId(null);
                                                            setRejectionReason('');
                                                        }}
                                                        className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                                                    >
                                                        ส่งแก้ไข
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex gap-1 justify-between items-center w-full">
                                                {/* Back / Reject Button */}
                                                {col.id === 'Pending Review' ? (
                                                    (currentUser?.role === 'admin' || currentUser?.permissions?.canApprove || task.approver === currentUser?.name) && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setRejectingTaskId(task.id); }}
                                                            className="text-xs px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 flex items-center gap-1 shadow-sm font-medium"
                                                        >
                                                            <X size={14} /> ส่งแก้ไข
                                                        </button>
                                                    )
                                                ) : (
                                                    col.id !== 'To Do' && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const prevStatus = col.id === 'Doing' ? 'To Do' : 'Doing'; /* Fixed: Pending Review -> Doing is handled by Reject or this but logic says Pending Review back is handled separately? No, let's keep it simple. If not Pending Review, standard back */
                                                                onUpdateStatus(task.id, prevStatus);
                                                            }}
                                                            className="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded text-slate-600"
                                                        >
                                                            ← ย้อนกลับ
                                                        </button>
                                                    )
                                                )}

                                                {/* Forward / Approve Button */}
                                                {col.id !== 'Done' && (
                                                    col.id !== 'Pending Review' || (currentUser?.role === 'admin' || currentUser?.permissions?.canApprove || task.approver === currentUser?.name)
                                                ) && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onUpdateStatus(task.id, col.id === 'To Do' ? 'Doing' : col.id === 'Doing' ? 'Pending Review' : 'Done');
                                                            }}
                                                            className={`text-xs px-3 py-1.5 rounded-lg ml-auto flex items-center gap-1 font-medium transition-all ${col.id === 'Pending Review'
                                                                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md hover:shadow-lg'
                                                                : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                                                                }`}
                                                        >
                                                            {col.id === 'Doing' ? 'ส่งตรวจ' : col.id === 'Pending Review' ? <><Check size={14} strokeWidth={2.5} /> อนุมัติ</> : 'ไปต่อ →'}
                                                        </button>
                                                    )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))
                }
            </div >
        </div >
    );
}
