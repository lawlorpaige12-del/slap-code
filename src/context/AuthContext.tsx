import React, { createContext, useContext, useState } from 'react';
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
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [sessionState, setSessionState] = useState<SessionState>({
    userName: '',
    tasks: [],
    plannerInput: null,
  });
  const [dashboard, setDashboard] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);

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
