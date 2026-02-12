import { useEffect, useState } from 'react';
import firestore from '@react-native-firebase/firestore';
import { Coworker } from '../models/types';

export default function useCoworkers(ownerId?: string) {
  const [coworkers, setCoworkers] = useState<Coworker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ownerId) {
      setCoworkers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = firestore()
      .collection('coworkers')
      .where('ownerId', '==', ownerId)
      .orderBy('name')
      .onSnapshot((snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Coworker, 'id'>),
        }));
        setCoworkers(items);
        setLoading(false);
      });

    return unsubscribe;
  }, [ownerId]);

  return { coworkers, loading };
}
