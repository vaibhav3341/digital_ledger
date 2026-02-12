import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import Button from '../components/Button';
import Input from '../components/Input';
import { sendOtp, confirmOtp } from '../services/auth';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

export default function AuthScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [code, setCode] = useState('');
  const [confirmation, setConfirmation] =
    useState<FirebaseAuthTypes.ConfirmationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!phoneNumber) {
      Alert.alert('Enter phone number');
      return;
    }
    try {
      setLoading(true);
      const result = await sendOtp(phoneNumber);
      setConfirmation(result);
    } catch (error) {
      Alert.alert('Failed to send OTP', String(error));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!confirmation) {
      return;
    }
    try {
      setLoading(true);
      await confirmOtp(confirmation, code);
    } catch (error) {
      Alert.alert('Invalid code', String(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Shared Ledger</Text>
      <Text style={styles.subtitle}>Sign in with your phone number</Text>

      <Input
        label="Phone number"
        value={phoneNumber}
        placeholder="+91XXXXXXXXXX"
        onChangeText={setPhoneNumber}
        keyboardType="phone-pad"
      />

      {confirmation ? (
        <>
          <Input
            label="OTP"
            value={code}
            placeholder="123456"
            onChangeText={setCode}
            keyboardType="numeric"
          />
          <Button
            label={loading ? 'Verifying...' : 'Verify'}
            onPress={handleVerify}
            disabled={loading}
          />
        </>
      ) : (
        <Button
          label={loading ? 'Sending...' : 'Send OTP'}
          onPress={handleSendOtp}
          disabled={loading}
        />
      )}
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
