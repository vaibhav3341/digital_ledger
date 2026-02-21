import React from 'react';
import { SectionList, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import EmptyState from '../components/EmptyState';
import FeedbackState from '../components/FeedbackState';
import OverflowMenu from '../components/OverflowMenu';
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
import { summarizeTransactionsForPerspective } from '../utils/transactions';

interface MonthSection {
  title: string;
  data: ReturnType<typeof useRecipientTransactions>['transactions'];
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}`;
}

export default function CoworkerHomeScreen() {
  const { t, i18n } = useTranslation();
  const { session, signOut } = useSession();
  const recipientId =
    session?.role === 'COWORKER' ? session.recipientId : undefined;
  const recipientName =
    session?.role === 'COWORKER' ? session.recipientName : 'Recipient';
  const { transactions, loading } = useRecipientTransactions(recipientId);

  const summary = React.useMemo(
    () => summarizeTransactionsForPerspective(transactions, 'COWORKER'),
    [transactions],
  );

  const [signingOut, setSigningOut] = React.useState(false);
  const monthLocale = i18n.language === 'hi' ? 'hi-IN' : 'en-IN';

  const sections = React.useMemo<MonthSection[]>(() => {
    const groups: Record<string, MonthSection> = {};

    transactions.forEach((transaction) => {
      const date = transaction.txnAt?.toDate?.();
      if (!date) {
        return;
      }
      const key = monthKey(date);
      if (!groups[key]) {
        groups[key] = {
          title: date.toLocaleString(monthLocale, { month: 'long', year: 'numeric' }),
          data: [],
        };
      }
      groups[key].data.push(transaction);
    });

    return Object.keys(groups)
      .sort((left, right) => (left < right ? 1 : -1))
      .map((key) => groups[key]);
  }, [monthLocale, transactions]);

  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      await signOut();
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.contentWrap}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>{recipientName}</Text>
            <Text style={styles.subtitle}>{t('ledger.viewOnly')}</Text>
          </View>
          <OverflowMenu
            triggerLabel={t('common.account')}
            items={[
              {
                label: signingOut ? t('common.signingOut') : t('common.signOut'),
                onPress: handleSignOut,
                disabled: signingOut,
              },
            ]}
          />
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>{t('ledger.netBalance')}</Text>
          <Text style={styles.heroValue}>
            {formatSignedAmountFromCents(summary.netCents)}
          </Text>
          <View style={styles.heroRow}>
            <View style={styles.heroChip}>
              <Text style={styles.heroChipLabel}>{t('ledger.sent')}</Text>
              <Text style={styles.heroChipValue}>
                {formatAmountFromCents(summary.totalSentCents)}
              </Text>
            </View>
            <View style={styles.heroChip}>
              <Text style={styles.heroChipLabel}>{t('ledger.received')}</Text>
              <Text style={styles.heroChipValue}>
                {formatAmountFromCents(summary.totalReceivedCents)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.listWrap}>
          {loading ? (
            <FeedbackState
              variant="loading"
              title={t('ledger.loadingLedger')}
              subtitle={t('ledger.loadingLedgerHint')}
            />
          ) : (
            <SectionList
              sections={sections}
              keyExtractor={(item) => item.txnId}
              renderSectionHeader={({ section }) => (
                <Text style={styles.sectionHeader}>{section.title}</Text>
              )}
              renderItem={({ item }) => (
                <RecipientTransactionItem item={item} perspective="COWORKER" />
              )}
              stickySectionHeadersEnabled={false}
              ListEmptyComponent={
                <EmptyState
                  title={t('ledger.noTransactions')}
                  subtitle={t('ledger.ledgerEmpty')}
                />
              }
              contentContainerStyle={
                sections.length === 0 ? styles.emptyContainer : styles.listContainer
              }
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>
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
  heroCard: {
    marginTop: spacing.md,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  heroLabel: {
    ...typography.caption,
    color: colors.muted,
  },
  heroValue: {
    ...typography.heading,
    color: colors.text,
    marginTop: spacing.xs,
  },
  heroRow: {
    flexDirection: 'row',
    marginTop: spacing.sm,
  },
  heroChip: {
    flex: 1,
    backgroundColor: colors.chip,
    borderRadius: 10,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    marginRight: spacing.sm,
  },
  heroChipLabel: {
    ...typography.caption,
    color: colors.muted,
  },
  heroChipValue: {
    ...typography.bodyStrong,
    color: colors.text,
    marginTop: spacing.xxs,
  },
  listWrap: {
    flex: 1,
    marginTop: spacing.md,
  },
  sectionHeader: {
    ...typography.caption,
    color: colors.muted,
    marginBottom: spacing.xs,
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
