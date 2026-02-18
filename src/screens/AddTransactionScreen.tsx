import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Card,
  Divider,
  List,
  Modal,
  Portal,
  Searchbar,
} from 'react-native-paper';
import Button from '../components/Button';
import Input from '../components/Input';
import useRecipients from '../hooks/useRecipients';
import useSession from '../hooks/useSession';
import { TransactionDirection } from '../models/types';
import { RootStackParamList } from '../navigation/RootNavigator';
import { createTransactionEntry } from '../services/firestore';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { formatDateDDMMYYYY } from '../utils/format';

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toNoonDate(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    12,
    0,
    0,
    0,
  );
}

function todayDate() {
  return toNoonDate(new Date());
}

function firstOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12, 0, 0, 0);
}

function isSameDay(left: Date, right: Date) {
  return (
    left.getDate() === right.getDate() &&
    left.getMonth() === right.getMonth() &&
    left.getFullYear() === right.getFullYear()
  );
}

function buildCalendarDays(monthDate: Date) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1, 12, 0, 0, 0);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingGap = firstDay.getDay();
  const cells: Array<Date | null> = [];

  for (let index = 0; index < leadingGap; index += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day, 12, 0, 0, 0));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

function RecipientSeparator() {
  return <Divider />;
}

export default function AddTransactionScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'AddTransaction'>>();
  const { session } = useSession();
  const ledgerId = session?.role === 'ADMIN' ? session.ledgerId : undefined;
  const { recipients, loading: recipientsLoading } = useRecipients(ledgerId);

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
  const [txnDate, setTxnDate] = useState<Date>(todayDate);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [calendarMonthCursor, setCalendarMonthCursor] = useState<Date>(
    firstOfMonth(todayDate()),
  );
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
  const yearOptions = useMemo(() => {
    const firstYear = 1980;
    const lastYear = new Date().getFullYear() + 20;
    return Array.from(
      { length: lastYear - firstYear + 1 },
      (_, index) => firstYear + index,
    );
  }, []);
  const calendarDays = useMemo(
    () => buildCalendarDays(calendarMonthCursor),
    [calendarMonthCursor],
  );

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
    setCalendarMonthCursor(firstOfMonth(txnDate));
    setDatePickerVisible(true);
  };

  const closeDatePicker = () => {
    setDatePickerVisible(false);
  };

  const handleSetToday = () => {
    const today = todayDate();
    setTxnDate(today);
    setCalendarMonthCursor(firstOfMonth(today));
    closeDatePicker();
  };

  const updateCalendarMonth = (month: number) => {
    setCalendarMonthCursor(current => {
      const next = new Date(current);
      next.setMonth(month, 1);
      return firstOfMonth(next);
    });
  };

  const updateCalendarYear = (year: number) => {
    setCalendarMonthCursor(current =>
      firstOfMonth(new Date(year, current.getMonth(), 1)),
    );
  };

  const stepCalendarMonth = (step: number) => {
    setCalendarMonthCursor(current =>
      firstOfMonth(new Date(current.getFullYear(), current.getMonth() + step, 1)),
    );
  };

  const pickDate = (date: Date) => {
    const selected = toNoonDate(date);
    setTxnDate(selected);
    setCalendarMonthCursor(firstOfMonth(selected));
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

    try {
      setLoading(true);
      await createTransactionEntry({
        ledgerId,
        recipientId: selectedRecipientId,
        direction,
        amountCents: Math.round(parsedAmount * 100),
        note: note.trim() || undefined,
        txnAt: txnDate,
        createdByUid: session.uid,
        recipientNameSnapshot: selectedRecipient.recipientName,
      });
      navigation.goBack();
    } catch (error) {
      const firestoreError = error as { code?: string; message?: string };
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

        <View style={styles.dateFieldContainer}>
          <Text style={styles.label}>Transaction Date</Text>
          <Pressable
            onPress={openDatePicker}
            style={({ pressed }) => [
              styles.dateField,
              pressed ? styles.dateFieldPressed : null,
            ]}>
            <Text style={styles.dateValue}>{formatDateDDMMYYYY(txnDate)}</Text>
            <Text style={styles.dateHint}>Tap to pick from calendar</Text>
          </Pressable>
        </View>

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
              renderItem={({ item }) => (
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
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>Select date</Text>

            <View style={styles.monthHeader}>
              <Pressable
                onPress={() => stepCalendarMonth(-1)}
                style={({ pressed }) => [
                  styles.monthArrow,
                  pressed ? styles.monthArrowPressed : null,
                ]}>
                <Text style={styles.monthArrowText}>{'<'}</Text>
              </Pressable>
              <Text style={styles.monthHeaderText}>
                {monthNames[calendarMonthCursor.getMonth()]}{' '}
                {calendarMonthCursor.getFullYear()}
              </Text>
              <Pressable
                onPress={() => stepCalendarMonth(1)}
                style={({ pressed }) => [
                  styles.monthArrow,
                  pressed ? styles.monthArrowPressed : null,
                ]}>
                <Text style={styles.monthArrowText}>{'>'}</Text>
              </Pressable>
            </View>

            <Text style={styles.pickerLabel}>Month</Text>
            <FlatList
              horizontal
              data={monthNames}
              keyExtractor={item => item}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pickerList}
              renderItem={({ item, index }) => (
                <Pressable
                  onPress={() => updateCalendarMonth(index)}
                  style={({ pressed }) => [
                    styles.pickerChip,
                    calendarMonthCursor.getMonth() === index
                      ? styles.pickerChipActive
                      : null,
                    pressed ? styles.pickerChipPressed : null,
                  ]}>
                  <Text
                    style={[
                      styles.pickerChipText,
                      calendarMonthCursor.getMonth() === index
                        ? styles.pickerChipTextActive
                        : null,
                    ]}>
                    {item.slice(0, 3)}
                  </Text>
                </Pressable>
              )}
            />

            <Text style={styles.pickerLabel}>Year</Text>
            <FlatList
              horizontal
              data={yearOptions}
              keyExtractor={item => String(item)}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pickerList}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => updateCalendarYear(item)}
                  style={({ pressed }) => [
                    styles.pickerChip,
                    calendarMonthCursor.getFullYear() === item
                      ? styles.pickerChipActive
                      : null,
                    pressed ? styles.pickerChipPressed : null,
                  ]}>
                  <Text
                    style={[
                      styles.pickerChipText,
                      calendarMonthCursor.getFullYear() === item
                        ? styles.pickerChipTextActive
                        : null,
                    ]}>
                    {item}
                  </Text>
                </Pressable>
              )}
            />

            <View style={styles.weekdayRow}>
              {weekdays.map(day => (
                <View key={day} style={styles.weekdayCell}>
                  <Text style={styles.weekdayText}>{day}</Text>
                </View>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {calendarDays.map((dateCell, index) => {
                if (!dateCell) {
                  return <View key={`empty-${index}`} style={styles.dayCellWrap} />;
                }

                const isActive = isSameDay(dateCell, txnDate);
                const key = `day-${dateCell.getFullYear()}-${dateCell.getMonth()}-${dateCell.getDate()}`;
                return (
                  <View key={key} style={styles.dayCellWrap}>
                    <Pressable
                      onPress={() => pickDate(dateCell)}
                      style={({ pressed }) => [
                        styles.dayCell,
                        isActive ? styles.dayCellActive : null,
                        pressed ? styles.dayCellPressed : null,
                      ]}>
                      <Text
                        style={[
                          styles.dayCellText,
                          isActive ? styles.dayCellTextActive : null,
                        ]}>
                        {dateCell.getDate()}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>

            <View style={styles.dateModalActions}>
              <Button label="Close" variant="ghost" onPress={closeDatePicker} />
              <Button label="Today" variant="secondary" onPress={handleSetToday} />
            </View>
          </ScrollView>
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
  dateFieldContainer: {
    marginBottom: spacing.md,
  },
  dateField: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  dateFieldPressed: {
    backgroundColor: colors.accent,
  },
  dateValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  dateHint: {
    marginTop: spacing.xs,
    fontSize: 12,
    color: colors.muted,
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
    maxHeight: '85%',
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  monthHeaderText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  monthArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  monthArrowPressed: {
    backgroundColor: colors.accent,
  },
  monthArrowText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  pickerList: {
    paddingBottom: spacing.sm,
  },
  pickerChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    backgroundColor: colors.card,
  },
  pickerChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pickerChipPressed: {
    opacity: 0.85,
  },
  pickerChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  pickerChipTextActive: {
    color: '#FFFFFF',
  },
  weekdayRow: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  weekdayCell: {
    width: '14.285%',
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.muted,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.lg,
  },
  dayCellWrap: {
    width: '14.285%',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  dayCell: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellActive: {
    backgroundColor: colors.primary,
  },
  dayCellPressed: {
    opacity: 0.8,
  },
  dayCellText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  dayCellTextActive: {
    color: '#FFFFFF',
  },
  dateModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
