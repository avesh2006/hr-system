import {
    User,
    UserRole,
    AttendanceRecord,
    SalarySlip,
    GamificationSettings,
    LeaveRequest,
    AdminDashboardData,
    EmployeeDashboardData,
    AuditLog,
} from '../types';

const API_BASE_URL = 'http://192.168.31.179/api';

const apiFetch = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        // Special case for CSV export which returns text
        if (response.headers.get('Content-Type')?.includes('text/csv')) {
            return response.text() as Promise<T>;
        }
        return response.json();
    } catch (error: any) {
        if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
             throw new Error('Connection failed. Is the backend server running on port 3001? Please start it with `npm start` in a separate terminal.');
        }
        throw error;
    }
};


// --- API FUNCTIONS ---

// Auth
export const loginUser = (email: string, pass: string): Promise<User> => 
    apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, pass }) });

export const signupUser = (name: string, email: string, pass: string, role: UserRole): Promise<User> =>
    apiFetch('/auth/signup', { method: 'POST', body: JSON.stringify({ name, email, pass, role }) });

export const updateUserProfile = (userId: string, updates: Partial<User>, newPassword?: string): Promise<User> =>
    apiFetch(`/users/${userId}`, { method: 'PUT', body: JSON.stringify({ updates, newPassword }) });

export const getUserById = (userId: string): Promise<User> =>
    apiFetch(`/users/${userId}`);
    
// Admin
export const getAdminDashboardData = (): Promise<AdminDashboardData> =>
    apiFetch('/admin/dashboard-data');

export const getAllEmployees = (): Promise<User[]> =>
    apiFetch('/admin/employees');

export const getAllAttendance = (): Promise<AttendanceRecord[]> =>
    apiFetch('/admin/attendance');

export const getAllSalaries = (): Promise<SalarySlip[]> =>
    apiFetch('/admin/salaries');

export const getGamificationSettings = (): Promise<GamificationSettings> =>
    apiFetch('/admin/gamification-settings');
    
export const updateGamificationSettings = (settings: GamificationSettings): Promise<GamificationSettings> =>
    apiFetch('/admin/gamification-settings', { method: 'PUT', body: JSON.stringify(settings) });

export const getAuditLogs = (): Promise<AuditLog[]> =>
    apiFetch('/admin/audit-logs');

export const exportEmployeesCSV = (): Promise<string> =>
    apiFetch('/admin/export/employees');

export const getAllLeaveRequests = (): Promise<LeaveRequest[]> =>
    apiFetch('/admin/leave-requests');

export const updateLeaveRequestStatus = (requestId: string, status: 'Approved' | 'Rejected'): Promise<LeaveRequest> =>
    apiFetch(`/admin/leave-requests/${requestId}`, { method: 'PUT', body: JSON.stringify({ status }) });


// Employee
export const getEmployeeDashboardData = (userId: string): Promise<EmployeeDashboardData> =>
    apiFetch(`/employees/${userId}/dashboard-data`);

export const markAttendance = (userId: string, type: 'check-in' | 'check-out', photo?: string, location?: { lat: number, lon: number }): Promise<AttendanceRecord> =>
    apiFetch(`/employees/${userId}/attendance`, { method: 'POST', body: JSON.stringify({ type, photo, location }) });

export const getMyAttendance = (userId: string): Promise<AttendanceRecord[]> =>
    apiFetch(`/employees/${userId}/attendance`);

export const getMySalarySlips = (userId: string): Promise<SalarySlip[]> =>
    apiFetch(`/employees/${userId}/salaries`);
    
export const getMyLeaveRequests = (userId: string): Promise<LeaveRequest[]> =>
    apiFetch(`/employees/${userId}/leave-requests`);

export const requestLeave = (userId: string, startDate: string, endDate: string, reason: string): Promise<LeaveRequest> =>
    apiFetch(`/employees/${userId}/leave-requests`, { method: 'POST', body: JSON.stringify({ startDate, endDate, reason }) });