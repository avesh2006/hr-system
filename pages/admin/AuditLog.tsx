import React, { useState, useEffect } from 'react';
import { getAuditLogs } from '../../services/mockApi';
import { AuditLog as AuditLogType } from '../../types';
import Card from '../../components/ui/Card';

const AuditLog: React.FC = () => {
    const [logs, setLogs] = useState<AuditLogType[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getAuditLogs().then(data => {
            setLogs(data);
            setLoading(false);
        }).catch(error => {
            console.error("Failed to fetch audit logs:", error);
            setLoading(false);
        });
    }, []);

    if (loading) {
        return <Card><p>Loading audit logs...</p></Card>;
    }

    return (
        <Card>
            <h2 className="text-2xl font-bold mb-4">Audit Log</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Timestamp</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {logs.length === 0 && (
                            <tr>
                                <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">No audit logs found.</td>
                            </tr>
                        )}
                        {logs.map(log => (
                            <tr key={log.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                    {new Date(log.timestamp).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                    {log.userName}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                    {log.action}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

export default AuditLog;