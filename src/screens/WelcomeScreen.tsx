import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Button from '../components/Button';
import Input from '../components/Input';
import StickyActionBar from '../components/StickyActionBar';
import useSession from '../hooks/useSession';
import { resolveSessionByPhone } from '../services/firestore';
import {
  getLastLoginPhoneLocalNumber,
  saveLastLoginPhoneLocalNumber,
} from '../services/localPrefs';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

export default function WelcomeScreen() {
  const { setSession } = useSession();
  const [phoneLocalNumber, setPhoneLocalNumber] = useState('');
  const [suggestedPhone, setSuggestedPhone] = useState<string | null>(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(true);
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  const isValidPhone = useMemo(() => phoneLocalNumber.length === 10, [phoneLocalNumber]);

  const handlePhoneChange = (value: string) => {
    setPhoneLocalNumber(value.replace(/\D+/g, ''));
    if (phoneError) {
      setPhoneError('');
    }
  };

  useEffect(() => {
    let active = true;

    const loadSuggestedPhone = async () => {
      try {
        const savedPhone = await getLastLoginPhoneLocalNumber();
        if (!active) {
          return;
        }
        if (savedPhone) {
          setSuggestedPhone(savedPhone);
        }
      } finally {
        if (active) {
          setLoadingSuggestion(false);
        }
      }
    };

    void loadSuggestedPhone();
    return () => {
      active = false;
    };
  }, []);

  const handleContinue = async () => {
    if (!isValidPhone) {
      setPhoneError('Enter a 10-digit phone number.');
      return;
    }

    try {
      setLoading(true);
      await saveLastLoginPhoneLocalNumber(phoneLocalNumber);
      const session = await resolveSessionByPhone(`+91 ${phoneLocalNumber}`.trim());
      if (!session) {
        setPhoneError('Phone number not registered. Ask admin to add you.');
        return;
      }
      setSuggestedPhone(phoneLocalNumber);
      setSession(session);
    } catch (error) {
      Alert.alert('Unable to continue', String(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <View style={styles.brandBlock}>
          <Text style={styles.brandTitle}>Shared Ledger</Text>
          <Text style={styles.brandCaption}>Phone sign in</Text>
        </View>

        <View style={styles.formCard}>
          {!loadingSuggestion && suggestedPhone && suggestedPhone !== phoneLocalNumber ? (
            <View style={styles.suggestionRow}>
              <Text style={styles.suggestionText}>Use saved number</Text>
              <Button
                label={suggestedPhone}
                variant="secondary"
                size="compact"
                onPress={() => setPhoneLocalNumber(suggestedPhone)}
                style={styles.suggestionButton}
              />
            </View>
          ) : null}
          <Input
            label="Phone Number"
            value={phoneLocalNumber}
            placeholder="9876543210"
            prefixText="+91"
            keyboardType="phone-pad"
            maxLength={10}
            onChangeText={handlePhoneChange}
            errorText={phoneError || undefined}
          />
        </View>
      </View>

      <StickyActionBar
        actions={[
          {
            label: loading ? 'Checking...' : 'Continue',
            onPress: handleContinue,
            disabled: loading || !isValidPhone,
            loading,
          },
        ]}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.screenHorizontal,
  },
  brandBlock: {
    marginBottom: spacing.lg,
  },
  brandTitle: {
    ...typography.display,
    color: colors.text,
  },
  brandCaption: {
    ...typography.body,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  formCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  suggestionRow: {
    marginBottom: spacing.md,
  },
  suggestionText: {
    ...typography.caption,
    color: colors.muted,
    marginBottom: spacing.xs,
  },
  suggestionButton: {
    alignSelf: 'flex-start',
  },
});
