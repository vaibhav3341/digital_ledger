import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from 'react-native-paper';
import { LedgerTransaction } from '../models/types';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { formatAmountFromCents, formatDate } from '../utils/format';
import Button from './Button';

interface SharedTransactionItemProps {
  item: LedgerTransaction;
  onDelete?: () => void;
  deleteDisabled?: boolean;
}

export default function SharedTransactionItem({
  item,
  onDelete,
  deleteDisabled,
}: SharedTransactionItemProps) {
  const txnDate = item.txnAt?.toDate?.();
  const directionLabel = item.direction === 'SENT' ? 'Sent' : 'Received';
  const directionStyle =
    item.direction === 'SENT' ? styles.directionSent : styles.directionReceived;

  return (
    <Card style={styles.card} mode="contained">
      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={styles.name}>{item.recipientNameSnapshot || 'Recipient'}</Text>
          <Text style={styles.amount}>{formatAmountFromCents(item.amountCents)}</Text>
        </View>
        <Text style={[styles.direction, directionStyle]}>{directionLabel}</Text>
        <Text style={styles.date}>
          {txnDate ? formatDate(txnDate) : 'Saving...'}
        </Text>
        {item.note ? <Text style={styles.note}>{item.note}</Text> : null}
        {onDelete ? (
          <Button
            label={deleteDisabled ? 'Deleting...' : 'Delete'}
            variant="danger"
            onPress={onDelete}
            disabled={deleteDisabled}
            style={styles.deleteAction}
          />
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  content: {
    padding: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  date: {
    marginTop: spacing.xs,
    fontSize: 12,
    color: colors.muted,
  },
  direction: {
    marginTop: spacing.xs,
    fontSize: 12,
    fontWeight: '700',
  },
  directionSent: {
    color: colors.primary,
  },
  directionReceived: {
    color: colors.danger,
  },
  note: {
    marginTop: spacing.sm,
    fontSize: 13,
    color: colors.text,
  },
  deleteAction: {
    marginTop: spacing.md,
  },
});
