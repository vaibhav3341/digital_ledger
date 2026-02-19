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
import { Modal, Portal, Searchbar } from 'react-native-paper';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import FeedbackState from '../components/FeedbackState';
import Input from '../components/Input';
import StickyActionBar from '../components/StickyActionBar';
import useRecipients from '../hooks/useRecipients';
import useSession from '../hooks/useSession';
import { TransactionDirection } from '../models/types';
import { RootStackParamList } from '../navigation/RootNavigator';
import { createTransactionEntry } from '../services/firestore';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { formatAmountFromCents, formatDateDDMMYYYY } from '../utils/format';

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
  const [showNote, setShowNote] = useState(false);
  const [txnDate, setTxnDate] = useState<Date>(todayDate);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [calendarMonthCursor, setCalendarMonthCursor] = useState<Date>(
    firstOfMonth(todayDate()),
  );
  const [loading, setLoading] = useState(false);

  const selectedRecipient = useMemo(
    () =>
      recipients.find((recipient) => recipient.recipientId === selectedRecipientId),
    [recipients, selectedRecipientId],
  );

  const filteredRecipients = useMemo(() => {
    const query = recipientSearch.trim().toLowerCase();
    if (!query) {
      return recipients;
    }
    return recipients.filter((recipient) => {
      return (
        recipient.recipientName.toLowerCase().includes(query) ||
        recipient.phoneNumber.toLowerCase().includes(query)
      );
    });
  }, [recipientSearch, recipients]);

  const calendarDays = useMemo(
    () => buildCalendarDays(calendarMonthCursor),
    [calendarMonthCursor],
  );

  const parsedAmount = Number(amount);
  const amountCents = parsedAmount > 0 ? Math.round(parsedAmount * 100) : 0;
  const canSave = Boolean(selectedRecipientId) && amountCents > 0 && !loading;

  const handleSave = async () => {
    if (!ledgerId || session?.role !== 'ADMIN') {
      Alert.alert('Admin session required');
      return;
    }
    if (!selectedRecipientId || !selectedRecipient) {
      Alert.alert('Select recipient');
      return;
    }
    if (!amountCents) {
      Alert.alert('Enter valid amount');
      return;
    }

    try {
      setLoading(true);
      await createTransactionEntry({
        ledgerId,
        recipientId: selectedRecipientId,
        direction,
        amountCents,
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
          'Firestore denied this write. Deploy latest firestore.rules and retry.',
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
    <View style={styles.screen}>
      <ScrollView
        style={styles.contentWrap}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Recipient</Text>
          <Button
            label={selectedRecipient?.recipientName || 'Select recipient'}
            variant="secondary"
            onPress={() => setRecipientPickerVisible(true)}
          />
          {selectedRecipient?.phoneNumber ? (
            <Text style={styles.meta}>{selectedRecipient.phoneNumber}</Text>
          ) : null}
          {recipients.length === 0 ? (
            <EmptyState
              title="No recipients yet"
              subtitle="Add a recipient before creating transactions."
              actionLabel="Add recipient"
              onActionPress={() => navigation.navigate('AddRecipient')}
            />
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Direction</Text>
          <View style={styles.directionRow}>
            <Button
              label="Sent"
              size="compact"
              onPress={() => setDirection('SENT')}
              variant={direction === 'SENT' ? 'primary' : 'secondary'}
              style={styles.directionButton}
            />
            <Button
              label="Received"
              size="compact"
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
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Date</Text>
          <Pressable
            onPress={() => {
              setCalendarMonthCursor(firstOfMonth(txnDate));
              setDatePickerVisible(true);
            }}
            style={({ pressed }) => [
              styles.dateField,
              pressed ? styles.dateFieldPressed : null,
            ]}
          >
            <Text style={styles.dateValue}>{formatDateDDMMYYYY(txnDate)}</Text>
            <Text style={styles.dateHint}>Tap to pick date</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          {!showNote ? (
            <Button
              label="Add optional note"
              variant="secondary"
              size="compact"
              onPress={() => setShowNote(true)}
            />
          ) : (
            <Input
              label="Note (optional)"
              value={note}
              placeholder="Description"
              onChangeText={setNote}
            />
          )}
        </View>

        <View style={styles.previewCard}>
          <Text style={styles.sectionLabel}>Preview</Text>
          <Text style={styles.previewText}>
            {selectedRecipient?.recipientName || 'No recipient selected'}
          </Text>
          <Text style={styles.previewText}>
            {direction === 'SENT' ? 'Sent' : 'Received'}{' '}
            {amountCents ? formatAmountFromCents(amountCents) : formatAmountFromCents(0)}
          </Text>
          <Text style={styles.previewMeta}>Date {formatDateDDMMYYYY(txnDate)}</Text>
        </View>
      </ScrollView>

      <StickyActionBar
        actions={[
          {
            label: loading ? 'Saving...' : 'Save',
            onPress: handleSave,
            disabled: !canSave,
            loading,
          },
        ]}
      />

      <Portal>
        <Modal
          visible={recipientPickerVisible}
          onDismiss={() => setRecipientPickerVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={styles.modalTitle}>Select recipient</Text>
          <Searchbar
            placeholder="Search by name or phone"
            value={recipientSearch}
            onChangeText={setRecipientSearch}
            style={styles.searchbar}
          />

          {recipientsLoading ? (
            <FeedbackState
              variant="loading"
              title="Loading recipients..."
              subtitle="Please wait a moment."
            />
          ) : (
            <FlatList
              data={filteredRecipients}
              keyExtractor={(item) => item.recipientId}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Button
                  label={`${item.recipientName} - ${item.phoneNumber}`}
                  variant="secondary"
                  size="compact"
                  onPress={() => {
                    setSelectedRecipientId(item.recipientId);
                    setRecipientPickerVisible(false);
                    setRecipientSearch('');
                  }}
                  style={styles.recipientRow}
                />
              )}
              ListEmptyComponent={
                <EmptyState
                  title="No recipients found"
                  subtitle="Try another search term."
                />
              }
              contentContainerStyle={
                filteredRecipients.length === 0
                  ? styles.modalEmptyContainer
                  : styles.modalListContainer
              }
            />
          )}

          <Button
            label="Close"
            variant="ghost"
            onPress={() => setRecipientPickerVisible(false)}
            style={styles.modalClose}
          />
        </Modal>
      </Portal>

      <Portal>
        <Modal
          visible={datePickerVisible}
          onDismiss={() => setDatePickerVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={styles.modalTitle}>Select date</Text>

          <View style={styles.monthHeader}>
            <Pressable
              onPress={() =>
                setCalendarMonthCursor((current) =>
                  firstOfMonth(
                    new Date(current.getFullYear(), current.getMonth() - 1, 1),
                  ),
                )
              }
              style={({ pressed }) => [
                styles.monthArrow,
                pressed ? styles.monthArrowPressed : null,
              ]}
            >
              <Text style={styles.monthArrowText}>{'<'}</Text>
            </Pressable>
            <Text style={styles.monthHeaderText}>
              {monthNames[calendarMonthCursor.getMonth()]}{' '}
              {calendarMonthCursor.getFullYear()}
            </Text>
            <Pressable
              onPress={() =>
                setCalendarMonthCursor((current) =>
                  firstOfMonth(
                    new Date(current.getFullYear(), current.getMonth() + 1, 1),
                  ),
                )
              }
              style={({ pressed }) => [
                styles.monthArrow,
                pressed ? styles.monthArrowPressed : null,
              ]}
            >
              <Text style={styles.monthArrowText}>{'>'}</Text>
            </Pressable>
          </View>

          <View style={styles.weekdayRow}>
            {weekdays.map((day) => (
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
                    onPress={() => {
                      const selected = toNoonDate(dateCell);
                      setTxnDate(selected);
                      setDatePickerVisible(false);
                    }}
                    style={({ pressed }) => [
                      styles.dayCell,
                      isActive ? styles.dayCellActive : null,
                      pressed ? styles.dayCellPressed : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayCellText,
                        isActive ? styles.dayCellTextActive : null,
                      ]}
                    >
                      {dateCell.getDate()}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>

          <View style={styles.dateActions}>
            <Button
              label="Close"
              variant="ghost"
              onPress={() => setDatePickerVisible(false)}
            />
            <Button
              label="Today"
              variant="secondary"
              onPress={() => {
                const today = todayDate();
                setTxnDate(today);
                setCalendarMonthCursor(firstOfMonth(today));
                setDatePickerVisible(false);
              }}
            />
          </View>
        </Modal>
      </Portal>
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
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderColor: colors.border,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  previewCard: {
    backgroundColor: colors.chip,
    borderRadius: 12,
    borderColor: colors.border,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  meta: {
    ...typography.caption,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  directionRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  directionButton: {
    flex: 1,
    marginRight: spacing.sm,
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
    ...typography.bodyStrong,
    color: colors.text,
  },
  dateHint: {
    ...typography.caption,
    marginTop: spacing.xs,
    color: colors.muted,
  },
  previewText: {
    ...typography.bodyStrong,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  previewMeta: {
    ...typography.caption,
    color: colors.muted,
  },
  modalContainer: {
    margin: spacing.lg,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    maxHeight: '84%',
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
  recipientRow: {
    marginBottom: spacing.xs,
  },
  modalListContainer: {
    paddingBottom: spacing.sm,
  },
  modalEmptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  modalClose: {
    marginTop: spacing.sm,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  monthHeaderText: {
    ...typography.bodyStrong,
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
    ...typography.bodyStrong,
    color: colors.text,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  weekdayCell: {
    width: '14.285%',
    alignItems: 'center',
  },
  weekdayText: {
    ...typography.caption,
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
    ...typography.caption,
    color: colors.text,
  },
  dayCellTextActive: {
    color: '#FFFFFF',
  },
  dateActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
