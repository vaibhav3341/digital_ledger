import { useEffect, useMemo, useState } from 'react';
import firestore from '@react-native-firebase/firestore';
import { Transaction } from '../models/types';

interface BalanceInfo {
  balance: number;
  lastActivity?: Date | null;
}

export default function useOwnerBalances(ownerId?: string) {
  const [balances, setBalances] = useState<Record<string, BalanceInfo>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ownerId) {
      setBalances({});
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = firestore()
      .collectionGroup('transactions')
      .where('ownerId', '==', ownerId)
      .onSnapshot((snapshot) => {
        const next: Record<string, BalanceInfo> = {};
        snapshot.docs.forEach((doc) => {
          const txn = doc.data() as Transaction;
          if (txn.isDeleted) {
            return;
          }
          const delta = txn.type === 'PAID_TO_COWORKER' ? txn.amount : -txn.amount;
          const existing = next[txn.coworkerId] || { balance: 0, lastActivity: null };
          const ts = txn.timestamp?.toDate?.() ? txn.timestamp.toDate() : null;
          const lastActivity =
            ts && (!existing.lastActivity || ts > existing.lastActivity)
              ? ts
              : existing.lastActivity;
          next[txn.coworkerId] = {
            balance: existing.balance + delta,
            lastActivity,
          };
        });
        setBalances(next);
        setLoading(false);
      });

    return unsubscribe;
  }, [ownerId]);

  return useMemo(() => ({ balances, loading }), [balances, loading]);
}
