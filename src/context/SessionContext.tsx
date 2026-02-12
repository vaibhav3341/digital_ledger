import React, { createContext, useCallback, useMemo, useState } from 'react';
import { AppSession } from '../models/types';

interface SessionContextValue {
  loading: boolean;
  session: AppSession | null;
  setSession: (next: AppSession) => void;
  clearSession: () => void;
}

export const SessionContext = createContext<SessionContextValue | undefined>(
  undefined,
);

interface SessionProviderProps {
  children: React.ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  const [session, setSessionState] = useState<AppSession | null>(null);

  const setSession = useCallback((next: AppSession) => {
    setSessionState(next);
  }, []);

  const clearSession = useCallback(() => {
    setSessionState(null);
  }, []);

  const value = useMemo(
    () => ({
      loading: false,
      session,
      setSession,
      clearSession,
    }),
    [session, setSession, clearSession],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}
