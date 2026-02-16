import React, { useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import RecipientCard from '../components/RecipientCard';
import SharedTransactionItem from '../components/SharedTransactionItem';
import useRecipients from '../hooks/useRecipients';
import useSession from '../hooks/useSession';
import useSharedTransactions from '../hooks/useSharedTransactions';
import { RootStackParamList } from '../navigation/RootNavigator';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { summarizeByRecipient } from '../utils/transactions';

export default function AdminHomeScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { session, signOut } = useSession();
  const ledgerId = session?.role === 'ADMIN' ? session.ledgerId : undefined;
  const { transactions } = useSharedTransactions(ledgerId);
  const { recipients } = useRecipients(ledgerId);
  const [activeTab, setActiveTab] = useState<'MASTER' | 'RECIPIENTS'>('MASTER');
  const [signingOut, setSigningOut] = useState(false);

  const summaryByRecipient = useMemo(
    () => summarizeByRecipient(transactions),
    [transactions],
  );

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
        <Button
          label={signingOut ? 'Signing out...' : 'Sign Out'}
          variant="ghost"
          onPress={handleSignOut}
          disabled={signingOut}
        />
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
          style={styles.tabButton}
        />
      </View>

      {activeTab === 'MASTER' ? (
        <>
          <Button
            label="Add Transaction"
            onPress={() => navigation.navigate('AddTransaction', {})}
            style={styles.primaryAction}
          />
          <FlatList
            data={transactions}
            keyExtractor={(item) => item.txnId}
            renderItem={({ item }) => <SharedTransactionItem item={item} />}
            ListEmptyComponent={
              <EmptyState
                title="No transactions yet"
                subtitle="Add the first recipient transaction."
              />
            }
            contentContainerStyle={
              transactions.length === 0 ? styles.emptyContainer : styles.listContainer
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
  tabRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  tabButton: {
    flex: 1,
    marginRight: spacing.sm,
  },
  primaryAction: {
    marginBottom: spacing.md,
  },
  listContainer: {
    paddingBottom: spacing.xl,
  },
  emptyContainer: {
    flexGrow: 1,
  },
});
