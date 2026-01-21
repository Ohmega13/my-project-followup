import React from 'react';
import { BarChart3, PieChart, Users, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card } from '../ui/Card';

export default function ReportsView({ data }) {
    // 1. Calculate Summary Metrics
    const totalTasks = data.tasks.length;
    const completedTasks = data.tasks.filter(t => t.status === 'Done').length;
    const overdueTasks = data.tasks.filter(t => t.status !== 'Done' && new Date(t.dueDate) < new Date()).length;
    const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // 2. Calculate Team Performance
    const assigneeStats = data.tasks.reduce((acc, task) => {
        const user = task.assignee || 'Unassigned';
        if (!acc[user]) acc[user] = { total: 0, done: 0, overdue: 0 };
        acc[user].total++;
        if (task.status === 'Done') acc[user].done++;
        if (task.status !== 'Done' && new Date(task.dueDate) < new Date()) acc[user].overdue++;
        return acc;
    }, {});

    // 3. Status Distribution
    const statusCounts = {
        'To Do': data.tasks.filter(t => t.status === 'To Do').length,
        'Doing': data.tasks.filter(t => t.status === 'Doing').length,
        'Done': data.tasks.filter(t => t.status === 'Done').length,
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <BarChart3 className="text-blue-600" /> รายงานผลการดำเนินงาน
            </h2>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4 flex items-center gap-4 border-l-4 border-l-blue-500">
                    <div className="p-3 bg-blue-50 rounded-full text-blue-600"><BarChart3 size={24} /></div>
                    <div>
                        <p className="text-sm text-slate-500">งานทั้งหมด</p>
                        <p className="text-2xl font-bold text-slate-800">{totalTasks}</p>
                    </div>
                </Card>
                <Card className="p-4 flex items-center gap-4 border-l-4 border-l-green-500">
                    <div className="p-3 bg-green-50 rounded-full text-green-600"><CheckCircle2 size={24} /></div>
                    <div>
                        <p className="text-sm text-slate-500">เสร็จสิ้น</p>
                        <p className="text-2xl font-bold text-slate-800">{completedTasks} <span className="text-sm font-normal text-slate-400">({completionRate}%)</span></p>
                    </div>
                </Card>
                <Card className="p-4 flex items-center gap-4 border-l-4 border-l-red-500">
                    <div className="p-3 bg-red-50 rounded-full text-red-600"><AlertCircle size={24} /></div>
                    <div>
                        <p className="text-sm text-slate-500">ล่าช้า (Overdue)</p>
                        <p className="text-2xl font-bold text-red-600">{overdueTasks}</p>
                    </div>
                </Card>
                <Card className="p-4 flex items-center gap-4 border-l-4 border-l-purple-500">
                    <div className="p-3 bg-purple-50 rounded-full text-purple-600"><Users size={24} /></div>
                    <div>
                        <p className="text-sm text-slate-500">คนทำงาน</p>
                        <p className="text-2xl font-bold text-slate-800">{Object.keys(assigneeStats).length}</p>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Team Performance Table */}
                <Card className="p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Users size={20} className="text-slate-500" /> ประสิทธิภาพทีมงาน (Team Performance)
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-medium">
                                <tr>
                                    <th className="px-4 py-3 rounded-l-lg">ชื่อ</th>
                                    <th className="px-4 py-3">งานทั้งหมด</th>
                                    <th className="px-4 py-3">เสร็จแล้ว</th>
                                    <th className="px-4 py-3 text-red-600">ล่าช้า</th>
                                    <th className="px-4 py-3 rounded-r-lg text-right">Success Rate</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {Object.entries(assigneeStats).map(([name, stats]) => (
                                    <tr key={name} className="hover:bg-slate-50/50">
                                        <td className="px-4 py-3 font-medium text-slate-700">{name}</td>
                                        <td className="px-4 py-3 text-slate-600">{stats.total}</td>
                                        <td className="px-4 py-3 text-green-600 font-medium">{stats.done}</td>
                                        <td className="px-4 py-3 text-red-500">{stats.overdue > 0 ? stats.overdue : '-'}</td>
                                        <td className="px-4 py-3 text-right">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${(stats.done / stats.total) >= 0.8 ? 'bg-green-100 text-green-700' :
                                                    (stats.done / stats.total) >= 0.5 ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                {Math.round((stats.done / stats.total) * 100)}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Status Distribution Chart */}
                <Card className="p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <PieChart size={20} className="text-slate-500" /> สถานะงานปัจจุบัน (Work Status)
                    </h3>

                    <div className="space-y-6 mt-6">
                        {/* Simple CSS Bar Chart */}
                        {Object.entries(statusCounts).map(([status, count]) => {
                            const percentage = totalTasks ? (count / totalTasks) * 100 : 0;
                            let color = 'bg-slate-400';
                            if (status === 'Doing') color = 'bg-blue-500';
                            if (status === 'Done') color = 'bg-green-500';

                            return (
                                <div key={status}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium text-slate-700">{status}</span>
                                        <span className="text-slate-500">{count} งาน ({Math.round(percentage)}%)</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-3">
                                        <div
                                            className={`h-3 rounded-full transition-all duration-500 ${color}`}
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
                        <p className="text-sm text-slate-500 mb-1">💡 คำแนะนำ</p>
                        <p className="text-slate-700 font-medium">ควรเร่งติดตามงานที่อยู่ในสถานะ "Doing" เพื่อให้ทันกำหนดส่งสิ้นเดือนนี้</p>
                    </div>
                </Card>
            </div>
        </div>
    );
}
