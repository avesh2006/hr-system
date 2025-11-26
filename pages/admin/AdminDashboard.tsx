import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import DashboardLayout from '../../components/DashboardLayout';
import Card from '../../components/ui/Card';
import { getAdminDashboardData, getAllAttendance, getAllSalaries } from '../../services/mockApi';
import { AttendanceRecord } from '../../types';
import Button from '../../components/ui/Button';
import Settings from './Settings';
import Profile from '../Profile';
import ManageEmployees from './ManageEmployees';
import EmployeeDetail from './EmployeeDetail';
import { CameraIcon, MapPinIcon } from '../../components/icons';
import AuditLog from './AuditLog';
import ManageLeaveRequests from './ManageLeaveRequests';

const AdminDashboardHome: React.FC = () => {
    const [stats, setStats] = useState({ totalEmployees: 0, onLeave: 0, presentToday: 0 });

    useEffect(() => {
        getAdminDashboardData().then(data => setStats(data.stats));
    }, []);
    
    const attendanceData = useMemo(() => [
        { name: 'Jan', Present: 40, Absent: 2, Leave: 5 },
        { name: 'Feb', Present: 38, Absent: 1, Leave: 3 },
        { name: 'Mar', Present: 42, Absent: 0, Leave: 4 },
        { name: 'Apr', Present: 41, Absent: 3, Leave: 2 },
    ], []);

    const salaryData = useMemo(() => [
        { name: 'Engineering', value: 400000 },
        { name: 'HR', value: 150000 },
        { name: 'Marketing', value: 250000 },
        { name: 'Sales', value: 300000 },
    ], []);
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <h3 className="text-lg font-medium">Total Employees</h3>
                    <p className="text-3xl font-bold text-primary-500">{stats.totalEmployees}</p>
                </Card>
                <Card>
                    <h3 className="text-lg font-medium">Present Today</h3>
                    <p className="text-3xl font-bold text-green-500">{stats.presentToday}</p>
                </Card>
                <Card>
                    <h3 className="text-lg font-medium">On Leave</h3>
                    <p className="text-3xl font-bold text-yellow-500">{stats.onLeave}</p>
                </Card>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <h3 className="text-xl font-semibold mb-4">Attendance Trends</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={attendanceData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="Present" stackId="a" fill="#22c55e" />
                            <Bar dataKey="Absent" stackId="a" fill="#ef4444" />
                            <Bar dataKey="Leave" stackId="a" fill="#f59e0b" />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
                <Card>
                    <h3 className="text-xl font-semibold mb-4">Salary Distribution by Department</h3>
                     <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={salaryData} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                {salaryData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                             <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                        </PieChart>
                    </ResponsiveContainer>
                </Card>
            </div>
        </div>
    );
};

const ManageAttendance: React.FC = () => {
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    useEffect(() => {
        getAllAttendance().then(setAttendance);
    }, []);

    return <Card>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Manage Attendance</h2>
            <Button>Export CSV</Button>
        </div>
        <div className="overflow-x-auto">
             <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Employee</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Check In</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Check Out</th>
                         <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {attendance.map(record => (
                        <tr key={record.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{record.employeeName}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{record.date}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                <div className="flex items-center gap-2">
                                    <span>{record.checkIn || '--'}</span>
                                    {record.checkInPhoto && <CameraIcon className="h-4 w-4 text-gray-400" title="Photo captured" />}
                                    {record.checkInLocation && <MapPinIcon className="h-4 w-4 text-gray-400" title={`Location: ${record.checkInLocation.lat.toFixed(4)}, ${record.checkInLocation.lon.toFixed(4)}`} />}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{record.checkOut || '--'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${record.status === 'Present' ? 'bg-green-100 text-green-800' : record.status === 'Absent' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{record.status}</span></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </Card>;
};

const AdminDashboard: React.FC = () => {
    const [activeView, setActiveView] = useState('dashboard');
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

    const handleSelectEmployee = (employeeId: string) => {
        setSelectedEmployeeId(employeeId);
    };

    const handleBackToEmployeeList = () => {
        setSelectedEmployeeId(null);
    };

    const handleSetActiveView = (view: string) => {
        setActiveView(view);
        setSelectedEmployeeId(null); // Reset selection when changing main view
    };

    const renderContent = () => {
        switch (activeView) {
            case 'dashboard':
                return <AdminDashboardHome />;
            case 'attendance':
                return <ManageAttendance />;
            case 'employees':
                return selectedEmployeeId ? (
                    <EmployeeDetail employeeId={selectedEmployeeId} onBack={handleBackToEmployeeList} />
                ) : (
                    <ManageEmployees onSelectEmployee={handleSelectEmployee} />
                );
            case 'leave-management':
                return <ManageLeaveRequests />;
            case 'settings':
                return <Settings />;
            case 'audit':
                return <AuditLog />;
            case 'profile':
                return <Profile />;
            default:
                return <AdminDashboardHome />;
        }
    };

    return (
        <DashboardLayout activeView={activeView} setActiveView={handleSetActiveView}>
            {renderContent()}
        </DashboardLayout>
    );
};

export default AdminDashboard;