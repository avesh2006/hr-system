import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { getEmployeeDashboardData, markAttendance, getMyAttendance, getMySalarySlips } from '../../services/mockApi';
import { AttendanceRecord, GamificationProgress, SalarySlip } from '../../types';
import Profile from '../Profile';
import CheckInModal from '../../components/CheckInModal';
import LeaveRequestPage from './LeaveRequestPage';

const EmployeeDashboardHome: React.FC<{setActiveView: (view: string) => void}> = ({ setActiveView }) => {
    const { user } = useAuth();
    const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
    const [gamification, setGamification] = useState<GamificationProgress | null>(null);
    const [loadingCheckin, setLoadingCheckin] = useState(false);
    const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
    
    useEffect(() => {
        if(user) {
            getEmployeeDashboardData(user.id).then(data => {
                setTodayAttendance(data.todayAttendance);
                setGamification(data.gamification);
            });
        }
    }, [user]);

    const handleCheckIn = () => {
        if (!user) return;
        setIsCheckInModalOpen(true);
    };

    const handleConfirmCheckIn = async (photo: string, location: { lat: number, lon: number }) => {
        if (!user) return;
        setLoadingCheckin(true);
        setIsCheckInModalOpen(false);
        try {
            const updatedRecord = await markAttendance(user.id, 'check-in', photo, location);
            setTodayAttendance(updatedRecord);
        } catch (error) {
            console.error("Check-in failed:", error);
            alert("Check-in failed. Please try again.");
        } finally {
            setLoadingCheckin(false);
        }
    };

    const handleCheckOut = async () => {
        if (!user) return;
        setLoadingCheckin(true);
        const updatedRecord = await markAttendance(user.id, 'check-out');
        setTodayAttendance(updatedRecord);
        setLoadingCheckin(false);
    };

    return (
        <>
            <CheckInModal
                isOpen={isCheckInModalOpen}
                onClose={() => setIsCheckInModalOpen(false)}
                onConfirm={handleConfirmCheckIn}
            />
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <h3 className="text-xl font-semibold mb-4">Today's Attendance</h3>
                        <div className="space-y-3">
                            <p>Status: <span className={`font-bold ${todayAttendance?.status === 'Present' ? 'text-green-500' : 'text-gray-500'}`}>{todayAttendance?.status || 'Not Marked'}</span></p>
                            <p>Check In: <span className="font-mono">{todayAttendance?.checkIn || '--:--'}</span></p>
                            <p>Check Out: <span className="font-mono">{todayAttendance?.checkOut || '--:--'}</span></p>
                        </div>
                        <div className="mt-4 flex gap-4">
                            <Button onClick={handleCheckIn} disabled={!!todayAttendance?.checkIn || loadingCheckin} isLoading={loadingCheckin && !todayAttendance?.checkIn}>Check In</Button>
                            <Button onClick={handleCheckOut} disabled={!todayAttendance?.checkIn || !!todayAttendance?.checkOut} isLoading={loadingCheckin && !!todayAttendance?.checkIn && !todayAttendance.checkOut} variant="secondary">Check Out</Button>
                        </div>
                    </Card>
                    <Card>
                        <h3 className="text-xl font-semibold mb-4">Gamification</h3>
                        {gamification && (
                            <div className="space-y-3">
                                <p>Points: <span className="font-bold text-primary-500">{gamification.points}</span></p>
                                <p>Rank: <span className="font-bold">#{gamification.leaderboardRank}</span></p>
                                <div >
                                    <h4 className="font-medium mb-2">Badges:</h4>
                                    <div className="flex gap-4">
                                    {gamification.badges.length > 0 ? gamification.badges.map(b => <span key={b.id} title={b.description} className="text-2xl">{b.icon}</span>) : <p className="text-sm text-gray-500">No badges yet.</p>}
                                    </div>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
                <Card>
                    <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
                    <div className="flex gap-4">
                        <Button variant="primary" onClick={() => setActiveView('leave')}>Request Leave</Button>
                        <Button variant="secondary" onClick={() => setActiveView('salary')}>View Salary Slips</Button>
                    </div>
                </Card>
            </div>
        </>
    );
};

const MyAttendance: React.FC = () => {
    const { user } = useAuth();
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

    useEffect(() => {
        if(user) getMyAttendance(user.id).then(setAttendance);
    }, [user]);

     return <Card>
        <h2 className="text-2xl font-bold mb-4">My Attendance Log</h2>
        <div className="overflow-x-auto">
             <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Check In</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Check Out</th>
                         <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {attendance.map(record => (
                        <tr key={record.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{record.date}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{record.checkIn || '--'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{record.checkOut || '--'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${record.status === 'Present' ? 'bg-green-100 text-green-800' : record.status === 'Absent' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{record.status}</span></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </Card>;
}

const MySalary: React.FC = () => {
    const { user } = useAuth();
    const [slips, setSlips] = useState<SalarySlip[]>([]);

    useEffect(() => {
        if(user) getMySalarySlips(user.id).then(setSlips);
    }, [user]);

     return <Card>
        <h2 className="text-2xl font-bold mb-4">My Salary Slips</h2>
        <div className="overflow-x-auto">
             <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Period</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Net Salary</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {slips.map(slip => (
                        <tr key={slip.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{slip.month} {slip.year}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">${slip.netSalary.toLocaleString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <a href="#" className="text-primary-600 hover:text-primary-900">Download</a>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </Card>;
}


const EmployeeDashboard: React.FC = () => {
    const [activeView, setActiveView] = useState('dashboard');

    const renderContent = () => {
        switch (activeView) {
            case 'dashboard':
                return <EmployeeDashboardHome setActiveView={setActiveView} />;
            case 'attendance':
                return <MyAttendance />;
            case 'salary':
                return <MySalary />;
            case 'leave':
                return <LeaveRequestPage />;
             case 'profile':
                return <Profile />;
            // Add other employee views here
            default:
                return <EmployeeDashboardHome setActiveView={setActiveView} />;
        }
    };

    return (
        <DashboardLayout activeView={activeView} setActiveView={setActiveView}>
            {renderContent()}
        </DashboardLayout>
    );
};

export default EmployeeDashboard;