import React, { createContext, useContext, useEffect, useState } from 'react';
import { computeDashboardStats, PlanTask, PlannerInput, DashboardStats } from '../services/api';

type SessionState = {
  userName: string;
  tasks: PlanTask[];
  plannerInput: PlannerInput | null;
};

type AuthContextValue = {
  sessionState: SessionState;
  dashboard: DashboardStats | null;
  loading: boolean;
  setUserName: (name: string) => void;
  setTasks: (tasks: PlanTask[]) => void;
  setPlannerInput: (input: PlannerInput) => void;
  refreshDashboard: () => Promise<void>;
  awardXp: (amount: number) => void;
};

const AUTH_STORAGE_KEY = 'slap-auth-state';

const defaultSessionState: SessionState = {
  userName: '',
  tasks: [],
  plannerInput: null,
};

const loadStoredState = () => {
  if (typeof window === 'undefined') {
    return { sessionState: defaultSessionState, dashboard: null };
  }

  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return { sessionState: defaultSessionState, dashboard: null };
    const parsed = JSON.parse(raw) as { sessionState?: SessionState; dashboard?: DashboardStats | null };
    return {
      sessionState: parsed.sessionState ?? defaultSessionState,
      dashboard: parsed.dashboard ?? null,
    };
  } catch {
    return { sessionState: defaultSessionState, dashboard: null };
  }
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const stored = loadStoredState();
  const [sessionState, setSessionState] = useState<SessionState>(stored.sessionState);
  const [dashboard, setDashboard] = useState<DashboardStats | null>(stored.dashboard);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ sessionState, dashboard }));
    }
  }, [sessionState, dashboard]);

  const setUserName = (name: string) => {
    setSessionState((prev) => ({ ...prev, userName: name }));
  };

  const setTasks = (tasks: PlanTask[]) => {
    setSessionState((prev) => ({ ...prev, tasks }));
  };

  const setPlannerInput = (input: PlannerInput) => {
    setSessionState((prev) => ({ ...prev, plannerInput: input }));
  };

  const refreshDashboard = async () => {
    setLoading(true);
    const stats = await computeDashboardStats(
      sessionState.tasks,
      sessionState.plannerInput,
      sessionState.userName
    );
    setDashboard(stats);
    setLoading(false);
  };

  const awardXp = (amount: number) => {
    setDashboard((prev) => {
      if (!prev) return prev;
      return { ...prev, xp: Math.max(0, prev.xp + amount) };
    });
  };

  return (
    <AuthContext.Provider
      value={{
        sessionState,
        dashboard,
        loading,
        setUserName,
        setTasks,
        setPlannerInput,
        refreshDashboard,
        awardXp,
      }}
    >
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
