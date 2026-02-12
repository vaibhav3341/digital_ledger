import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import Button from '../components/Button';
import { signInWithGoogle } from '../services/auth';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

export default function WelcomeScreen() {
  const [loading, setLoading] = useState(false);

  const handleGoogleContinue = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      Alert.alert('Google sign-in failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Shared Ledger</Text>
      <Text style={styles.subtitle}>
        Continue with Google to access your admin or coworker ledger.
      </Text>
      <Button
        label={loading ? 'Please wait...' : 'Continue with Google'}
        onPress={handleGoogleContinue}
        disabled={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: spacing.xl,
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
