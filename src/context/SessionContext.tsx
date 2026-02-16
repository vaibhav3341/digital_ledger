import React, { createContext, useCallback, useMemo, useState } from 'react';
import { AppSession } from '../models/types';

interface SessionContextValue {
  loading: boolean;
  session: AppSession | null;
  authUser: {
    uid: string;
    displayName?: string | null;
    email?: string | null;
  } | null;
  requiresRegistration: boolean;
  setSession: (next: AppSession) => void;
  clearSession: () => Promise<void>;
  signOut: () => Promise<void>;
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

  const signOut = useCallback(async () => {
    setSessionState(null);
  }, []);

  const value = useMemo(
    () => ({
      loading: false,
      session,
      authUser: null,
      requiresRegistration: false,
      setSession,
      clearSession: signOut,
      signOut,
    }),
    [session, setSession, signOut],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}
