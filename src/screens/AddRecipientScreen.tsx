import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Contacts from 'react-native-contacts';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Chip, Modal, Portal, Searchbar } from 'react-native-paper';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import FeedbackState from '../components/FeedbackState';
import Input from '../components/Input';
import StickyActionBar from '../components/StickyActionBar';
import useSession from '../hooks/useSession';
import { RootStackParamList } from '../navigation/RootNavigator';
import {
  createRecipientWithPhone,
  normalizePhoneNumber,
} from '../services/firestore';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

type RecipientMode = 'CONTACTS' | 'MANUAL';

interface ContactCandidate {
  id: string;
  name: string;
  phoneNumber: string;
}

function toContactCandidates(allContacts: unknown[]): ContactCandidate[] {
  const candidates: ContactCandidate[] = [];

  allContacts.forEach((item, index) => {
    const contact = item as {
      recordID?: string;
      givenName?: string;
      familyName?: string;
      displayName?: string;
      phoneNumbers?: Array<{ number?: string | null }>;
    };
    const firstPhone = contact.phoneNumbers?.find((entry) => entry.number?.trim())
      ?.number;
    if (!firstPhone) {
      return;
    }

    const name =
      contact.displayName?.trim() ||
      `${contact.givenName || ''} ${contact.familyName || ''}`.trim() ||
      'Unnamed contact';

    candidates.push({
      id: contact.recordID || `${name}_${index}`,
      name,
      phoneNumber: firstPhone.trim(),
    });
  });

  return candidates;
}

function toIndianLocalNumber(phoneNumber: string) {
  const normalized = normalizePhoneNumber(phoneNumber);
  if (normalized.length <= 10) {
    return normalized;
  }
  return normalized.slice(-10);
}

export default function AddRecipientScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t } = useTranslation();
  const { session } = useSession();
  const ledgerId = session?.role === 'ADMIN' ? session.ledgerId : '';

  const [mode, setMode] = useState<RecipientMode>('CONTACTS');
  const [recipientName, setRecipientName] = useState('');
  const [phoneLocalNumber, setPhoneLocalNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [contactsLoading, setContactsLoading] = useState(false);
  const [contacts, setContacts] = useState<ContactCandidate[]>([]);
  const [contactPickerVisible, setContactPickerVisible] = useState(false);
  const [contactSearch, setContactSearch] = useState('');

  const canSave = useMemo(() => {
    return recipientName.trim().length > 0 && phoneLocalNumber.length >= 10;
  }, [recipientName, phoneLocalNumber]);

  const filteredContacts = useMemo(() => {
    const query = contactSearch.trim().toLowerCase();
    if (!query) {
      return contacts;
    }

    const queryDigits = query.replace(/\D+/g, '');
    return contacts.filter((contact) => {
      if (contact.name.toLowerCase().includes(query)) {
        return true;
      }

      if (contact.phoneNumber.toLowerCase().includes(query)) {
        return true;
      }

      if (!queryDigits) {
        return false;
      }

      return contact.phoneNumber.replace(/\D+/g, '').includes(queryDigits);
    });
  }, [contactSearch, contacts]);

  const requestContactsPermission = async () => {
    if (Platform.OS !== 'android') {
      return true;
    }

    const permission = PermissionsAndroid.PERMISSIONS.READ_CONTACTS;
    const granted = await PermissionsAndroid.request(permission);
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  };

  const loadContacts = async () => {
    try {
      setContactsLoading(true);
      const allowed = await requestContactsPermission();
      if (!allowed) {
        Alert.alert(t('recipient.permissionDenied'));
        return;
      }

      const allContacts = await Contacts.getAll();
      const candidates = toContactCandidates(allContacts).sort((a, b) =>
        a.name.localeCompare(b.name),
      );

      setContacts(candidates);
      setContactSearch('');
      setContactPickerVisible(true);
    } catch (error) {
      Alert.alert(t('recipient.unableToLoad'), String(error));
    } finally {
      setContactsLoading(false);
    }
  };

  const handlePickContact = (contact: ContactCandidate) => {
    setRecipientName(contact.name);
    setPhoneLocalNumber(toIndianLocalNumber(contact.phoneNumber));
    setContactSearch('');
    setContactPickerVisible(false);
  };

  const handlePhoneChange = (value: string) => {
    setPhoneLocalNumber(value.replace(/\D+/g, ''));
  };

  const handleSave = async () => {
    if (!ledgerId) {
      Alert.alert(t('recipient.adminRequired'));
      return;
    }
    if (!canSave) {
      Alert.alert(t('recipient.enterValidDetails'));
      return;
    }

    try {
      setSubmitting(true);
      await createRecipientWithPhone({
        ledgerId,
        recipientName: recipientName.trim(),
        phoneNumber: `+91 ${phoneLocalNumber}`.trim(),
      });
      navigation.goBack();
    } catch (error) {
      Alert.alert(t('recipient.failedToAdd'), String(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.contentWrap}>
        <Text style={styles.title}>{t('recipient.addTitle')}</Text>

        <View style={styles.modeRow}>
          <Chip
            selected={mode === 'CONTACTS'}
            onPress={() => setMode('CONTACTS')}
            style={styles.modeChip}
          >
            {t('recipient.fromContacts')}
          </Chip>
          <Chip
            selected={mode === 'MANUAL'}
            onPress={() => setMode('MANUAL')}
            style={styles.modeChip}
          >
            {t('recipient.manual')}
          </Chip>
        </View>

        <View style={styles.formCard}>
          {mode === 'CONTACTS' ? (
            <Button
              label={
                contactsLoading
                  ? t('recipient.loadingContacts')
                  : t('recipient.selectFromContacts')
              }
              variant="secondary"
              onPress={loadContacts}
              disabled={contactsLoading || submitting}
              style={styles.contactButton}
            />
          ) : null}

          <Input
            label={t('recipient.name')}
            value={recipientName}
            placeholder={t('recipient.namePlaceholder')}
            onChangeText={setRecipientName}
          />
          <Input
            label={t('recipient.phone')}
            value={phoneLocalNumber}
            placeholder={t('recipient.phonePlaceholder')}
            prefixText="+91"
            keyboardType="phone-pad"
            maxLength={10}
            onChangeText={handlePhoneChange}
          />
        </View>
      </View>

      <StickyActionBar
        actions={[
          {
            label: submitting ? t('recipient.saving') : t('recipient.addButton'),
            onPress: handleSave,
            disabled: submitting || !canSave,
            loading: submitting,
          },
        ]}
      />

      <Portal>
        <Modal
          visible={contactPickerVisible}
          onDismiss={() => setContactPickerVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={styles.modalTitle}>{t('recipient.chooseContact')}</Text>
          <Searchbar
            placeholder={t('recipient.searchByNameOrPhone')}
            value={contactSearch}
            onChangeText={setContactSearch}
            style={styles.searchbar}
          />

          {contactsLoading ? (
            <FeedbackState
              variant="loading"
              title={t('recipient.loadingContacts')}
              subtitle={t('recipient.loadingContactsHint')}
            />
          ) : (
            <FlatList
              data={filteredContacts}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Button
                  label={`${item.name} - ${item.phoneNumber}`}
                  variant="secondary"
                  size="compact"
                  onPress={() => handlePickContact(item)}
                  style={styles.contactRow}
                />
              )}
              ListEmptyComponent={
                contacts.length === 0 ? (
                  <EmptyState
                    title={t('recipient.noContactsFound')}
                    subtitle={t('recipient.tryManualMode')}
                  />
                ) : (
                  <EmptyState
                    title={t('common.noResults')}
                    subtitle={t('common.tryAgain')}
                  />
                )
              }
              contentContainerStyle={
                filteredContacts.length === 0
                  ? styles.modalEmptyContainer
                  : styles.modalListContainer
              }
            />
          )}

          <Button
            label={t('common.close')}
            variant="ghost"
            onPress={() => setContactPickerVisible(false)}
            style={styles.modalClose}
          />
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
  title: {
    ...typography.heading,
    color: colors.text,
  },
  modeRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
  },
  modeChip: {
    marginRight: spacing.sm,
    backgroundColor: colors.chip,
  },
  formCard: {
    marginTop: spacing.md,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  contactButton: {
    marginBottom: spacing.md,
  },
  modalContainer: {
    margin: spacing.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.md,
    maxHeight: '84%',
  },
  modalTitle: {
    ...typography.subtitle,
    color: colors.text,
  },
  searchbar: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  contactRow: {
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
});
