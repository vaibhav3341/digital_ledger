import React, { useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Button from '../components/Button';
import Input from '../components/Input';
import useRecipients from '../hooks/useRecipients';
import useSession from '../hooks/useSession';
import { TransactionDirection } from '../models/types';
import { RootStackParamList } from '../navigation/RootNavigator';
import { createTransactionEntry } from '../services/firestore';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { formatDateDDMMYYYY } from '../utils/format';

function todayDateString() {
  return formatDateDDMMYYYY(new Date());
}

function parseDateInput(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) {
    return null;
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const parsed = new Date(year, month - 1, day, 12, 0, 0);
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getDate() !== day ||
    parsed.getMonth() !== month - 1 ||
    parsed.getFullYear() !== year
  ) {
    return null;
  }

  return parsed;
}

export default function AddTransactionScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'AddTransaction'>>();
  const { session } = useSession();
  const ledgerId = session?.role === 'ADMIN' ? session.ledgerId : undefined;
  const { recipients } = useRecipients(ledgerId);

  const [selectedRecipientId, setSelectedRecipientId] = useState(
    route.params?.recipientId || '',
  );
  const [direction, setDirection] = useState<TransactionDirection>(
    route.params?.initialDirection || 'SENT',
  );
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [txnDate, setTxnDate] = useState(todayDateString());
  const [loading, setLoading] = useState(false);

  const selectedRecipient = useMemo(
    () => recipients.find((recipient) => recipient.recipientId === selectedRecipientId),
    [recipients, selectedRecipientId],
  );

  const handleSave = async () => {
    if (!ledgerId || session?.role !== 'ADMIN') {
      return;
    }
    if (!selectedRecipientId) {
      Alert.alert('Select recipient');
      return;
    }

    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      Alert.alert('Enter a valid amount');
      return;
    }

    const parsedDate = parseDateInput(txnDate.trim());
    if (!parsedDate) {
      Alert.alert('Enter date in DD/MM/YYYY format');
      return;
    }

    try {
      setLoading(true);
      await createTransactionEntry({
        ledgerId,
        recipientId: selectedRecipientId,
        direction,
        amountCents: Math.round(parsedAmount * 100),
        note: note.trim() || undefined,
        txnAt: parsedDate,
        createdByUid: session.uid,
        recipientNameSnapshot: selectedRecipient?.recipientName,
      });
      navigation.goBack();
    } catch (error) {
      const firestoreError = error as { code?: string; message?: string };
      if (firestoreError?.code === 'firestore/permission-denied') {
        Alert.alert(
          'Failed to save transaction',
          'Firestore denied this write. Deploy latest `firestore.rules` to the exact Firebase project used by this app, then retry.',
        );
        return;
      }
      Alert.alert(
        'Failed to save transaction',
        firestoreError?.message || String(error),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Transaction</Text>

      <Text style={styles.label}>Recipient</Text>
      <FlatList
        horizontal
        data={recipients}
        keyExtractor={(item) => item.recipientId}
        renderItem={({ item }) => (
          <Button
            label={item.recipientName}
            variant={
              selectedRecipientId === item.recipientId ? 'primary' : 'secondary'
            }
            onPress={() => setSelectedRecipientId(item.recipientId)}
            style={styles.recipientButton}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.emptyHint}>
            Create at least one recipient before adding transactions.
          </Text>
        }
        contentContainerStyle={styles.recipientList}
        showsHorizontalScrollIndicator={false}
      />

      <View style={styles.directionRow}>
        <Button
          label="Sent"
          onPress={() => setDirection('SENT')}
          variant={direction === 'SENT' ? 'primary' : 'secondary'}
          style={styles.directionButton}
        />
        <Button
          label="Received"
          onPress={() => setDirection('RECEIVED')}
          variant={direction === 'RECEIVED' ? 'primary' : 'secondary'}
          style={styles.directionButton}
        />
      </View>

      <Input
        label="Amount"
        value={amount}
        placeholder="0.00"
        onChangeText={setAmount}
        keyboardType="numeric"
      />
      <Input
        label="Transaction Date (DD/MM/YYYY)"
        value={txnDate}
        placeholder="16/02/2026"
        onChangeText={setTxnDate}
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
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  title: {
    ...typography.title,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  recipientList: {
    paddingBottom: spacing.md,
  },
  recipientButton: {
    marginRight: spacing.sm,
  },
  emptyHint: {
    fontSize: 13,
    color: colors.muted,
  },
  directionRow: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  directionButton: {
    flex: 1,
    marginRight: spacing.sm,
  },
});
