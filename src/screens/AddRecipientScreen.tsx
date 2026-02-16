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
import Contacts from 'react-native-contacts';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Button from '../components/Button';
import Input from '../components/Input';
import useSession from '../hooks/useSession';
import { RootStackParamList } from '../navigation/RootNavigator';
import { createRecipientWithPhone, normalizePhoneNumber } from '../services/firestore';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

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
  const { session } = useSession();
  const ledgerId = session?.role === 'ADMIN' ? session.ledgerId : '';

  const [recipientName, setRecipientName] = useState('');
  const [phoneLocalNumber, setPhoneLocalNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [showContactList, setShowContactList] = useState(false);
  const [contacts, setContacts] = useState<ContactCandidate[]>([]);

  const canSave = useMemo(() => {
    return recipientName.trim().length > 0 && phoneLocalNumber.length >= 10;
  }, [recipientName, phoneLocalNumber]);

  const requestContactsPermission = async () => {
    if (Platform.OS !== 'android') {
      return true;
    }

    const permission = PermissionsAndroid.PERMISSIONS.READ_CONTACTS;
    const granted = await PermissionsAndroid.request(permission);
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  };

  const handleLoadContacts = async () => {
    try {
      setLoadingContacts(true);
      const allowed = await requestContactsPermission();
      if (!allowed) {
        Alert.alert('Contacts permission denied');
        return;
      }

      const allContacts = await Contacts.getAll();
      const candidates = toContactCandidates(allContacts);
      if (candidates.length === 0) {
        Alert.alert('No contacts with phone numbers found');
        return;
      }

      setContacts(candidates);
      setShowContactList(true);
    } catch (error) {
      Alert.alert('Unable to load contacts', String(error));
    } finally {
      setLoadingContacts(false);
    }
  };

  const handlePickContact = (contact: ContactCandidate) => {
    setRecipientName(contact.name);
    setPhoneLocalNumber(toIndianLocalNumber(contact.phoneNumber));
    setShowContactList(false);
  };

  const handlePhoneChange = (value: string) => {
    setPhoneLocalNumber(value.replace(/\D+/g, ''));
  };

  const handleSave = async () => {
    if (!ledgerId) {
      Alert.alert('Admin session is required');
      return;
    }

    if (!canSave) {
      Alert.alert('Enter recipient name and valid phone number');
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
      Alert.alert('Failed to add recipient', String(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Recipient</Text>
      <Text style={styles.subtitle}>
        Add recipient name and phone number. Pick from contacts or enter manually.
      </Text>

      <Button
        label={loadingContacts ? 'Loading Contacts...' : 'Select from Contacts'}
        variant="secondary"
        onPress={handleLoadContacts}
        disabled={loadingContacts || submitting}
        style={styles.actionButton}
      />

      {showContactList ? (
        <View style={styles.contactListCard}>
          <View style={styles.contactHeader}>
            <Text style={styles.contactTitle}>Choose Contact</Text>
            <Button
              label="Hide"
              variant="ghost"
              onPress={() => setShowContactList(false)}
            />
          </View>
          <FlatList
            data={contacts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Button
                label={`${item.name} • ${item.phoneNumber}`}
                variant="secondary"
                onPress={() => handlePickContact(item)}
                style={styles.contactRow}
              />
            )}
            contentContainerStyle={styles.contactListContent}
          />
        </View>
      ) : null}

      <Input
        label="Recipient Name"
        value={recipientName}
        placeholder="Enter recipient name"
        onChangeText={setRecipientName}
      />
      <Input
        label="Phone Number"
        value={phoneLocalNumber}
        placeholder="9876543210"
        prefixText="+91"
        keyboardType="phone-pad"
        maxLength={10}
        onChangeText={handlePhoneChange}
      />

      <Button
        label={submitting ? 'Saving...' : 'Add Recipient'}
        onPress={handleSave}
        disabled={submitting}
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
  actionButton: {
    marginBottom: spacing.md,
  },
  contactListCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    maxHeight: 260,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  contactListContent: {
    paddingTop: spacing.sm,
  },
  contactRow: {
    marginBottom: spacing.xs,
  },
});
