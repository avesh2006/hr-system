import React, { useState, useEffect } from 'react';
import { getUserById, getMyAttendance, getMySalarySlips, getMyLeaveRequests } from '../../services/mockApi';
import { User, AttendanceRecord, SalarySlip, LeaveRequest } from '../../types';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { ChevronLeftIcon } from '../../components/icons';

interface EmployeeDetailProps {
    employeeId: string;
    onBack: () => void;
}

type Tab = 'attendance' | 'salary' | 'leave';

const EmployeeDetail: React.FC<EmployeeDetailProps> = ({ employeeId, onBack }) => {
    const [employee, setEmployee] = useState<User | null>(null);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [salaries, setSalaries] = useState<SalarySlip[]>([]);
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>('attendance');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [userData, attendanceData, salaryData, leaveData] = await Promise.all([
                    getUserById(employeeId),
                    getMyAttendance(employeeId),
                    getMySalarySlips(employeeId),
                    getMyLeaveRequests(employeeId)
                ]);
                setEmployee(userData || null);
                setAttendance(attendanceData);
                setSalaries(salaryData);
                setLeaveRequests(leaveData);
            } catch (error) {
                console.error("Failed to fetch employee details", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [employeeId]);
    
    const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
        const baseClasses = 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full';
        const statusClasses = {
            Present: 'bg-green-100 text-green-800',
            Absent: 'bg-red-100 text-red-800',
            'On Leave': 'bg-yellow-100 text-yellow-800',
            Approved: 'bg-green-100 text-green-800',
            Rejected: 'bg-red-100 text-red-800',
            Pending: 'bg-yellow-100 text-yellow-800',
        };
        const className = `${baseClasses} ${statusClasses[status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800'}`;
        return <span className={className}>{status}</span>;
    };

    if (loading) return <Card><p>Loading employee details...</p></Card>;
    if (!employee) return <Card><p>Employee not found.</p></Card>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button onClick={onBack} variant="secondary">
                    <ChevronLeftIcon className="h-5 w-5 mr-2" />
                    Back to List
                </Button>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Employee Details</h1>
            </div>

            <Card className="flex items-center gap-6">
                <img className="h-24 w-24 rounded-full" src={`https://i.pravatar.cc/150?u=${employee.id}`} alt="Employee avatar" />
                <div>
                    <h2 className="text-2xl font-bold">{employee.name}</h2>
                    <p className="text-gray-500 dark:text-gray-400">{employee.email}</p>
                    <p className="text-gray-500 dark:text-gray-400">Team: {employee.team} | Joined: {employee.joinDate}</p>
                </div>
            </Card>

            <Card>
                <div className="border-b border-gray-200 dark:border-gray-700">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        {(['attendance', 'salary', 'leave'] as Tab[]).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`${
                                    activeTab === tab
                                    ? 'border-primary-500 text-primary-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize`}
                            >
                                {tab} History
                            </button>
                        ))}
                    </nav>
                </div>
                
                <div className="mt-6">
                    {activeTab === 'attendance' && (
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                             <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Check In</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Check Out</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {attendance.map(r => <tr key={r.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{r.date}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{r.checkIn || '--'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{r.checkOut || '--'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm"><StatusBadge status={r.status} /></td>
                                </tr>)}
                            </tbody>
                        </table>
                    )}
                    {activeTab === 'salary' && (
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Period</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Net Salary</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Basic</th>
                                </tr>
                            </thead>
                             <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {salaries.map(s => <tr key={s.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{s.month} {s.year}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">${s.netSalary.toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">${s.basic.toLocaleString()}</td>
                                </tr>)}
                            </tbody>
                        </table>
                    )}
                     {activeTab === 'leave' && (
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Period</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Reason</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                             <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {leaveRequests.map(l => <tr key={l.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{l.startDate} to {l.endDate}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{l.reason}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm"><StatusBadge status={l.status} /></td>
                                </tr>)}
                            </tbody>
                        </table>
                    )}
                </div>

            </Card>
        </div>
    );
};

export default EmployeeDetail;
