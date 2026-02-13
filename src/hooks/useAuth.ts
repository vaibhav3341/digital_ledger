import { useEffect, useState } from 'react';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { UserProfile } from '../models/types';

export default function useAuth() {
  const [authUser, setAuthUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((user) => {
      setAuthUser(user);
      if (!user) {
        setProfile(null);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!authUser) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = firestore()
      .collection('users')
      .doc(authUser.uid)
      .onSnapshot((snap) => {
        if (snap.exists()) {
          setProfile(snap.data() as UserProfile);
        } else {
          setProfile(null);
        }
        setLoading(false);
      });

    return unsubscribe;
  }, [authUser]);

  return {
    authUser,
    profile,
    loading,
  };
}
