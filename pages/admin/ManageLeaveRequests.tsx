import React, { useState, useEffect } from 'react';
import { getAllLeaveRequests, updateLeaveRequestStatus } from '../../services/mockApi';
import { LeaveRequest } from '../../types';
import Card from '../../components/ui/Card';
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


const ManageLeaveRequests: React.FC = () => {
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingRequestId, setUpdatingRequestId] = useState<string | null>(null);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const data = await getAllLeaveRequests();
            setRequests(data);
        } catch (error) {
            console.error("Failed to fetch leave requests:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateRequest = async (requestId: string, status: 'Approved' | 'Rejected') => {
        setUpdatingRequestId(requestId);
        try {
            const updatedRequest = await updateLeaveRequestStatus(requestId, status);
            setRequests(prevRequests => 
                prevRequests.map(req => req.id === requestId ? {...req, status: updatedRequest.status} : req)
            );
        } catch (error) {
            console.error(`Failed to ${status.toLowerCase()} request:`, error);
            alert(`Could not update request. Please try again.`);
        } finally {
            setUpdatingRequestId(null);
        }
    };

    if (loading) {
        return <Card><p>Loading leave requests...</p></Card>;
    }

    return (
        <Card>
            <h2 className="text-2xl font-bold mb-4">Manage Leave Requests</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Employee</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Dates</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Reason</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {requests.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">No leave requests found.</td>
                            </tr>
                        )}
                        {requests.map(req => (
                            <tr key={req.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{req.employeeName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{req.startDate} to {req.endDate}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 max-w-xs truncate">{req.reason}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm"><StatusBadge status={req.status} /></td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    {req.status === 'Pending' && (
                                        <div className="flex gap-2">
                                            <Button 
                                                className="!py-1 !px-2 !text-xs bg-green-100 text-green-800 hover:bg-green-200"
                                                onClick={() => handleUpdateRequest(req.id, 'Approved')}
                                                isLoading={updatingRequestId === req.id}
                                            >
                                                Approve
                                            </Button>
                                            <Button 
                                                className="!py-1 !px-2 !text-xs bg-red-100 text-red-800 hover:bg-red-200"
                                                onClick={() => handleUpdateRequest(req.id, 'Rejected')}
                                                isLoading={updatingRequestId === req.id}
                                            >
                                                Reject
                                            </Button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

export default ManageLeaveRequests;