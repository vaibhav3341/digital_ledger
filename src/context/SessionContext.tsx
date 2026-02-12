import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { AppSession, AppUserRecord } from '../models/types';
import { signOut as signOutAuth } from '../services/auth';
import { touchUserLastLoginIfExists } from '../services/firestore';

interface SessionContextValue {
  loading: boolean;
  session: AppSession | null;
  authUser: FirebaseAuthTypes.User | null;
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
  const [loading, setLoading] = useState(true);
  const [authUser, setAuthUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [requiresRegistration, setRequiresRegistration] = useState(false);
  const [session, setSessionState] = useState<AppSession | null>(null);

  const setSession = useCallback((next: AppSession) => {
    setSessionState(next);
  }, []);

  const hydrateSession = useCallback(
    async (
      firebaseUser: FirebaseAuthTypes.User,
      userRecord: AppUserRecord,
    ): Promise<AppSession | null> => {
      if (userRecord.role === 'ADMIN' && userRecord.adminId && userRecord.ledgerId) {
        const adminSnap = await firestore()
          .collection('admins')
          .doc(userRecord.adminId)
          .get();
        const adminName =
          (adminSnap.exists() ? adminSnap.data()?.adminName : null) ||
          userRecord.displayName ||
          firebaseUser.displayName ||
          'Admin';

        return {
          uid: firebaseUser.uid,
          role: 'ADMIN',
          adminId: userRecord.adminId,
          adminName,
          ledgerId: userRecord.ledgerId,
        };
      }

      if (
        userRecord.role === 'COWORKER' &&
        userRecord.recipientId &&
        userRecord.ledgerId
      ) {
        const recipientSnap = await firestore()
          .collection('recipients')
          .doc(userRecord.recipientId)
          .get();
        const recipientName =
          (recipientSnap.exists() ? recipientSnap.data()?.recipientName : null) ||
          'Recipient';

        return {
          uid: firebaseUser.uid,
          role: 'COWORKER',
          coworkerName:
            userRecord.displayName || firebaseUser.displayName || 'Coworker',
          recipientId: userRecord.recipientId,
          recipientName,
          ledgerId: userRecord.ledgerId,
          accessCode: '',
        };
      }

      return null;
    },
    [],
  );

  useEffect(() => {
    let unsubscribeUser: (() => void) | null = null;

    const unsubscribeAuth = auth().onAuthStateChanged((firebaseUser) => {
      if (unsubscribeUser) {
        unsubscribeUser();
        unsubscribeUser = null;
      }

      setAuthUser(firebaseUser);

      if (!firebaseUser) {
        setSessionState(null);
        setRequiresRegistration(false);
        setLoading(false);
        return;
      }

      setLoading(true);
      void touchUserLastLoginIfExists({
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName || null,
        email: firebaseUser.email || null,
      });

      const userRef = firestore().collection('users').doc(firebaseUser.uid);
      unsubscribeUser = userRef.onSnapshot(
        (snapshot) => {
          void (async () => {
            try {
              if (!snapshot.exists()) {
                setSessionState(null);
                setRequiresRegistration(true);
                setLoading(false);
                return;
              }

              const userRecord = snapshot.data() as AppUserRecord;
              const nextSession = await hydrateSession(firebaseUser, userRecord);
              setSessionState(nextSession);
              setRequiresRegistration(!nextSession);
              setLoading(false);
            } catch (error) {
              console.warn('Failed to hydrate session', error);
              setSessionState(null);
              setRequiresRegistration(true);
              setLoading(false);
            }
          })();
        },
        (error) => {
          console.warn('Failed to load users profile', error);
          setSessionState(null);
          setRequiresRegistration(true);
          setLoading(false);
        },
      );
    });

    return () => {
      if (unsubscribeUser) {
        unsubscribeUser();
      }
      unsubscribeAuth();
    };
  }, [hydrateSession]);

  const signOut = useCallback(async () => {
    await signOutAuth();
    setSessionState(null);
    setRequiresRegistration(false);
    setAuthUser(null);
  }, []);

  const value = useMemo(
    () => ({
      loading,
      session,
      authUser,
      requiresRegistration,
      setSession,
      clearSession: signOut,
      signOut,
    }),
    [
      authUser,
      loading,
      requiresRegistration,
      session,
      setSession,
      signOut,
    ],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}
