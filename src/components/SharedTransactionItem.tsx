import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from 'react-native-paper';
import { LedgerTransaction } from '../models/types';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
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
  const amountColor = item.direction === 'SENT' ? colors.primary : colors.danger;
  const signedAmount = `${item.direction === 'SENT' ? '+' : '-'}${formatAmountFromCents(
    item.amountCents,
  )}`;

  return (
    <Card style={styles.card} mode="contained">
      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={styles.name}>{item.recipientNameSnapshot || 'Recipient'}</Text>
          <Text style={[styles.amount, { color: amountColor }]}>{signedAmount}</Text>
        </View>

        <Text style={styles.date}>{txnDate ? formatDate(txnDate) : 'Saving...'}</Text>
        {item.note ? (
          <Text style={styles.note} numberOfLines={1}>
            {item.note}
          </Text>
        ) : null}
        {onDelete ? (
          <Button
            label={deleteDisabled ? 'Deleting...' : 'Delete'}
            variant="danger"
            size="compact"
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
    ...typography.bodyStrong,
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  amount: {
    ...typography.bodyStrong,
    marginRight: spacing.xs,
  },
  date: {
    ...typography.caption,
    marginTop: spacing.xs,
    color: colors.muted,
  },
  note: {
    ...typography.caption,
    marginTop: spacing.xs,
    color: colors.text,
  },
  deleteAction: {
    marginTop: spacing.md,
  },
});
