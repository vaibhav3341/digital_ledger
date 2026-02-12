import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import Button from '../components/Button';
import Input from '../components/Input';
import useSession from '../hooks/useSession';
import { RootStackParamList } from '../navigation/RootNavigator';
import {
  createAdminAndLedger,
  registerCoworkerFromAccessCode,
} from '../services/firestore';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

const REGISTRATION_TIMEOUT_MS = 15000;

function withTimeout<T>(task: Promise<T>, context: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(
        new Error(
          `${context} is taking too long. Check internet and Firebase setup.`,
        ),
      );
    }, REGISTRATION_TIMEOUT_MS);

    task
      .then((result) => {
        clearTimeout(timeout);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timeout);
        reject(error);
      });
  });
}

export default function RegisterProfileScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'RegisterProfile'>>();
  const validatedCode = route.params?.validatedCode;
  const { setSession } = useSession();
  const [name, setName] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'COWORKER'>(
    validatedCode ? 'COWORKER' : 'ADMIN',
  );
  const [loading, setLoading] = useState(false);

  const roleSubtitle = useMemo(() => {
    if (role === 'ADMIN') {
      return 'Create your admin profile and ledger';
    }
    if (validatedCode) {
      return `Joining recipient slot: ${validatedCode.recipientName}`;
    }
    return 'Coworker registration requires a valid access code';
  }, [role, validatedCode]);

  const handleContinue = async () => {
    if (!name.trim()) {
      Alert.alert('Enter your name');
      return;
    }

    try {
      setLoading(true);
      if (role === 'ADMIN') {
        const result = await withTimeout(
          createAdminAndLedger({
            adminName: name.trim(),
          }),
          'Admin registration',
        );
        setSession({
          role: 'ADMIN',
          adminId: result.adminId,
          adminName: result.adminName,
          ledgerId: result.ledgerId,
        });
        return;
      }

      if (!validatedCode) {
        Alert.alert('Access code required', 'Go back and validate access code');
        return;
      }

      const result = await withTimeout(
        registerCoworkerFromAccessCode({
          code: validatedCode.code,
          coworkerName: name.trim(),
        }),
        'Coworker registration',
      );
      setSession({
        role: 'COWORKER',
        coworkerName: name.trim(),
        recipientId: result.recipientId,
        recipientName: result.recipientName,
        ledgerId: result.ledgerId,
        accessCode: result.code,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown registration error';
      Alert.alert('Registration failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile Setup</Text>
      <Text style={styles.subtitle}>{roleSubtitle}</Text>

      <Input
        label="Name"
        value={name}
        placeholder="Full name"
        onChangeText={setName}
      />

      <View style={styles.roleRow}>
        <Button
          label="Admin"
          onPress={() => setRole('ADMIN')}
          variant={role === 'ADMIN' ? 'primary' : 'secondary'}
          style={styles.roleButton}
        />
        <Button
          label="Coworker"
          onPress={() => setRole('COWORKER')}
          variant={role === 'COWORKER' ? 'primary' : 'secondary'}
          style={styles.roleButton}
        />
      </View>

      <Button
        label={loading ? 'Please wait...' : 'Continue'}
        onPress={handleContinue}
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
  roleRow: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  roleButton: {
    flex: 1,
    marginRight: spacing.sm,
  },
});
