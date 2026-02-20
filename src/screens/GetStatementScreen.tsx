import React, {useEffect, useMemo, useState} from 'react';
import {
  Alert,
  PermissionsAndroid,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  ActivityIndicator,
  Card,
  Menu,
  Snackbar,
} from 'react-native-paper';
import Button from '../components/Button';
import FilterMenuButton from '../components/FilterMenuButton';
import Input from '../components/Input';
import SegmentedControl, {
  SegmentedControlOption,
} from '../components/SegmentedControl';
import useRecipients from '../hooks/useRecipients';
import useSession from '../hooks/useSession';
import {
  endOfDay,
  fetchStatementTransactions,
  generateStatementPdf,
  saveStatementToDownloads,
  startOfDay,
} from '../services/statement';
import {colors} from '../theme/colors';
import {spacing} from '../theme/spacing';
import {typography} from '../theme/typography';
import {formatDateDDMMYYYY, parseDateDDMMYYYY} from '../utils/format';

type DurationMode = 'TILL_DATE' | 'CUSTOM_RANGE';

const ALL_RECIPIENTS_FILTER = 'ALL';
const durationOptions: SegmentedControlOption<DurationMode>[] = [
  { value: 'TILL_DATE', label: 'Till date' },
  { value: 'CUSTOM_RANGE', label: 'Custom range' },
];

function todayString() {
  return formatDateDDMMYYYY(new Date());
}

function monthStartString() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return formatDateDDMMYYYY(start);
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
  const {session} = useSession();
  const ledgerId = session?.role === 'ADMIN' ? session.ledgerId : undefined;
  const adminName = session?.role === 'ADMIN' ? session.adminName : 'Admin';
  const {recipients} = useRecipients(ledgerId);

  const [recipientMenuVisible, setRecipientMenuVisible] = useState(false);
  const [recipientFilterId, setRecipientFilterId] = useState<string>(
    ALL_RECIPIENTS_FILTER,
  );
  const [durationMode, setDurationMode] = useState<DurationMode>('TILL_DATE');
  const [startDateInput, setStartDateInput] = useState(monthStartString());
  const [endDateInput, setEndDateInput] = useState(todayString());
  const [loading, setLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const recipientNameById = useMemo(() => {
    const map: Record<string, string> = {};
    recipients.forEach(recipient => {
      map[recipient.recipientId] = recipient.recipientName;
    });
    return map;
  }, [recipients]);

  useEffect(() => {
    if (
      recipientFilterId !== ALL_RECIPIENTS_FILTER &&
      !recipients.some(recipient => recipient.recipientId === recipientFilterId)
    ) {
      setRecipientFilterId(ALL_RECIPIENTS_FILTER);
    }
  }, [recipientFilterId, recipients]);

  const selectedRecipientLabel =
    recipientFilterId === ALL_RECIPIENTS_FILTER
      ? 'All recipients'
      : recipientNameById[recipientFilterId] || 'Selected recipient';

  const handleGenerateStatement = async () => {
    if (!ledgerId) {
      Alert.alert('Admin session required');
      return;
    }

    const canWriteToDownloads = await ensureLegacyStoragePermission();
    if (!canWriteToDownloads) {
      Alert.alert(
        'Storage permission is required to save statement in Downloads.',
      );
      return;
    }

    let startDate: Date | undefined;
    let endDate = endOfDay(new Date());

    if (durationMode === 'CUSTOM_RANGE') {
      const parsedStart = parseDateDDMMYYYY(startDateInput);
      const parsedEnd = parseDateDDMMYYYY(endDateInput);

      if (!parsedStart || !parsedEnd) {
        Alert.alert('Enter valid dates in DD/MM/YYYY format');
        return;
      }

      startDate = startOfDay(parsedStart);
      endDate = endOfDay(parsedEnd);

      if (startDate.getTime() > endDate.getTime()) {
        Alert.alert('Start date cannot be after end date');
        return;
      }
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

      const defaultStart = startOfDay(new Date());
      const firstTxnDate = transactions[0]?.txnAt?.toDate?.();
      const rangeStart =
        durationMode === 'CUSTOM_RANGE'
          ? (startDate as Date)
          : firstTxnDate
          ? startOfDay(firstTxnDate)
          : defaultStart;

      const generated = await generateStatementPdf({
        adminName,
        recipientLabel: selectedRecipientLabel,
        rangeStart,
        rangeEnd: endDate,
        transactions,
        recipientNamesById: recipientNameById,
      });

      const downloadResult = await saveStatementToDownloads(generated);
      setSnackbarMessage(
        `Statement saved to ${downloadResult.downloadsPathLabel}`,
      );
      setSnackbarVisible(true);
    } catch (error) {
      Alert.alert('Failed to generate statement', String(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Get Statement</Text>
        <Text style={styles.subtitle}>
          Select recipient and duration, then generate a PDF statement.
        </Text>

        <Card mode="contained" style={styles.card}>
          <View style={styles.cardContent}>
            <Text style={styles.label}>Recipient</Text>
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
              }>
              <Menu.Item
                onPress={() => {
                  setRecipientFilterId(ALL_RECIPIENTS_FILTER);
                  setRecipientMenuVisible(false);
                }}
                title="All people"
              />
              {recipients.length > 0 ? (
                recipients.map(recipient => (
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

            <Text style={[styles.label, styles.durationLabel]}>Duration</Text>
            <SegmentedControl
              value={durationMode}
              options={durationOptions}
              onChange={setDurationMode}
              equalWidth
              style={styles.durationControl}
            />

            {durationMode === 'CUSTOM_RANGE' ? (
              <>
                <Input
                  label="Start Date (DD/MM/YYYY)"
                  value={startDateInput}
                  placeholder="01/02/2026"
                  onChangeText={setStartDateInput}
                />
                <Input
                  label="End Date (DD/MM/YYYY)"
                  value={endDateInput}
                  placeholder="16/02/2026"
                  onChangeText={setEndDateInput}
                />
              </>
            ) : (
              <Text style={styles.tillDateHint}>
                Includes all transactions till {todayString()}.
              </Text>
            )}

            <Button
              label={loading ? 'Generating...' : 'Generate Statement'}
              onPress={handleGenerateStatement}
              disabled={loading}
              style={styles.generateButton}
            />

            {loading ? (
              <ActivityIndicator
                animating
                color={colors.primary}
                style={styles.loadingIndicator}
              />
            ) : null}
          </View>
        </Card>
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={4000}>
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
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.muted,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  cardContent: {
    padding: spacing.lg,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
    marginBottom: spacing.xs,
  },
  selectorControl: {
    marginBottom: spacing.md,
  },
  durationLabel: {
    marginTop: spacing.xs,
  },
  durationControl: {
    marginBottom: spacing.md,
  },
  tillDateHint: {
    fontSize: 12,
    color: colors.muted,
    marginBottom: spacing.md,
  },
  generateButton: {
    marginTop: spacing.sm,
  },
  loadingIndicator: {
    marginTop: spacing.md,
  },
});
