/**
 * Google Apps Script for Project Follow-up WebApp
 * 
 * Instructions:
 * 1. Open your Google Sheet.
 * 2. Extensions > Apps Script.
 * 3. Paste this code into Code.gs.
 * 4. Run `setup()` function once to create sheets.
 * 5. Deploy > New deployment > Web app.
 *    - Execute as: Me
 *    - Who has access: Anyone (or Anyone with Google account if you want auth)
 * 6. Copy the Current web app URL and paste it into `src/services/api.js` in your React project.
 */

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const action = e.parameter.action || (e.postData && JSON.parse(e.postData.contents).action);
    const data = e.parameter.data ? JSON.parse(e.parameter.data) : (e.postData && JSON.parse(e.postData.contents).data);
    
    let result = {};

    switch (action) {
      case 'getData':
        result = getAllData();
        break;
      case 'addTask':
        result = addTask(data);
        break;
      case 'updateTask':
        result = updateTask(data);
        break;
      case 'deleteTask':
        result = deleteTask(data);
        break;
      case 'addProject':
        result = addProject(data);
        break;
      case 'updateProject':
        result = updateProject(data);
        break;
      case 'deleteProject':
        result = deleteProject(data);
        break;
      case 'getUsers':
        result = getUsers();
        break;
      case 'saveUser':
        result = saveUser(data);
        break;
      case 'deleteUser':
        result = deleteUser(data);
        break;
      case 'login':
        result = login(data);
        break;
      case 'generateDemoData':
        result = generateDemoData();
        break;
      case 'addFolder':
        result = addFolder(data);
        break;
      case 'deleteFolder':
        result = deleteFolder(data);
        break;
      case 'renameFolder':
        result = renameFolder(data);
        break;
      case 'moveFolder':
        result = moveFolder(data);
        break;
      case 'updateProjectFolder':
        result = updateProjectFolder(data);
        break;
      case 'syncDatabase':
        result = syncDatabase();
        break;
      case 'fixDatabaseColumns':
        result = fixDatabaseColumns();
        break;
      case 'getCalendarEvents':
        result = getCalendarEvents(data);
        break;
      case 'getNotifications':
        result = getNotifications(data);
        break;
      case 'addNotification':
        result = addNotification(data);
        break;
      case 'markNotificationRead':
        result = markNotificationRead(data);
        break;
      case 'resetData':
        result = resetData();
        break;
      case 'renewData':
        result = renewData();
        break;
      case 'backupDatabase':
        result = backupDatabase();
        break;
      case 'restoreDatabase':
        result = restoreDatabase(data);
        break;
      default:
        result = { error: 'Invalid action' };
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// --- CORE FUNCTIONS ---

function getAllData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const projects = getSheetData(ss.getSheetByName('Projects'));
  const tasks = getSheetData(ss.getSheetByName('Tasks'));
  const folders = getSheetData(ss.getSheetByName('Folders'));
  return { projects, tasks, folders };
}

function addTask(task) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Tasks');
  const newRow = [
    task.id, 
    task.projectId, 
    task.title, 
    task.description || '',
    task.assignee, 
    task.status, 
    task.progress, 
    task.startDate,
    task.dueDate, 
    task.priority,
    JSON.stringify(task.comments || []),
    new Date(), // Created At
    task.approver || '',
    JSON.stringify(task.followers || []),
    new Date() // Updated At
  ];
  sheet.appendRow(newRow);
  return { success: true, task };
}

function addProject(project) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Projects');
  const newRow = [
    project.id || `P${new Date().getTime()}`,
    project.name,
    project.client,
    project.deadline,
    project.status,
    project.folder || ''
  ];
  sheet.appendRow(newRow);
  return { success: true, project: { ...project, id: newRow[0] } };
}

function updateProject(project) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Projects');
  const data = sheet.getDataRange().getValues();
  const rowIndex = data.findIndex(row => row[0] == project.id);
  
  if (rowIndex > 0) {
    // 0:id, 1:name, 2:client, 3:deadline, 4:status, 5:folder
    if(project.name) sheet.getRange(rowIndex + 1, 2).setValue(project.name);
    if(project.client) sheet.getRange(rowIndex + 1, 3).setValue(project.client);
    if(project.deadline) sheet.getRange(rowIndex + 1, 4).setValue(project.deadline);
    if(project.status) sheet.getRange(rowIndex + 1, 5).setValue(project.status);
    if(project.folder) sheet.getRange(rowIndex + 1, 6).setValue(project.folder);
    return { success: true };
  }
  return { error: 'Project not found' };
}

function updateTask(task) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Tasks');
  const data = sheet.getDataRange().getValues();
  const rowIndex = data.findIndex(row => row[0] == task.id);
  
  if (rowIndex > 0) {
    if(task.title) sheet.getRange(rowIndex + 1, 3).setValue(task.title);
    if(task.description) sheet.getRange(rowIndex + 1, 4).setValue(task.description);
    if(task.assignee) sheet.getRange(rowIndex + 1, 5).setValue(task.assignee);
    if(task.status) sheet.getRange(rowIndex + 1, 6).setValue(task.status);
    if(task.progress !== undefined) sheet.getRange(rowIndex + 1, 7).setValue(task.progress);
    if(task.startDate) sheet.getRange(rowIndex + 1, 8).setValue(task.startDate);
    if(task.dueDate) sheet.getRange(rowIndex + 1, 9).setValue(task.dueDate);
    if(task.priority) sheet.getRange(rowIndex + 1, 10).setValue(task.priority);
    if(task.comments) sheet.getRange(rowIndex + 1, 11).setValue(JSON.stringify(task.comments));
    if(task.approver) sheet.getRange(rowIndex + 1, 13).setValue(task.approver);
    if(task.followers) sheet.getRange(rowIndex + 1, 14).setValue(JSON.stringify(task.followers));
    
    // Always update updatedAt (Col 15)
    sheet.getRange(rowIndex + 1, 15).setValue(new Date());
    
    return { success: true };
  }
  return { error: 'Task not found' };
}

function deleteTask(d) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Tasks');
  const data = sheet.getDataRange().getValues();
  const rowIndex = data.findIndex(row => row[0] == d.id);
  if (rowIndex > 0) {
    sheet.deleteRow(rowIndex + 1);
    return { success: true };
  }
  return { error: 'Task not found' };
}

function deleteProject(d) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Projects');
  const data = sheet.getDataRange().getValues();
  const rowIndex = data.findIndex(row => row[0] == d.id);
  if (rowIndex > 0) {
    sheet.deleteRow(rowIndex + 1);
    return { success: true };
  }
  return { error: 'Project not found' };
}

function addFolder(data) { // { name }
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Folders');
  
  if (!sheet) {
    sheet = ss.insertSheet('Folders');
    sheet.appendRow(['id', 'name', 'createdAt']);
  }

  const newRow = [
    `F${new Date().getTime()}`,
    data.name,
    new Date()
  ];
  sheet.appendRow(newRow);
  return { success: true, folder: { id: newRow[0], name: newRow[1] } };
}

function deleteFolder(data) { // { id }
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Folders');
  const d = sheet.getDataRange().getValues();
  // Use String coercion for safer ID comparison
  const rowIndex = d.findIndex(row => String(row[0]) == String(data.id));
  if(rowIndex > 0) {
    sheet.deleteRow(rowIndex + 1);
    return { success: true };
  }
  return { error: 'Folder not found' };
}

function renameFolder(data) { // { id, newName }
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Folders');
  const d = sheet.getDataRange().getValues();
  const rowIndex = d.findIndex(row => String(row[0]) == String(data.id));
  
  if (rowIndex > 0) {
    sheet.getRange(rowIndex + 1, 2).setValue(data.newName);
    return { success: true };
  }
  return { error: 'Folder not found' };
}

function moveFolder(data) { // { id, direction }
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Folders');
  const d = sheet.getDataRange().getValues();
  const rowIndex = d.findIndex(row => row[0] == data.id);
  
  if (rowIndex > 0) { // Found and not header
    const row = rowIndex + 1; // 1-based
    
    if (data.direction === 'up') {
      if (row > 2) {
         const rangeCurr = sheet.getRange(row, 1, 1, sheet.getLastColumn());
         const rangeAbove = sheet.getRange(row - 1, 1, 1, sheet.getLastColumn());
         const valsCurr = rangeCurr.getValues();
         const valsAbove = rangeAbove.getValues();
         rangeCurr.setValues(valsAbove);
         rangeAbove.setValues(valsCurr);
         return { success: true };
      }
    } else { // down
      if (rowIndex < d.length - 1) {
         const rangeCurr = sheet.getRange(row, 1, 1, sheet.getLastColumn());
         const rangeBelow = sheet.getRange(row + 1, 1, 1, sheet.getLastColumn());
         const valsCurr = rangeCurr.getValues();
         const valsBelow = rangeBelow.getValues();
         rangeCurr.setValues(valsBelow);
         rangeBelow.setValues(valsCurr);
         return { success: true };
      }
    }
  }
  return { success: false };
}

function updateProjectFolder(data) { // { projectId, folderName }
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Projects');
  const d = sheet.getDataRange().getValues();
  const rowIndex = d.findIndex(row => row[0] == data.projectId);
  
  if (rowIndex > 0) {
    // Column 6 (F) is 'folder'
    sheet.getRange(rowIndex + 1, 6).setValue(data.folderName);
    return { success: true };
  }
  return { error: 'Project not found' };
}

// --- USER MANAGEMENT ---

function getUsers() {
  const users = getSheetData(SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users'));
  // Parse permissions JSON if it exists, otherwise provide defaults
  return users.map(u => ({
    ...u,
    permissions: u.permissions ? JSON.parse(u.permissions) : null
  }));
}

function saveUser(user) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users');
  const data = sheet.getDataRange().getValues();
  let rowIndex = data.findIndex(row => row[0] == user.id); // ID is now col 0

  const rowData = [
    user.id || `U${new Date().getTime()}`,
    user.email || '',
    user.username,
    user.password || '1234', // Default password if new
    user.name,
    user.role,
    user.avatar,
    JSON.stringify(user.permissions || {})
  ];

  if (rowIndex > 0) {
    // Update
    // We only update fields that are safe. For simplicity, we rewrite the row except maybe ID
    const range = sheet.getRange(rowIndex + 1, 1, 1, rowData.length);
    range.setValues([rowData]);
  } else {
    // Add
    sheet.appendRow(rowData);
  }
  return { success: true };
}

function deleteUser(d) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users');
  const data = sheet.getDataRange().getValues();
  const rowIndex = data.findIndex(row => row[0] == d.id);
  if (rowIndex > 0) {
    sheet.deleteRow(rowIndex + 1);
    return { success: true };
  }
  return { error: 'User not found' };
}

function login(credentials) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users');
  const users = getSheetData(sheet);
  // Support both username and email login for backward compat
  const user = users.find(u => (u.username === credentials.username || u.email === credentials.username) && (u.password == credentials.password));
  
  if (user) {
    return { 
      ...user,
      permissions: user.permissions ? JSON.parse(user.permissions) : null
    };
  }
  return { error: 'Invalid credentials' };
}

// --- HELPER FUNCTIONS ---

function getSheetData(sheet) {
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  return data.slice(1).map(row => {
    let obj = {};
    headers.forEach((header, i) => {
      // Convert header to camelCase if needed, or just use as is
      let key = header.toLowerCase().replace(/ [a-z]/g, match => match.trim().toUpperCase());
      
      // Specific fixes for camelCase headers from Demo Data vs Spaced headers from Manual Entry
      if (key === 'projectid') key = 'projectId';
      if (key === 'duedate') key = 'dueDate';
      if (key === 'startdate') key = 'startDate';
      if (key === 'createdat') key = 'createdAt';
      
      if (key === 'comments' || key === 'followers') {
        try {
          obj[key] = JSON.parse(row[i]);
        } catch (e) {
          obj[key] = [];
        }
      } else {
        obj[key] = row[i];
      }
    });
    return obj;
  });
}

// --- SETUP FUNCTION ---

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  if (!ss.getSheetByName('Projects')) {
    const pSheet = ss.insertSheet('Projects');
    pSheet.appendRow(['id', 'name', 'client', 'deadline', 'status', 'folder']);
    pSheet.appendRow(['P001', 'Website Redesign', 'ABC Corp', '2024-03-01', 'In Progress', 'Development']);
    pSheet.appendRow(['P002', 'Mobile App', 'FastWork', '2024-04-15', 'Pending', 'Development']);
    pSheet.appendRow(['P003', 'Marketing Q1', 'Internal', '2024-02-28', 'Done', 'Marketing']);
  }

  if (!ss.getSheetByName('Tasks')) {
    const tSheet = ss.insertSheet('Tasks');
    tSheet.appendRow(['id', 'projectId', 'title', 'description', 'assignee', 'status', 'progress', 'startDate', 'dueDate', 'priority', 'comments', 'createdAt', 'approver', 'followers', 'updatedAt']);
    tSheet.appendRow(['T001', 'P001', 'Design Homepage', 'Create main hero section', 'Ohm Staff', 'Done', 100, '2024-01-15', '2024-01-20', 'High', '[]', new Date(), '', '[]']);
    // Fix Formats
    tSheet.getRange("G:G").setNumberFormat("0"); // Progress as Number
    tSheet.getRange("H:I").setNumberFormat("yyyy-mm-dd"); // Dates
    tSheet.getRange("L:L").setNumberFormat("yyyy-mm-dd hh:mm:ss"); // CreatedAt
    tSheet.getRange("O:O").setNumberFormat("yyyy-mm-dd hh:mm:ss"); // UpdatedAt
  }


  if (!ss.getSheetByName('Users')) {
    const uSheet = ss.insertSheet('Users');
    uSheet.appendRow(['id', 'email', 'username', 'password', 'name', 'role', 'avatar', 'permissions']);
    
    // Default Admin
    const adminPerms = JSON.stringify({ canEdit: true, canDelete: true, pages: ['dashboard', 'kanban', 'calendar', 'timeline', 'reports', 'settings'] });
    uSheet.appendRow(['u1', 'admin@demo.com', 'admin', 'admin', 'James Admin', 'admin', 'JA', adminPerms]);
    
    // Default Staff
    const staffPerms = JSON.stringify({ canEdit: true, canDelete: false, pages: ['dashboard', 'kanban', 'calendar', 'timeline'] });
    uSheet.appendRow(['u2', 'staff@demo.com', 'user', 'user', 'Ohm Staff', 'editor', 'OS', staffPerms]);
  }

  if (!ss.getSheetByName('Folders')) {
    const fSheet = ss.insertSheet('Folders');
    fSheet.appendRow(['id', 'name', 'createdAt']);
    fSheet.appendRow(['F1', 'Development', new Date()]);
    fSheet.appendRow(['F2', 'Marketing', new Date()]);
    fSheet.appendRow(['F3', 'Design', new Date()]);
    fSheet.appendRow(['F4', 'Audit', new Date()]);
    fSheet.appendRow(['F5', 'HR', new Date()]);
  }
}

// --- DEMO DATA GENERATOR ---

function generateDemoData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Setup Sheets
  const sheets = ['Projects', 'Tasks', 'Folders', 'Users'];
  sheets.forEach(name => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);
    sheet.clear();
  });

  const pSheet = ss.getSheetByName('Projects');
  const tSheet = ss.getSheetByName('Tasks');
  const fSheet = ss.getSheetByName('Folders');
  const uSheet = ss.getSheetByName('Users');

  // Headers
  pSheet.appendRow(['id', 'name', 'client', 'deadline', 'status', 'folder']);
  tSheet.appendRow(['id', 'projectId', 'title', 'description', 'assignee', 'status', 'progress', 'startDate', 'dueDate', 'priority', 'comments', 'createdAt', 'approver', 'followers', 'updatedAt']);
  fSheet.appendRow(['id', 'name', 'createdAt']);
  uSheet.appendRow(['id', 'email', 'username', 'password', 'name', 'role', 'avatar', 'permissions']);

  // Format Columns
  tSheet.getRange("G:G").setNumberFormat("0"); // Progress
  tSheet.getRange("H:I").setNumberFormat("yyyy-mm-dd"); // Dates
  tSheet.getRange("L:L").setNumberFormat("yyyy-mm-dd hh:mm:ss"); // CreatedAt
  tSheet.getRange("O:O").setNumberFormat("yyyy-mm-dd hh:mm:ss"); // UpdatedAt

  // 2. Create Users
  const users = [
    // Admin
    { id: 'u1', email: 'admin@demo.com', user: 'admin', pass: 'admin', name: 'Super Admin', role: 'admin', ava: 'AD', perms: { canEdit: true, canDelete: true, canApprove: true, pages: ['dashboard', 'kanban', 'calendar', 'timeline', 'reports', 'settings'] } },
    // Executives (Approvers)
    { id: 'u2', email: 'exec1@demo.com', user: 'cfo', pass: '1234', name: 'Somchai CFO', role: 'viewer', ava: 'SC', perms: { canEdit: false, canDelete: false, canApprove: true, pages: ['dashboard', 'reports'] } },
    { id: 'u3', email: 'exec2@demo.com', user: 'ceo', pass: '1234', name: 'Malee CEO', role: 'viewer', ava: 'MC', perms: { canEdit: false, canDelete: false, canApprove: true, pages: ['dashboard', 'reports'] } },
    // Editors (Staff)
    { id: 'u4', email: 'editor1@demo.com', user: 'top', pass: '1234', name: 'Top Dev', role: 'editor', ava: 'TD', perms: { canEdit: true, canDelete: false, pages: ['dashboard', 'kanban', 'calendar'] } },
    { id: 'u5', email: 'editor2@demo.com', user: 'joy', pass: '1234', name: 'Joy Design', role: 'editor', ava: 'JD', perms: { canEdit: true, canDelete: false, pages: ['dashboard', 'kanban', 'calendar'] } },
    { id: 'u6', email: 'editor3@demo.com', user: 'bank', pass: '1234', name: 'Bank Mkt', role: 'editor', ava: 'BM', perms: { canEdit: true, canDelete: false, pages: ['dashboard', 'kanban', 'calendar'] } },
    { id: 'u7', email: 'editor4@demo.com', user: 'fon', pass: '1234', name: 'Fon HR', role: 'editor', ava: 'FH', perms: { canEdit: true, canDelete: false, pages: ['dashboard', 'kanban', 'calendar'] } },
    { id: 'u8', email: 'editor5@demo.com', user: 'max', pass: '1234', name: 'Max Sales', role: 'editor', ava: 'MS', perms: { canEdit: true, canDelete: false, pages: ['dashboard', 'kanban', 'calendar'] } },
    // Viewers
    { id: 'u9', email: 'view1@demo.com', user: 'guest1', pass: '1234', name: 'Guest One', role: 'viewer', ava: 'G1', perms: { canEdit: false, canDelete: false, pages: ['dashboard'] } },
    { id: 'u10', email: 'view2@demo.com', user: 'guest2', pass: '1234', name: 'Guest Two', role: 'viewer', ava: 'G2', perms: { canEdit: false, canDelete: false, pages: ['dashboard'] } }
  ];

  users.forEach(u => {
    uSheet.appendRow([u.id, u.email, u.user, u.pass, u.name, u.role, u.ava, JSON.stringify(u.perms)]);
  });

  // 3. Create Folders
  const folderNames = ['Development', 'Marketing', 'Design', 'Sales', 'HR', 'Finance', 'Legal'];
  const folderRows = folderNames.map((n, i) => [`F${i+1}`, n, new Date()]);
  folderRows.forEach(r => fSheet.appendRow(r));

  // 4. Create Projects
  const clients = ['Agoda', 'SCB', 'True', 'CP All', 'Shopee', 'Lazada', 'Grab', 'Line', 'KBank', 'PTT'];
  const statuses = ['In Progress', 'Pending', 'Done', 'To Do'];
  const projectRows = [];
  const projectIds = [];

  for (let i = 1; i <= 20; i++) {
    const pid = `P${String(i).padStart(3, '0')}`;
    const client = clients[Math.floor(Math.random() * clients.length)];
    const folder = folderNames[Math.floor(Math.random() * folderNames.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + (Math.floor(Math.random() * 60) - 30)); // +/- 30 days
    const deadline = new Date(startDate);
    deadline.setDate(deadline.getDate() + 30 + Math.floor(Math.random() * 60)); // +30-90 days

    projectRows.push([
      pid,
      `${client} Project Phase ${Math.ceil(Math.random() * 5)}`,
      client,
      deadline.toISOString().split('T')[0],
      status,
      folder
    ]);
    projectIds.push({ id: pid, start: startDate, end: deadline, name: client });
  }
  
  // Bulk append (faster)
  if (projectRows.length > 0) {
    pSheet.getRange(2, 1, projectRows.length, projectRows[0].length).setValues(projectRows);
  }

  // 5. Create Tasks
  const taskRows = [];
  const editors = users.filter(u => u.role === 'editor' || u.role === 'admin');
  const approvers = users.filter(u => u.perms.canApprove);
  const viewers = users.filter(u => u.role === 'viewer');
  
  projectIds.forEach(proj => {
    const numTasks = Math.floor(Math.random() * 8) + 3; // 3-10 tasks per project
    
    for (let j = 1; j <= numTasks; j++) {
      const tid = `${proj.id}-${j}`;
      const assignee = editors[Math.floor(Math.random() * editors.length)];
      const hasApprover = Math.random() > 0.7;
      const approver = hasApprover ? approvers[Math.floor(Math.random() * approvers.length)].name : '';
      
      // Followers logic
      const followerList = [];
      if (Math.random() > 0.5) followerList.push({ name: viewers[0].name, avatar: viewers[0].ava });
      if (Math.random() > 0.8) followerList.push({ name: approvers[0].name, avatar: approvers[0].ava });
      if (Math.random() > 0.8) followerList.push({ name: assignee.name === editors[0].name ? editors[1].name : editors[0].name, avatar: 'ST' });

      // Dates within project range
      const tStart = new Date(proj.start.getTime() + Math.random() * (proj.end.getTime() - proj.start.getTime()));
      const tDue = new Date(tStart);
      tDue.setDate(tDue.getDate() + Math.floor(Math.random() * 14) + 1);

      const statusVal = ['To Do', 'In Progress', 'Done', 'Waiting'][Math.floor(Math.random() * 4)];
      const progress = statusVal === 'Done' ? 100 : (statusVal === 'To Do' ? 0 : Math.floor(Math.random() * 90));

      taskRows.push([
        tid,
        proj.id,
        `${['Design', 'Coding', 'Meeting', 'Review', 'Testing', 'Deploy'][Math.floor(Math.random() * 6)]} Module ${j}`,
        `Task details for ${proj.name}. Ensure compliance with specs.`,
        assignee.name,
        statusVal,
        progress,
        tStart.toISOString().split('T')[0],
        tDue.toISOString().split('T')[0],
        ['Low', 'Medium', 'High', 'Critical'][Math.floor(Math.random() * 4)],
        '[]', // Comments
        new Date(), // CreatedAt
        approver,
        JSON.stringify(followerList),
        new Date() // updatedAt
      ]);
    }
  });

  if (taskRows.length > 0) {
    tSheet.getRange(2, 1, taskRows.length, taskRows[0].length).setValues(taskRows);
  }

  return { success: true, message: `Generates ${users.length} users, ${projectRows.length} projects, ${taskRows.length} tasks.` };
}

// --- CALENDAR INTEGRATION ---

function getCalendarEvents(idStr) { // { start, end } or just use relative logic if passed dates are tricky
  // However, simpler to just fetch "events for this month" or receive start/end date strings
  // Let's assume data = { start: 'yyyy-mm-dd', end: 'yyyy-mm-dd' }
  try {
    const start = new Date(idStr.start);
    const end = new Date(idStr.end);
    
    // Get default calendar
    const cal = CalendarApp.getDefaultCalendar();
    if (!cal) return { events: [] };

    const events = cal.getEvents(start, end);
    
    const simpleEvents = events.map(e => ({
      id: e.getId(),
      title: e.getTitle(),
      start: e.getStartTime().toISOString(),
      end: e.getEndTime().toISOString(),
      isAllDay: e.isAllDayEvent(),
      color: e.getColor() || '#7986cb', // Default generic color
      type: 'gcal'
    }));

    return { success: true, events: simpleEvents };
  } catch (e) {
    // If permission missing or other error
    return { success: false, error: e.toString(), events: [] };
  }
}

function syncFolders() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let fSheet = ss.getSheetByName('Folders');
  if (!fSheet) {
    fSheet = ss.insertSheet('Folders');
    fSheet.appendRow(['id', 'name', 'createdAt']);
  }

  // Get existing folders
  const existingFolders = getSheetData(fSheet);
  const existingNames = new Set(existingFolders.map(f => f.name));

  // Default Folders (James Demo)
  const defaults = ['Design', 'Development', 'HR', 'Marketing', 'Product'];
  
  // Scan Projects for used folders
  const pSheet = ss.getSheetByName('Projects');
  if (pSheet) {
    const projects = getSheetData(pSheet);
    projects.forEach(p => {
      if (p.folder && p.folder.toString().trim() !== '' && p.folder.toString().trim() !== 'undefined') {
        defaults.push(p.folder.toString().trim());
      }
    });
  }

  // Add missing
  const needed = [...new Set(defaults)];
  let addedCount = 0;

  needed.forEach(name => {
    if (!existingNames.has(name)) {
      fSheet.appendRow([`F${Date.now() + Math.floor(Math.random() * 1000)}`, name, new Date()]);
      existingNames.add(name);
      addedCount++;
    }
  });

  return { success: true, added: addedCount, total: existingNames.size };
}

function syncDatabase() {
  const stats = {
    projects: deduplicateSheet('Projects'),
    tasks: deduplicateSheet('Tasks'),
    folders: deduplicateSheet('Folders'),
    users: deduplicateSheet('Users'),
    folderSync: syncFolders()
  };
  return { success: true, stats };
}

function fixDatabaseColumns() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tSheet = ss.getSheetByName('Tasks');
  if (tSheet) {
    let headers = tSheet.getRange(1, 1, 1, tSheet.getLastColumn()).getValues()[0];
    let msg = 'Checked columns.';
    
    if (!headers.includes('approver')) {
      tSheet.getRange(1, headers.length + 1).setValue('approver');
      msg += ' Added approver.';
      headers = tSheet.getRange(1, 1, 1, tSheet.getLastColumn()).getValues()[0]; // Update headers
    }
    
    if (!headers.includes('followers')) {
       tSheet.getRange(1, headers.length + 1).setValue('followers');
       msg += ' Added followers.';
    }

    if (!headers.includes('updatedAt')) {
       tSheet.getRange(1, headers.length + 1).setValue('updatedAt');
       msg += ' Added updatedAt.';
    }
    return { success: true, message: msg };
  }
  return { error: 'Tasks sheet not found' };
}

// --- NOTIFICATIONS SYSTEM ---

function getNotifications(data) {
  const user = data.user;
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Notifications');
  if (!sheet) return { success: true, notifications: [] };
  
  const allNotes = getSheetData(sheet);
  // Filter for user
  const userNotes = allNotes.filter(n => n.recipient === user || n.recipient === 'ALL');
  
  // Sort by date desc
  userNotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  return { success: true, notifications: userNotes.slice(0, 50) }; // Limit to last 50
}

function addNotification(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Notifications');
  if (!sheet) {
    sheet = ss.insertSheet('Notifications');
    sheet.appendRow(['id', 'recipient', 'message', 'type', 'linkId', 'isRead', 'createdAt']);
  }
  
  const id = 'N' + Date.now() + Math.floor(Math.random() * 1000);
  const recipients = Array.isArray(data.recipients) ? data.recipients : [data.recipient];
  
  recipients.forEach(rcpt => {
    if (rcpt) {
       sheet.appendRow([
        id, 
        rcpt, 
        data.message, 
        data.type || 'info', 
        data.linkId || '', 
        'false', 
        new Date()
      ]);
    }
  });
  
  return { success: true };
}

function markNotificationRead(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Notifications');
  if (!sheet) return { error: 'No sheet' };
  
  const id = data.id;
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  
  // Update matching row (assuming id is col 0)
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] == id) { // Loose equality for number/string mix
      sheet.getRange(i + 1, 6).setValue('true'); // Col 6 is isRead (0-indexed 5)
      break;
    }
  }
  return { success: true };
}

function deduplicateSheet(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return 0;

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return 0;

  const headers = data[0];
  const rows = data.slice(1);
  const map = new Map();

  rows.forEach(row => {
    const id = row[0];
    if (id) map.set(id.toString(), row);
  });

  const uniqueRows = Array.from(map.values());

  if (uniqueRows.length < rows.length) {
    sheet.clearContents();
    sheet.appendRow(headers);
    if (uniqueRows.length > 0) {
      sheet.getRange(2, 1, uniqueRows.length, uniqueRows[0].length).setValues(uniqueRows);
    }
    return rows.length - uniqueRows.length;
  }
  return 0;
}

// --- DATABASE MANAGEMENT ---

function resetData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Preserve Admin
  const uSheet = ss.getSheetByName('Users');
  let adminRow = null;
  if(uSheet) {
    const users = getSheetData(uSheet);
    // Find first admin or fallback
    const admin = users.find(u => u.username === 'admin' || u.role === 'admin');
    if (admin) {
       adminRow = [admin.id, admin.email, admin.username, admin.password, admin.name, admin.role, admin.avatar, JSON.stringify(admin.permissions)];
    }
  }

  // If no admin found, logic to recreate default admin
  if (!adminRow) {
      const adminPerms = JSON.stringify({ canEdit: true, canDelete: true, canApprove: true, pages: ['dashboard', 'kanban', 'calendar', 'timeline', 'reports', 'settings'] });
      adminRow = ['u1', 'admin@demo.com', 'admin', 'admin', 'Super Admin', 'admin', 'AD', adminPerms];
  }

  // 2. Clear Sheets
  ['Projects', 'Tasks', 'Folders', 'Notifications', 'Users'].forEach(name => {
    let sheet = ss.getSheetByName(name);
    if(sheet) sheet.clearContents(); // Keep sheet, clear data
    // Re-add Headers
    if(sheet) {
        if(name === 'Projects') sheet.appendRow(['id', 'name', 'client', 'deadline', 'status', 'folder']);
        if(name === 'Tasks') sheet.appendRow(['id', 'projectId', 'title', 'description', 'assignee', 'status', 'progress', 'startDate', 'dueDate', 'priority', 'comments', 'createdAt', 'approver', 'followers']);
        if(name === 'Folders') sheet.appendRow(['id', 'name', 'createdAt']);
        if(name === 'Users') sheet.appendRow(['id', 'email', 'username', 'password', 'name', 'role', 'avatar', 'permissions']);
        if(name === 'Notifications') sheet.appendRow(['id', 'recipient', 'message', 'type', 'linkId', 'isRead', 'createdAt']);
    }
  });

  // 3. Restore Admin
  if(uSheet) uSheet.appendRow(adminRow);

  return { success: true, message: "Database Reset (Admin Preserved)" };
}

function renewData() {
  // 1. Reset first
  resetData();

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const fSheet = ss.getSheetByName('Folders');
  const uSheet = ss.getSheetByName('Users');

  // 2. Add 5 Folders
  const folders = ['Development', 'Marketing', 'Sales', 'HR', 'Common'];
  folders.forEach((f, i) => {
      fSheet.appendRow([`F${i+1}`, f, new Date()]);
  });

  // 3. Add 3 Users
  const newUsers = [
      { id: 'u_new1', user: 'staff1', pass: '1234', name: 'Staff One', role: 'editor', ava: 'S1', perms: { canEdit: true, canDelete: false, pages: ['dashboard', 'kanban', 'calendar'] } },
      { id: 'u_new2', user: 'staff2', pass: '1234', name: 'Staff Two', role: 'editor', ava: 'S2', perms: { canEdit: true, canDelete: false, pages: ['dashboard', 'kanban', 'calendar'] } },
      { id: 'u_new3', user: 'guest1', pass: '1234', name: 'Guest User', role: 'viewer', ava: 'G1', perms: { canEdit: false, canDelete: false, pages: ['dashboard'] } }
  ];

  newUsers.forEach(u => {
      uSheet.appendRow([u.id, '', u.user, u.pass, u.name, u.role, u.ava, JSON.stringify(u.perms)]);
  });

  return { success: true, message: "Database Renewed (5 Folders, 3 Users)" };
}

function backupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return {
      projects: getSheetData(ss.getSheetByName('Projects')),
      tasks: getSheetData(ss.getSheetByName('Tasks')),
      folders: getSheetData(ss.getSheetByName('Folders')),
      users: getSheetData(ss.getSheetByName('Users')),
      notifications: getSheetData(ss.getSheetByName('Notifications'))
  };
}

function restoreDatabase(data) {
  // data = { projects: [], tasks: [], ... }
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  const restoreSheet = (name, rowsData, headers) => {
      let sheet = ss.getSheetByName(name);
      if(!sheet) sheet = ss.insertSheet(name);
      sheet.clear();
      sheet.appendRow(headers);
      
      if(rowsData && rowsData.length > 0) {
          const rows = rowsData.map(obj => {
              return headers.map(h => {
                  // Convert Key to camelCase for lookup
                  let key = h.toLowerCase().replace(/ [a-z]/g, match => match.trim().toUpperCase());
                  if (key === 'projectid') key = 'projectId';
                  if (key === 'duedate') key = 'dueDate';
                  if (key === 'startdate') key = 'startDate';
                  if (key === 'createdat') key = 'createdAt';
                  
                  let val = obj[key] || obj[h]; // Try camel or direct header
                  if(typeof val === 'object') return JSON.stringify(val);
                  return val;
              });
          });
          sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
      }
  };

  if(data.projects) restoreSheet('Projects', data.projects, ['id', 'name', 'client', 'deadline', 'status', 'folder']);
  if(data.tasks) restoreSheet('Tasks', data.tasks, ['id', 'projectId', 'title', 'description', 'assignee', 'status', 'progress', 'startDate', 'dueDate', 'priority', 'comments', 'createdAt', 'approver', 'followers']);
  if(data.folders) restoreSheet('Folders', data.folders, ['id', 'name', 'createdAt']);
  if(data.users) restoreSheet('Users', data.users, ['id', 'email', 'username', 'password', 'name', 'role', 'avatar', 'permissions']);
  if(data.notifications) restoreSheet('Notifications', data.notifications, ['id', 'recipient', 'message', 'type', 'linkId', 'isRead', 'createdAt']);

  return { success: true, message: "Database Restored" };
}
