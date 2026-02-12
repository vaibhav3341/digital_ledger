import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Button from '../components/Button';
import Input from '../components/Input';
import useSession from '../hooks/useSession';
import { RootStackParamList } from '../navigation/RootNavigator';
import { createSharedLedgerTransaction } from '../services/firestore';
import { SharedTransactionType } from '../models/types';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

export default function AddSharedTransactionScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'AddSharedTransaction'>>();
  const { session } = useSession();
  const ledgerId = session?.role === 'ADMIN' ? session.ledgerId : undefined;

  const [type, setType] = useState<SharedTransactionType>(route.params.initialType);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!ledgerId) {
      return;
    }
    const parsed = Number(amount);
    if (!parsed || parsed <= 0) {
      Alert.alert('Enter a valid amount');
      return;
    }
    try {
      setLoading(true);
      await createSharedLedgerTransaction({
        ledgerId,
        type,
        amount: parsed,
        note: note.trim() || undefined,
      });
      navigation.goBack();
    } catch (error) {
      Alert.alert('Failed to save transaction', String(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Shared Transaction</Text>

      <View style={styles.toggleRow}>
        <Button
          label="Add"
          onPress={() => setType('ADD')}
          variant={type === 'ADD' ? 'primary' : 'secondary'}
          style={styles.toggleButton}
        />
        <Button
          label="Send"
          onPress={() => setType('SEND')}
          variant={type === 'SEND' ? 'primary' : 'secondary'}
          style={styles.toggleButton}
        />
        <Button
          label="Receive"
          onPress={() => setType('RECEIVE')}
          variant={type === 'RECEIVE' ? 'primary' : 'secondary'}
          style={styles.toggleButton}
        />
      </View>

      <Input
        label="Amount"
        value={amount}
        placeholder="0"
        onChangeText={setAmount}
        keyboardType="numeric"
      />
      <Input
        label="Note (optional)"
        value={note}
        placeholder="Description"
        onChangeText={setNote}
      />

      <Button
        label={loading ? 'Saving...' : 'Save'}
        onPress={handleSave}
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
    marginBottom: spacing.lg,
  },
  toggleRow: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  toggleButton: {
    flex: 1,
    marginRight: spacing.sm,
  },
});
