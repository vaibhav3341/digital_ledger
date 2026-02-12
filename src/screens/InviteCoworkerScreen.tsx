import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import auth from '@react-native-firebase/auth';
import Button from '../components/Button';
import Input from '../components/Input';
import { createCoworker } from '../services/firestore';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

export default function InviteCoworkerScreen() {
  const ownerId = auth().currentUser?.uid;
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!ownerId) {
      return;
    }
    if (!name.trim()) {
      Alert.alert('Enter coworker name');
      return;
    }

    try {
      setLoading(true);
      const result = await createCoworker({
        ownerId,
        name: name.trim(),
        phone: phone.trim() || undefined,
      });
      setInviteCode(result.inviteCode);
    } catch (error) {
      Alert.alert('Failed to create coworker', String(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add coworker</Text>
      <Text style={styles.subtitle}>
        Create a coworker and share the invite code.
      </Text>

      <Input
        label="Coworker name"
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
        label={loading ? 'Creating...' : 'Create & Get Code'}
        onPress={handleCreate}
        disabled={loading}
      />

      {inviteCode ? (
        <View style={styles.inviteBox}>
          <Text style={styles.inviteLabel}>Invite code</Text>
          <Text style={styles.inviteCode}>{inviteCode}</Text>
          <Text style={styles.inviteHint}>
            Ask the coworker to enter this code after login.
          </Text>
        </View>
      ) : null}
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
  inviteBox: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  inviteLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
  },
  inviteCode: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.sm,
  },
  inviteHint: {
    marginTop: spacing.sm,
    fontSize: 12,
    color: colors.muted,
  },
});
