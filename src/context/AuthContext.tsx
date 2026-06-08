import React, { createContext, useContext, useEffect, useState } from 'react';
import { fetchDashboardStats, getCurrentUser, signInWithEmail, signOutUser } from '../services/api';

type User = {
  id: string;
  name: string;
  email: string;
  xp: number;
  streak: number;
  level: number;
};

type Dashboard = {
  tasksCompleted: number;
  totalStudyTime: string;
  streak: number;
  xp: number;
  level: number;
  upcoming: Array<{ title: string; due: string; priority: string }>;
  leaderboard: Array<{ name: string; xp: number; studyTime: string; level: number }>;
  ecosystemHealth: 'vibrant' | 'recovering' | 'neglected';
};

type AuthContextValue = {
  user: User | null;
  dashboard: Dashboard | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshDashboard: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    setLoading(true);
    const current = await getCurrentUser();
    if (current) {
      setUser(current);
    }
    const stats = await fetchDashboardStats();
    setDashboard(stats);
    setLoading(false);
  };

  useEffect(() => {
    loadUser();
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const authenticated = await signInWithEmail(email, password);
    setUser(authenticated);
    await loadUser();
  };

  const signOut = async () => {
    setLoading(true);
    await signOutUser();
    setUser(null);
    await loadUser();
  };

  const refreshDashboard = async () => {
    setLoading(true);
    const stats = await fetchDashboardStats();
    setDashboard(stats);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, dashboard, loading, signIn, signOut, refreshDashboard }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
