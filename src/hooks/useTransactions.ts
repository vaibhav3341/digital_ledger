import { useEffect, useState } from 'react';
import firestore from '@react-native-firebase/firestore';
import { Transaction } from '../models/types';

export default function useTransactions(coworkerId?: string) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!coworkerId) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = firestore()
      .collection('coworkers')
      .doc(coworkerId)
      .collection('transactions')
      .orderBy('timestamp', 'desc')
      .onSnapshot((snapshot) => {
        const items = snapshot.docs
          .map((doc) => doc.data() as Transaction)
          .filter((txn) => !txn.isDeleted);
        setTransactions(items);
        setLoading(false);
      });

    return unsubscribe;
  }, [coworkerId]);

  return { transactions, loading };
}
