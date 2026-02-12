import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import RecipientTransactionItem from '../components/RecipientTransactionItem';
import useRecipientTransactions from '../hooks/useRecipientTransactions';
import useSession from '../hooks/useSession';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import {
  formatAmountFromCents,
  formatSignedAmountFromCents,
} from '../utils/format';
import { summarizeTransactions } from '../utils/transactions';

export default function CoworkerHomeScreen() {
  const { session, clearSession } = useSession();
  const recipientId = session?.role === 'COWORKER' ? session.recipientId : undefined;
  const recipientName =
    session?.role === 'COWORKER' ? session.recipientName : 'Recipient';
  const { transactions } = useRecipientTransactions(recipientId);
  const summary = summarizeTransactions(transactions);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>{recipientName}</Text>
          <Text style={styles.subtitle}>Your recipient ledger (view-only)</Text>
        </View>
        <Button label="Reset" variant="ghost" onPress={clearSession} />
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryText}>
          Sent: {formatAmountFromCents(summary.totalSentCents)}
        </Text>
        <Text style={styles.summaryText}>
          Received: {formatAmountFromCents(summary.totalReceivedCents)}
        </Text>
        <Text style={styles.summaryNet}>
          Net: {formatSignedAmountFromCents(summary.netCents)}
        </Text>
      </View>

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.txnId}
        renderItem={({ item }) => <RecipientTransactionItem item={item} />}
        ListEmptyComponent={
          <EmptyState
            title="No transactions"
            subtitle="Your recipient ledger is empty."
          />
        }
        contentContainerStyle={
          transactions.length === 0 ? styles.emptyContainer : styles.listContainer
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderColor: colors.border,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  summaryText: {
    fontSize: 13,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  summaryNet: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    marginTop: spacing.xs,
  },
  listContainer: {
    paddingBottom: spacing.xl,
  },
  emptyContainer: {
    flexGrow: 1,
  },
});
