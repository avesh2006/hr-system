export enum UserRole {
    ADMIN = 'admin',
    EMPLOYEE = 'employee',
}

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    team: string;
    joinDate: string;
}

export interface AttendanceRecord {
    id: string;
    employeeId: string;
    employeeName: string;
    date: string;
    checkIn: string | null;
    checkOut: string | null;
    status: 'Present' | 'Absent' | 'On Leave';
    checkInPhoto?: string;
    checkInLocation?: { lat: number; lon: number };
}

export interface SalarySlip {
    id: string;
    employeeId: string;
    month: string;
    year: number;
    basic: number;
    allowances: number;
    deductions: number;
    netSalary: number;
}

export interface LeaveRequest {
    id: string;
    employeeId: string;
    employeeName?: string;
    startDate: string;
    endDate: string;
    reason: string;
    status: 'Pending' | 'Approved' | 'Rejected';
}

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
}

export interface GamificationProgress {
    points: number;
    badges: Badge[];
    leaderboardRank: number;
}

export interface GamificationSettings {
    pointsForPunctuality: number;
    pointsForPerfectWeek: number;
}

export interface AuditLog {
    id: string;
    timestamp: string;
    userId: string;
    userName: string;
    action: string;
    details?: string;
}


// FIX: Add types for API responses to fix unknown type errors
export interface AdminDashboardData {
    stats: {
        totalEmployees: number;
        presentToday: number;
        onLeave: number;
    };
}

export interface EmployeeDashboardData {
    todayAttendance: AttendanceRecord | null;
    gamification: GamificationProgress | null;
}