import React, { useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Chip } from 'react-native-paper';
import EmptyState from '../components/EmptyState';
import FeedbackState from '../components/FeedbackState';
import RecipientTransactionItem from '../components/RecipientTransactionItem';
import StickyActionBar from '../components/StickyActionBar';
import useRecipientTransactions from '../hooks/useRecipientTransactions';
import { RootStackParamList } from '../navigation/RootNavigator';
import { deleteTransactionEntry } from '../services/firestore';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import {
  formatAmountFromCents,
  formatSignedAmountFromCents,
} from '../utils/format';
import { summarizeTransactions } from '../utils/transactions';

type DirectionFilter = 'ALL' | 'SENT' | 'RECEIVED';

export default function RecipientLedgerScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'RecipientLedger'>>();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { recipientId, recipientName, isReadOnly } = route.params;
  const { transactions, loading } = useRecipientTransactions(recipientId);

  const [deletingTxnId, setDeletingTxnId] = useState<string | null>(null);
  const [directionFilter, setDirectionFilter] = useState<DirectionFilter>('ALL');

  const summary = useMemo(() => summarizeTransactions(transactions), [transactions]);

  const filteredTransactions = useMemo(() => {
    if (directionFilter === 'ALL') {
      return transactions;
    }
    return transactions.filter((transaction) => transaction.direction === directionFilter);
  }, [directionFilter, transactions]);

  const handleDeleteTransaction = (txnId: string) => {
    Alert.alert('Delete transaction', 'Delete this recipient transaction?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              setDeletingTxnId(txnId);
              await deleteTransactionEntry({ txnId });
            } catch (error) {
              Alert.alert('Failed to delete transaction', String(error));
            } finally {
              setDeletingTxnId((current) => (current === txnId ? null : current));
            }
          })();
        },
      },
    ]);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.contentWrap}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{recipientName}</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Sent</Text>
              <Text style={styles.summaryValue}>
                {formatAmountFromCents(summary.totalSentCents)}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Received</Text>
              <Text style={styles.summaryValue}>
                {formatAmountFromCents(summary.totalReceivedCents)}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Net</Text>
              <Text style={styles.summaryValue}>
                {formatSignedAmountFromCents(summary.netCents)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.filterRow}>
          <Chip
            selected={directionFilter === 'ALL'}
            onPress={() => setDirectionFilter('ALL')}
            style={styles.filterChip}
          >
            All
          </Chip>
          <Chip
            selected={directionFilter === 'SENT'}
            onPress={() => setDirectionFilter('SENT')}
            style={styles.filterChip}
          >
            Sent
          </Chip>
          <Chip
            selected={directionFilter === 'RECEIVED'}
            onPress={() => setDirectionFilter('RECEIVED')}
            style={styles.filterChip}
          >
            Received
          </Chip>
        </View>

        <View style={styles.listWrap}>
          {loading ? (
            <FeedbackState
              variant="loading"
              title="Loading transactions..."
              subtitle="Pulling recipient history."
            />
          ) : (
            <FlatList
              data={filteredTransactions}
              keyExtractor={(item) => item.txnId}
              renderItem={({ item }) => (
                <RecipientTransactionItem
                  item={item}
                  onDelete={
                    !isReadOnly ? () => handleDeleteTransaction(item.txnId) : undefined
                  }
                  deleteDisabled={deletingTxnId === item.txnId}
                />
              )}
              ListEmptyComponent={
                <EmptyState
                  title="No transactions yet"
                  subtitle="Use Send or Receive to add the first entry."
                />
              }
              contentContainerStyle={
                filteredTransactions.length === 0
                  ? styles.emptyContainer
                  : styles.listContainer
              }
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>

      {!isReadOnly ? (
        <StickyActionBar
          actions={[
            {
              label: 'Send',
              onPress: () =>
                navigation.navigate('AddTransaction', {
                  recipientId,
                  recipientName,
                  initialDirection: 'SENT',
                }),
            },
            {
              label: 'Receive',
              variant: 'secondary',
              onPress: () =>
                navigation.navigate('AddTransaction', {
                  recipientId,
                  recipientName,
                  initialDirection: 'RECEIVED',
                }),
            },
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentWrap: {
    flex: 1,
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.lg,
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderColor: colors.border,
    borderWidth: 1,
    padding: spacing.lg,
  },
  summaryTitle: {
    ...typography.subtitle,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.muted,
  },
  summaryValue: {
    ...typography.bodyStrong,
    color: colors.text,
    marginTop: spacing.xxs,
  },
  filterRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  filterChip: {
    marginRight: spacing.sm,
    backgroundColor: colors.chip,
  },
  listWrap: {
    flex: 1,
  },
  listContainer: {
    paddingBottom: spacing.lg,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
});
