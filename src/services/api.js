// Configuration
export const REMOTE_CONFIG_URL = 'https://raw.githubusercontent.com/Ohmega13/my-project-followup/main/backend_url.json';

// Mock Data
const MOCK_DATA = {
    users: [
        {
            id: 'u1', email: 'admin@demo.com', username: 'admin', name: 'James Admin', role: 'admin', avatar: 'JA',
            permissions: { canEdit: true, canDelete: true, pages: ['dashboard', 'kanban', 'calendar', 'timeline', 'reports', 'settings'] }
        },
        {
            id: 'u2', email: 'ohm@demo.com', username: 'user', name: 'Ohm Staff', role: 'editor', avatar: 'OS',
            permissions: { canEdit: true, canDelete: false, pages: ['dashboard', 'kanban', 'calendar', 'timeline'] }
        },
        {
            id: 'u3', email: 'view@demo.com', username: 'view', name: 'Sarah Viewer', role: 'viewer', avatar: 'SV',
            permissions: { canEdit: false, canDelete: false, pages: ['dashboard', 'kanban', 'calendar', 'timeline'] }
        },
    ],
    projects: [
        { id: 'P001', name: 'Website Redesign', client: 'ABC Corp', deadline: '2024-03-01', status: 'In Progress', folder: 'Development' },
        { id: 'P002', name: 'Mobile App React', client: 'FastWork Co.', deadline: '2024-04-15', status: 'Pending', folder: 'Development' },
        { id: 'P003', name: 'Q1 Marketing', client: 'Internal', deadline: '2024-02-28', status: 'Done', folder: 'Marketing' },
        { id: 'P004', name: 'Office Moving', client: 'Admin', deadline: '2024-05-20', status: 'To Do', folder: 'Admin' }
    ],
    tasks: [
        {
            id: 'T001',
            projectId: 'P001',
            title: 'Design Homepage',
            assignee: 'Ohm Staff',
            status: 'Done',
            progress: 100,
            dueDate: '2024-01-20',
            priority: 'High',
            tags: [{ id: 't1', name: 'Design', color: 'pink' }, { id: 't2', name: 'Urgent', color: 'red' }],
            comments: [
                { id: 'c1', text: 'Updated the hero section per feedback.', user: { name: 'Ohm Staff', avatar: 'OS' }, timestamp: '2024-01-19T14:30:00' }
            ]
        },
        {
            id: 'T002',
            projectId: 'P001',
            title: 'Setup React Project',
            assignee: 'James Admin',
            status: 'Done',
            progress: 100,
            dueDate: '2024-01-22',
            priority: 'Medium',
            tags: [{ id: 't3', name: 'Dev', color: 'blue' }],
            comments: []
        },
        {
            id: 'T003',
            projectId: 'P001',
            title: 'API Integration',
            assignee: 'Ohm Staff',
            status: 'Doing',
            progress: 45,
            dueDate: '2024-02-10',
            priority: 'High',
            tags: [{ id: 't3', name: 'Dev', color: 'blue' }, { id: 't4', name: 'Backend', color: 'purple' }],
            comments: []
        },
        {
            id: 'T004',
            projectId: 'P001',
            title: 'User Testing',
            assignee: 'Unassigned',
            status: 'To Do',
            progress: 0,
            dueDate: '2024-02-25',
            priority: 'Low',
            tags: [],
            comments: []
        },
        {
            id: 'T005',
            projectId: 'P002',
            title: 'Requirement Gathering',
            assignee: 'James Admin',
            status: 'Doing',
            progress: 80,
            dueDate: '2024-01-30',
            priority: 'High',
            tags: [{ id: 't5', name: 'Meeting', color: 'orange' }],
            comments: []
        },
    ]
};

// Helper to call Google Apps Script
const callAppsScript = async (action, data = {}) => {
    const url = localStorage.getItem('google_script_url');
    if (!url) throw new Error("Google Script URL not set. Please check settings or connection.");

    try {
        const response = await fetch(url, {
            method: 'POST',
            mode: 'cors', // Important for GAS
            headers: {
                'Content-Type': 'text/plain;charset=utf-8', // GAS requires text/plain to avoid preflight issues sometimes
            },
            body: JSON.stringify({ action, data })
        });
        const result = await response.json();
        if (result.error) throw new Error(result.error);
        return result;
    } catch (error) {
        console.error("API Call Error:", error);
        throw error;
    }
};

export const API = {
    isDemo: false, // Dynamics check inside methods

    async init() {
        try {
            console.log("Checking for remote config...", REMOTE_CONFIG_URL);
            const res = await fetch(REMOTE_CONFIG_URL);
            if (res.ok) {
                const config = await res.json();
                if (config.google_script_url) {
                    const current = localStorage.getItem('google_script_url');
                    if (current !== config.google_script_url) {
                        console.log("Updating API URL from Remote Config:", config.google_script_url);
                        localStorage.setItem('google_script_url', config.google_script_url);
                    }
                    return config.google_script_url;
                }
            }
        } catch (e) {
            console.warn("Failed to load remote config, using local settings.", e);
        }
        return null;
    },

    async getData() {
        const url = localStorage.getItem('google_script_url');
        if (!url) {
            // Fallback to Mock
            return new Promise(resolve => {
                setTimeout(() => {
                    resolve({ projects: MOCK_DATA.projects, tasks: MOCK_DATA.tasks });
                }, 800);
            });
        }
        return callAppsScript('getData');
    },

    async login(username, password) {
        const url = localStorage.getItem('google_script_url');
        if (!url) {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    const user = MOCK_DATA.users.find(u => u.username === username && (password === username || password === 'admin'));
                    if (user) resolve(user);
                    else reject('Invalid credentials (Mock)');
                }, 1000);
            });
        }
        return callAppsScript('login', { username, password });
    },

    async addProject(project) {
        const url = localStorage.getItem('google_script_url');
        if (!url) return { success: true, project: { ...project, id: `P${Date.now()}` } };
        return callAppsScript('addProject', project);
    },

    async updateProject(project) {
        const url = localStorage.getItem('google_script_url');
        if (!url) return { success: true };
        return callAppsScript('updateProject', project);
    },

    async deleteProject(id) {
        const url = localStorage.getItem('google_script_url');
        if (!url) return { success: true };
        return callAppsScript('deleteProject', { id });
    },

    async addTask(task) {
        const url = localStorage.getItem('google_script_url');
        if (!url) return { success: true, task: { ...task, id: `T${Date.now()}` } };
        return callAppsScript('addTask', task);
    },

    async updateTask(task) {
        const url = localStorage.getItem('google_script_url');
        if (!url) return { success: true };
        return callAppsScript('updateTask', task);
    },

    async deleteTask(id) {
        const url = localStorage.getItem('google_script_url');
        if (!url) return { success: true };
        return callAppsScript('deleteTask', { id });
    },

    async getUsers() {
        const url = localStorage.getItem('google_script_url');
        if (!url) {
            return new Promise(resolve => setTimeout(() => resolve([...MOCK_DATA.users]), 500));
        }
        return callAppsScript('getUsers');
    },

    async saveUser(user) {
        const url = localStorage.getItem('google_script_url');
        if (!url) {
            // Mock Save
            if (user.id) {
                const index = MOCK_DATA.users.findIndex(u => u.id === user.id);
                if (index !== -1) MOCK_DATA.users[index] = { ...user };
            } else {
                MOCK_DATA.users.push({ ...user, id: `U${Date.now()}` });
            }
            return { success: true };
        }
        return callAppsScript('saveUser', user);
    },

    async deleteUser(id) {
        const url = localStorage.getItem('google_script_url');
        if (!url) {
            MOCK_DATA.users = MOCK_DATA.users.filter(u => u.id !== id);
            return { success: true };
        }
        return callAppsScript('deleteUser', { id });
    },

    async generateDemoData() {
        const url = localStorage.getItem('google_script_url');
        if (!url) return { success: true, message: "Mock data refreshed (reload to see)" }; // No-op for mock
        return callAppsScript('generateDemoData');
    },

    async getFolders() {
        const url = localStorage.getItem('google_script_url');
        if (!url) {
            // Mock Folders
            return new Promise(resolve => {
                setTimeout(() => {
                    resolve([
                        { id: 'f1', name: 'Development' },
                        { id: 'f2', name: 'Marketing' },
                        { id: 'f3', name: 'Design' },
                        { id: 'f4', name: 'Audit' },
                        { id: 'f5', name: 'HR' }
                    ]);
                }, 500);
            });
        }
        // Actually getAllData returns folders now, so we might just use that.
        // But let's keep it separate if needed or just use getAllData.
        // Wait, getAllData already returns everything.
        // We really just need the write operations here.
        return [];
    },

    async addFolder(name) {
        const url = localStorage.getItem('google_script_url');
        if (!url) return { success: true, folder: { id: `F${Date.now()}`, name } };
        return callAppsScript('addFolder', { name });
    },

    async deleteFolder(id) {
        const url = localStorage.getItem('google_script_url');
        if (!url) return { success: true };
        return callAppsScript('deleteFolder', { id });
    },

    async renameFolder(id, newName) { // { id, newName }
        const url = localStorage.getItem('google_script_url');
        if (!url) return { success: true };
        return callAppsScript('renameFolder', { id, newName });
    },

    async moveFolder(id, direction) { // { id, direction }
        const url = localStorage.getItem('google_script_url');
        if (!url) return { success: true };
        return callAppsScript('moveFolder', { id, direction });
    },

    async updateProjectFolder(projectId, folderName) {
        const url = localStorage.getItem('google_script_url');
        if (!url) return { success: true };
        return callAppsScript('updateProjectFolder', { projectId, folderName });
    },

    async getNotifications(user) {
        const url = localStorage.getItem('google_script_url');
        if (!url) return { success: true, notifications: [] };
        return callAppsScript('getNotifications', { user });
    },

    async addNotification(notification) {
        const url = localStorage.getItem('google_script_url');
        if (!url) return { success: true };
        return callAppsScript('addNotification', notification);
    },

    async markNotificationRead(id) {
        const url = localStorage.getItem('google_script_url');
        if (!url) return { success: true };
        return callAppsScript('markNotificationRead', { id });
    },

    async syncDatabase() {
        const url = localStorage.getItem('google_script_url');
        if (!url) return { success: true, stats: { projects: 0, tasks: 0 } };
        return callAppsScript('syncDatabase');
    },

    async resetData() {
        const url = localStorage.getItem('google_script_url');
        if (!url) return { success: true };
        return callAppsScript('resetData');
    },

    async renewData() {
        const url = localStorage.getItem('google_script_url');
        if (!url) return { success: true };
        return callAppsScript('renewData');
    },

    async backupDatabase() {
        const url = localStorage.getItem('google_script_url');
        if (!url) return { success: false, error: 'No URL' };
        return callAppsScript('backupDatabase');
    },

    async restoreDatabase(data) {
        const url = localStorage.getItem('google_script_url');
        if (!url) return { success: false, error: 'No URL' };
        return callAppsScript('restoreDatabase', data);
    }
};
