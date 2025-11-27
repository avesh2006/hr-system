
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { GoogleGenAI } = require('@google/genai');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 3001;

// --- DATABASE SETUP (Vercel-ready) ---
const mongoUri = process.env.MONGO_URI;
let dbConnectionPromise;

const connectDB = () => {
    if (dbConnectionPromise) {
        return dbConnectionPromise;
    }
    if (!mongoUri) {
        console.error("FATAL ERROR: MONGO_URI environment variable is not set.");
        return Promise.reject(new Error("Server configuration error: Database URI is not set."));
    }

    dbConnectionPromise = new Promise(async (resolve, reject) => {
        try {
            const client = new MongoClient(mongoUri);
            await client.connect();
            console.log("Successfully connected to MongoDB Atlas.");
            const db = client.db("hr_portal");
            await seedDatabase(db);
            resolve(db);
        } catch (err) {
            console.error("Failed to connect to MongoDB Atlas", err);
            dbConnectionPromise = null; // Reset promise on failure to allow retry on next request
            reject(err);
        }
    });

    return dbConnectionPromise;
};

// Middleware to ensure DB is connected before handling requests
const ensureDbConnection = async (req, res, next) => {
    try {
        req.db = await connectDB();
        next();
    } catch (error) {
        console.error("DATABASE MIDDLEWARE ERROR:", error.message);
        res.status(503).json({ message: "A server error occurred: Could not connect to the database. Please ensure it's configured correctly and network access is allowed." });
    }
};


app.use(cors());
app.use(bodyParser.json({ limit: '5mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '5mb' }));

// Apply the DB connection middleware to all API routes
app.use('/api', ensureDbConnection);


// --- GEMINI SETUP ---
let ai;
if (process.env.API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
} else {
    console.warn("API_KEY environment variable not set. AI Assistant will not function.");
}


// --- HELPERS ---
const formatDate = (date) => date.toISOString().split('T')[0];
const formatTime = (date) => date.toTimeString().split(' ')[0].substring(0, 5);

// --- AUDIT LOG HELPER ---
const logAction = async (db, user, action, details = '') => {
    if (!db) {
        console.error("Database not initialized, cannot log action.");
        return;
    }
    const logEntry = {
        timestamp: new Date(),
        userId: user._id,
        userName: user.name,
        action,
        details
    };
    await db.collection('audit_logs').insertOne(logEntry);
};

// --- API ENDPOINTS (This server is now API-only) ---

// Auth
app.post('/api/auth/login', async (req, res) => {
    const { email, pass } = req.body;
    const user = await req.db.collection('users').findOne({ email });
    // In a real app, passwords should be hashed. For this example, we're comparing plain text.
    if (user && user.password === pass) {
        await logAction(req.db, user, 'User Login');
        const { password, ...userWithoutPassword } = user;
        res.json({ ...userWithoutPassword, id: user._id });
    } else {
        res.status(401).json({ message: 'Invalid email or password' });
    }
});

app.post('/api/auth/signup', async (req, res) => {
    const { name, email, pass, role } = req.body;
    const existingUser = await req.db.collection('users').findOne({ email });
    if (existingUser) {
        return res.status(400).json({ message: 'An account with this email already exists.' });
    }
    const newUser = {
        name,
        email,
        password: pass, // Store plain text for this example. Use hashing in production!
        role,
        team: 'Unassigned',
        joinDate: formatDate(new Date())
    };
    const result = await req.db.collection('users').insertOne(newUser);
    const createdUser = await req.db.collection('users').findOne({ _id: result.insertedId });
    await logAction(req.db, createdUser, 'User Signed Up');
    
    const { password, ...userWithoutPassword } = createdUser;
    res.status(201).json({ ...userWithoutPassword, id: createdUser._id });
});

// Users
app.put('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    const { updates, newPassword } = req.body;
    
    if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid user ID.' });

    const user = await req.db.collection('users').findOne({ _id: new ObjectId(id) });
    if (!user) return res.status(404).json({ message: 'User not found.' });
    
    delete updates.role; // Prevent role escalation
    delete updates.email; // Prevent email change
    
    const updateDoc = { $set: updates };
    if (newPassword) {
        updateDoc.$set.password = newPassword;
    }
    
    await req.db.collection('users').updateOne({ _id: new ObjectId(id) }, updateDoc);
    const updatedUser = await req.db.collection('users').findOne({ _id: new ObjectId(id) });
    
    await logAction(req.db, updatedUser, 'Updated User Profile');
    const { password, ...userWithoutPassword } = updatedUser;
    res.json({ ...userWithoutPassword, id: updatedUser._id });
});

app.get('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid user ID.' });

    const user = await req.db.collection('users').findOne({ _id: new ObjectId(id) });
    if (user) {
        const { password, ...userWithoutPassword } = user;
        res.json({ ...userWithoutPassword, id: user._id });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
});

// Admin
app.get('/api/admin/dashboard-data', async (req, res) => {
    const todayStr = formatDate(new Date());
    const totalEmployees = await req.db.collection('users').countDocuments({ role: 'employee' });
    const presentToday = await req.db.collection('attendance').countDocuments({ date: todayStr, status: 'Present' });
    const onLeave = await req.db.collection('attendance').countDocuments({ date: todayStr, status: 'On Leave' });
    res.json({
        stats: { totalEmployees, presentToday, onLeave }
    });
});

app.get('/api/admin/employees', async (req, res) => {
    const users = await req.db.collection('users').find({}, { projection: { password: 0 } }).toArray();
    res.json(users.map(u => ({ ...u, id: u._id })));
});

app.get('/api/admin/attendance', async (req, res) => {
    const attendance = await req.db.collection('attendance').find().sort({ date: -1 }).toArray();
    res.json(attendance.map(a => ({ ...a, id: a._id })));
});

app.get('/api/admin/salaries', async (req, res) => {
    const salaries = await req.db.collection('salaries').find().toArray();
    res.json(salaries.map(s => ({ ...s, id: s._id })));
});

app.get('/api/admin/gamification-settings', async (req, res) => {
    let settings = await req.db.collection('settings').findOne({ name: 'gamification' });
    if (!settings) {
        settings = { name: 'gamification', pointsForPunctuality: 10, pointsForPerfectWeek: 50 };
        await req.db.collection('settings').insertOne(settings);
    }
    res.json(settings);
});

app.put('/api/admin/gamification-settings', async (req, res) => {
    const adminUser = await req.db.collection('users').findOne({ role: 'admin' });
    if (adminUser) await logAction(req.db, adminUser, 'Updated Gamification Settings');
    
    const { pointsForPunctuality, pointsForPerfectWeek } = req.body;
    const result = await req.db.collection('settings').updateOne(
        { name: 'gamification' },
        { $set: { pointsForPunctuality, pointsForPerfectWeek } },
        { upsert: true }
    );
    const updatedSettings = await req.db.collection('settings').findOne({ name: 'gamification' });
    res.json(updatedSettings);
});

app.get('/api/admin/audit-logs', async (req, res) => {
    const logs = await req.db.collection('audit_logs').find().sort({ timestamp: -1 }).limit(100).toArray();
    res.json(logs.map(l => ({ ...l, id: l._id })));
});

app.get('/api/admin/export/employees', async (req, res) => {
    const adminUser = await req.db.collection('users').findOne({ role: 'admin' });
    if (adminUser) await logAction(req.db, adminUser, 'Exported Employee Data (CSV)');
    
    const users = await req.db.collection('users').find({}, { projection: { password: 0 } }).toArray();
    const headers = ['ID', 'Name', 'Email', 'Role', 'Team', 'Join Date'];
    const csvRows = [
        headers.join(','),
        ...users.map(u => [u._id.toString(), u.name, u.email, u.role, u.team, u.joinDate].join(','))
    ];
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="employees.csv"');
    res.status(200).end(csvRows.join('\n'));
});

app.get('/api/admin/leave-requests', async (req, res) => {
    const requests = await req.db.collection('leave_requests').find().sort({ startDate: -1 }).toArray();
    for (let req of requests) {
        const user = await req.db.collection('users').findOne({ _id: new ObjectId(req.employeeId) });
        req.employeeName = user ? user.name : 'Unknown';
    }
    res.json(requests.map(r => ({ ...r, id: r._id })));
});

app.put('/api/admin/leave-requests/:requestId', async (req, res) => {
    const { requestId } = req.params;
    const { status } = req.body;
    
    if (!ObjectId.isValid(requestId)) return res.status(400).json({ message: 'Invalid request ID.' });
    if (!['Approved', 'Rejected'].includes(status)) return res.status(400).json({ message: 'Invalid status.' });

    const result = await req.db.collection('leave_requests').updateOne({ _id: new ObjectId(requestId) }, { $set: { status } });
    if (result.matchedCount === 0) return res.status(404).json({ message: 'Leave request not found.' });

    const updatedRequest = await req.db.collection('leave_requests').findOne({ _id: new ObjectId(requestId) });

    const adminUser = await req.db.collection('users').findOne({ role: 'admin' });
    const employee = await req.db.collection('users').findOne({ _id: new ObjectId(updatedRequest.employeeId) });
    if (adminUser) {
        await logAction(req.db, adminUser, `Leave Request ${status}`, `Request for ${employee ? employee.name : 'Unknown'}`);
    }

    res.json({ ...updatedRequest, id: updatedRequest._id });
});

// Employee
app.get('/api/employees/:userId/dashboard-data', async (req, res) => {
    const { userId } = req.params;
    const todayStr = formatDate(new Date());
    let todayAttendance = await req.db.collection('attendance').findOne({ employeeId: userId, date: todayStr });
    
    if (!todayAttendance) {
        const user = await req.db.collection('users').findOne({ _id: new ObjectId(userId) });
        todayAttendance = { employeeId: userId, employeeName: user?.name, date: todayStr, checkIn: null, checkOut: null, status: 'Absent' };
    }
    
    const gamification = await req.db.collection('gamification').findOne({ employeeId: userId }) || { points: 0, badges: [], leaderboardRank: 'N/A' };
    
    res.json({ todayAttendance, gamification });
});

app.post('/api/employees/:userId/attendance', async (req, res) => {
    const { userId } = req.params;
    const { type, photo, location } = req.body;
    const todayStr = formatDate(new Date());

    let record = await req.db.collection('attendance').findOne({ employeeId: userId, date: todayStr });

    if (type === 'check-in') {
        if (record && record.status === 'Present') return res.status(400).json({ message: 'You have already checked in today.' });
        
        const user = await req.db.collection('users').findOne({ _id: new ObjectId(userId) });
        const newRecordData = {
            employeeId: userId,
            employeeName: user.name,
            date: todayStr,
            checkIn: formatTime(new Date()),
            checkOut: null,
            status: 'Present',
            checkInPhoto: photo,
            checkInLocation: location
        };

        if (record) {
            await req.db.collection('attendance').updateOne({ _id: record._id }, { $set: newRecordData });
        } else {
            await req.db.collection('attendance').insertOne(newRecordData);
        }
        const finalRecord = await req.db.collection('attendance').findOne({ employeeId: userId, date: todayStr });
        res.json({ ...finalRecord, id: finalRecord._id });
    } else if (type === 'check-out') {
        if (!record) return res.status(400).json({ message: 'You have not checked in today.' });
        if (record.checkOut) return res.status(400).json({ message: 'You have already checked out today.' });
        
        await req.db.collection('attendance').updateOne({ _id: record._id }, { $set: { checkOut: formatTime(new Date()) } });
        const finalRecord = await req.db.collection('attendance').findOne({ _id: record._id });
        res.json({ ...finalRecord, id: finalRecord._id });
    } else {
        return res.status(400).json({ message: 'Invalid attendance action.' });
    }
});

app.get('/api/employees/:userId/attendance', async (req, res) => {
    const attendance = await req.db.collection('attendance').find({ employeeId: req.params.userId }).sort({ date: -1 }).toArray();
    res.json(attendance.map(a => ({ ...a, id: a._id })));
});
app.get('/api/employees/:userId/salaries', async (req, res) => {
    const salaries = await req.db.collection('salaries').find({ employeeId: req.params.userId }).toArray();
    res.json(salaries.map(s => ({ ...s, id: s._id })));
});
app.get('/api/employees/:userId/leave-requests', async (req, res) => {
    const requests = await req.db.collection('leave_requests').find({ employeeId: req.params.userId }).sort({ startDate: -1 }).toArray();
    res.json(requests.map(r => ({ ...r, id: r._id })));
});

app.post('/api/employees/:userId/leave-requests', async (req, res) => {
    const { userId } = req.params;
    const { startDate, endDate, reason } = req.body;
    
    const user = await req.db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const newRequest = { employeeId: userId, startDate, endDate, reason, status: 'Pending' };
    const result = await req.db.collection('leave_requests').insertOne(newRequest);
    
    await logAction(req.db, user, 'Submitted Leave Request', `From ${startDate} to ${endDate}`);
    res.status(201).json({ ...newRequest, id: result.insertedId });
});

// AI Assistant
app.post('/api/ai/chat', async (req, res) => {
    const { prompt, user: userInfo } = req.body;
    if (!ai) return res.status(503).json({ message: "AI Assistant is not configured on the server. API_KEY is missing." });
    if (!prompt || !userInfo) return res.status(400).json({ message: 'Prompt and user are required.' });

    try {
        const db = req.db;
        const attendance = await db.collection('attendance').find({ employeeId: userInfo.id }).sort({ date: -1 }).limit(5).toArray();
        const salary = await db.collection('salaries').find({ employeeId: userInfo.id }).sort({ year: -1, month: -1 }).limit(2).toArray();
        const leaveBalance = await db.collection('leave_balances').findOne({ employeeId: userInfo.id }) || { annual: 15, sick: 10 };
        const gamification = await db.collection('gamification').findOne({ employeeId: userInfo.id }) || { points: 0, badges: [], rank: 'N/A' };

        const fullPrompt = `
You are an AI HR Assistant integrated into a SaaS-grade HR dashboard. Your role is to help employees check attendance, salary slips, and request leave, while enabling admins to manage analytics, exports, and employee records. Always respond in a professional, concise tone, and provide step-by-step guidance.

Here is the current user's data for context:
- User Name: ${userInfo.name}
- User Role: ${userInfo.role}
- Recent Attendance: ${JSON.stringify(attendance, null, 2)}
- Recent Salary Slips: ${JSON.stringify(salary, null, 2)}
- Leave Balance: ${JSON.stringify(leaveBalance, null, 2)}
- Gamification Status: ${JSON.stringify(gamification, null, 2)}

Based on this context, answer the following user query. Be helpful and concise.
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

// --- DATABASE SEEDING ---
async function seedDatabase(db) {
    if (!db) {
        console.log("DB not connected, skipping seed.");
        return;
    }
    const usersCollection = db.collection('users');
    const userCount = await usersCollection.countDocuments();
    if (userCount > 0) {
        return;
    }

    console.log('Database is empty. Seeding initial data...');
    
    const seedUsers = [
        { name: 'Alex Johnson', email: 'admin@example.com', password: 'password123', role: 'admin', team: 'Management', joinDate: '2020-01-15' },
        { name: 'Jane Doe', email: 'employee@example.com', password: 'password123', role: 'employee', team: 'Engineering', joinDate: '2022-03-10' },
        { name: 'John Smith', email: 'john@example.com', password: 'password123', role: 'employee', team: 'Marketing', joinDate: '2021-07-22' }
    ];
    await usersCollection.insertMany(seedUsers);
    
    const jane = await usersCollection.findOne({ email: 'employee@example.com' });
    const john = await usersCollection.findOne({ email: 'john@example.com' });

    const seedAttendance = [
        { employeeId: jane._id.toString(), employeeName: jane.name, date: formatDate(new Date(Date.now() - 2 * 864e5)), checkIn: '09:01', checkOut: '17:30', status: 'Present' },
        { employeeId: jane._id.toString(), employeeName: jane.name, date: formatDate(new Date(Date.now() - 1 * 864e5)), checkIn: '08:55', checkOut: '17:35', status: 'Present' },
        { employeeId: john._id.toString(), employeeName: john.name, date: formatDate(new Date(Date.now() - 2 * 864e5)), checkIn: '09:15', checkOut: '18:00', status: 'Present' },
        { employeeId: john._id.toString(), employeeName: john.name, date: formatDate(new Date(Date.now() - 1 * 864e5)), checkIn: null, checkOut: null, status: 'On Leave' },
    ];
    await db.collection('attendance').insertMany(seedAttendance);

    const seedSalaries = [
        { employeeId: jane._id.toString(), month: 'April', year: 2024, basic: 4000, allowances: 1000, deductions: 200, netSalary: 4800 },
        { employeeId: jane._id.toString(), month: 'May', year: 2024, basic: 4000, allowances: 1000, deductions: 200, netSalary: 4800 },
        { employeeId: john._id.toString(), month: 'April', year: 2024, basic: 3500, allowances: 800, deductions: 150, netSalary: 4150 },
    ];
    await db.collection('salaries').insertMany(seedSalaries);
    
    const seedLeaveRequests = [
        { employeeId: jane._id.toString(), startDate: '2024-05-10', endDate: '2024-05-12', reason: 'Vacation', status: 'Approved' },
        { employeeId: john._id.toString(), startDate: '2024-06-01', endDate: '2024-06-01', reason: 'Sick Leave', status: 'Approved' },
        { employeeId: jane._id.toString(), startDate: '2024-07-20', endDate: '2024-07-25', reason: 'Family event', status: 'Pending' },
    ];
    await db.collection('leave_requests').insertMany(seedLeaveRequests);
    
    await db.collection('settings').insertOne({ name: 'gamification', pointsForPunctuality: 10, pointsForPerfectWeek: 50 });

    console.log('Seeding complete.');
}


// Start the server for local development, ensuring DB is connected first
if (require.main === module) {
  (async () => {
    try {
      await connectDB();
      app.listen(port, () => {
        console.log(`Server listening at http://localhost:${port}`);
      });
    } catch (err) {
      console.error("Failed to connect to database on startup. Server not started.", err);
      process.exit(1);
    }
  })();
}


// Export the app for Vercel
module.exports = app;