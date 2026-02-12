import React, { useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import Input from '../components/Input';
import RecipientCard from '../components/RecipientCard';
import useRecipients from '../hooks/useRecipients';
import useSharedTransactions from '../hooks/useSharedTransactions';
import useSession from '../hooks/useSession';
import { RootStackParamList } from '../navigation/RootNavigator';
import { createRecipientWithAccessCode } from '../services/firestore';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { summarizeByRecipient } from '../utils/transactions';

export default function RecipientsListScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { session } = useSession();
  const ledgerId = session?.role === 'ADMIN' ? session.ledgerId : undefined;
  const { recipients } = useRecipients(ledgerId);
  const { transactions } = useSharedTransactions(ledgerId);
  const [recipientName, setRecipientName] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const summaryByRecipient = summarizeByRecipient(transactions);

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
      <Text style={styles.title}>Recipients</Text>
      <Text style={styles.subtitle}>
        Create recipient slots and generate one access code per recipient.
      </Text>

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
      />

      {generatedCode ? (
        <View style={styles.codeBox}>
          <Text style={styles.codeLabel}>Latest Access Code</Text>
          <Text style={styles.codeValue} selectable>
            {generatedCode}
          </Text>
          <Text style={styles.codeHint}>Long press the code to copy it.</Text>
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
            subtitle="Generate an access code to create the first recipient."
          />
        }
        contentContainerStyle={
          recipients.length === 0 ? styles.emptyContainer : styles.listContainer
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
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.muted,
    marginBottom: spacing.md,
  },
  codeBox: {
    marginTop: spacing.md,
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
    marginTop: spacing.sm,
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
