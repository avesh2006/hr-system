import React, { useState, useEffect } from 'react';
import { getAllEmployees, exportEmployeesCSV } from '../../services/mockApi';
import { User, UserRole } from '../../types';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

interface ManageEmployeesProps {
    onSelectEmployee: (employeeId: string) => void;
}

const ManageEmployees: React.FC<ManageEmployeesProps> = ({ onSelectEmployee }) => {
    const [employees, setEmployees] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        getAllEmployees().then(data => {
            setEmployees(data);
            setLoading(false);
        });
    }, []);

    const handleExport = async () => {
        setExporting(true);
        try {
            const csvData = await exportEmployeesCSV();
            const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `employees-export-${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Failed to export employees:", error);
            alert("Could not export data. Please try again.");
        } finally {
            setExporting(false);
        }
    };


    if (loading) {
        return (
            <Card>
                <p>Loading employees...</p>
            </Card>
        );
    }

    return (
        <Card>
            <div className="flex justify-between items-center mb-4">
                 <h2 className="text-2xl font-bold">Manage Employees</h2>
                 <Button onClick={handleExport} isLoading={exporting}>Export CSV</Button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Team</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {employees.map(employee => (
                            <tr key={employee.id} onClick={() => onSelectEmployee(employee.id)} className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10">
                                            <img className="h-10 w-10 rounded-full" src={`https://i.pravatar.cc/150?u=${employee.id}`} alt="" />
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{employee.name}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{employee.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${employee.role === UserRole.ADMIN ? 'bg-indigo-100 text-indigo-800' : 'bg-green-100 text-green-800'}`}>
                                        {employee.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{employee.team}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

export default ManageEmployees;