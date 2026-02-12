import { useEffect, useMemo, useState } from 'react';
import firestore from '@react-native-firebase/firestore';
import { LedgerTransaction } from '../models/types';

function txnAtMillis(item: LedgerTransaction) {
  return item.txnAt?.toMillis?.() || 0;
}

export default function useSharedTransactions(ledgerId?: string) {
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ledgerId) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = firestore()
      .collection('transactions')
      .where('ledgerId', '==', ledgerId)
      .onSnapshot((snapshot) => {
        const items = snapshot.docs
          .map((doc) => doc.data() as LedgerTransaction)
          .sort((a, b) => txnAtMillis(b) - txnAtMillis(a));
        setTransactions(items);
        setLoading(false);
      });

    return unsubscribe;
  }, [ledgerId]);

  return useMemo(() => ({ transactions, loading }), [transactions, loading]);
}
