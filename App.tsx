
import React from 'react';
// FIX: The `useAuth` hook is defined in `hooks/useAuth.ts`, not in the AuthContext file.
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import LoginPage from './pages/Login';
import Dashboard from './pages/Dashboard';
import AIAssistant from './components/AIAssistant';

const AppContent: React.FC = () => {
    const { user } = useAuth();

    return (
        <div className="min-h-screen text-gray-900 dark:text-gray-100">
            {user ? (
                <>
                    <Dashboard />
                    <AIAssistant />
                </>
            ) : (
                <LoginPage />
            )}
        </div>
    );
};

const App: React.FC = () => {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
};

export default App;