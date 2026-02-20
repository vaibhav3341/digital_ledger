import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  PermissionsAndroid,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Menu, Modal, Portal, Snackbar } from 'react-native-paper';
import Button from '../components/Button';
import FilterMenuButton from '../components/FilterMenuButton';
import SegmentedControl, {
  SegmentedControlOption,
} from '../components/SegmentedControl';
import StickyActionBar from '../components/StickyActionBar';
import useRecipients from '../hooks/useRecipients';
import useSession from '../hooks/useSession';
import {
  endOfDay,
  fetchStatementTransactions,
  generateStatementPdf,
  saveStatementToDownloads,
  startOfDay,
} from '../services/statement';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { formatDateDDMMYYYY } from '../utils/format';

type DurationMode = 'TILL_DATE' | 'THIS_MONTH' | 'CUSTOM';
type DateTarget = 'START' | 'END';

const ALL_RECIPIENTS_FILTER = 'ALL';
const durationOptions: SegmentedControlOption<DurationMode>[] = [
  { value: 'TILL_DATE', label: 'Till date' },
  { value: 'THIS_MONTH', label: 'This month' },
  { value: 'CUSTOM', label: 'Custom' },
];
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

function todayDate() {
  return new Date();
}

function monthStartDate() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1, 12, 0, 0, 0);
}

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

function requiresLegacyStoragePermission() {
  return (
    Platform.OS === 'android' &&
    typeof Platform.Version === 'number' &&
    Platform.Version < 29
  );
}

async function ensureLegacyStoragePermission() {
  if (!requiresLegacyStoragePermission()) {
    return true;
  }
  const status = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
  );
  return status === PermissionsAndroid.RESULTS.GRANTED;
}

export default function GetStatementScreen() {
  const { session } = useSession();
  const ledgerId = session?.role === 'ADMIN' ? session.ledgerId : undefined;
  const adminName = session?.role === 'ADMIN' ? session.adminName : 'Admin';
  const { recipients } = useRecipients(ledgerId);

  const [recipientMenuVisible, setRecipientMenuVisible] = useState(false);
  const [recipientFilterId, setRecipientFilterId] = useState<string>(
    ALL_RECIPIENTS_FILTER,
  );

  const [durationMode, setDurationMode] = useState<DurationMode>('THIS_MONTH');
  const [customStartDate, setCustomStartDate] = useState<Date>(monthStartDate());
  const [customEndDate, setCustomEndDate] = useState<Date>(todayDate());
  const [dateTarget, setDateTarget] = useState<DateTarget>('START');
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [calendarMonthCursor, setCalendarMonthCursor] = useState<Date>(
    firstOfMonth(todayDate()),
  );

  const [loading, setLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [lastSavedLabel, setLastSavedLabel] = useState('');
  const [lastSavedUri, setLastSavedUri] = useState('');

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

  const selectedRecipientLabel =
    recipientFilterId === ALL_RECIPIENTS_FILTER
      ? 'All people'
      : recipientNameById[recipientFilterId] || 'Selected person';

  const calendarDays = useMemo(
    () => buildCalendarDays(calendarMonthCursor),
    [calendarMonthCursor],
  );

  const openDatePicker = (target: DateTarget) => {
    setDateTarget(target);
    setCalendarMonthCursor(
      firstOfMonth(target === 'START' ? customStartDate : customEndDate),
    );
    setDatePickerVisible(true);
  };

  const handleOpenSavedStatement = async () => {
    if (!lastSavedUri) {
      return;
    }
    try {
      await Linking.openURL(lastSavedUri);
    } catch (error) {
      Alert.alert('Unable to open statement', String(error));
    }
  };

  const handleShareSavedStatement = async () => {
    if (!lastSavedUri) {
      return;
    }
    try {
      await Share.share({
        message: lastSavedLabel,
        url: lastSavedUri,
      });
    } catch (error) {
      Alert.alert('Unable to share statement', String(error));
    }
  };

  const handleGenerateStatement = async () => {
    if (!ledgerId) {
      Alert.alert('Admin session required');
      return;
    }

    const canWriteToDownloads = await ensureLegacyStoragePermission();
    if (!canWriteToDownloads) {
      Alert.alert('Storage permission is required to save statement.');
      return;
    }

    let startDate: Date | undefined;
    let endDate = endOfDay(new Date());

    if (durationMode === 'THIS_MONTH') {
      startDate = startOfDay(monthStartDate());
    } else if (durationMode === 'CUSTOM') {
      const start = startOfDay(customStartDate);
      const end = endOfDay(customEndDate);
      if (start.getTime() > end.getTime()) {
        Alert.alert('Start date cannot be after end date');
        return;
      }
      startDate = start;
      endDate = end;
    }

    try {
      setLoading(true);
      const transactions = await fetchStatementTransactions({
        ledgerId,
        recipientId:
          recipientFilterId === ALL_RECIPIENTS_FILTER
            ? undefined
            : recipientFilterId,
        startDate,
        endDate,
      });

      const firstTxnDate = transactions[0]?.txnAt?.toDate?.();
      const rangeStart =
        durationMode === 'CUSTOM'
          ? startOfDay(customStartDate)
          : durationMode === 'THIS_MONTH'
            ? startOfDay(monthStartDate())
            : firstTxnDate
              ? startOfDay(firstTxnDate)
              : startOfDay(new Date());

      const generated = await generateStatementPdf({
        adminName,
        recipientLabel: selectedRecipientLabel,
        rangeStart,
        rangeEnd: endDate,
        transactions,
        recipientNamesById: recipientNameById,
      });

      const downloadResult = await saveStatementToDownloads(generated);
      setLastSavedLabel(downloadResult.downloadsPathLabel);
      setLastSavedUri(downloadResult.downloadsUri);
      setSnackbarMessage(`Saved to ${downloadResult.downloadsPathLabel}`);
      setSnackbarVisible(true);
    } catch (error) {
      Alert.alert('Failed to generate statement', String(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.contentWrap}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Scope</Text>
          <Menu
            visible={recipientMenuVisible}
            onDismiss={() => setRecipientMenuVisible(false)}
            anchor={
              <FilterMenuButton
                label="People"
                value={selectedRecipientLabel}
                onPress={() => setRecipientMenuVisible(true)}
                style={styles.selectorControl}
              />
            }
          >
            <Menu.Item
              onPress={() => {
                setRecipientFilterId(ALL_RECIPIENTS_FILTER);
                setRecipientMenuVisible(false);
              }}
              title="All people"
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

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Range</Text>
          <SegmentedControl
            value={durationMode}
            options={durationOptions}
            onChange={setDurationMode}
            equalWidth
            style={styles.durationControl}
          />

          {durationMode === 'CUSTOM' ? (
            <View>
              <Pressable
                onPress={() => openDatePicker('START')}
                style={({ pressed }) => [
                  styles.dateField,
                  pressed ? styles.dateFieldPressed : null,
                ]}
              >
                <Text style={styles.dateFieldLabel}>Start</Text>
                <Text style={styles.dateFieldValue}>
                  {formatDateDDMMYYYY(customStartDate)}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => openDatePicker('END')}
                style={({ pressed }) => [
                  styles.dateField,
                  pressed ? styles.dateFieldPressed : null,
                ]}
              >
                <Text style={styles.dateFieldLabel}>End</Text>
                <Text style={styles.dateFieldValue}>
                  {formatDateDDMMYYYY(customEndDate)}
                </Text>
              </Pressable>
            </View>
          ) : (
            <Text style={styles.metaText}>
              {durationMode === 'THIS_MONTH'
                ? `From ${formatDateDDMMYYYY(monthStartDate())} to ${formatDateDDMMYYYY(
                    todayDate(),
                  )}`
                : `Up to ${formatDateDDMMYYYY(todayDate())}`}
            </Text>
          )}
        </View>

        <View style={styles.outputCard}>
          <Text style={styles.sectionLabel}>Output</Text>
          <Text style={styles.outputText}>Recipient {selectedRecipientLabel}</Text>
          <Text style={styles.outputMeta}>
            {durationMode === 'CUSTOM'
              ? `${formatDateDDMMYYYY(customStartDate)} to ${formatDateDDMMYYYY(
                  customEndDate,
                )}`
              : durationMode === 'THIS_MONTH'
                ? `${formatDateDDMMYYYY(monthStartDate())} to ${formatDateDDMMYYYY(
                    todayDate(),
                  )}`
                : `Till ${formatDateDDMMYYYY(todayDate())}`}
          </Text>

          {lastSavedLabel ? (
            <View style={styles.secondaryActions}>
              <Button
                label="Open"
                variant="secondary"
                size="compact"
                onPress={handleOpenSavedStatement}
                style={styles.secondaryButton}
              />
              <Button
                label="Share"
                variant="secondary"
                size="compact"
                onPress={handleShareSavedStatement}
                style={styles.secondaryButton}
              />
            </View>
          ) : null}
        </View>
      </ScrollView>

      <StickyActionBar
        actions={[
          {
            label: loading ? 'Generating...' : 'Generate Statement',
            onPress: handleGenerateStatement,
            disabled: loading,
            loading,
          },
        ]}
      />

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
              const selectedDate =
                dateTarget === 'START' ? customStartDate : customEndDate;
              const isActive = isSameDay(dateCell, selectedDate);
              const key = `day-${dateCell.getFullYear()}-${dateCell.getMonth()}-${dateCell.getDate()}`;

              return (
                <View key={key} style={styles.dayCellWrap}>
                  <Pressable
                    onPress={() => {
                      const chosen = toNoonDate(dateCell);
                      if (dateTarget === 'START') {
                        setCustomStartDate(chosen);
                      } else {
                        setCustomEndDate(chosen);
                      }
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

          <Button
            label="Close"
            variant="ghost"
            onPress={() => setDatePickerVisible(false)}
          />
        </Modal>
      </Portal>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={4000}
        action={
          lastSavedUri
            ? {
                label: 'Open',
                onPress: handleOpenSavedStatement,
              }
            : undefined
        }
      >
        {snackbarMessage}
      </Snackbar>
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
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  outputCard: {
    backgroundColor: colors.chip,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  selectorControl: {
    marginBottom: spacing.xs,
  },
  durationControl: {
    marginBottom: spacing.sm,
  },
  dateField: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
    backgroundColor: colors.card,
  },
  dateFieldPressed: {
    backgroundColor: colors.accent,
  },
  dateFieldLabel: {
    ...typography.caption,
    color: colors.muted,
  },
  dateFieldValue: {
    ...typography.bodyStrong,
    color: colors.text,
    marginTop: spacing.xxs,
  },
  metaText: {
    ...typography.caption,
    color: colors.muted,
  },
  outputText: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  outputMeta: {
    ...typography.caption,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  secondaryActions: {
    marginTop: spacing.sm,
    flexDirection: 'row',
  },
  secondaryButton: {
    flex: 1,
    marginRight: spacing.sm,
  },
  modalContainer: {
    margin: spacing.lg,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  modalTitle: {
    ...typography.subtitle,
    color: colors.text,
    marginBottom: spacing.sm,
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
    marginBottom: spacing.md,
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
});
