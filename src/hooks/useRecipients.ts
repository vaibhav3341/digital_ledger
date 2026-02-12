import { useEffect, useMemo, useState } from 'react';
import firestore from '@react-native-firebase/firestore';
import { Recipient } from '../models/types';

function createdAtMillis(item: Recipient) {
  return item.createdAt?.toMillis?.() || 0;
}

export default function useRecipients(ledgerId?: string) {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ledgerId) {
      setRecipients([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = firestore()
      .collection('recipients')
      .where('ledgerId', '==', ledgerId)
      .onSnapshot((snapshot) => {
        const items = snapshot.docs
          .map((doc) => doc.data() as Recipient)
          .sort((a, b) => createdAtMillis(b) - createdAtMillis(a));
        setRecipients(items);
        setLoading(false);
      });

    return unsubscribe;
  }, [ledgerId]);

  return useMemo(() => ({ recipients, loading }), [recipients, loading]);
}
