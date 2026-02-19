import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Menu } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import FeedbackState from '../components/FeedbackState';
import FilterMenuButton from '../components/FilterMenuButton';
import OverflowMenu from '../components/OverflowMenu';
import RecipientCard from '../components/RecipientCard';
import SegmentedControl, {
  SegmentedControlOption,
} from '../components/SegmentedControl';
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
  const { t } = useTranslation();
  const { session, signOut } = useSession();
  const ledgerId = session?.role === 'ADMIN' ? session.ledgerId : undefined;
  const { transactions, loading: transactionsLoading } =
    useSharedTransactions(ledgerId);
  const { recipients, loading: recipientsLoading } = useRecipients(ledgerId);

  const [activeTab, setActiveTab] = useState<TabKey>('LEDGER');
  const [signingOut, setSigningOut] = useState(false);
  const [deletingTransactionId, setDeletingTransactionId] = useState<
    string | null
  >(null);
  const [deletingRecipientId, setDeletingRecipientId] = useState<string | null>(
    null,
  );
  const [sortOrder, setSortOrder] = useState<MasterSortOrder>('DESC');
  const [recipientFilterId, setRecipientFilterId] =
    useState<string>(ALL_RECIPIENTS_FILTER);
  const [recipientMenuVisible, setRecipientMenuVisible] = useState(false);

  const summaryByRecipient = useMemo(
    () => summarizeByRecipient(transactions),
    [transactions],
  );
  const viewOptions = useMemo<SegmentedControlOption<TabKey>[]>(
    () => [
      { value: 'LEDGER', label: t('admin.view.ledger') },
      { value: 'PEOPLE', label: t('admin.view.people') },
    ],
    [t],
  );
  const sortOptions = useMemo<SegmentedControlOption<MasterSortOrder>[]>(
    () => [
      { value: 'DESC', label: t('admin.sortBy.newestFirst') },
      { value: 'ASC', label: t('admin.sortBy.oldestFirst') },
    ],
    [t],
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
      ? t('admin.filterByRecipient')
      : recipientNameById[recipientFilterId] || t('common.selectedRecipient');

  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      await signOut();
    } catch (error) {
      Alert.alert(t('common.signOut'), String(error));
    } finally {
      setSigningOut(false);
    }
  };

  const handleDeleteTransaction = (txnId: string, recipientName: string) => {
    Alert.alert(
      t('admin.deleteTransaction'),
      t('admin.deleteTransactionConfirm', { name: recipientName }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                setDeletingTransactionId(txnId);
                await deleteTransactionEntry({ txnId });
              } catch (error) {
                Alert.alert(t('admin.failedToDelete'), String(error));
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
      t('admin.deleteRecipient'),
      t('admin.deleteRecipientConfirm', { name: recipientName }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                setDeletingRecipientId(recipientId);
                await deleteRecipientEntry({ recipientId });
              } catch (error) {
                Alert.alert(t('admin.failedToDeleteRecipient'), String(error));
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
            <Text style={styles.title}>{t('admin.title')}</Text>
            <Text style={styles.subtitle}>
              {session?.role === 'ADMIN' ? session.adminName : ''}
            </Text>
          </View>
          <OverflowMenu
            triggerLabel={t('admin.actions')}
            items={[
              {
                label: t('admin.getStatement'),
                onPress: () => navigation.navigate('GetStatement'),
              },
              {
                label: signingOut ? t('common.signingOut') : t('common.signOut'),
                onPress: handleSignOut,
                disabled: signingOut,
              },
            ]}
          />
        </View>

        <View style={styles.summaryStrip}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>{t('admin.view.people')}</Text>
            <Text style={styles.summaryValue}>{recipients.length}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>{t('admin.entries')}</Text>
            <Text style={styles.summaryValue}>{transactions.length}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>{t('common.net')}</Text>
            <Text style={styles.summaryValue}>
              {formatSignedAmountFromCents(ledgerSummary.netCents)}
            </Text>
          </View>
        </View>

        <View style={styles.controlGroup}>
          <Text style={styles.controlLabel}>{t('admin.view.label')}</Text>
          <SegmentedControl
            value={activeTab}
            options={viewOptions}
            onChange={setActiveTab}
            equalWidth
          />
        </View>

        {activeTab === 'LEDGER' ? (
          <>
            <View style={styles.controlGroup}>
              <Text style={styles.controlLabel}>{t('admin.sortByDate')}</Text>
              <SegmentedControl
                value={sortOrder}
                options={sortOptions}
                onChange={setSortOrder}
                equalWidth
              />
            </View>

            <View style={styles.controlGroup}>
              <Text style={styles.controlLabel}>{t('admin.filterPeople')}</Text>
              <View style={styles.filterActionsRow}>
                <View style={styles.filterMenuWrap}>
                  <Menu
                    visible={recipientMenuVisible}
                    onDismiss={() => setRecipientMenuVisible(false)}
                    anchor={
                      <FilterMenuButton
                        label={t('admin.view.people')}
                        value={recipientFilterLabel}
                        onPress={() => setRecipientMenuVisible(true)}
                      />
                    }
                  >
                    <Menu.Item
                      onPress={() => {
                        setRecipientFilterId(ALL_RECIPIENTS_FILTER);
                        setRecipientMenuVisible(false);
                      }}
                      title={t('admin.filterByRecipient')}
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
                      <Menu.Item
                        disabled
                        onPress={() => {}}
                        title={t('admin.noRecipients')}
                      />
                    )}
                  </Menu>
                </View>
                <Button
                  label={t('common.all')}
                  variant="secondary"
                  size="compact"
                  onPress={() => setRecipientFilterId(ALL_RECIPIENTS_FILTER)}
                  disabled={recipientFilterId === ALL_RECIPIENTS_FILTER}
                  style={styles.allFilterButton}
                />
              </View>
            </View>
          </>
        ) : null}

        <View style={styles.listWrap}>
          {activeTab === 'LEDGER' ? (
            transactionsLoading ? (
              <FeedbackState
                variant="loading"
                title={t('admin.loadingLedgerEntries')}
                subtitle={t('admin.loadingLedgerEntriesHint')}
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
                      title={t('admin.noTransactions')}
                      subtitle={t('admin.addFirstTransaction')}
                      actionLabel={t('admin.addTransaction')}
                      onActionPress={() => navigation.navigate('AddTransaction', {})}
                    />
                  ) : (
                    <EmptyState
                      title={t('admin.noMatchingTransactions')}
                      subtitle={t('admin.changeFilters')}
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
              title={t('admin.loadingRecipients')}
              subtitle={t('admin.loadingRecipientsHint')}
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
                  title={t('admin.noRecipients')}
                  subtitle={t('admin.addFirstRecipient')}
                  actionLabel={t('recipient.addButton')}
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
            label:
              activeTab === 'LEDGER'
                ? t('admin.addTransaction')
                : t('recipient.addButton'),
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
  controlGroup: {
    marginTop: spacing.md,
  },
  controlLabel: {
    ...typography.caption,
    color: colors.muted,
    marginBottom: spacing.xs,
  },
  filterActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterMenuWrap: {
    flex: 1,
    marginRight: spacing.sm,
  },
  allFilterButton: {
    minWidth: 84,
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
