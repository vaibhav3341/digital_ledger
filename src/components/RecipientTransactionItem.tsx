import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from 'react-native-paper';
import { LedgerTransaction } from '../models/types';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { formatAmountFromCents, formatDate } from '../utils/format';
import {
  TransactionPerspective,
  directionForPerspective,
} from '../utils/transactions';
import Button from './Button';

interface RecipientTransactionItemProps {
  item: LedgerTransaction;
  onDelete?: () => void;
  deleteDisabled?: boolean;
  perspective?: TransactionPerspective;
}

export default function RecipientTransactionItem({
  item,
  onDelete,
  deleteDisabled,
  perspective = 'ADMIN',
}: RecipientTransactionItemProps) {
  const displayDirection = directionForPerspective(item.direction, perspective);
  const isSent = displayDirection === 'SENT';
  const txnDate = item.txnAt?.toDate?.();
  const amountColor = isSent ? colors.primary : colors.danger;
  const signedAmount = `${isSent ? '+' : '-'}${formatAmountFromCents(
    item.amountCents,
  )}`;

  return (
    <Card style={styles.card} mode="contained">
      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={styles.type}>{isSent ? 'Sent' : 'Received'}</Text>
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
  type: {
    ...typography.bodyStrong,
    color: colors.text,
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
