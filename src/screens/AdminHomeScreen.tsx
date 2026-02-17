import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Chip, Menu } from 'react-native-paper';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import RecipientCard from '../components/RecipientCard';
import SharedTransactionItem from '../components/SharedTransactionItem';
import useRecipients from '../hooks/useRecipients';
import useSession from '../hooks/useSession';
import useSharedTransactions from '../hooks/useSharedTransactions';
import { LedgerTransaction } from '../models/types';
import { RootStackParamList } from '../navigation/RootNavigator';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { summarizeByRecipient } from '../utils/transactions';

type MasterSortOrder = 'DESC' | 'ASC';

const ALL_RECIPIENTS_FILTER = 'ALL';
const sortLabelByOrder: Record<MasterSortOrder, string> = {
  DESC: 'Date (Newest first)',
  ASC: 'Date (Oldest first)',
};

function txnAtMillis(item: LedgerTransaction) {
  return item.txnAt?.toMillis?.() || 0;
}

export default function AdminHomeScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { session, signOut } = useSession();
  const ledgerId = session?.role === 'ADMIN' ? session.ledgerId : undefined;
  const { transactions } = useSharedTransactions(ledgerId);
  const { recipients } = useRecipients(ledgerId);
  const [activeTab, setActiveTab] = useState<'MASTER' | 'RECIPIENTS'>('MASTER');
  const [signingOut, setSigningOut] = useState(false);
  const [sortOrder, setSortOrder] = useState<MasterSortOrder>('DESC');
  const [recipientFilterId, setRecipientFilterId] =
    useState<string>(ALL_RECIPIENTS_FILTER);
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
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
      ? 'All recipients'
      : recipientNameById[recipientFilterId] || 'Selected recipient';

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

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Admin Ledger</Text>
          <Text style={styles.subtitle}>
            {session?.role === 'ADMIN' ? session.adminName : ''}
          </Text>
        </View>
        <View style={styles.headerActions}>
          {activeTab === 'MASTER' ? (
            <Button
              label="Get Statement"
              variant="secondary"
              onPress={() => navigation.navigate('GetStatement')}
              style={styles.headerActionButton}
            />
          ) : null}
          <Button
            label={signingOut ? 'Signing out...' : 'Sign Out'}
            variant="ghost"
            onPress={handleSignOut}
            disabled={signingOut}
          />
        </View>
      </View>

      <View style={styles.tabRow}>
        <Button
          label="Master Ledger"
          onPress={() => setActiveTab('MASTER')}
          variant={activeTab === 'MASTER' ? 'primary' : 'secondary'}
          style={styles.tabButton}
        />
        <Button
          label="Recipients"
          onPress={() => setActiveTab('RECIPIENTS')}
          variant={activeTab === 'RECIPIENTS' ? 'primary' : 'secondary'}
          style={[styles.tabButton, styles.tabButtonLast]}
        />
      </View>

      {activeTab === 'MASTER' ? (
        <>
          <Button
            label="Add Transaction"
            onPress={() => navigation.navigate('AddTransaction', {})}
            style={styles.primaryAction}
          />
          <View style={styles.filterRow}>
            <Menu
              visible={sortMenuVisible}
              onDismiss={() => setSortMenuVisible(false)}
              anchor={
                <Chip
                  mode="flat"
                  selected
                  onPress={() => setSortMenuVisible(true)}
                  style={styles.filterChip}
                >
                  {sortLabelByOrder[sortOrder]}
                </Chip>
              }
            >
              <Menu.Item
                onPress={() => {
                  setSortOrder('DESC');
                  setSortMenuVisible(false);
                }}
                title={sortLabelByOrder.DESC}
              />
              <Menu.Item
                onPress={() => {
                  setSortOrder('ASC');
                  setSortMenuVisible(false);
                }}
                title={sortLabelByOrder.ASC}
              />
            </Menu>

            <Menu
              visible={recipientMenuVisible}
              onDismiss={() => setRecipientMenuVisible(false)}
              anchor={
                <Chip
                  mode="flat"
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
                title="All recipients"
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
                <Menu.Item disabled onPress={() => {}} title="No recipients" />
              )}
            </Menu>
          </View>
          <FlatList
            data={filteredTransactions}
            keyExtractor={(item) => item.txnId}
            renderItem={({ item }) => <SharedTransactionItem item={item} />}
            ListEmptyComponent={
              <EmptyState
                title={
                  transactions.length === 0
                    ? 'No transactions yet'
                    : 'No matching transactions'
                }
                subtitle={
                  transactions.length === 0
                    ? 'Add the first recipient transaction.'
                    : 'Change recipient or sort filters to see transactions.'
                }
              />
            }
            contentContainerStyle={
              filteredTransactions.length === 0
                ? styles.emptyContainer
                : styles.listContainer
            }
          />
        </>
      ) : (
        <>
          <Button
            label="Add Recipient"
            onPress={() => navigation.navigate('AddRecipient')}
            style={styles.primaryAction}
          />
          <FlatList
            data={recipients}
            keyExtractor={(item) => item.recipientId}
            renderItem={({ item }) => (
              <RecipientCard
                name={item.recipientName}
                phoneNumber={item.phoneNumber}
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
              />
            )}
            ListEmptyComponent={
              <EmptyState
                title="No recipients"
                subtitle="Add the first recipient with name and phone number."
              />
            }
            contentContainerStyle={
              recipients.length === 0 ? styles.emptyContainer : styles.listContainer
            }
          />
        </>
      )}
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
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActionButton: {
    marginRight: spacing.sm,
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
  tabRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  tabButton: {
    flex: 1,
    marginRight: spacing.sm,
  },
  tabButtonLast: {
    marginRight: 0,
  },
  primaryAction: {
    marginBottom: spacing.md,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  filterChip: {
    marginRight: spacing.sm,
    backgroundColor: colors.accent,
  },
  listContainer: {
    paddingBottom: spacing.xl,
  },
  emptyContainer: {
    flexGrow: 1,
  },
});
