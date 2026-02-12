import React, { useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import Input from '../components/Input';
import RecipientCard from '../components/RecipientCard';
import SharedTransactionItem from '../components/SharedTransactionItem';
import useRecipients from '../hooks/useRecipients';
import useSession from '../hooks/useSession';
import useSharedTransactions from '../hooks/useSharedTransactions';
import { RootStackParamList } from '../navigation/RootNavigator';
import { createRecipientWithAccessCode } from '../services/firestore';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { summarizeByRecipient } from '../utils/transactions';

export default function AdminHomeScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { session, clearSession } = useSession();
  const ledgerId = session?.role === 'ADMIN' ? session.ledgerId : undefined;
  const { transactions } = useSharedTransactions(ledgerId);
  const { recipients } = useRecipients(ledgerId);
  const [activeTab, setActiveTab] = useState<'MASTER' | 'RECIPIENTS'>('MASTER');
  const [recipientName, setRecipientName] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const summaryByRecipient = useMemo(
    () => summarizeByRecipient(transactions),
    [transactions],
  );

  const handleGenerate = async () => {
    if (!ledgerId) {
      return;
    }
    if (!recipientName.trim()) {
      Alert.alert('Enter recipient name');
      return;
    }

    try {
      setLoading(true);
      const result = await createRecipientWithAccessCode({
        ledgerId,
        recipientName: recipientName.trim(),
      });
      setGeneratedCode(result.code);
      setRecipientName('');
    } catch (error) {
      Alert.alert('Failed to generate access code', String(error));
    } finally {
      setLoading(false);
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
        <Button label="Reset" variant="ghost" onPress={clearSession} />
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
          <Input
            label="Recipient Name"
            value={recipientName}
            placeholder="Enter name"
            onChangeText={setRecipientName}
          />
          <Button
            label={loading ? 'Generating...' : 'Generate Access Code'}
            onPress={handleGenerate}
            disabled={loading}
            style={styles.primaryAction}
          />
          {generatedCode ? (
            <View style={styles.codeBox}>
              <Text style={styles.codeLabel}>Latest Access Code</Text>
              <Text style={styles.codeValue} selectable>
                {generatedCode}
              </Text>
              <Text style={styles.codeHint}>Long press code to copy.</Text>
            </View>
          ) : null}
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
              />
            )}
            ListEmptyComponent={
              <EmptyState
                title="No recipients"
                subtitle="Generate an access code to create a recipient."
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
  codeBox: {
    marginBottom: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderColor: colors.border,
    borderWidth: 1,
  },
  codeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
  },
  codeValue: {
    marginTop: spacing.sm,
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  codeHint: {
    marginTop: spacing.xs,
    fontSize: 12,
    color: colors.muted,
  },
  listContainer: {
    paddingBottom: spacing.xl,
  },
  emptyContainer: {
    flexGrow: 1,
  },
});
