import React, { useState } from 'react';
import { FileText, CheckSquare, AlertCircle, Clock, Trash2, ChevronDown, ChevronRight, Plus, Info, X } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

export default function Dashboard({ data, onDeleteProject, onViewReports, onEditProject, onAddProject, onSelectProject, onOpenTask, currentUser }) {
    // Calculate Stats
    const totalTasks = data.tasks.length;
    const completedTasks = data.tasks.filter(t => t.status === 'Done').length;
    const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
    const highPriority = data.tasks.filter(t => t.priority === 'High' && t.status !== 'Done').length;

    const [expandedProjects, setExpandedProjects] = useState({});
    const [showStatusInfo, setShowStatusInfo] = useState(false);
    const [filterType, setFilterType] = useState('all');

    const getFilteredTasks = (projectId) => {
        const tasks = data.tasks.filter(t => t.projectId === projectId);
        if (filterType === 'completed') return tasks.filter(t => t.status === 'Done');
        if (filterType === 'urgent') return tasks.filter(t => t.priority === 'High' && t.status !== 'Done');
        return tasks;
    };

    const visibleProjects = data.projects.filter(project => {
        if (filterType === 'all') return true;
        return getFilteredTasks(project.id).length > 0;
    });

    const toggleProject = (projectId) => {
        setExpandedProjects(prev => ({
            ...prev,
            [projectId]: !prev[projectId]
        }));
    };

    const isTaskUnread = (task) => {
        if (!currentUser) return false;
        // Use updatedAt or fallback to createdAt. If neither, assume read.
        const taskTime = task.updatedAt || task.createdAt;
        if (!taskTime) return false;

        const lastRead = localStorage.getItem(`read_receipt_${currentUser.email}_${task.id}`);
        // If never read, it is unread
        if (!lastRead) return true;

        return new Date(taskTime) > new Date(lastRead);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card
                    className={`p-4 flex items-center gap-4 cursor-pointer transition-all hover:shadow-md ${filterType === 'all' ? 'ring-2 ring-blue-500 bg-blue-50/30' : ''}`}
                    onClick={() => setFilterType('all')}
                >
                    <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                        <FileText size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">โปรเจกต์ทั้งหมด</p>
                        <h3 className="text-2xl font-bold text-slate-800">{data.projects.length}</h3>
                    </div>
                </Card>
                <Card
                    className={`p-4 flex items-center gap-4 cursor-pointer transition-all hover:shadow-md ${filterType === 'completed' ? 'ring-2 ring-green-500 bg-green-50/30' : ''}`}
                    onClick={() => setFilterType('completed')}
                >
                    <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                        <CheckSquare size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">งานที่เสร็จแล้ว</p>
                        <h3 className="text-2xl font-bold text-slate-800">{completedTasks}/{totalTasks}</h3>
                    </div>
                </Card>
                <Card
                    className={`p-4 flex items-center gap-4 cursor-pointer transition-all hover:shadow-md ${filterType === 'urgent' ? 'ring-2 ring-orange-500 bg-orange-50/30' : ''}`}
                    onClick={() => setFilterType('urgent')}
                >
                    <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                        <AlertCircle size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">งานเร่งด่วน</p>
                        <h3 className="text-2xl font-bold text-slate-800">{highPriority} คงเหลือ</h3>
                    </div>
                </Card>
                <Card className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">ความคืบหน้าภาพรวม</p>
                        <h3 className="text-2xl font-bold text-slate-800">{progress}%</h3>
                    </div>
                </Card>
            </div>

            {/* Recent Activity / Project List Table */}
            <Card className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        สถานะโปรเจกต์
                        <button onClick={() => setShowStatusInfo(true)} className="text-slate-400 hover:text-blue-600 transition-colors">
                            <Info size={18} />
                        </button>
                    </h3>
                    <div className="flex items-center gap-3">
                        <button onClick={onAddProject} className="flex items-center gap-1 text-sm text-blue-600 font-medium hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
                            <Plus size={16} /> เพิ่มโปรเจกต์
                        </button>
                        <div className="h-4 w-px bg-slate-200"></div>
                        <button onClick={onViewReports} className="text-sm text-slate-500 font-medium hover:text-blue-600 transition-colors">ดูรายงาน</button>
                    </div>
                </div>
                {/* Mobile View: Vertical Cards */}
                <div className="md:hidden space-y-4">
                    {visibleProjects.map(project => {
                        // Stats based on ALL tasks
                        const allProjectTasks = data.tasks.filter(t => t.projectId === project.id);
                        const pDone = allProjectTasks.filter(t => t.status === 'Done').length;
                        const pProgress = allProjectTasks.length === 0 ? 0 : Math.round((pDone / allProjectTasks.length) * 100);

                        // Displayed tasks based on FILTER
                        const displayedTasks = getFilteredTasks(project.id);
                        const isExpanded = expandedProjects[project.id];

                        return (
                            <div key={project.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 onClick={() => onSelectProject(project.id)} className="font-bold text-slate-800 cursor-pointer hover:text-blue-600">{project.name}</h4>
                                        <p className="text-xs text-slate-500">{project.client}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <Badge type={project.status === 'In Progress' ? 'primary' : project.status === 'Done' ? 'success' : project.status === 'Delayed' ? 'error' : 'default'}>{project.status}</Badge>
                                        {project.isAuto && <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">AUTO</span>}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs text-slate-500">
                                        <span>กำหนดส่ง: {formatDate(project.deadline)}</span>
                                        <span>{pProgress}%</span>
                                    </div>
                                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pProgress}%` }}></div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                    <button
                                        onClick={() => toggleProject(project.id)}
                                        className="text-xs font-medium text-slate-500 flex items-center gap-1 hover:text-blue-600"
                                    >
                                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                        {displayedTasks.length} งานย่อย ({(allProjectTasks.length - displayedTasks.length) > 0 ? `ซ่อน ${allProjectTasks.length - displayedTasks.length}` : 'ทั้งหมด'})
                                    </button>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => onEditProject(project)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                                            <FileText size={16} />
                                        </button>
                                        <button onClick={() => onDeleteProject(project.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="pt-2 space-y-2 border-t border-slate-100 animate-in slide-in-from-top-2">
                                        {displayedTasks.length > 0 ? displayedTasks.map(task => (
                                            <div key={task.id} onClick={() => onOpenTask(task)} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100 cursor-pointer hover:bg-blue-50">
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${task.status === 'Done' ? 'bg-green-500' : task.status === 'In Progress' ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                                                    <span className={`text-xs truncate ${task.status === 'Done' ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{task.title}</span>
                                                    {isTaskUnread(task) && <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 animate-pulse ml-2" title="New Update"></span>}
                                                </div>
                                            </div>
                                        )) : (
                                            <p className="text-xs text-slate-400 italic text-center py-2">ไม่พบงานที่ตรงกับเงื่อนไข</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                        <thead className="text-xs text-slate-400 uppercase font-medium bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left w-10"></th>
                                <th className="px-4 py-3 text-left rounded-l-lg">ชื่อโปรเจกต์</th>
                                <th className="px-4 py-3 text-left">ลูกค้า</th>
                                <th className="px-4 py-3 text-left">กำหนดส่ง</th>
                                <th className="px-4 py-3 text-left">สถานะ</th>
                                <th className="px-4 py-3 text-left">ความคืบหน้า</th>
                                <th className="px-4 py-3 text-left rounded-r-lg">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {visibleProjects.map(project => {
                                // Stats based on ALL tasks
                                const allProjectTasks = data.tasks.filter(t => t.projectId === project.id);
                                const pDone = allProjectTasks.filter(t => t.status === 'Done').length;
                                const pProgress = allProjectTasks.length === 0 ? 0 : Math.round((pDone / allProjectTasks.length) * 100);

                                // Displayed tasks based on FILTER
                                const displayedTasks = getFilteredTasks(project.id);
                                const isExpanded = expandedProjects[project.id];

                                return (
                                    <React.Fragment key={project.id}>
                                        <tr className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-4 text-center">
                                                <button onClick={() => toggleProject(project.id)} className="text-slate-400 hover:text-blue-600">
                                                    {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                                </button>
                                            </td>
                                            <td onClick={() => onSelectProject(project.id)} className="px-4 py-4 font-medium text-slate-700 cursor-pointer hover:text-blue-600">{project.name}</td>
                                            <td className="px-4 py-4 text-slate-500">{project.client}</td>
                                            <td className="px-4 py-4 text-slate-500 text-sm">{formatDate(project.deadline)}</td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Badge type={project.status === 'In Progress' ? 'primary' : project.status === 'Done' ? 'success' : project.status === 'Delayed' ? 'error' : 'default'}>
                                                        {project.status}
                                                    </Badge>
                                                    {project.isAuto && <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100" title="สถานะถูกคำนวณอัตโนมัติ">AUTO</span>}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 w-32">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full">
                                                        <div className="h-1.5 bg-blue-500 rounded-full" style={{ width: `${pProgress}%` }}></div>
                                                    </div>
                                                    <span className="text-xs text-slate-500">{pProgress}%</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 w-20">
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => onEditProject(project)}
                                                        className="text-slate-400 hover:text-blue-600 transition-colors p-1 rounded-full hover:bg-blue-50"
                                                        title="แก้ไขโปรเจกต์"
                                                    >
                                                        <FileText size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => onDeleteProject(project.id)}
                                                        className="text-slate-400 hover:text-red-600 transition-colors p-1 rounded-full hover:bg-red-50"
                                                        title="ลบโปรเจกต์"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        {isExpanded && (
                                            <tr className="bg-slate-50/50">
                                                <td colSpan="7" className="px-4 py-3 pl-12">
                                                    <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                                                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                                                            <CheckSquare size={14} /> รายการงานในโปรเจกต์ ({displayedTasks.length})
                                                        </h4>
                                                        {displayedTasks.length > 0 ? (
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                {displayedTasks.map(task => (
                                                                    <div key={task.id} onClick={() => onOpenTask(task)} className="flex items-center justify-between p-2 rounded-md border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer">
                                                                        <div className="flex items-center gap-2 min-w-0">
                                                                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${task.status === 'Done' ? 'bg-green-500' : task.status === 'In Progress' ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                                                                            <span className={`text-sm truncate ${task.status === 'Done' ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{task.title}</span>
                                                                            {isTaskUnread(task) && <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 animate-pulse ml-2" title="New Update"></span>}
                                                                        </div>
                                                                        <Badge type={task.status === 'Done' ? 'success' : task.status === 'In Progress' ? 'primary' : 'default'} size="sm">
                                                                            {task.status}
                                                                        </Badge>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm text-slate-400 italic">ไม่พบงานที่ตรงกับเงื่อนไข</p>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Status Info Modal */}
            {showStatusInfo && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                <Info size={20} className="text-blue-600" /> คำอธิบายสถานะ (Status Legend)
                            </h3>
                            <button onClick={() => setShowStatusInfo(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-slate-500 mb-4">
                                ระบบมีการคำนวณสถานะอัตโนมัติ (AUTO) โดยพิจารณาจากงานย่อยในโปรเจกต์ ดังนี้:
                            </p>

                            <div className="space-y-3">
                                <div className="flex gap-3">
                                    <div className="w-24 flex-shrink-0">
                                        <span className="px-2 py-1 rounded bg-slate-100 text-slate-600 text-xs font-bold block text-center">To Do</span>
                                        <div className="text-[10px] text-center text-slate-400 mt-1">Waiting</div>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">ยังไม่เริ่ม / รอดำเนินการ</p>
                                        <p className="text-xs text-slate-500">โปรเจกต์ยังไม่มีการเริ่มทำงานใดๆ และยังไม่ถึงกำหนดส่ง</p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <div className="w-24 flex-shrink-0">
                                        <span className="px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs font-bold block text-center">In Progress</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">กำลังดำเนินการ</p>
                                        <p className="text-xs text-slate-500">มีงานอย่างน้อย 1 งานที่กำลังทำอยู่ (Doing) หรือรอตรวจสอบ (Pending Review)</p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <div className="w-24 flex-shrink-0">
                                        <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-700 text-xs font-bold block text-center">Pending</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">รอตรวจสอบ</p>
                                        <p className="text-xs text-slate-500">งานถูกส่งมาเพื่อขออนุมัติ หรือ Review</p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <div className="w-24 flex-shrink-0">
                                        <span className="px-2 py-1 rounded bg-red-100 text-red-700 text-xs font-bold block text-center">Delayed</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">ล่าช้า</p>
                                        <p className="text-xs text-slate-500">มีงานที่ <b>เลยกำหนดส่ง (Due Date)</b> และยังทำไม่เสร็จ (สถานะจะเปลี่ยนเป็นสีแดงอัตโนมัติ)</p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <div className="w-24 flex-shrink-0">
                                        <span className="px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-bold block text-center">Done</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">เสร็จสิ้น</p>
                                        <p className="text-xs text-slate-500">งานทั้งหมดในโปรเจกต์เสร็จสมบูรณ์เรียบร้อยแล้ว (100%)</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-700 border border-blue-100">
                                <b>Note:</b> คุณสามารถเลือกปรับสถานะเป็น Manual ได้ในหน้าแก้ไขโปรเจกต์ หากต้องการกำหนดสถานะเอง (เช่น Paused, Cancelled)
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
