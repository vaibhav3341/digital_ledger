import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import LedgerItem from '../components/LedgerItem';
import useTransactions from '../hooks/useTransactions';
import { RootStackParamList } from '../navigation/RootNavigator';
import { calcBalance } from '../utils/balance';
import { formatAmount } from '../utils/format';
import { TransactionType } from '../models/types';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

export default function CoworkerDetailScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'CoworkerDetail'>>();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { coworkerId } = route.params;
  const { transactions } = useTransactions(coworkerId);
  const [filter, setFilter] = useState<'ALL' | TransactionType>('ALL');

  const filtered = useMemo(() => {
    if (filter === 'ALL') {
      return transactions;
    }
    return transactions.filter((txn) => txn.type === filter);
  }, [transactions, filter]);

  const balance = calcBalance(transactions);

  return (
    <View style={styles.container}>
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Current balance</Text>
        <Text style={styles.balanceValue}>{formatAmount(balance)}</Text>
        <Button
          label="Add transaction"
          onPress={() =>
            navigation.navigate('AddEditTransaction', { coworkerId })
          }
        />
        <View style={styles.filterRow}>
          <Button
            label="All"
            onPress={() => setFilter('ALL')}
            variant={filter === 'ALL' ? 'primary' : 'secondary'}
            style={styles.filterButton}
          />
          <Button
            label="Paid"
            onPress={() => setFilter('PAID_TO_COWORKER')}
            variant={filter === 'PAID_TO_COWORKER' ? 'primary' : 'secondary'}
            style={styles.filterButton}
          />
          <Button
            label="Received"
            onPress={() => setFilter('RECEIVED_FROM_COWORKER')}
            variant={filter === 'RECEIVED_FROM_COWORKER' ? 'primary' : 'secondary'}
            style={styles.filterButtonLast}
          />
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.txnId}
        renderItem={({ item }) => (
          <LedgerItem
            item={item}
            onPress={() =>
              navigation.navigate('AddEditTransaction', {
                coworkerId,
                txnId: item.txnId,
              })
            }
          />
        )}
        ListEmptyComponent={
          <EmptyState title="No transactions" subtitle="Add the first entry." />
        }
        contentContainerStyle={
          filtered.length === 0 ? styles.emptyContainer : styles.listContainer
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
    marginVertical: spacing.sm,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  filterButton: {
    flex: 1,
    marginRight: spacing.sm,
  },
  filterButtonLast: {
    flex: 1,
  },
  listContainer: {
    paddingBottom: spacing.xl,
  },
  emptyContainer: {
    flexGrow: 1,
  },
});
