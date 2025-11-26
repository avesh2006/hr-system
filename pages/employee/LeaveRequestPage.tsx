import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getMyLeaveRequests, requestLeave } from '../../services/mockApi';
import { LeaveRequest } from '../../types';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const baseClasses = 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full';
    const statusClasses = {
        Approved: 'bg-green-100 text-green-800',
        Rejected: 'bg-red-100 text-red-800',
        Pending: 'bg-yellow-100 text-yellow-800',
    };
    const className = `${baseClasses} ${statusClasses[status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800'}`;
    return <span className={className}>{status}</span>;
};

const LeaveRequestPage: React.FC = () => {
    const { user } = useAuth();
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            fetchLeaveRequests();
        }
    }, [user]);

    const fetchLeaveRequests = async () => {
        if (!user) return;
        try {
            const data = await getMyLeaveRequests(user.id);
            setRequests(data.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()));
        } catch (err) {
            console.error('Failed to fetch leave requests', err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !startDate || !endDate || !reason) {
            setError('Please fill in all fields.');
            return;
        }
        if (new Date(startDate) > new Date(endDate)) {
            setError('End date cannot be before start date.');
            return;
        }
        setError(null);
        setLoading(true);
        try {
            await requestLeave(user.id, startDate, endDate, reason);
            // Reset form and refetch
            setStartDate('');
            setEndDate('');
            setReason('');
            fetchLeaveRequests();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <h2 className="text-2xl font-bold mb-4">Request Leave</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input id="start-date" label="Start Date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
                        <Input id="end-date" label="End Date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required />
                    </div>
                    <div>
                        <label htmlFor="reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Reason</label>
                        <textarea
                            id="reason"
                            rows={3}
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                            required
                        ></textarea>
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div className="flex justify-end">
                        <Button type="submit" isLoading={loading}>Submit Request</Button>
                    </div>
                </form>
            </Card>

            <Card>
                <h2 className="text-2xl font-bold mb-4">My Leave History</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Dates</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Reason</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {requests.map(req => (
                                <tr key={req.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{req.startDate} to {req.endDate}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{req.reason}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm"><StatusBadge status={req.status} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default LeaveRequestPage;