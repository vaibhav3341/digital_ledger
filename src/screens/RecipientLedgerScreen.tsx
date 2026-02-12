import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import RecipientTransactionItem from '../components/RecipientTransactionItem';
import useRecipientTransactions from '../hooks/useRecipientTransactions';
import { RootStackParamList } from '../navigation/RootNavigator';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import {
  formatAmountFromCents,
  formatSignedAmountFromCents,
} from '../utils/format';
import { summarizeTransactions } from '../utils/transactions';

export default function RecipientLedgerScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'RecipientLedger'>>();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { recipientId, recipientName, isReadOnly } = route.params;
  const { transactions } = useRecipientTransactions(recipientId);
  const summary = summarizeTransactions(transactions);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{recipientName}</Text>
      <Text style={styles.subtitle}>Recipient Ledger</Text>

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

      {!isReadOnly ? (
        <View style={styles.actionRow}>
          <Button
            label="Send"
            onPress={() =>
              navigation.navigate('AddTransaction', {
                recipientId,
                recipientName,
                initialDirection: 'SENT',
              })
            }
            style={styles.actionButton}
          />
          <Button
            label="Receive"
            onPress={() =>
              navigation.navigate('AddTransaction', {
                recipientId,
                recipientName,
                initialDirection: 'RECEIVED',
              })
            }
            style={styles.actionButton}
          />
        </View>
      ) : null}

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.txnId}
        renderItem={({ item }) => <RecipientTransactionItem item={item} />}
        ListEmptyComponent={
          <EmptyState
            title="No recipient transactions"
            subtitle="No recipient-specific entries yet."
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
  title: {
    ...typography.title,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.muted,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
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
  actionRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  actionButton: {
    flex: 1,
    marginRight: spacing.sm,
  },
  listContainer: {
    paddingBottom: spacing.xl,
  },
  emptyContainer: {
    flexGrow: 1,
  },
});
