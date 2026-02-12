import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import useAuth from '../hooks/useAuth';
import useTransactions from '../hooks/useTransactions';
import EmptyState from '../components/EmptyState';
import LedgerItem from '../components/LedgerItem';
import { calcBalance } from '../utils/balance';
import { formatAmount } from '../utils/format';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

export default function CoworkerLedgerScreen() {
  const { profile } = useAuth();
  const coworkerId = profile?.coworkerId;
  const { transactions } = useTransactions(coworkerId);
  const balance = calcBalance(transactions);

  return (
    <View style={styles.container}>
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Current balance</Text>
        <Text style={styles.balanceValue}>{formatAmount(balance)}</Text>
      </View>

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.txnId}
        renderItem={({ item }) => <LedgerItem item={item} />}
        ListEmptyComponent={
          <EmptyState title="No transactions" subtitle="No entries yet." />
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
  balanceCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  balanceLabel: {
    ...typography.body,
    color: colors.muted,
  },
  balanceValue: {
    ...typography.title,
    color: colors.primary,
    marginTop: spacing.sm,
  },
  listContainer: {
    paddingBottom: spacing.xl,
  },
  emptyContainer: {
    flexGrow: 1,
  },
});
