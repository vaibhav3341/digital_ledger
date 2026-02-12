import { useContext } from 'react';
import { SessionContext } from '../context/SessionContext';

export default function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession must be used inside SessionProvider');
  }
  return ctx;
}
