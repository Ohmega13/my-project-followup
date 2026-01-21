import React, { useMemo, useState } from 'react';
import { GanttChartSquare, ChevronDown, ChevronRight } from 'lucide-react';

export default function TimelineView({ projects, tasks }) {
    const [expandedProjects, setExpandedProjects] = useState({});

    const toggleProject = (projectId) => {
        setExpandedProjects(prev => ({
            ...prev,
            [projectId]: !prev[projectId]
        }));
    };

    // Process data with useMemo to ensure stability (no jitter on re-render)
    const { processedData, dateRange } = useMemo(() => {
        const today = new Date();
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        const endOfYear = new Date(today.getFullYear(), 11, 31);

        let minDate = startOfYear;
        let maxDate = endOfYear;

        const data = projects.map(project => {
            const projectTasks = tasks.filter(t => t.projectId === project.id);

            // 1. Process Tasks First to get their actual Start/End dates on timeline
            const timelineTasks = projectTasks.map(t => {
                const tEnd = new Date(t.dueDate);
                // Priority: startDate > createdAt > dueDate - 7 days
                let tStart = t.startDate ? new Date(t.startDate) : (t.createdAt ? new Date(t.createdAt) : new Date(tEnd.getTime() - 7 * 24 * 60 * 60 * 1000));

                if (isNaN(tStart.getTime())) tStart = new Date(tEnd.getTime() - 7 * 24 * 60 * 60 * 1000);

                // Ensure Start <= End, if not, force start = end - 1 day
                if (tStart > tEnd) tStart = new Date(tEnd.getTime() - 24 * 60 * 60 * 1000);

                return {
                    ...t,
                    start: tStart,
                    end: tEnd
                };
            }).sort((a, b) => a.start - b.start);

            // 2. Calculate Project Start/End based on tasks
            let start = new Date(project.deadline);
            let end = new Date(project.deadline);

            if (timelineTasks.length > 0) {
                // Project Start = Earliest Task Start
                const minTaskStart = new Date(Math.min(...timelineTasks.map(t => t.start)));

                // Project End = Latest Task End OR Project Deadline (whichever is later)
                const maxTaskEnd = new Date(Math.max(...timelineTasks.map(t => t.end)));

                start = minTaskStart;
                if (maxTaskEnd > end) end = maxTaskEnd;
            } else {
                // No tasks: Default to 30 days before deadline
                start = new Date(new Date(project.deadline).getTime() - 30 * 24 * 60 * 60 * 1000);
            }

            if (isNaN(start.getTime())) start = new Date();
            if (isNaN(end.getTime())) end = new Date();

            return {
                ...project,
                start,
                end,
                tasks: timelineTasks
            };
        }).sort((a, b) => a.start - b.start);

        return {
            processedData: data,
            dateRange: { start: startOfYear, end: endOfYear, totalDays: (endOfYear - startOfYear) / (1000 * 60 * 60 * 24) }
        };
    }, [projects, tasks]); // Re-compute only when data changes

    const getLeftPos = (date) => {
        const diff = (date - dateRange.start) / (1000 * 60 * 60 * 24);
        return Math.max(0, (diff / dateRange.totalDays) * 100);
    };

    const getWidth = (start, end) => {
        const duration = (end - start) / (1000 * 60 * 60 * 24);
        return Math.max(0.5, (duration / dateRange.totalDays) * 100);
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex flex-col gap-3">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <GanttChartSquare className="text-purple-600" size={20} />
                    ไทม์ไลน์โปรเจกต์ (Project Timeline)
                </h2>
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-slate-600 pl-1">
                    <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm"></div> กำลังทำ</span>
                    <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm"></div> เสร็จสิ้น</span>
                    <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm"></div> ล่าช้า (Overdue)</span>
                    <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-slate-400 shadow-sm"></div> ยังไม่เริ่ม</span>
                </div>
            </div>

            <div className="flex-1 overflow-auto relative">
                <div className="md:min-w-[1000px] min-w-[800px]">
                    {/* Header Row */}
                    <div className="flex border-b border-slate-100 sticky top-0 bg-white z-20">
                        <div className="w-36 md:w-80 flex-shrink-0 p-4 font-semibold text-xs md:text-sm text-slate-500 bg-slate-50 border-r border-slate-100 sticky left-0 z-30 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                            ชื่อโปรเจกต์ / งาน
                        </div>
                        <div className="flex-1 flex pb-2 pt-4">
                            {['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ตุ.ค.', 'พ.ย.', 'ธ.ค.'].map((m, i) => (
                                <div key={m} className="flex-1 text-xs text-slate-400 font-medium border-l border-slate-100 pl-1">
                                    {m}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative">
                        {/* Grid Background */}
                        <div className="absolute inset-0 left-36 md:left-80 pointer-events-none z-0">
                            {/* Today Line */}
                            <div className="absolute top-0 bottom-0 border-l-2 border-red-500 border-dashed z-10 opacity-70" style={{ left: `${getLeftPos(new Date())}%` }} title="Today"></div>

                            {/* Grid Lines */}
                            <div className="absolute inset-0 flex opacity-20">
                                {Array.from({ length: 12 }).map((_, i) => (
                                    <div key={i} className="flex-1 border-l border-slate-400 h-full"></div>
                                ))}
                            </div>
                        </div>

                        {/* Rows */}
                        <div className="relative z-10 pb-10">
                            {processedData.map(project => {
                                const left = getLeftPos(project.start);
                                const width = getWidth(project.start, project.end);
                                const isExpanded = expandedProjects[project.id];
                                const statusColors = {
                                    'In Progress': 'bg-blue-500',
                                    'Done': 'bg-green-500',
                                    'To Do': 'bg-slate-400',
                                    'Pending': 'bg-yellow-500'
                                };

                                return (
                                    <React.Fragment key={project.id}>
                                        {/* Project Row */}
                                        <div className="flex items-center h-12 border-b border-slate-50 hover:bg-slate-50 transition-colors group bg-slate-50/30">
                                            {/* Name Column */}
                                            <div className="w-36 md:w-80 flex-shrink-0 px-2 md:px-4 py-2 border-r border-slate-100 font-bold text-slate-700 sticky left-0 z-20 bg-white group-hover:bg-slate-50 flex items-center gap-1 md:gap-2 shadow-[2px_0_5px_rgba(0,0,0,0.05)] text-xs md:text-base">
                                                <button
                                                    onClick={() => toggleProject(project.id)}
                                                    className="p-1 hover:bg-slate-200 rounded text-slate-400"
                                                >
                                                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                </button>
                                                <span className="truncate">{project.name}</span>
                                            </div>

                                            {/* Project Bar */}
                                            <div className="flex-1 relative h-full flex items-center px-2">
                                                <div
                                                    className={`absolute h-6 rounded-md shadow-sm flex items-center px-2 text-white text-xs font-medium cursor-pointer transition-all hover:brightness-110 whitespace-nowrap overflow-visible z-10 ${statusColors[project.status] || 'bg-slate-500'}`}
                                                    style={{
                                                        left: `${left}%`,
                                                        width: `${Math.max(width, 1)}%`
                                                    }}
                                                    title={`Project: ${project.name}\nDuration: ${project.start.toLocaleDateString()} - ${project.end.toLocaleDateString()}`}
                                                >
                                                    {width > 15 && <span className="truncate w-full">{project.name}</span>}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Task Rows (if expanded) */}
                                        {isExpanded && project.tasks.map(task => {
                                            const tLeft = getLeftPos(task.start);
                                            const tWidth = getWidth(task.start, task.end);
                                            const isOverdue = task.status !== 'Done' && new Date() > new Date(task.dueDate);
                                            const tColor = task.status === 'Done' ? 'bg-green-400' : isOverdue ? 'bg-red-500' : task.status === 'Doing' ? 'bg-blue-400' : 'bg-slate-300';

                                            return (
                                                <div key={task.id} className="flex items-center h-10 border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                                    <div className="w-36 md:w-80 flex-shrink-0 px-2 pl-6 md:px-4 md:pl-10 py-1 border-r border-slate-100 text-xs md:text-sm text-slate-600 sticky left-0 z-20 bg-white hover:bg-slate-50 flex items-center gap-2 truncate shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                                                        <div className={`w-2 h-2 rounded-full ${tColor}`}></div>
                                                        <span className="truncate">{task.title}</span>
                                                    </div>
                                                    <div className="flex-1 relative h-full flex items-center px-2">
                                                        <div
                                                            className={`absolute h-4 rounded opacity-80 hover:opacity-100 cursor-pointer ${tColor}`}
                                                            style={{
                                                                left: `${tLeft}%`,
                                                                width: `${Math.max(tWidth, 0.5)}%`
                                                            }}
                                                            title={`Task: ${task.title}\nDue: ${task.dueDate}`}
                                                        ></div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
