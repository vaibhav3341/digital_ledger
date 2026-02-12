import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Button from '../components/Button';
import Input from '../components/Input';
import { validateRecipientAccessCode } from '../services/firestore';
import { RootStackParamList } from '../navigation/RootNavigator';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

export default function RegisterAccessCodeScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!code.trim()) {
      Alert.alert('Enter access code');
      return;
    }

    try {
      setLoading(true);
      const validatedCode = await validateRecipientAccessCode(
        code.trim().toUpperCase(),
      );
      navigation.navigate('RegisterProfile', { validatedCode });
    } catch (error) {
      Alert.alert('Invalid code', String(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register</Text>
      <Text style={styles.subtitle}>Enter access code to join as coworker</Text>

      <Input
        label="Access Code"
        value={code}
        placeholder="ABC12345"
        onChangeText={setCode}
      />

      <Button
        label={loading ? 'Validating...' : 'Continue'}
        onPress={handleContinue}
        disabled={loading}
      />

      <Button
        label="Don't have access code?"
        variant="ghost"
        onPress={() => navigation.navigate('RegisterProfile')}
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
