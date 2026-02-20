import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Chip, Menu } from 'react-native-paper';
import EmptyState from '../components/EmptyState';
import FeedbackState from '../components/FeedbackState';
import OverflowMenu from '../components/OverflowMenu';
import RecipientCard from '../components/RecipientCard';
import SharedTransactionItem from '../components/SharedTransactionItem';
import StickyActionBar from '../components/StickyActionBar';
import useRecipients from '../hooks/useRecipients';
import useSession from '../hooks/useSession';
import useSharedTransactions from '../hooks/useSharedTransactions';
import { LedgerTransaction } from '../models/types';
import { RootStackParamList } from '../navigation/RootNavigator';
import {
  deleteRecipientEntry,
  deleteTransactionEntry,
} from '../services/firestore';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { formatSignedAmountFromCents } from '../utils/format';
import { summarizeByRecipient } from '../utils/transactions';

type MasterSortOrder = 'DESC' | 'ASC';
type TabKey = 'LEDGER' | 'PEOPLE';

const ALL_RECIPIENTS_FILTER = 'ALL';

function txnAtMillis(item: LedgerTransaction) {
  return item.txnAt?.toMillis?.() || 0;
}

export default function AdminHomeScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { session, signOut } = useSession();
  const ledgerId = session?.role === 'ADMIN' ? session.ledgerId : undefined;
  const { transactions, loading: transactionsLoading } = useSharedTransactions(ledgerId);
  const { recipients, loading: recipientsLoading } = useRecipients(ledgerId);

  const [activeTab, setActiveTab] = useState<TabKey>('LEDGER');
  const [signingOut, setSigningOut] = useState(false);
  const [deletingTransactionId, setDeletingTransactionId] = useState<string | null>(null);
  const [deletingRecipientId, setDeletingRecipientId] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<MasterSortOrder>('DESC');
  const [recipientFilterId, setRecipientFilterId] =
    useState<string>(ALL_RECIPIENTS_FILTER);
  const [recipientMenuVisible, setRecipientMenuVisible] = useState(false);

  const summaryByRecipient = useMemo(
    () => summarizeByRecipient(transactions),
    [transactions],
  );

  const recipientNameById = useMemo(() => {
    const map: Record<string, string> = {};
    recipients.forEach((recipient) => {
      map[recipient.recipientId] = recipient.recipientName;
    });
    return map;
  }, [recipients]);

  const ledgerSummary = useMemo(() => {
    return transactions.reduce(
      (acc, transaction) => {
        if (transaction.direction === 'SENT') {
          acc.totalSentCents += transaction.amountCents;
          acc.netCents += transaction.amountCents;
        } else {
          acc.totalReceivedCents += transaction.amountCents;
          acc.netCents -= transaction.amountCents;
        }
        return acc;
      },
      { totalSentCents: 0, totalReceivedCents: 0, netCents: 0 },
    );
  }, [transactions]);

  useEffect(() => {
    if (
      recipientFilterId !== ALL_RECIPIENTS_FILTER &&
      !recipients.some((recipient) => recipient.recipientId === recipientFilterId)
    ) {
      setRecipientFilterId(ALL_RECIPIENTS_FILTER);
    }
  }, [recipientFilterId, recipients]);

  const filteredTransactions = useMemo(() => {
    const recipientFiltered = transactions.filter((transaction) => {
      if (recipientFilterId === ALL_RECIPIENTS_FILTER) {
        return true;
      }
      return transaction.recipientId === recipientFilterId;
    });

    return [...recipientFiltered].sort((left, right) => {
      const leftMillis = txnAtMillis(left);
      const rightMillis = txnAtMillis(right);
      if (leftMillis === rightMillis) {
        return left.txnId.localeCompare(right.txnId);
      }
      if (sortOrder === 'ASC') {
        return leftMillis - rightMillis;
      }
      return rightMillis - leftMillis;
    });
  }, [recipientFilterId, sortOrder, transactions]);

  const recipientFilterLabel =
    recipientFilterId === ALL_RECIPIENTS_FILTER
      ? 'All'
      : recipientNameById[recipientFilterId] || 'Selected';

  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      await signOut();
    } catch (error) {
      Alert.alert('Sign out failed', String(error));
    } finally {
      setSigningOut(false);
    }
  };

  const handleDeleteTransaction = (txnId: string, recipientName: string) => {
    Alert.alert(
      'Delete transaction',
      `Delete this transaction for ${recipientName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                setDeletingTransactionId(txnId);
                await deleteTransactionEntry({ txnId });
              } catch (error) {
                Alert.alert('Failed to delete transaction', String(error));
              } finally {
                setDeletingTransactionId((current) =>
                  current === txnId ? null : current,
                );
              }
            })();
          },
        },
      ],
    );
  };

  const handleDeleteRecipient = (recipientId: string, recipientName: string) => {
    Alert.alert(
      'Delete recipient',
      `Delete ${recipientName}? This also removes transactions for this recipient.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                setDeletingRecipientId(recipientId);
                await deleteRecipientEntry({ recipientId });
              } catch (error) {
                Alert.alert('Failed to delete recipient', String(error));
              } finally {
                setDeletingRecipientId((current) =>
                  current === recipientId ? null : current,
                );
              }
            })();
          },
        },
      ],
    );
  };

  return (
    <View style={styles.screen}>
      <View style={styles.contentWrap}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Ledger</Text>
            <Text style={styles.subtitle}>
              {session?.role === 'ADMIN' ? session.adminName : ''}
            </Text>
          </View>
          <OverflowMenu
            items={[
              {
                label: 'Get statement',
                onPress: () => navigation.navigate('GetStatement'),
              },
              {
                label: signingOut ? 'Signing out...' : 'Sign out',
                onPress: handleSignOut,
                disabled: signingOut,
              },
            ]}
          />
        </View>

        <View style={styles.summaryStrip}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>People</Text>
            <Text style={styles.summaryValue}>{recipients.length}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Entries</Text>
            <Text style={styles.summaryValue}>{transactions.length}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Net</Text>
            <Text style={styles.summaryValue}>
              {formatSignedAmountFromCents(ledgerSummary.netCents)}
            </Text>
          </View>
        </View>

        <View style={styles.tabRow}>
          <Chip
            selected={activeTab === 'LEDGER'}
            onPress={() => setActiveTab('LEDGER')}
            style={styles.tabChip}
          >
            Ledger
          </Chip>
          <Chip
            selected={activeTab === 'PEOPLE'}
            onPress={() => setActiveTab('PEOPLE')}
            style={styles.tabChip}
          >
            People
          </Chip>
        </View>

        {activeTab === 'LEDGER' ? (
          <View style={styles.filterRow}>
            <Chip
              selected={sortOrder === 'DESC'}
              onPress={() => setSortOrder('DESC')}
              style={styles.filterChip}
            >
              Newest
            </Chip>
            <Chip
              selected={sortOrder === 'ASC'}
              onPress={() => setSortOrder('ASC')}
              style={styles.filterChip}
            >
              Oldest
            </Chip>
            <Menu
              visible={recipientMenuVisible}
              onDismiss={() => setRecipientMenuVisible(false)}
              anchor={
                <Chip
                  selected
                  onPress={() => setRecipientMenuVisible(true)}
                  style={styles.filterChip}
                >
                  {recipientFilterLabel}
                </Chip>
              }
            >
              <Menu.Item
                onPress={() => {
                  setRecipientFilterId(ALL_RECIPIENTS_FILTER);
                  setRecipientMenuVisible(false);
                }}
                title="All"
              />
              {recipients.length > 0 ? (
                recipients.map((recipient) => (
                  <Menu.Item
                    key={recipient.recipientId}
                    onPress={() => {
                      setRecipientFilterId(recipient.recipientId);
                      setRecipientMenuVisible(false);
                    }}
                    title={recipient.recipientName}
                  />
                ))
              ) : (
                <Menu.Item disabled onPress={() => {}} title="No people" />
              )}
            </Menu>
          </View>
        ) : null}

        <View style={styles.listWrap}>
          {activeTab === 'LEDGER' ? (
            transactionsLoading ? (
              <FeedbackState
                variant="loading"
                title="Loading ledger entries..."
                subtitle="Pulling your latest transactions."
              />
            ) : (
              <FlatList
                data={filteredTransactions}
                keyExtractor={(item) => item.txnId}
                renderItem={({ item }) => (
                  <SharedTransactionItem
                    item={item}
                    onDelete={() =>
                      handleDeleteTransaction(
                        item.txnId,
                        item.recipientNameSnapshot || 'recipient',
                      )
                    }
                    deleteDisabled={deletingTransactionId === item.txnId}
                  />
                )}
                ListEmptyComponent={
                  transactions.length === 0 ? (
                    <EmptyState
                      title="No transactions yet"
                      subtitle="Add the first transaction to start this ledger."
                      actionLabel="Add transaction"
                      onActionPress={() => navigation.navigate('AddTransaction', {})}
                    />
                  ) : (
                    <EmptyState
                      title="No matching transactions"
                      subtitle="Adjust filters to see more results."
                    />
                  )
                }
                contentContainerStyle={
                  filteredTransactions.length === 0
                    ? styles.emptyContainer
                    : styles.listContainer
                }
                showsVerticalScrollIndicator={false}
              />
            )
          ) : recipientsLoading ? (
            <FeedbackState
              variant="loading"
              title="Loading people..."
              subtitle="Pulling recipient list for this ledger."
            />
          ) : (
            <FlatList
              data={recipients}
              keyExtractor={(item) => item.recipientId}
              renderItem={({ item }) => (
                <RecipientCard
                  name={item.recipientName}
                  status={item.status}
                  netCents={summaryByRecipient[item.recipientId]?.netCents || 0}
                  onOpen={() =>
                    navigation.navigate('RecipientLedger', {
                      recipientId: item.recipientId,
                      recipientName: item.recipientName,
                      isReadOnly: false,
                    })
                  }
                  onSend={() =>
                    navigation.navigate('AddTransaction', {
                      recipientId: item.recipientId,
                      recipientName: item.recipientName,
                      initialDirection: 'SENT',
                    })
                  }
                  onReceive={() =>
                    navigation.navigate('AddTransaction', {
                      recipientId: item.recipientId,
                      recipientName: item.recipientName,
                      initialDirection: 'RECEIVED',
                    })
                  }
                  onDelete={() =>
                    handleDeleteRecipient(item.recipientId, item.recipientName)
                  }
                  deleteDisabled={deletingRecipientId === item.recipientId}
                />
              )}
              ListEmptyComponent={
                <EmptyState
                  title="No people yet"
                  subtitle="Add the first recipient to start tracking."
                  actionLabel="Add recipient"
                  onActionPress={() => navigation.navigate('AddRecipient')}
                />
              }
              contentContainerStyle={
                recipients.length === 0 ? styles.emptyContainer : styles.listContainer
              }
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>

      <StickyActionBar
        actions={[
          {
            label: activeTab === 'LEDGER' ? 'Add Transaction' : 'Add Recipient',
            onPress: () =>
              activeTab === 'LEDGER'
                ? navigation.navigate('AddTransaction', {})
                : navigation.navigate('AddRecipient'),
          },
        ]}
      />
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    ...typography.heading,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  summaryStrip: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.card,
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
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
  tabRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
  },
  tabChip: {
    marginRight: spacing.sm,
    backgroundColor: colors.chip,
  },
  filterRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterChip: {
    marginRight: spacing.sm,
    marginBottom: spacing.xs,
    backgroundColor: colors.chip,
  },
  listWrap: {
    flex: 1,
    marginTop: spacing.sm,
  },
  listContainer: {
    paddingBottom: spacing.lg,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
});
