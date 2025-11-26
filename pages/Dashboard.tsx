
import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';
import AdminDashboard from './admin/AdminDashboard';
import EmployeeDashboard from './employee/EmployeeDashboard';

const Dashboard: React.FC = () => {
    const { user } = useAuth();

    if (!user) {
        return null; // Or a loading spinner
    }

    switch (user.role) {
        case UserRole.ADMIN:
            return <AdminDashboard />;
        case UserRole.EMPLOYEE:
            return <EmployeeDashboard />;
        default:
            return <div>Invalid user role.</div>;
    }
};

export default Dashboard;
