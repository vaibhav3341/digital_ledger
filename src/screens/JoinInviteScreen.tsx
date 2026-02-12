import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import Button from '../components/Button';
import Input from '../components/Input';
import { claimInvite } from '../services/firestore';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { RootStackParamList } from '../navigation/RootNavigator';

export default function JoinInviteScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'JoinInvite'>>();
  const [name, setName] = useState(route.params?.name || '');
  const [phone, setPhone] = useState(route.params?.phone || '');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    const user = auth().currentUser;
    if (!user) {
      return;
    }
    if (!code.trim()) {
      Alert.alert('Enter invite code');
      return;
    }
    if (!name.trim()) {
      Alert.alert('Enter your name');
      return;
    }
    try {
      setLoading(true);
      await claimInvite({
        code: code.trim().toUpperCase(),
        uid: user.uid,
        name: name.trim(),
        phone: phone.trim() || undefined,
      });
    } catch (error) {
      Alert.alert('Unable to join', String(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Join a ledger</Text>
      <Text style={styles.subtitle}>Use the invite code from your owner</Text>

      <Input
        label="Invite code"
        value={code}
        placeholder="ABC12345"
        onChangeText={setCode}
      />
      <Input
        label="Your name"
        value={name}
        placeholder="Full name"
        onChangeText={setName}
      />
      <Input
        label="Phone (optional)"
        value={phone}
        placeholder="+91XXXXXXXXXX"
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />

      <Button
        label={loading ? 'Joining...' : 'Join'}
        onPress={handleJoin}
        disabled={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  title: {
    ...typography.title,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.muted,
    marginBottom: spacing.xl,
  },
});
