import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { loginUser, signupUser, updateUserProfile } from '../services/mockApi';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, pass: string) => Promise<void>;
    signup: (name: string, email: string, pass: string, role: UserRole) => Promise<void>;
    logout: () => void;
    updateUser: (updatedUser: Partial<User>, newPassword?: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        try {
            const storedUser = localStorage.getItem('authUser');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        } catch (error) {
            console.error("Failed to parse user from localStorage", error);
            localStorage.removeItem('authUser');
        } finally {
            setLoading(false);
        }
    }, []);

    const login = async (email: string, pass: string) => {
        const loggedInUser = await loginUser(email, pass);
        setUser(loggedInUser);
        localStorage.setItem('authUser', JSON.stringify(loggedInUser));
    };

    const signup = async (name: string, email: string, pass: string, role: UserRole) => {
        const newUser = await signupUser(name, email, pass, role);
        setUser(newUser);
        localStorage.setItem('authUser', JSON.stringify(newUser));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('authUser');
    };
    
    const updateUser = async (updatedUser: Partial<User>, newPassword?: string) => {
        if (user) {
            const updatedUserData = await updateUserProfile(user.id, updatedUser, newPassword);
            setUser(updatedUserData);
            localStorage.setItem('authUser', JSON.stringify(updatedUserData));
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUser }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
