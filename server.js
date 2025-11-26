const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { GoogleGenAI } = require('@google/genai');

const app = express();
const port = 3001;

app.use(cors());
app.use(bodyParser.json({ limit: '5mb' })); // Increase limit for photo data
app.use(bodyParser.urlencoded({ extended: true, limit: '5mb' }));


// --- GEMINI SETUP ---
let ai;
if (process.env.API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
} else {
    console.warn("API_KEY environment variable not set. AI Assistant will not function.");
}


// --- MOCK DATABASE AND HELPERS ---

const UserRole = { ADMIN: 'admin', EMPLOYEE: 'employee' };
const formatDate = (date) => date.toISOString().split('T')[0];
const formatTime = (date) => date.toTimeString().split(' ')[0].substring(0, 5);
const getDateAgo = (days) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
};

let MOCK_USERS = [
    { id: 'admin-001', name: 'Alex Johnson', email: 'admin@example.com', role: UserRole.ADMIN, team: 'Management', joinDate: '2020-01-15' },
    { id: 'emp-001', name: 'Jane Doe', email: 'employee@example.com', role: UserRole.EMPLOYEE, team: 'Engineering', joinDate: '2022-03-10' },
    { id: 'emp-002', name: 'John Smith', email: 'john@example.com', role: UserRole.EMPLOYEE, team: 'Marketing', joinDate: '2021-07-22' }
];
let MOCK_PASSWORDS = { 'admin-001': 'password123', 'emp-001': 'password123', 'emp-002': 'password123' };
let MOCK_ATTENDANCE = [
    { id: 'att-001', employeeId: 'emp-001', employeeName: 'Jane Doe', date: formatDate(getDateAgo(2)), checkIn: '09:01', checkOut: '17:30', status: 'Present' },
    { id: 'att-002', employeeId: 'emp-001', employeeName: 'Jane Doe', date: formatDate(getDateAgo(1)), checkIn: '08:55', checkOut: '17:35', status: 'Present' },
    { id: 'att-003', employeeId: 'emp-002', employeeName: 'John Smith', date: formatDate(getDateAgo(2)), checkIn: '09:15', checkOut: '18:00', status: 'Present' },
    { id: 'att-004', employeeId: 'emp-002', employeeName: 'John Smith', date: formatDate(getDateAgo(1)), checkIn: null, checkOut: null, status: 'On Leave' },
];
let MOCK_SALARIES = [
    { id: 'sal-001', employeeId: 'emp-001', month: 'April', year: 2024, basic: 4000, allowances: 1000, deductions: 200, netSalary: 4800 },
    { id: 'sal-002', employeeId: 'emp-001', month: 'May', year: 2024, basic: 4000, allowances: 1000, deductions: 200, netSalary: 4800 },
    { id: 'sal-003', employeeId: 'emp-002', month: 'April', year: 2024, basic: 3500, allowances: 800, deductions: 150, netSalary: 4150 },
    { id: 'sal-004', employeeId: 'emp-002', month: 'May', year: 2024, basic: 3500, allowances: 800, deductions: 150, netSalary: 4150 },
];
let MOCK_LEAVE_REQUESTS = [
    { id: 'leave-001', employeeId: 'emp-001', startDate: '2024-05-10', endDate: '2024-05-12', reason: 'Vacation', status: 'Approved' },
    { id: 'leave-002', employeeId: 'emp-002', startDate: '2024-06-01', endDate: '2024-06-01', reason: 'Sick Leave', status: 'Approved' },
    { id: 'leave-003', employeeId: 'emp-001', startDate: '2024-07-20', endDate: '2024-07-25', reason: 'Family event', status: 'Pending' },
];
const MOCK_BADGES = [
    { id: 'badge-01', name: 'Punctuality Pro', description: 'Checked in on time for 5 consecutive days.', icon: '🏆' },
    { id: 'badge-02', name: 'Perfect Week', description: 'Present every day for a full week.', icon: '✅' },
];
let MOCK_GAMIFICATION = {
    'emp-001': { points: 1250, badges: [MOCK_BADGES[0]], leaderboardRank: 3 },
    'emp-002': { points: 980, badges: [], leaderboardRank: 8 }
};
let MOCK_LEAVE_BALANCE = {
    'emp-001': { annual: 10, sick: 5 },
    'emp-002': { annual: 8, sick: 3 }
};
let MOCK_GAMIFICATION_SETTINGS = { pointsForPunctuality: 10, pointsForPerfectWeek: 50 };
let MOCK_AUDIT_LOGS = [];

// --- AUDIT LOG HELPER ---
const logAction = (user, action, details = '') => {
    const logEntry = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: user.id,
        userName: user.name,
        action,
        details
    };
    MOCK_AUDIT_LOGS.unshift(logEntry); // Add to the beginning of the array
};


const getEmployeeContextualDataLogic = (userId) => {
    const attendance = MOCK_ATTENDANCE.filter(a => a.employeeId === userId).slice(-5);
    const salary = MOCK_SALARIES.filter(s => s.employeeId === userId).slice(-2);
    const leave = MOCK_LEAVE_BALANCE[userId];
    const gamification = MOCK_GAMIFICATION[userId];
    return { attendance, salary, leave, gamification };
};

// --- API ENDPOINTS ---

// Auth
app.post('/api/auth/login', (req, res) => {
    const { email, pass } = req.body;
    const user = MOCK_USERS.find(u => u.email === email);
    if (user && MOCK_PASSWORDS[user.id] === pass) {
        logAction(user, 'User Login');
        res.json(user);
    } else {
        res.status(401).json({ message: 'Invalid email or password' });
    }
});

app.post('/api/auth/signup', (req, res) => {
    const { name, email, pass, role } = req.body;
    if (MOCK_USERS.some(u => u.email === email)) {
        return res.status(400).json({ message: 'An account with this email already exists.' });
    }
    const newUser = { id: `${role}-${Date.now()}`, name, email, role, team: 'Unassigned', joinDate: formatDate(new Date()) };
    MOCK_USERS.push(newUser);
    MOCK_PASSWORDS[newUser.id] = pass;
    logAction(newUser, 'User Signed Up');
    res.status(201).json(newUser);
});

// Users
app.put('/api/users/:id', (req, res) => {
    const { id } = req.params;
    const { updates, newPassword } = req.body;
    const userIndex = MOCK_USERS.findIndex(u => u.id === id);
    if (userIndex === -1) return res.status(404).json({ message: 'User not found.' });
    if (updates.role) delete updates.role; // Prevent role escalation
    MOCK_USERS[userIndex] = { ...MOCK_USERS[userIndex], ...updates };
    if (newPassword) MOCK_PASSWORDS[id] = newPassword;
    logAction(MOCK_USERS[userIndex], 'Updated User Profile');
    res.json(MOCK_USERS[userIndex]);
});

app.get('/api/users/:id', (req, res) => {
    const { id } = req.params;
    const user = MOCK_USERS.find(u => u.id === id);
    if (user) res.json(user);
    else res.status(404).json({ message: 'User not found' });
});

// Admin
app.get('/api/admin/dashboard-data', (req, res) => {
    const todayStr = formatDate(new Date());
    const presentToday = MOCK_ATTENDANCE.filter(a => a.date === todayStr && a.status === 'Present').length;
    const onLeave = MOCK_ATTENDANCE.filter(a => a.date === todayStr && a.status === 'On Leave').length;
    res.json({
        stats: {
            totalEmployees: MOCK_USERS.filter(u => u.role === UserRole.EMPLOYEE).length,
            presentToday,
            onLeave
        }
    });
});
app.get('/api/admin/employees', (req, res) => res.json(MOCK_USERS));
app.get('/api/admin/attendance', (req, res) => res.json(MOCK_ATTENDANCE));
app.get('/api/admin/salaries', (req, res) => res.json(MOCK_SALARIES));
app.get('/api/admin/gamification-settings', (req, res) => res.json(MOCK_GAMIFICATION_SETTINGS));

app.put('/api/admin/gamification-settings', (req, res) => {
    // In a real app, you'd get the user from the request token
    const adminUser = MOCK_USERS.find(u => u.role === UserRole.ADMIN);
    if (adminUser) {
        logAction(adminUser, 'Updated Gamification Settings');
    }
    MOCK_GAMIFICATION_SETTINGS = req.body;
    res.json(MOCK_GAMIFICATION_SETTINGS);
});

app.get('/api/admin/audit-logs', (req, res) => {
    res.json(MOCK_AUDIT_LOGS);
});

app.get('/api/admin/export/employees', (req, res) => {
     // In a real app, you'd get the user from the request token
    const adminUser = MOCK_USERS.find(u => u.role === UserRole.ADMIN);
    if (adminUser) {
        logAction(adminUser, 'Exported Employee Data (CSV)');
    }
    
    const headers = ['ID', 'Name', 'Email', 'Role', 'Team', 'Join Date'];
    const csvRows = [
        headers.join(','),
        ...MOCK_USERS.map(u => [u.id, u.name, u.email, u.role, u.team, u.joinDate].join(','))
    ];
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="employees.csv"');
    res.status(200).end(csvRows.join('\n'));
});

app.get('/api/admin/leave-requests', (req, res) => {
    const requestsWithNames = MOCK_LEAVE_REQUESTS.map(req => {
        const user = MOCK_USERS.find(u => u.id === req.employeeId);
        return { ...req, employeeName: user ? user.name : 'Unknown Employee' };
    }).sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
    res.json(requestsWithNames);
});

app.put('/api/admin/leave-requests/:requestId', (req, res) => {
    const { requestId } = req.params;
    const { status } = req.body;
    const requestIndex = MOCK_LEAVE_REQUESTS.findIndex(r => r.id === requestId);

    if (requestIndex === -1) return res.status(404).json({ message: 'Leave request not found.' });
    if (!['Approved', 'Rejected'].includes(status)) return res.status(400).json({ message: 'Invalid status.' });

    const updatedRequest = { ...MOCK_LEAVE_REQUESTS[requestIndex], status };
    MOCK_LEAVE_REQUESTS[requestIndex] = updatedRequest;

    const adminUser = MOCK_USERS.find(u => u.role === UserRole.ADMIN);
    const employee = MOCK_USERS.find(u => u.id === updatedRequest.employeeId);
    if (adminUser) {
        logAction(adminUser, `Leave Request ${status}`, `Request for ${employee ? employee.name : 'Unknown'}`);
    }

    res.json(updatedRequest);
});


// Employee
app.get('/api/employees/:userId/dashboard-data', (req, res) => {
    const { userId } = req.params;
    const todayStr = formatDate(new Date());
    let todayAttendance = MOCK_ATTENDANCE.find(a => a.employeeId === userId && a.date === todayStr) || null;
    if (!todayAttendance) {
        const user = MOCK_USERS.find(u => u.id === userId);
        todayAttendance = { id: `att-${Date.now()}`, employeeId: userId, employeeName: user?.name || 'Unknown', date: todayStr, checkIn: null, checkOut: null, status: 'Absent' };
    }
    res.json({ todayAttendance, gamification: MOCK_GAMIFICATION[userId] });
});

app.post('/api/employees/:userId/attendance', (req, res) => {
    const { userId } = req.params;
    const { type, photo, location } = req.body;
    const todayStr = formatDate(new Date());
    let record = MOCK_ATTENDANCE.find(a => a.employeeId === userId && a.date === todayStr);

    if (type === 'check-in') {
        if (record && record.status === 'Present') return res.status(400).json({ message: 'You have already checked in today.' });
        const user = MOCK_USERS.find(u => u.id === userId);
        const newRecord = { id: `att-${Date.now()}`, employeeId: userId, employeeName: user?.name || 'Unknown', date: todayStr, checkIn: formatTime(new Date()), checkOut: null, status: 'Present', checkInPhoto: photo, checkInLocation: location };
        if (record) {
            const recordIndex = MOCK_ATTENDANCE.findIndex(r => r.id === record.id);
            MOCK_ATTENDANCE[recordIndex] = newRecord;
        } else {
            MOCK_ATTENDANCE.push(newRecord);
        }
        record = newRecord;
    } else if (type === 'check-out') {
        if (!record) return res.status(400).json({ message: 'You have not checked in today.' });
        if (record.checkOut) return res.status(400).json({ message: 'You have already checked out today.' });
        record.checkOut = formatTime(new Date());
    } else {
        return res.status(400).json({ message: 'Invalid attendance action.' });
    }
    res.json(record);
});

app.get('/api/employees/:userId/attendance', (req, res) => {
    res.json(MOCK_ATTENDANCE.filter(a => a.employeeId === req.params.userId));
});
app.get('/api/employees/:userId/salaries', (req, res) => {
    res.json(MOCK_SALARIES.filter(s => s.employeeId === req.params.userId));
});
app.get('/api/employees/:userId/leave-requests', (req, res) => {
    res.json(MOCK_LEAVE_REQUESTS.filter(l => l.employeeId === req.params.userId));
});

app.post('/api/employees/:userId/leave-requests', (req, res) => {
    const { userId } = req.params;
    const { startDate, endDate, reason } = req.body;
    const user = MOCK_USERS.find(u => u.id === userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const newRequest = {
        id: `leave-${Date.now()}`,
        employeeId: userId,
        startDate,
        endDate,
        reason,
        status: 'Pending'
    };
    MOCK_LEAVE_REQUESTS.push(newRequest);
    logAction(user, 'Submitted Leave Request', `From ${startDate} to ${endDate}`);
    res.status(201).json(newRequest);
});

// AI Assistant
app.post('/api/ai/chat', async (req, res) => {
    const { prompt, user } = req.body;
    if (!ai) return res.status(503).json({ message: "AI Assistant is not configured on the server. API_KEY is missing." });
    if (!prompt || !user) return res.status(400).json({ message: 'Prompt and user are required.' });

    try {
        const contextualData = getEmployeeContextualDataLogic(user.id);
        const fullPrompt = `
            You are an AI HR Assistant integrated into a SaaS-grade HR dashboard.
            Your role is to help employees and admins with their queries.
            Always respond in a professional, helpful, and concise tone. Provide step-by-step guidance if needed.

            Current User Information:
            - Name: ${user.name}
            - Role: ${user.role}

            Contextual HR Data for ${user.name}:
            - Attendance Records (Last 5): ${JSON.stringify(contextualData.attendance, null, 2)}
            - Salary Slips (Last 2): ${JSON.stringify(contextualData.salary, null, 2)}
            - Leave Balance: ${JSON.stringify(contextualData.leave, null, 2)}
            - Gamification Status: ${JSON.stringify(contextualData.gamification, null, 2)}

            Based on the user's role and the provided contextual data, please answer the following query.
            Do not mention that you have access to this data, just use it to answer the question directly.
            If the information is not in the context, politely state that you cannot access that specific information.

            User Query: "${prompt}"
        `;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullPrompt,
        });

        res.json({ response: response.text });
    } catch (error) {
        console.error("Error calling Gemini API from backend:", error);
        res.status(500).json({ message: "An error occurred while communicating with the AI." });
    }
});

app.listen(port, () => {
    console.log(`HR Portal backend listening at http://localhost:${port}`);
});