import React, { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import auth from '@react-native-firebase/auth';
import Button from '../components/Button';
import Input from '../components/Input';
import useTransactions from '../hooks/useTransactions';
import { RootStackParamList } from '../navigation/RootNavigator';
import {
  createTransaction,
  deleteTransaction,
  updateTransaction,
} from '../services/firestore';
import { TransactionType } from '../models/types';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { createUuid } from '../utils/uuid';

export default function AddEditTransactionScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'AddEditTransaction'>>();
  const { coworkerId, txnId } = route.params;
  const { transactions } = useTransactions(coworkerId);
  const existing = useMemo(
    () => transactions.find((txn) => txn.txnId === txnId),
    [transactions, txnId],
  );

  const [draftTxnId] = useState(txnId || createUuid());
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('PAID_TO_COWORKER');
  const [note, setNote] = useState('');
  const [paymentMode, setPaymentMode] = useState('');
  const [referenceId, setReferenceId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!existing) {
      return;
    }
    setAmount(existing.amount.toString());
    setType(existing.type);
    setNote(existing.note || '');
    setPaymentMode(existing.paymentMode || '');
    setReferenceId(existing.referenceId || '');
  }, [existing]);

  const handleSave = async () => {
    const user = auth().currentUser;
    if (!user) {
      return;
    }
    const parsed = Number(amount);
    if (!parsed || parsed <= 0) {
      Alert.alert('Enter a valid amount');
      return;
    }
    try {
      setLoading(true);
      if (existing) {
        await updateTransaction({
          coworkerId,
          txnId: existing.txnId,
          updates: {
            amount: parsed,
            type,
            note: note.trim() || null,
            paymentMode: paymentMode.trim() || null,
            referenceId: referenceId.trim() || null,
          },
        });
      } else {
        await createTransaction({
          ownerId: user.uid,
          coworkerId,
          createdBy: user.uid,
          amount: parsed,
          type,
          note: note.trim() || undefined,
          paymentMode: paymentMode.trim() || undefined,
          referenceId: referenceId.trim() || undefined,
          txnId: draftTxnId,
        });
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('Failed to save', String(error));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!existing) {
      return;
    }
    try {
      setLoading(true);
      await deleteTransaction({ coworkerId, txnId: existing.txnId });
      navigation.goBack();
    } catch (error) {
      Alert.alert('Failed to delete', String(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {existing ? 'Edit transaction' : 'New transaction'}
      </Text>

      <Input
        label="Amount"
        value={amount}
        placeholder="0"
        onChangeText={setAmount}
        keyboardType="numeric"
      />

      <View style={styles.toggleRow}>
        <Button
          label="Paid to coworker"
          onPress={() => setType('PAID_TO_COWORKER')}
          variant={type === 'PAID_TO_COWORKER' ? 'primary' : 'secondary'}
          style={styles.toggleButton}
        />
        <Button
          label="Received from coworker"
          onPress={() => setType('RECEIVED_FROM_COWORKER')}
          variant={type === 'RECEIVED_FROM_COWORKER' ? 'primary' : 'secondary'}
          style={styles.toggleButtonLast}
        />
      </View>

      <Input
        label="Note (optional)"
        value={note}
        placeholder="Reason or description"
        onChangeText={setNote}
      />
      <Input
        label="Payment mode (optional)"
        value={paymentMode}
        placeholder="Cash / UPI / Bank"
        onChangeText={setPaymentMode}
      />
      <Input
        label="Reference ID (optional)"
        value={referenceId}
        placeholder="UPI txn id"
        onChangeText={setReferenceId}
      />

      <Button
        label={loading ? 'Saving...' : 'Save'}
        onPress={handleSave}
        disabled={loading}
      />

      {existing ? (
        <Button
          label={loading ? 'Deleting...' : 'Delete'}
          onPress={handleDelete}
          variant="danger"
          style={styles.deleteButton}
          disabled={loading}
        />
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
    marginBottom: spacing.lg,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  toggleButton: {
    flex: 1,
    marginRight: spacing.sm,
  },
  toggleButtonLast: {
    flex: 1,
  },
  deleteButton: {
    marginTop: spacing.md,
  },
});
