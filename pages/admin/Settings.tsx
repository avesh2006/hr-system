import React, { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { getGamificationSettings, updateGamificationSettings } from '../../services/mockApi';
import { GamificationSettings as GamificationSettingsType } from '../../types';

const Settings: React.FC = () => {
    const [settings, setSettings] = useState<GamificationSettingsType | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        getGamificationSettings().then(data => {
            setSettings(data);
            setLoading(false);
        });
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!settings) return;
        setSaving(true);
        setSuccess(null);
        await updateGamificationSettings(settings);
        setSaving(false);
        setSuccess('Settings saved successfully!');
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!settings) return;
        const { name, value } = e.target;
        setSettings({
            ...settings,
            [name]: Number(value)
        });
    };

    if (loading) {
        return <p>Loading settings...</p>;
    }
    
    if (!settings) {
        return <p>Could not load settings.</p>;
    }

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Settings</h1>
            <Card className="max-w-2xl">
                <form onSubmit={handleSave}>
                    <h2 className="text-xl font-semibold mb-4 border-b pb-2 dark:border-gray-700">Gamification Rules</h2>
                    <div className="space-y-4 pt-4">
                        <Input
                            id="pointsForPunctuality"
                            label="Points for On-Time Check-in"
                            name="pointsForPunctuality"
                            type="number"
                            value={settings.pointsForPunctuality}
                            onChange={handleChange}
                        />
                        <Input
                            id="pointsForPerfectWeek"
                            label="Points for a Perfect Week (Present all 5 days)"
                            name="pointsForPerfectWeek"
                            type="number"
                             value={settings.pointsForPerfectWeek}
                            onChange={handleChange}
                        />
                    </div>
                     <div className="mt-6 flex justify-end items-center gap-4">
                        {success && <p className="text-sm text-green-500">{success}</p>}
                        <Button type="submit" isLoading={saving}>
                            Save Settings
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default Settings;
