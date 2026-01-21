
/**
 * Calculates the dynamic status of a project based on its tasks.
 * @param {Array} tasks - List of tasks belonging to the project
 * @returns {String} - Calculated status ('Not Started', 'In Progress', 'Delayed', 'Done')
 */
export const calculateProjectStatus = (tasks) => {
    if (!tasks || tasks.length === 0) return 'Not Started';

    const totalTasks = tasks.length;
    const doneTasks = tasks.filter(t => t.status === 'Done').length;

    // 1. Done: All tasks are done
    if (doneTasks === totalTasks) return 'Done';

    // 2. Delayed: Any task is overdue (and not done)
    const today = new Date();
    // Reset time to start of day for accurate comparison? Or just use real time. 
    // Usually simple comparison is enough.
    const hasDelay = tasks.some(t => {
        if (t.status === 'Done') return false;
        if (!t.dueDate) return false;
        return new Date(t.dueDate) < today;
    });

    if (hasDelay) return 'Delayed';

    // 3. In Progress: Any task is 'Doing' (In Progress) or 'Pending Review'
    const hasProgress = tasks.some(t => t.status === 'Doing' || t.status === 'Pending Review');
    if (hasProgress) return 'In Progress';

    // Also if some tasks are done but not all, it is effectively In Progress?
    if (doneTasks > 0) return 'In Progress';

    // 4. Not Started: Default fallback (All tasks are 'To Do' and not delayed)
    return 'Not Started';
};

/**
 * Returns color class for a given status
 */
export const getStatusColor = (status) => {
    switch (status) {
        case 'Done': return 'bg-green-100 text-green-700'; // Green
        case 'Delayed': return 'bg-red-100 text-red-700'; // Red
        case 'In Progress': return 'bg-blue-100 text-blue-700'; // Blue
        case 'Paused': return 'bg-orange-100 text-orange-700'; // Orange
        case 'Cancelled': return 'bg-slate-100 text-slate-700'; // Grey/Black
        case 'Not Started': return 'bg-slate-100 text-slate-500'; // Grey
        default: return 'bg-slate-100 text-slate-600';
    }
};

/**
 * Returns the Thai label for a given status
 */
export const getStatusLabel = (status) => {
    switch (status) {
        case 'Done': return 'เสร็จสิ้น';
        case 'Delayed': return 'ล่าช้า';
        case 'In Progress': return 'กำลังดำเนินการ';
        case 'Paused': return 'หยุดชั่วคราว';
        case 'Cancelled': return 'ยกเลิก';
        case 'Not Started': return 'ยังไม่เริ่ม';
        default: return status;
    }
};
