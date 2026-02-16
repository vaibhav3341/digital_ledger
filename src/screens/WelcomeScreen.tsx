import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import Button from '../components/Button';
import Input from '../components/Input';
import useSession from '../hooks/useSession';
import { resolveSessionByPhone } from '../services/firestore';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

export default function WelcomeScreen() {
  const { setSession } = useSession();
  const [phoneLocalNumber, setPhoneLocalNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePhoneChange = (value: string) => {
    setPhoneLocalNumber(value.replace(/\D+/g, ''));
  };

  const handleContinue = async () => {
    try {
      setLoading(true);
      const session = await resolveSessionByPhone(`+91 ${phoneLocalNumber}`.trim());
      if (!session) {
        Alert.alert(
          'Phone number not registered',
          'This phone number is not linked to any recipient. Ask admin to add you first.',
        );
        return;
      }
      setSession(session);
    } catch (error) {
      Alert.alert('Unable to continue', String(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Shared Ledger</Text>
      <Text style={styles.subtitle}>
        Enter your phone number to continue.
      </Text>
      <Input
        label="Phone Number"
        value={phoneLocalNumber}
        placeholder="9876543210"
        prefixText="+91"
        keyboardType="phone-pad"
        maxLength={10}
        onChangeText={handlePhoneChange}
      />
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
