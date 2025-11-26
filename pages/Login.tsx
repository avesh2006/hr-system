
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const LoginPage: React.FC = () => {
    const [isLoginView, setIsLoginView] = useState(true);
    const [email, setEmail] = useState('admin@example.com');
    const [password, setPassword] = useState('password123');
    const [name, setName] = useState('');
    const [role, setRole] = useState<UserRole>(UserRole.EMPLOYEE);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const { login, signup } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            if (isLoginView) {
                await login(email, password);
            } else {
                await signup(name, email, password, role);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
                        {isLoginView ? 'Sign in to your account' : 'Create a new account'}
                    </h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm -space-y-px flex flex-col gap-4">
                        {!isLoginView && (
                             <Input
                                id="name"
                                label="Full Name"
                                name="name"
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="John Doe"
                            />
                        )}
                        <Input
                            id="email-address"
                            label="Email address"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email address"
                        />
                        <Input
                            id="password"
                            label="Password"
                            name="password"
                            type="password"
                            autoComplete={isLoginView ? "current-password" : "new-password"}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                        />
                         {!isLoginView && (
                            <div>
                                <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                                <select 
                                    id="role" 
                                    name="role"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value as UserRole)}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                >
                                    <option value={UserRole.EMPLOYEE}>Employee</option>
                                    <option value={UserRole.ADMIN}>Admin</option>
                                </select>
                            </div>
                         )}
                    </div>

                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                    <div>
                        <Button type="submit" className="w-full" isLoading={loading}>
                            {isLoginView ? 'Sign in' : 'Sign up'}
                        </Button>
                    </div>
                </form>
                <div className="text-sm text-center">
                    <a href="#" onClick={(e) => {
                        e.preventDefault();
                        setIsLoginView(!isLoginView);
                        setError(null);
                    }} className="font-medium text-primary-600 hover:text-primary-500">
                        {isLoginView ? 'Don\'t have an account? Sign up' : 'Already have an account? Sign in'}
                    </a>
                </div>
                 <div className="text-xs text-center text-gray-500">
                    <p>Admin: admin@example.com / password123</p>
                    <p>Employee: employee@example.com / password123</p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
