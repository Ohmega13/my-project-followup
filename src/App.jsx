import React, { useState, useEffect } from 'react';
import { LayoutDashboard, CheckSquare, LogOut, Plus, ChevronDown, Folder, FolderOpen, Calendar, GanttChartSquare, BarChart3, Settings, Shield, Menu, X, ChevronUp, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { TopProgressBar } from './components/ui/TopProgressBar';

import { API } from './services/api';
import { calculateProjectStatus } from './utils/statusHelper';
import LoginView from './components/views/LoginView';
import Dashboard from './components/views/Dashboard';
import KanbanBoard from './components/views/KanbanBoard';
import CalendarView from './components/views/CalendarView';
import TimelineView from './components/views/TimelineView';
import ReportsView from './components/views/ReportsView';
import SettingsView from './components/views/SettingsView';
import { NotificationDropdown } from './components/common/Notifications';
import TaskModal from './components/modals/TaskModal';
import ProjectModal from './components/modals/ProjectModal';
import ActionTypeModal from './components/modals/ActionTypeModal';

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('app_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [currentPage, setCurrentPage] = useState(user ? 'dashboard' : 'login'); // login, dashboard, kanban
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState({ projects: [], tasks: [] });
  const [selectedProject, setSelectedProject] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState({});
  const [users, setUsers] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile Sidebar State
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [folderToRename, setFolderToRename] = useState(null); // { id, name }
  const [activeFolderMenu, setActiveFolderMenu] = useState(null); // 'fid'

  // Resizable Sidebar
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const savedWidth = localStorage.getItem('sidebarWidth');
    return savedWidth ? parseInt(savedWidth) : 256;
  });
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      let newWidth = e.clientX;
      if (newWidth < 200) newWidth = 200; // Min width
      if (newWidth > 480) newWidth = 480; // Max width
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
        localStorage.setItem('sidebarWidth', sidebarWidth);
      }
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none'; // Prevent text selection
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, sidebarWidth]); // Dependency on sidebarWidth for latest value in LC (though in closure it acts differently, better to use setter ref)

  // Wait, I should use functional update for setSidebarWidth if I didn't depend on it, but here it's fine as long as event listener is refreshed or logic is correct. 
  // Better approach:
  // Use a ref for current width if performance issues, but for this simple interaction, basic state is okay. I will improve the effect to not re-bind constantly if not needed.
  // Actually, standard drag pattern:
  // bind move/up to window ONLY when resizing starts.

  /* Re-writing Effect for cleaner logic */
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e) => {
      let newWidth = e.clientX;
      if (newWidth < 200) newWidth = 200;
      if (newWidth > 600) newWidth = 600;
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      // Save on unmount of resize interaction
      localStorage.setItem('sidebarWidth', sidebarWidth); // This might capture stale, but let's do saving in mouseUp handler or separate effect
    };
  }, [isResizing]);

  // Save width when it changes (debounce could be good but not strictly necessary for localstorage)
  useEffect(() => {
    if (!isResizing) localStorage.setItem('sidebarWidth', sidebarWidth);
  }, [sidebarWidth, isResizing]);

  // ... (handleSaveProject, handleEditProject, etc. - keep existing) ...
  // Re-paste existing handlers to ensure context is maintained or just target the state area if possible, but replace tool is line-based.
  // I will only replace the top part and imports first.

  const handleSaveProject = (project) => {
    if (editingProject) {
      // Edit Mode
      const updatedProjects = data.projects.map(p => p.id === editingProject.id ? { ...p, ...project } : p);
      setData(prev => ({ ...prev, projects: updatedProjects }));
      API.updateProject({ ...project, id: editingProject.id });
    } else {
      // Add Mode
      const newProject = { ...project, id: `P${Date.now()} ` };
      setData(prev => ({ ...prev, projects: [...prev.projects, newProject] }));
      API.addProject(newProject);
    }
    setIsProjectModalOpen(false);
    setEditingProject(null);
  };

  // ... existing handlers ...
  // Actually, I can't easily replace just the imports and state in one go without pasting a lot of code. 
  // I will do multiple edits. First imports.

  // Let's restart the plan for this Step.
  // 1. Update imports.
  // 2. Add State.
  // 3. Update Render (Sidebar + Header + Overlay).

  // This tool call is for Imports + State only.




  const handleEditProject = (project) => {
    setEditingProject(project);
    setIsProjectModalOpen(true);
  };
  const projects = data?.projects || [];
  const projectsByFolder = projects.reduce((acc, project) => {
    const folder = project.folder || 'Uncategorized';
    if (!acc[folder]) acc[folder] = [];
    acc[folder].push(project);
    return acc;
  }, {});

  const toggleFolder = (folder) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folder]: !prev[folder]
    }));
  };

  const handleMoveFolder = async (folderId, direction) => {
    const currentFolders = data.folders || [];
    const index = currentFolders.findIndex(f => f.id === folderId);

    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === currentFolders.length - 1) return;

    const newFolders = [...currentFolders];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;

    // Swap
    const temp = newFolders[index];
    newFolders[index] = newFolders[swapIndex];
    newFolders[swapIndex] = temp;

    setData(prev => ({ ...prev, folders: newFolders }));

    await API.moveFolder({ id: folderId, direction });
  };

  const handleRenameFolder = async (folderId, newName) => {
    if (!newName) return;
    const currentFolders = data.folders || [];
    const updatedFolders = currentFolders.map(f => f.id === folderId ? { ...f, name: newName } : f);
    setData(prev => ({ ...prev, folders: updatedFolders }));

    setFolderToRename(null);
    setActiveFolderMenu(null);

    await API.renameFolder(folderId, newName);
  };

  // Load Data
  useEffect(() => {
    // Check Remote Config First
    API.init().then(() => {
      // Check localStorage for session
      const savedUser = localStorage.getItem('app_user');
      if (savedUser && !user) {
        setUser(JSON.parse(savedUser));
      }
    });
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const result = await API.getData();

      // Filter Data based on View Scope (Executive vs Supervisor)
      let filteredData = { ...result };
      const viewScope = user.permissions?.viewScope || (user.role === 'admin' ? 'GLOBAL' : 'ASSIGNED');

      if (viewScope === 'ASSIGNED') {
        const visibleTasks = result.tasks.filter(t =>
          t.assignee === user.name ||
          t.approver === user.name ||
          (Array.isArray(t.followers) && t.followers.some(f => f.name === user.name))
        );

        // Visible Projects are those containing visible tasks
        const visibleProjectIds = new Set(visibleTasks.map(t => t.projectId));
        const visibleProjects = result.projects.filter(p => visibleProjectIds.has(p.id));

        // Calculate Statuses for Projects (Handle AUTO mode)
        const processedProjects = visibleProjects.map(p => {
          const pTasks = visibleTasks.filter(t => t.projectId === p.id);
          const isAuto = p.status === 'AUTO';

          return {
            ...p,
            _originalStatus: p.status, // Preserve for Edit Modal
            isAuto: isAuto,
            status: isAuto ? calculateProjectStatus(pTasks) : p.status
          };
        });

        filteredData = {
          ...result,
          projects: processedProjects,
          tasks: visibleTasks
        };
      } else {
        // GLOBAL SCOPE - Still need to process Auto Status
        const processedProjects = result.projects.map(p => {
          const pTasks = result.tasks.filter(t => t.projectId === p.id);
          const isAuto = p.status === 'AUTO';

          return {
            ...p,
            _originalStatus: p.status,
            isAuto: isAuto,
            status: isAuto ? calculateProjectStatus(pTasks) : p.status
          };
        });

        filteredData = {
          ...result,
          projects: processedProjects
        };
      }

      setData(filteredData);

      // Fetch Users
      try {
        const usersList = await API.getUsers();
        setUsers(usersList);
      } catch (err) {
        console.warn("Could not load users", err);
      }
    } catch (error) {
      console.error("Error loading data", error);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  // Polling for Auto-Refresh (Every 15 Seconds)
  useEffect(() => {
    if (!user) return; // Don't poll if not logged in

    const intervalId = setInterval(() => {
      // Only fetch if no modal is open (to avoid overwriting unsaved work or disrupting UI)
      if (!isModalOpen && !isProjectModalOpen && !editingTask && !editingProject) {
        fetchData(false); // Silent fetch
      }
    }, 15000); // 15 Seconds

    return () => clearInterval(intervalId);
  }, [user, isModalOpen, isProjectModalOpen, editingTask, editingProject]);

  const handleLogin = async (email, password) => {
    setIsLoading(true);
    try {
      const result = await API.login(email, password);
      setUser(result);
      localStorage.setItem('app_user', JSON.stringify(result)); // Save session
      setCurrentPage('dashboard');
    } catch (error) {
      console.error("Login failed", error);
      alert('เข้าสู่ระบบไม่สำเร็จ: กรุณาตรวจสอบ Username / Password (admin/admin)');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    setIsLoading(true);
    try {
      // Optimistic Update
      const updatedTasks = data.tasks.map(t =>
        t.id === taskId ? { ...t, status: newStatus, updatedAt: new Date().toISOString() } : t
      );
      setData(prev => ({ ...prev, tasks: updatedTasks }));

      // Send update to API
      await API.updateTask({ id: taskId, status: newStatus });
    } catch (error) {
      console.error("Failed to update status", error);
      alert("บันทึกสถานะไม่สำเร็จ");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveTask = async (task) => {
    setIsLoading(true);
    try {
      let savedTask = { ...task };
      // Fix: Check task.id to determine if it's new, because "Calendar Add" sets editingTask partial data without ID.
      const isNew = !task.id;

      if (!isNew) {
        // Edit Mode
        const updatedTasks = data.tasks.map(t => t.id === task.id ? { ...t, ...task, updatedAt: new Date().toISOString() } : t);
        setData(prev => ({ ...prev, tasks: updatedTasks }));
        await API.updateTask(task);

        // Notifications (Diff)
        const oldTask = editingTask || {}; // Fallback just in case
        // 1. Assignee Change
        if (task.assignee !== oldTask.assignee && task.assignee !== user.name) {
          API.addNotification({ recipient: task.assignee, message: `คุณได้รับมอบหมายงานใหม่: ${task.title}`, type: 'info', linkId: task.id });
        }
        // 2. Approver Change
        if (task.approver !== oldTask.approver && task.approver !== user.name) {
          API.addNotification({ recipient: task.approver, message: `คุณได้รับมอบหมายให้อนุมัติงาน: ${task.title}`, type: 'warning', linkId: task.id });
        }
        // 3. New Followers
        const oldFollowerNames = (oldTask.followers || []).map(f => f.name);
        (task.followers || []).forEach(f => {
          if (!oldFollowerNames.includes(f.name) && f.name !== user.name) {
            API.addNotification({ recipient: f.name, message: `คุณถูกเพิ่มเป็นผู้เกี่ยวข้องในงาน: ${task.title}`, type: 'info', linkId: task.id });
          }
        });

      } else {
        // Add Mode
        const newId = `T${Date.now()}`;
        savedTask = {
          ...task,
          id: newId,
          status: 'To Do',
          progress: 0,
          tags: task.tags || [],
          comments: []
        };
        setData(prev => ({ ...prev, tasks: [...prev.tasks, savedTask] }));
        await API.addTask(savedTask);

        // Notifications (New)
        if (savedTask.assignee && savedTask.assignee !== user.name) {
          API.addNotification({ recipient: savedTask.assignee, message: `คุณได้รับมอบหมายงานใหม่: ${savedTask.title}`, type: 'info', linkId: savedTask.id });
        }
        if (savedTask.approver && savedTask.approver !== user.name) {
          API.addNotification({ recipient: savedTask.approver, message: `คุณได้รับมอบหมายให้อนุมัติงาน: ${savedTask.title}`, type: 'warning', linkId: savedTask.id });
        }
        if (Array.isArray(savedTask.followers)) {
          savedTask.followers.forEach(f => {
            if (f.name !== user.name) {
              API.addNotification({ recipient: f.name, message: `คุณถูกเพิ่มเป็นผู้เกี่ยวข้องในงาน: ${savedTask.title}`, type: 'info', linkId: savedTask.id });
            }
          });
        }
      }
      setIsModalOpen(false);
      setEditingTask(null);
    } catch (error) {
      console.error("Failed to save task", error);
      alert("บันทึกงานไม่สำเร็จ");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddComment = (taskId, text) => {
    const newComment = {
      id: `c${Date.now()} `,
      text,
      user: { name: user.name, avatar: user.role === 'admin' ? 'A' : 'S' },
      timestamp: new Date().toISOString()
    };

    const updatedTasks = data.tasks.map(t =>
      t.id === taskId ? { ...t, comments: [...(t.comments || []), newComment], updatedAt: new Date().toISOString() } : t
    );
    setData(prev => ({ ...prev, tasks: updatedTasks }));

    // Also update editingTask if it's open
    if (editingTask && editingTask.id === taskId) {
      setEditingTask(prev => ({ ...prev, comments: [...(prev.comments || []), newComment] }));
    }

    // Save to Backend
    const updatedTask = updatedTasks.find(t => t.id === taskId);
    API.updateTask({ id: taskId, comments: updatedTask.comments });
  };



  const handleRejectTask = async (taskId, reason) => {
    setIsLoading(true);
    try {
      // 1. Add Comment
      const newComment = {
        id: `c${Date.now()}`,
        text: `[สิ่งที่ต้องแก้ไข] ${reason}`,
        user: { name: user.name, avatar: user.role === 'admin' ? 'A' : 'S' },
        timestamp: new Date().toISOString()
      };

      // 2. Update Task Status & Progress
      const updatedTasks = data.tasks.map(t => {
        if (t.id === taskId) {
          return {
            ...t,
            status: 'Doing',
            progress: 50,
            comments: [...(t.comments || []), newComment],
            updatedAt: new Date().toISOString()
          };
        }
        return t;
      });
      setData(prev => ({ ...prev, tasks: updatedTasks }));

      // 3. API Calls
      // Update Task (Status + Progress + Comments)
      const updatedTask = updatedTasks.find(t => t.id === taskId);
      await API.updateTask({
        id: taskId,
        status: 'Doing',
        progress: 50,
        comments: updatedTask.comments
      });

      // 4. Notification
      if (updatedTask.assignee && updatedTask.assignee !== user.name) {
        API.addNotification({
          recipient: updatedTask.assignee,
          message: `งาน "${updatedTask.title}" ถูกส่งกลับแก้ไข: ${reason}`,
          type: 'error',
          linkId: taskId
        });
      }

    } catch (error) {
      console.error("Failed to reject task", error);
      alert("บันทึกการส่งแก้ไขไม่สำเร็จ");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (confirm('คุณต้องการลบงานนี้ใช่หรือไม่?')) {
      setIsLoading(true);
      try {
        const updatedTasks = data.tasks.filter(t => t.id !== taskId);
        setData(prev => ({ ...prev, tasks: updatedTasks }));

        if (editingTask && editingTask.id === taskId) {
          setIsModalOpen(false);
          setEditingTask(null);
        }

        await API.deleteTask(taskId);
      } catch (error) {
        console.error("Failed to delete task", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleEditComment = (taskId, commentId, newText) => {
    const updatedTasks = data.tasks.map(t => {
      if (t.id === taskId) {
        const updatedComments = (t.comments || []).map(c =>
          c.id === commentId ? { ...c, text: newText } : c
        );
        return { ...t, comments: updatedComments, updatedAt: new Date().toISOString() };
      }
      return t;
    });
    setData(prev => ({ ...prev, tasks: updatedTasks }));

    if (editingTask && editingTask.id === taskId) {
      setEditingTask(prev => {
        const updatedComments = (prev.comments || []).map(c =>
          c.id === commentId ? { ...c, text: newText } : c
        );
        return { ...prev, comments: updatedComments };
      });
    }

    const updatedTask = updatedTasks.find(t => t.id === taskId);
    API.updateTask({ id: taskId, comments: updatedTask.comments });
  };

  const handleDeleteComment = (taskId, commentId) => {
    if (confirm('คุณต้องการลบความคิดเห็นนี้ใช่หรือไม่?')) {
      const updatedTasks = data.tasks.map(t => {
        if (t.id === taskId) {
          const updatedComments = (t.comments || []).filter(c => c.id !== commentId);
          return { ...t, comments: updatedComments, updatedAt: new Date().toISOString() };
        }
        return t;
      });
      setData(prev => ({ ...prev, tasks: updatedTasks }));

      if (editingTask && editingTask.id === taskId) {
        setEditingTask(prev => {
          const updatedComments = (prev.comments || []).filter(c => c.id !== commentId);
          return { ...prev, comments: updatedComments };
        });
      }

      const updatedTask = updatedTasks.find(t => t.id === taskId);
      API.updateTask({ id: taskId, comments: updatedTask.comments });
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (confirm('คุณต้องการลบโปรเจกต์นี้และงานทั้งหมดในโปรเจกต์ใช่หรือไม่?')) {
      setIsLoading(true);
      try {
        const updatedProjects = data.projects.filter(p => p.id !== projectId);
        const updatedTasks = data.tasks.filter(t => t.projectId !== projectId);
        setData(prev => ({ ...prev, projects: updatedProjects, tasks: updatedTasks }));
        if (selectedProject === projectId) setSelectedProject('All');
        await API.deleteProject({ id: projectId });
      } catch (error) {
        console.error("Failed to delete project", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // --- RENDER MAIN ---

  if (!user) return <LoginView onLogin={handleLogin} isLoading={isLoading} />;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col md:flex-row relative">
      <TopProgressBar isLoading={isLoading} />
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        style={{ width: isMobile ? undefined : sidebarWidth }}
        className={`
        fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200 flex flex-col h-screen transition-transform duration-300 ease-in-out w-64
        md:relative md:translate-x-0 group
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Resize Handle */}
        <div
          className="hidden md:block absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-400 z-50 transition-colors"
          onMouseDown={() => setIsResizing(true)}
        ></div>

        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <LayoutDashboard size={18} />
            </div>
            <span className="font-bold text-lg text-slate-800 tracking-tight">ProjectFlow</span>
          </div>
          {/* Close Sidebar Button (Mobile) */}
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden text-slate-500 hover:text-slate-800"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {/* Dashboard Link */}
          {(user.permissions?.pages?.includes('dashboard') || user.role === 'admin') && (
            <button
              onClick={() => { setCurrentPage('dashboard'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors mb-1 ${currentPage === 'dashboard' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <LayoutDashboard size={18} />
              ภาพรวมบริษัท
            </button>
          )}

          {(user.permissions?.pages?.includes('calendar') || user.role === 'admin') && (
            <button
              onClick={() => { setCurrentPage('calendar'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors mb-1 ${currentPage === 'calendar' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Calendar size={18} />
              <div className="flex items-center gap-2">
                ปฏิทินงาน
                <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">Optional</span>
              </div>
            </button>
          )}

          {(user.permissions?.pages?.includes('timeline') || user.role === 'admin') && (
            <button
              onClick={() => { setCurrentPage('timeline'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors mb-4 ${currentPage === 'timeline' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <GanttChartSquare size={18} />
              <div className="flex items-center gap-2">
                ไทม์ไลน์
                <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">Optional</span>
              </div>
            </button>
          )}

          {(user.permissions?.pages?.includes('kanban') || user.role === 'admin') && (
            <>
              <div className="flex items-center justify-between px-4 mb-2 mt-4">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">ALL PROJECTS</div>
                {user.role === 'admin' && (
                  <button
                    onClick={async () => {
                      const name = prompt('ชื่อโฟลเดอร์ใหม่:');
                      if (name) {
                        try {
                          const res = await API.addFolder(name);
                          if (res.success) {
                            loadData();
                          }
                        } catch (e) { alert(e.message); }
                      }
                    }}
                    className="text-slate-400 hover:text-blue-600 transition-colors" title="เพิ่มโฟลเดอร์">
                    <Plus size={14} />
                  </button>
                )}
              </div>

              {/* Folders & Projects Tree */}
              <div className="space-y-1">
                {(() => {
                  const backendFolders = data.folders || [];
                  const backendNames = new Set(backendFolders.map(f => f.name));

                  // 1. Folders from Backend (Ordered)
                  let displayFolders = backendFolders.map(f => ({ ...f, isBackend: true }));

                  // 2. Folders from Projects (that are not in Backend yet) - Appended at the end
                  Object.keys(projectsByFolder).sort().forEach(folderName => {
                    if (folderName !== 'Uncategorized' && !backendNames.has(folderName)) {
                      displayFolders.push({ id: `virtual-${folderName}`, name: folderName, isBackend: false });
                    }
                  });

                  return (
                    <div className="py-2">
                      {displayFolders.map((folder, index) => {
                        const isExpanded = expandedFolders[folder.name];
                        const folderProjects = projectsByFolder[folder.name] || [];
                        const isEmpty = folderProjects.length === 0;

                        return (
                          <div key={folder.id} className="mb-1">
                            {/* Folder Header */}
                            <div className="group flex items-center justify-between px-4 py-2 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer group">
                              <div
                                onClick={() => toggleFolder(folder.name)}
                                className="flex items-center gap-2 flex-1 min-w-0"
                              >
                                {isExpanded ? (
                                  <FolderOpen size={16} className="text-blue-500 flex-shrink-0" />
                                ) : (
                                  <Folder size={16} className="text-slate-400 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                                )}
                                {folderToRename?.id === folder.id ? (
                                  <input
                                    autoFocus
                                    className="text-sm font-medium text-slate-700 bg-white border border-blue-300 rounded px-1 w-full outline-none"
                                    defaultValue={folder.name}
                                    onClick={(e) => e.stopPropagation()}
                                    onBlur={(e) => handleRenameFolder(folder.id, e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleRenameFolder(folder.id, e.currentTarget.value);
                                      if (e.key === 'Escape') setFolderToRename(null);
                                    }}
                                  />
                                ) : (
                                  <span className={`text-sm font-medium truncate ${isExpanded ? 'text-blue-700' : 'text-slate-600'}`}>
                                    {folder.name}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {/* Admin Only Controls */}
                                {user.role === 'admin' && folder.isBackend && (
                                  <>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleMoveFolder(folder.id, 'up'); }}
                                      disabled={index === 0}
                                      className="p-1 text-slate-300 hover:text-blue-600 disabled:opacity-30"
                                      title="ย้ายขึ้น"
                                    >
                                      <ChevronUp size={12} />
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleMoveFolder(folder.id, 'down'); }}
                                      disabled={index === displayFolders.length - 1}
                                      className="p-1 text-slate-300 hover:text-blue-600 disabled:opacity-30"
                                      title="ย้ายลง"
                                    >
                                      <ChevronDown size={12} />
                                    </button>

                                    {/* 3-Dot Menu */}
                                    <div className="relative">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveFolderMenu(activeFolderMenu === folder.id ? null : folder.id);
                                        }}
                                        className="p-1 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100"
                                      >
                                        <MoreVertical size={14} />
                                      </button>

                                      {/* Dropdown Menu */}
                                      {activeFolderMenu === folder.id && (
                                        <>
                                          <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setActiveFolderMenu(null); }}></div>
                                          <div className="absolute right-0 top-6 z-20 w-32 bg-white rounded-lg shadow-xl border border-slate-100 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                            <button
                                              onClick={(e) => { e.stopPropagation(); setFolderToRename(folder); setActiveFolderMenu(null); }}
                                              className="w-full text-left px-3 py-2 text-slate-600 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2"
                                            >
                                              <Pencil size={12} /> เปลี่ยนชื่อ
                                            </button>
                                            {isEmpty && (
                                              <button
                                                onClick={async (e) => {
                                                  e.stopPropagation();
                                                  if (confirm('ลบโฟลเดอร์นี้?')) {
                                                    const previousFolders = data.folders;
                                                    // Optimistic
                                                    const updatedFolders = data.folders.filter(f => f.id !== folder.id);
                                                    setData(prev => ({ ...prev, folders: updatedFolders }));

                                                    try {
                                                      await API.deleteFolder(folder.id);
                                                    } catch (error) {
                                                      console.error("Delete failed:", error);
                                                      alert(`ลบโฟลเดอร์ไม่สำเร็จ: ${error.message}`);
                                                      setData(prev => ({ ...prev, folders: previousFolders })); // Revert
                                                    }
                                                  }
                                                  setActiveFolderMenu(null);
                                                }}
                                                className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2"
                                              >
                                                <Trash2 size={12} /> ลบ
                                              </button>
                                            )}
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Sub-projects */}
                            {isExpanded && (
                              <div className="bg-slate-50/50">
                                {folderProjects.map(project => (
                                  <button
                                    key={project.id}
                                    onClick={() => {
                                      setSelectedProject(project.id);
                                      setCurrentPage('kanban');
                                      document.title = `${project.name} - ProjectFlow`;
                                      if (window.innerWidth < 768) setIsSidebarOpen(false);
                                    }}
                                    className={`
                                      w-full text-left pl-12 pr-4 py-2 flex items-center justify-between text-sm transition-colors
                                      ${selectedProject === project.id ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}
                                    `}
                                  >
                                    <span className="truncate">{project.name}</span>
                                    {project.status === 'Doing' && <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>}
                                    {project.status === 'Pending Review' && <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>}
                                  </button>
                                ))}
                                {folderProjects.length === 0 && (
                                  <div className="pl-12 py-2 text-xs text-slate-400 italic">ไม่มีโปรเจกต์</div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Uncategorized Projects */}
                      {projectsByFolder['Uncategorized'] && projectsByFolder['Uncategorized'].length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 mb-2">Other</div>
                          {projectsByFolder['Uncategorized'].map(p => (
                            <div
                              key={p.id}
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.setData('projectId', p.id);
                              }}
                              onClick={() => { setSelectedProject(p.id); setCurrentPage('kanban'); }}
                              className={`w-full text-left text-sm py-2 px-4 rounded-lg truncate transition-colors flex items-center gap-3 cursor-pointer ${selectedProject === p.id && currentPage === 'kanban' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${p.status === 'In Progress' ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                              <span className="truncate">{p.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

            </>
          )}
        </nav>

        <div className="p-4 border-t border-slate-100">
          {(user.permissions?.pages?.includes('settings') || user.role === 'admin') && (
            <button
              onClick={() => setCurrentPage('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors mb-2 ${currentPage === 'settings' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Settings size={18} />
              การตั้งค่า
            </button>
          )}
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
              {user.role === 'admin' ? 'A' : 'S'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.role}</p>
            </div>
          </div>
          <button onClick={() => { setUser(null); localStorage.removeItem('app_user'); }} className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm transition-colors">
            <LogOut size={16} /> ออกจากระบบ
          </button>
        </div>
      </aside >

      {/* Main Content */}
      < main className="flex-1 h-screen overflow-hidden flex flex-col" >
        {/* Top Header */}
        < header className="bg-white border-b border-slate-200 flex flex-row items-center justify-between px-4 py-2 md:px-6 md:h-16 flex-shrink-0 z-30" >
          <div className="flex items-center gap-3">
            {/* Mobile Sidebar Toggle */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden text-slate-500 hover:text-slate-800"
            >
              <Menu size={24} />
            </button>

            {currentPage === 'kanban' && (
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-800 truncate md:max-w-none">
                  {selectedProject === 'All' ? 'ทุกโปรเจกต์' : data.projects.find(p => p.id === selectedProject)?.name}
                </h2>
                {selectedProject !== 'All' && (
                  <span className="hidden md:inline-block text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full border border-slate-200">
                    {data.projects.find(p => p.id === selectedProject)?.client}
                  </span>
                )}
              </div>
            )}
            {currentPage === 'dashboard' && <h2 className="text-xl font-bold text-slate-800">แดชบอร์ด</h2>}
            {currentPage === 'reports' && <h2 className="text-xl font-bold text-slate-800">Analytics</h2>}
            {currentPage === 'settings' && <h2 className="text-xl font-bold text-slate-800">Settings</h2>}
            {currentPage === 'calendar' && <h2 className="text-xl font-bold text-slate-800">ปฏิทินงาน</h2>}
            {currentPage === 'timeline' && <h2 className="text-xl font-bold text-slate-800">ไทม์ไลน์</h2>}
          </div>

          <div className="flex items-center justify-end gap-2 md:gap-4">
            <NotificationDropdown
              currentUser={user}
              tasks={data?.tasks}
              onOpenTask={(task) => { setEditingTask(task); setIsModalOpen(true); }}
            />
            <div className="h-6 w-px bg-slate-200 mx-1"></div>
            {/* Show Add Project only if Admin */}
            {/* Top Header Button - Add Task */}
            {(user.permissions?.canEdit || user.role === 'admin') && (
              <button
                onClick={() => {
                  if (currentPage === 'calendar') {
                    setIsActionModalOpen(true);
                  } else {
                    setEditingTask(null);
                    setIsModalOpen(true);
                  }
                }}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 md:px-4 md:py-2 rounded-lg text-sm font-medium shadow-sm shadow-blue-200 transition-all whitespace-nowrap"
              >
                <Plus size={18} />
                <span className="md:hidden">เพิ่ม</span>
                <span className="hidden md:inline">เพิ่มงานใหม่</span>
              </button>
            )}

          </div>
        </header >

        {/* Content Area - With Access Check */}
        < div className="flex-1 overflow-auto p-6 bg-slate-50/50" >
          {isLoading && !data.projects.length ? (
            <div className="flex items-center justify-center h-full text-slate-400">Loading data...</div>
          ) : (
            // Access Control Logic
            (!user.permissions?.pages?.includes(currentPage) && user.role !== 'admin' && currentPage !== 'login') ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <Shield size={48} className="mb-4 text-slate-300" />
                <h3 className="text-lg font-bold text-slate-600">Access Denied</h3>
                <p className="text-sm">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>
              </div>
            ) : (
              currentPage === 'dashboard'
                ? <Dashboard
                  data={data}
                  currentUser={user}
                  onDeleteProject={handleDeleteProject}
                  onEditProject={handleEditProject}
                  onViewReports={() => setCurrentPage('reports')}
                  onAddProject={() => setIsProjectModalOpen(true)}
                  onSelectProject={(projectId) => { setSelectedProject(projectId); setCurrentPage('kanban'); }}
                  onOpenTask={(task) => { setEditingTask(task); setIsModalOpen(true); }}
                />
                : currentPage === 'calendar'
                  ? <CalendarView
                    selectedDate={selectedDate}
                    onDateSelect={setSelectedDate}
                    tasks={data.tasks}
                    projects={data.projects}
                    onEditTask={(task) => { setEditingTask(task); setIsModalOpen(true); }}
                    onAddNew={(date, type) => {
                      const isNote = type === 'note';
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const day = String(date.getDate()).padStart(2, '0');
                      const dateStr = `${year}-${month}-${day}`;

                      setEditingTask({
                        startDate: dateStr,
                        dueDate: dateStr,
                        tags: isNote ? ['Note'] : [],
                        priority: 'Medium',
                        title: isNote ? 'บันทึกช่วยจำ' : '',
                        status: 'To Do',
                        // No ID implies New Task with Defaults
                      });
                      setIsModalOpen(true);
                    }}
                  />
                  : currentPage === 'timeline'
                    ? <TimelineView projects={data.projects} tasks={data.tasks} />
                    : currentPage === 'reports'
                      ? <ReportsView data={data} />
                      : currentPage === 'settings'
                        ? <SettingsView currentUser={user} onLogout={() => { setUser(null); setCurrentPage('login'); }} />
                        : <KanbanBoard
                          data={data}
                          selectedProject={selectedProject}
                          onEditTask={(task) => { setEditingTask(task); setIsModalOpen(true); }}
                          onUpdateStatus={handleUpdateTaskStatus}
                          onDeleteTask={handleDeleteTask}
                          currentUser={user}
                          canEdit={user.permissions?.canEdit || user.role === 'admin'}
                          canDelete={user.permissions?.canDelete || user.role === 'admin'}
                          onRejectTask={handleRejectTask}
                        />
            )
          )}
        </div >
      </main >

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        task={editingTask}
        projects={data.projects}
        users={users}
        currentUser={user}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        onAddComment={handleAddComment}
        onEditComment={handleEditComment}
        onDeleteComment={handleDeleteComment}
        onCreateProject={() => setIsProjectModalOpen(true)}
      />
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSave={handleSaveProject}
        project={editingProject}
        folders={data.folders || []}
      />
      <ActionTypeModal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        date={selectedDate}
        onSelect={(type) => {
          const year = selectedDate.getFullYear();
          const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
          const day = String(selectedDate.getDate()).padStart(2, '0');
          const dateStr = `${year}-${month}-${day}`;

          setEditingTask({
            startDate: dateStr,
            dueDate: dateStr,
            status: 'To Do',
            priority: 'Medium',
            tags: type === 'note' ? ['Note'] : [],
            title: type === 'note' ? 'บันทึกช่วยจำ' : ''
          });
          setIsActionModalOpen(false);
          setIsModalOpen(true);
        }}
      />
    </div >
  );
}