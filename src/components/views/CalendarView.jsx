import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Loader2, RefreshCw, Plus, StickyNote, PenTool } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { API } from '../../services/api';

export default function CalendarView({ tasks, projects = [], onEditTask, selectedDate, onDateSelect }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    // const [actionModal, setActionModal] = useState({ isOpen: false, date: null }); // Removed
    const [gcalEvents, setGcalEvents] = useState([]);
    const [isLoadingGCal, setIsLoadingGCal] = useState(false);

    useEffect(() => {
        fetchGCalEvents();
    }, [currentDate]);

    const fetchGCalEvents = async () => {
        setIsLoadingGCal(true);
        try {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const start = new Date(year, month, 1);
            const end = new Date(year, month + 1, 0);

            const fetchStart = new Date(start); fetchStart.setDate(fetchStart.getDate() - 7);
            const fetchEnd = new Date(end); fetchEnd.setDate(fetchEnd.getDate() + 14);

            const res = await API.getCalendarEvents(fetchStart.toISOString(), fetchEnd.toISOString());
            if (res.success && res.events) {
                setGcalEvents(res.events);
            }
        } catch (error) {
            console.error("Failed to fetch GCal events", error);
        } finally {
            setIsLoadingGCal(false);
        }
    };

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month, 1).getDay();
    };

    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const monthName = currentDate.toLocaleString('th-TH', { month: 'long', year: 'numeric' });

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const formatDate = (dateInput) => {
        if (!dateInput) return '';
        const d = new Date(dateInput);
        if (isNaN(d.getTime())) return '';
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const renderCalendarDays = () => {
        const days = [];
        const today = new Date();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        // Empty cells
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-14 md:h-32 bg-slate-50 border-b border-r border-slate-100"></div>);
        }

        // Days
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const thisDateObj = new Date(year, month, day);

            // Filter items
            const dayTasks = tasks.filter(t => formatDate(t.dueDate) === dateStr);
            const dayProjects = projects.filter(p => formatDate(p.deadline) === dateStr);
            const dayGcalEvents = gcalEvents.filter(e => formatDate(e.start) === dateStr);
            const totalItems = dayTasks.length + dayProjects.length + dayGcalEvents.length;

            const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
            const isSelected = selectedDate && formatDate(selectedDate) === dateStr;

            days.push(
                <div
                    key={day}
                    onClick={() => onDateSelect(thisDateObj)}
                    className={`h-20 md:h-32 border-b border-r border-slate-100 p-1 md:p-2 overflow-hidden cursor-pointer transition-all relative
                        ${isToday ? 'bg-blue-50/50' : 'bg-white'} 
                        ${isSelected ? 'ring-2 ring-inset ring-blue-500 bg-blue-50' : 'hover:bg-slate-50'}`}
                >
                    <div className="flex justify-between items-start mb-1">
                        <span className={`text-sm font-medium w-6 h-6 md:w-7 md:h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white' : 'text-slate-700'}`}>
                            {day}
                        </span>
                        {/* Desktop Count */}
                        {totalItems > 0 && (
                            <span className="hidden md:inline text-xs text-slate-400 font-medium">
                                {totalItems}
                            </span>
                        )}
                    </div>



                    {/* Mobile View: Dots */}
                    <div className="md:hidden flex flex-wrap gap-1 justify-center mt-2 content-center">
                        {[...Array(Math.min(dayProjects.length, 3))].map((_, i) => <div key={`pd-${i}`} className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>)}
                        {[...Array(Math.min(dayGcalEvents.length, 3))].map((_, i) => <div key={`gd-${i}`} className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>)}
                        {[...Array(Math.min(dayTasks.length, 5))].map((_, i) => <div key={`td-${i}`} className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>)}
                    </div>

                    {/* Desktop View: Full List */}
                    <div className="hidden md:block space-y-1 overflow-y-auto max-h-[calc(100%-2rem)]">
                        {/* Project Deadlines */}
                        {dayProjects.map(proj => (
                            <div key={`p-${proj.id}`} className="w-full text-left text-[10px] px-1.5 py-1 rounded bg-amber-100 border border-amber-200 text-amber-800 font-medium truncate shadow-sm mb-0.5" title={`Deadline: ${proj.name}`}>
                                🏁 {proj.name}
                            </div>
                        ))}

                        {/* Google Calendar Events */}
                        {dayGcalEvents.map((ev, idx) => (
                            <div key={`g-${idx}`} className="w-full text-left text-[10px] px-1.5 py-1 rounded bg-indigo-50 border border-indigo-100 text-indigo-700 truncate shadow-sm mb-0.5" title={`GCal: ${ev.title}`}>
                                📅 {ev.title}
                            </div>
                        ))}

                        {/* Tasks */}
                        {dayTasks.map(task => (
                            <button
                                key={task.id}
                                onClick={(e) => { e.stopPropagation(); onEditTask(task); }}
                                className={`w-full text-left text-[10px] px-1.5 py-1 rounded border mb-0.5 truncate shadow-sm transition-all hover:scale-[1.02] active:scale-95
                                    ${task.status === 'Done' ? 'bg-green-50 border-green-100 text-green-700 opacity-70' :
                                        task.priority === 'High' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-white border-slate-200 text-slate-700'}`}
                            >
                                <div className="flex items-center gap-1">
                                    <div className={`w-1.5 h-1.5 rounded-full ${task.status === 'Done' ? 'bg-green-500' : task.status === 'Doing' ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                                    <span className="truncate">{task.title}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            );
        }

        return days;
    };

    // Prepare content for Selected Date View
    const getSelectedDayContent = () => {
        const dateStr = formatDate(selectedDate);
        const dayTasks = tasks.filter(t => formatDate(t.dueDate) === dateStr);
        const dayProjects = projects.filter(p => formatDate(p.deadline) === dateStr);
        const dayGcalEvents = gcalEvents.filter(e => formatDate(e.start) === dateStr);

        return { dayTasks, dayProjects, dayGcalEvents };
    };

    const { dayTasks, dayProjects, dayGcalEvents } = getSelectedDayContent();
    const hasSelectedItems = dayTasks.length + dayProjects.length + dayGcalEvents.length > 0;

    return (
        <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg md:text-xl font-bold text-slate-800 flex items-center gap-2">
                        <CalendarIcon className="text-blue-600 hidden md:inline" />
                        {monthName}
                    </h2>
                    <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
                        <button onClick={prevMonth} className="p-1 hover:bg-white hover:shadow-sm rounded-md transition-all text-slate-600">
                            <ChevronLeft size={20} />
                        </button>
                        <button onClick={() => { setCurrentDate(new Date()); onDateSelect(new Date()); }} className="px-3 text-xs font-medium text-slate-600 hover:text-blue-600">วันนี้</button>
                        <button onClick={nextMonth} className="p-1 hover:bg-white hover:shadow-sm rounded-md transition-all text-slate-600">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                <div className="hidden md:flex items-center gap-4 text-xs">
                    {isLoadingGCal && <span className="flex items-center gap-1 text-slate-400"><Loader2 className="animate-spin" size={14} /> syncing...</span>}
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-amber-400 rounded-full"></span><span className="text-slate-600">Deadline</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-slate-400 rounded-full"></span><span className="text-slate-600">Task</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
                {['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'].map(day => (
                    <div key={day} className="py-2 text-center text-[10px] md:text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {day}
                    </div>
                ))}
            </div>

            <div className={`grid grid-cols-7 border-b md:border-b-0 border-slate-200 bg-white md:bg-slate-50/30 overflow-y-auto ${hasSelectedItems ? 'h-[260px] md:h-auto md:flex-1' : 'flex-1'}`}>
                {renderCalendarDays()}
            </div>

            {/* Selected Detail View (Mobile Focused) */}
            <div className="flex-1 md:hidden bg-slate-50 overflow-y-auto p-4 border-t border-slate-200">
                <h3 className="font-bold text-slate-800 mb-3 text-sm sticky top-0 bg-slate-50 pb-2 z-10 flex justify-between items-center">
                    <span>{selectedDate.toLocaleDateString('th-TH', { dateStyle: 'full' })}</span>
                    <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full">{dayTasks.length + dayProjects.length + dayGcalEvents.length} รายการ</span>
                </h3>

                <div className="space-y-2">
                    {hasSelectedItems ? (
                        <>
                            {dayProjects.map(proj => (
                                <div key={proj.id} className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-xl">🏁</div>
                                    <div>
                                        <h4 className="font-bold text-amber-900 text-sm">{proj.name}</h4>
                                        <p className="text-xs text-amber-700">Deadline โปรเจกต์</p>
                                    </div>
                                </div>
                            ))}
                            {dayGcalEvents.map((ev, i) => (
                                <div key={i} className="bg-indigo-50 border border-indigo-200 p-3 rounded-xl flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-xl">📅</div>
                                    <div>
                                        <h4 className="font-bold text-indigo-900 text-sm">{ev.title}</h4>
                                        <p className="text-xs text-indigo-700">{new Date(ev.start).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} - {new Date(ev.end).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                </div>
                            ))}
                            {dayTasks.map(task => (
                                <div
                                    key={task.id}
                                    onClick={() => onEditTask(task)}
                                    className="bg-white border border-slate-200 p-3 rounded-xl flex items-center gap-3 shadow-sm active:scale-98 transition-transform"
                                >
                                    <div className={`w-2 h-full rounded-full self-stretch ${task.status === 'Done' ? 'bg-green-500' : task.priority === 'High' ? 'bg-red-500' : 'bg-slate-300'}`}></div>
                                    <div className="flex-1">
                                        <h4 className={`font-semibold text-sm ${task.status === 'Done' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{task.title}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant={task.status === 'Done' ? 'success' : 'secondary'}>{task.status}</Badge>
                                            <span className="text-xs text-slate-400">{task.projectId}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                            <CalendarIcon size={32} className="mb-2 opacity-20" />
                            <p className="text-sm">ไม่มีรายการในวันนี้</p>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}
