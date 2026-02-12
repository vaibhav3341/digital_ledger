import { useEffect, useMemo, useState } from 'react';
import firestore from '@react-native-firebase/firestore';
import { LedgerTransaction } from '../models/types';

function txnAtMillis(item: LedgerTransaction) {
  return item.txnAt?.toMillis?.() || 0;
}

export default function useRecipientTransactions(recipientId?: string) {
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!recipientId) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = firestore()
      .collection('transactions')
      .where('recipientId', '==', recipientId)
      .onSnapshot((snapshot) => {
        const items = snapshot.docs
          .map((doc) => doc.data() as LedgerTransaction)
          .sort((a, b) => txnAtMillis(b) - txnAtMillis(a));
        setTransactions(items);
        setLoading(false);
      });

    return unsubscribe;
  }, [recipientId]);

  return useMemo(() => ({ transactions, loading }), [transactions, loading]);
}
