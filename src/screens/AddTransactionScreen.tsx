import React, {useMemo, useState} from 'react';
import {
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Card,
  Divider,
  List,
  Modal,
  Portal,
  Searchbar,
  TextInput as PaperTextInput,
} from 'react-native-paper';
import Button from '../components/Button';
import Input from '../components/Input';
import useRecipients from '../hooks/useRecipients';
import useSession from '../hooks/useSession';
import {TransactionDirection} from '../models/types';
import {RootStackParamList} from '../navigation/RootNavigator';
import {createTransactionEntry} from '../services/firestore';
import {colors} from '../theme/colors';
import {spacing} from '../theme/spacing';
import {typography} from '../theme/typography';
import {formatDateDDMMYYYY, parseDateDDMMYYYY} from '../utils/format';

function todayDateString() {
  return formatDateDDMMYYYY(new Date());
}

function RecipientSeparator() {
  return <Divider />;
}

function formatTwoDigits(value: string) {
  return value.padStart(2, '0');
}

function digitsOnly(value: string, maxLength: number) {
  return value.replace(/\D/g, '').slice(0, maxLength);
}

export default function AddTransactionScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'AddTransaction'>>();
  const {session} = useSession();
  const ledgerId = session?.role === 'ADMIN' ? session.ledgerId : undefined;
  const {recipients, loading: recipientsLoading} = useRecipients(ledgerId);

  const [selectedRecipientId, setSelectedRecipientId] = useState(
    route.params?.recipientId || '',
  );
  const [recipientPickerVisible, setRecipientPickerVisible] = useState(false);
  const [recipientSearch, setRecipientSearch] = useState('');
  const [direction, setDirection] = useState<TransactionDirection>(
    route.params?.initialDirection || 'SENT',
  );
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [txnDate, setTxnDate] = useState(todayDateString());
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [draftDay, setDraftDay] = useState(
    String(new Date().getDate()).padStart(2, '0'),
  );
  const [draftMonth, setDraftMonth] = useState(
    String(new Date().getMonth() + 1).padStart(2, '0'),
  );
  const [draftYear, setDraftYear] = useState(String(new Date().getFullYear()));
  const [loading, setLoading] = useState(false);

  const selectedRecipient = useMemo(
    () =>
      recipients.find(
        recipient => recipient.recipientId === selectedRecipientId,
      ),
    [recipients, selectedRecipientId],
  );
  const filteredRecipients = useMemo(() => {
    const query = recipientSearch.trim().toLowerCase();
    if (!query) {
      return recipients;
    }
    return recipients.filter(recipient => {
      return (
        recipient.recipientName.toLowerCase().includes(query) ||
        recipient.phoneNumber.toLowerCase().includes(query)
      );
    });
  }, [recipientSearch, recipients]);

  const openRecipientPicker = () => {
    setRecipientPickerVisible(true);
  };

  const closeRecipientPicker = () => {
    setRecipientPickerVisible(false);
    setRecipientSearch('');
  };

  const handleSelectRecipient = (recipientId: string) => {
    setSelectedRecipientId(recipientId);
    closeRecipientPicker();
  };

  const openDatePicker = () => {
    const parsed = parseDateDDMMYYYY(txnDate.trim()) || new Date();
    setDraftDay(String(parsed.getDate()).padStart(2, '0'));
    setDraftMonth(String(parsed.getMonth() + 1).padStart(2, '0'));
    setDraftYear(String(parsed.getFullYear()));
    setDatePickerVisible(true);
  };

  const closeDatePicker = () => {
    setDatePickerVisible(false);
  };

  const handleSetToday = () => {
    const today = new Date();
    setTxnDate(formatDateDDMMYYYY(today));
    setDraftDay(String(today.getDate()).padStart(2, '0'));
    setDraftMonth(String(today.getMonth() + 1).padStart(2, '0'));
    setDraftYear(String(today.getFullYear()));
    closeDatePicker();
  };

  const handleApplyDate = () => {
    const dateValue = `${formatTwoDigits(draftDay)}/${formatTwoDigits(
      draftMonth,
    )}/${draftYear}`;
    const parsedDate = parseDateDDMMYYYY(dateValue);
    if (!parsedDate) {
      Alert.alert('Select a valid date');
      return;
    }

    setTxnDate(formatDateDDMMYYYY(parsedDate));
    closeDatePicker();
  };

  const handleSave = async () => {
    if (!ledgerId || session?.role !== 'ADMIN') {
      return;
    }
    if (!selectedRecipientId) {
      Alert.alert('Select recipient');
      return;
    }
    if (!selectedRecipient) {
      Alert.alert('Select a valid recipient');
      return;
    }

    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      Alert.alert('Enter a valid amount');
      return;
    }

    const parsedDate = parseDateDDMMYYYY(txnDate.trim());
    if (!parsedDate) {
      Alert.alert('Enter date in DD/MM/YYYY format');
      return;
    }

    try {
      setLoading(true);
      await createTransactionEntry({
        ledgerId,
        recipientId: selectedRecipientId,
        direction,
        amountCents: Math.round(parsedAmount * 100),
        note: note.trim() || undefined,
        txnAt: parsedDate,
        createdByUid: session.uid,
        recipientNameSnapshot: selectedRecipient.recipientName,
      });
      navigation.goBack();
    } catch (error) {
      const firestoreError = error as {code?: string; message?: string};
      if (firestoreError?.code === 'firestore/permission-denied') {
        Alert.alert(
          'Failed to save transaction',
          'Firestore denied this write. Deploy latest `firestore.rules` to the exact Firebase project used by this app, then retry.',
        );
        return;
      }
      Alert.alert(
        'Failed to save transaction',
        firestoreError?.message || String(error),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Add Transaction</Text>

        <Card mode="contained" style={styles.sectionCard}>
          <View style={styles.sectionBody}>
            <Text style={styles.label}>Recipient</Text>
            <Button
              label={selectedRecipient?.recipientName || 'Select recipient'}
              variant="secondary"
              onPress={openRecipientPicker}
              style={styles.recipientSelectorButton}
            />
            {selectedRecipient?.phoneNumber ? (
              <Text style={styles.selectedRecipientMeta}>
                {selectedRecipient.phoneNumber}
              </Text>
            ) : null}
            {recipients.length === 0 ? (
              <Text style={styles.emptyHint}>
                Create at least one recipient before adding transactions.
              </Text>
            ) : null}
          </View>
        </Card>

        <View style={styles.directionRow}>
          <Button
            label="Sent"
            onPress={() => setDirection('SENT')}
            variant={direction === 'SENT' ? 'primary' : 'secondary'}
            style={styles.directionButton}
          />
          <Button
            label="Received"
            onPress={() => setDirection('RECEIVED')}
            variant={direction === 'RECEIVED' ? 'primary' : 'secondary'}
            style={styles.directionButton}
          />
        </View>

        <Input
          label="Amount"
          value={amount}
          placeholder="0.00"
          onChangeText={setAmount}
          keyboardType="numeric"
        />
        <Input
          label="Transaction Date"
          value={txnDate}
          placeholder="DD/MM/YYYY"
          onChangeText={setTxnDate}
        />
        <Button
          label="Pick Date"
          variant="secondary"
          onPress={openDatePicker}
          style={styles.pickDateButton}
        />
        <Input
          label="Note (optional)"
          value={note}
          placeholder="Description"
          onChangeText={setNote}
        />

        <Button
          label={loading ? 'Saving...' : 'Save'}
          onPress={handleSave}
          disabled={loading}
        />
      </ScrollView>

      <Portal>
        <Modal
          visible={recipientPickerVisible}
          onDismiss={closeRecipientPicker}
          contentContainerStyle={styles.modalContainer}>
          <Text style={styles.modalTitle}>Select recipient</Text>
          <Searchbar
            placeholder="Search by name or phone"
            value={recipientSearch}
            onChangeText={setRecipientSearch}
            style={styles.searchbar}
            inputStyle={styles.searchbarInput}
          />

          {recipientsLoading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator animating color={colors.primary} />
            </View>
          ) : (
            <FlatList
              data={filteredRecipients}
              keyExtractor={item => item.recipientId}
              keyboardShouldPersistTaps="handled"
              style={styles.modalList}
              renderItem={({item}) => (
                <List.Item
                  title={
                    selectedRecipientId === item.recipientId
                      ? `${item.recipientName}  ✓`
                      : item.recipientName
                  }
                  description={item.phoneNumber}
                  titleStyle={styles.modalItemTitle}
                  descriptionStyle={styles.modalItemDescription}
                  onPress={() => handleSelectRecipient(item.recipientId)}
                />
              )}
              ItemSeparatorComponent={RecipientSeparator}
              ListEmptyComponent={
                <Text style={styles.emptySearchText}>No recipients found.</Text>
              }
            />
          )}

          <View style={styles.modalActions}>
            <Button
              label="Close"
              variant="ghost"
              onPress={closeRecipientPicker}
            />
          </View>
        </Modal>
      </Portal>

      <Portal>
        <Modal
          visible={datePickerVisible}
          onDismiss={closeDatePicker}
          contentContainerStyle={styles.dateModalContainer}>
          <Text style={styles.modalTitle}>Select date</Text>
          <View style={styles.dateFieldsRow}>
            <PaperTextInput
              mode="outlined"
              label="DD"
              value={draftDay}
              onChangeText={text => setDraftDay(digitsOnly(text, 2))}
              keyboardType="number-pad"
              maxLength={2}
              style={[styles.dateFieldInput, styles.dateFieldSmall]}
              outlineStyle={styles.dateFieldOutline}
            />
            <PaperTextInput
              mode="outlined"
              label="MM"
              value={draftMonth}
              onChangeText={text => setDraftMonth(digitsOnly(text, 2))}
              keyboardType="number-pad"
              maxLength={2}
              style={[styles.dateFieldInput, styles.dateFieldSmall]}
              outlineStyle={styles.dateFieldOutline}
            />
            <PaperTextInput
              mode="outlined"
              label="YYYY"
              value={draftYear}
              onChangeText={text => setDraftYear(digitsOnly(text, 4))}
              keyboardType="number-pad"
              maxLength={4}
              style={[styles.dateFieldInput, styles.dateFieldLarge]}
              outlineStyle={styles.dateFieldOutline}
            />
          </View>

          <View style={styles.dateModalActions}>
            <Button label="Cancel" variant="ghost" onPress={closeDatePicker} />
            <Button
              label="Today"
              variant="secondary"
              onPress={handleSetToday}
            />
            <Button label="Apply" onPress={handleApplyDate} />
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  title: {
    ...typography.title,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  sectionCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    marginBottom: spacing.md,
  },
  sectionBody: {
    padding: spacing.lg,
  },
  recipientSelectorButton: {
    marginBottom: spacing.xs,
  },
  selectedRecipientMeta: {
    fontSize: 12,
    color: colors.muted,
    marginBottom: spacing.xs,
  },
  emptyHint: {
    fontSize: 13,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  directionRow: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  directionButton: {
    flex: 1,
    marginRight: spacing.sm,
  },
  pickDateButton: {
    marginTop: -spacing.xs,
    marginBottom: spacing.md,
  },
  modalContainer: {
    margin: spacing.lg,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    maxHeight: '78%',
  },
  modalTitle: {
    ...typography.subtitle,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  searchbar: {
    backgroundColor: colors.background,
    marginBottom: spacing.sm,
  },
  searchbarInput: {
    color: colors.text,
  },
  modalList: {
    maxHeight: 340,
  },
  modalItemTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  modalItemDescription: {
    color: colors.muted,
    fontSize: 12,
  },
  emptySearchText: {
    color: colors.muted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  loaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  modalActions: {
    marginTop: spacing.sm,
    alignItems: 'flex-end',
  },
  dateModalContainer: {
    margin: spacing.lg,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  dateFieldsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  dateFieldInput: {
    backgroundColor: colors.card,
    marginRight: spacing.sm,
  },
  dateFieldSmall: {
    flex: 1,
  },
  dateFieldLarge: {
    flex: 1.4,
    marginRight: 0,
  },
  dateFieldOutline: {
    borderRadius: 10,
  },
  dateModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
