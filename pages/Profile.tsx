import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const Profile: React.FC = () => {
    const { user, updateUser } = useAuth();
    
    const [name, setName] = useState(user?.name || '');
    const [team, setTeam] = useState(user?.team || '');
    const [email, setEmail] = useState(user?.email || '');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    if (!user) {
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (newPassword && newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (newPassword && newPassword.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }

        setLoading(true);
        try {
            await updateUser({ name, team }, newPassword || undefined);
            setSuccess("Profile updated successfully!");
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">My Profile</h1>
            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card>
                        <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
                        <div className="space-y-4">
                            <Input
                                id="name"
                                label="Full Name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                            <Input
                                id="team"
                                label="Team"
                                type="text"
                                value={team}
                                onChange={(e) => setTeam(e.target.value)}
                                required
                            />
                            <Input
                                id="email"
                                label="Email Address"
                                type="email"
                                value={email}
                                disabled
                            />
                             <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Join Date: {user.joinDate}</p>
                            </div>
                        </div>
                    </Card>
                    <Card>
                        <h2 className="text-xl font-semibold mb-4">Change Password</h2>
                         <div className="space-y-4">
                            <Input
                                id="new-password"
                                label="New Password"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Leave blank to keep current password"
                            />
                            <Input
                                id="confirm-password"
                                label="Confirm New Password"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>
                    </Card>
                </div>
                <div className="mt-6 flex justify-end items-center gap-4">
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    {success && <p className="text-sm text-green-500">{success}</p>}
                    <Button type="submit" isLoading={loading}>
                        Save Changes
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default Profile;