import React, { useState, ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';
import { DashboardIcon, AttendanceIcon, SalaryIcon, LeaveIcon, GamificationIcon, UsersIcon, SettingsIcon, LogoutIcon, UserCircleIcon, DocumentTextIcon } from './icons';

interface NavItem {
    name: string;
    icon: React.FC<{ className?: string }>;
    view: string;
    roles: UserRole[];
}

const navItems: NavItem[] = [
    { name: 'Dashboard', icon: DashboardIcon, view: 'dashboard', roles: [UserRole.ADMIN, UserRole.EMPLOYEE] },
    { name: 'Attendance', icon: AttendanceIcon, view: 'attendance', roles: [UserRole.ADMIN, UserRole.EMPLOYEE] },
    { name: 'Salary', icon: SalaryIcon, view: 'salary', roles: [UserRole.ADMIN, UserRole.EMPLOYEE] },
    { name: 'Leave Request', icon: LeaveIcon, view: 'leave', roles: [UserRole.EMPLOYEE] },
    { name: 'Gamification', icon: GamificationIcon, view: 'gamification', roles: [UserRole.ADMIN, UserRole.EMPLOYEE] },
    { name: 'Employees', icon: UsersIcon, view: 'employees', roles: [UserRole.ADMIN] },
    { name: 'Leave Management', icon: LeaveIcon, view: 'leave-management', roles: [UserRole.ADMIN] },
    { name: 'Profile', icon: UserCircleIcon, view: 'profile', roles: [UserRole.ADMIN, UserRole.EMPLOYEE] },
    { name: 'Settings', icon: SettingsIcon, view: 'settings', roles: [UserRole.ADMIN] },
    { name: 'Audit Log', icon: DocumentTextIcon, view: 'audit', roles: [UserRole.ADMIN] },
];

interface DashboardLayoutProps {
    children: ReactNode;
    activeView: string;
    setActiveView: (view: string) => void;
}

const Sidebar: React.FC<{ activeView: string; setActiveView: (view: string) => void }> = ({ activeView, setActiveView }) => {
    const { user, logout } = useAuth();
    if (!user) return null;

    const filteredNavItems = navItems.filter(item => item.roles.includes(user.role));

    return (
        <aside className="w-64 bg-white dark:bg-gray-800 flex flex-col shadow-lg">
            <div className="h-16 flex items-center justify-center border-b dark:border-gray-700">
                <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400">HR Portal</h1>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-2">
                {filteredNavItems.map(item => (
                    <a
                        key={item.name}
                        href="#"
                        onClick={(e) => { e.preventDefault(); setActiveView(item.view); }}
                        className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                            activeView === item.view
                                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-white'
                                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                        }`}
                    >
                        <item.icon className="h-5 w-5 mr-3" />
                        {item.name}
                    </a>
                ))}
            </nav>
            <div className="p-4 border-t dark:border-gray-700">
                <a
                    href="#"
                    onClick={(e) => { e.preventDefault(); logout(); }}
                    className="flex items-center px-4 py-2 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                    <LogoutIcon className="h-5 w-5 mr-3" />
                    Logout
                </a>
            </div>
        </aside>
    );
};

const Header: React.FC = () => {
    const { user } = useAuth();
    if (!user) return null;

    return (
        <header className="h-16 bg-white dark:bg-gray-800 shadow-md flex items-center justify-between px-6">
            <div>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Welcome, {user.name}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">You are logged in as {user.role === UserRole.ADMIN ? 'an Admin' : 'an Employee'}.</p>
            </div>
            <div className="flex items-center">
                 <img
                    className="h-10 w-10 rounded-full object-cover"
                    src={`https://i.pravatar.cc/150?u=${user.id}`}
                    alt="User avatar"
                />
            </div>
        </header>
    );
};

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, activeView, setActiveView }) => {
    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
            <Sidebar activeView={activeView} setActiveView={setActiveView} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-6">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;