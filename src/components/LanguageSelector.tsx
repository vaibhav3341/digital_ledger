import React, {useState} from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import {Modal, Portal} from 'react-native-paper';
import {useLanguage} from '../hooks/useLanguage';
import {useTranslation} from 'react-i18next';
import {colors} from '../theme/colors';
import {spacing} from '../theme/spacing';
import {typography} from '../theme/typography';

interface LanguageSelectorProps {
  style?: StyleProp<ViewStyle>;
}

export default function LanguageSelector({style}: LanguageSelectorProps) {
  const {t} = useTranslation();
  const {
    currentLanguage,
    availableLanguages,
    changeLanguage,
    isLanguageLoaded,
  } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [pendingLanguage, setPendingLanguage] = useState<string | null>(null);

  const currentLanguageName =
    availableLanguages.find(lang => lang.code === currentLanguage)
      ?.nativeName || currentLanguage;

  const openModal = () => {
    setVisible(true);
  };

  const closeModal = () => {
    if (pendingLanguage) {
      return;
    }
    setVisible(false);
  };

  const handleLanguageSelect = async (languageCode: string) => {
    if (pendingLanguage) {
      return;
    }
    if (languageCode === currentLanguage) {
      setVisible(false);
      return;
    }
    setPendingLanguage(languageCode);
    try {
      await changeLanguage(languageCode);
      setVisible(false);
    } finally {
      setPendingLanguage(null);
    }
  };

  if (!isLanguageLoaded) {
    return null;
  }

  return (
    <>
      <Pressable
        onPress={openModal}
        disabled={Boolean(pendingLanguage)}
        style={({pressed}) => [
          styles.trigger,
          pressed && !pendingLanguage ? styles.triggerPressed : null,
          style,
        ]}>
        <View style={styles.triggerBadge}>
          <Text style={styles.triggerBadgeText}>Aa</Text>
        </View>
        <View style={styles.triggerLeft}>
          <Text style={styles.triggerLabel}>{t('welcome.language')}</Text>
          <Text style={styles.triggerValue}>{currentLanguageName}</Text>
        </View>
        <View style={styles.triggerIconWrap}>
          <Text style={styles.triggerIcon}>{'>'}</Text>
        </View>
      </Pressable>

      <Portal>
        <Modal
          visible={visible}
          onDismiss={closeModal}
          contentContainerStyle={styles.modalContainer}>
          <View style={styles.handle} />
          <Text style={styles.modalTitle}>{t('welcome.selectLanguage')}</Text>
          <Text style={styles.modalCaption}>{t('welcome.subtitle')}</Text>

          <View style={styles.languageOptions}>
            {availableLanguages.map(language => {
              const isSelected = language.code === currentLanguage;
              const isPending = pendingLanguage === language.code;
              return (
                <Pressable
                  key={language.code}
                  onPress={async () => {
                    await handleLanguageSelect(language.code);
                  }}
                  disabled={Boolean(pendingLanguage)}
                  style={({pressed}) => [
                    styles.languageOption,
                    isSelected ? styles.languageOptionActive : null,
                    pressed ? styles.languageOptionPressed : null,
                  ]}>
                  <View style={styles.optionTextWrap}>
                    <Text style={styles.optionPrimaryText}>
                      {language.nativeName}
                    </Text>
                    <Text style={styles.optionSecondaryText}>
                      {language.name}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.optionTag,
                      isSelected
                        ? styles.optionTagActive
                        : styles.optionTagIdle,
                    ]}>
                    <Text
                      style={[
                        styles.optionTagText,
                        isSelected ? styles.optionTagTextActive : null,
                      ]}>
                      {isPending ? '...' : isSelected ? 'ON' : 'OFF'}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            onPress={closeModal}
            disabled={Boolean(pendingLanguage)}
            style={({pressed}) => [
              styles.closeButton,
              pressed && !pendingLanguage ? styles.closeButtonPressed : null,
            ]}>
            <Text style={styles.closeButtonText}>{t('common.close')}</Text>
          </Pressable>
        </Modal>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    minWidth: 210,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#0F1A2E',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#091024',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 6},
    elevation: 4,
  },
  triggerPressed: {
    opacity: 0.92,
  },
  triggerBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#183056',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  triggerBadgeText: {
    ...typography.caption,
    color: '#D8E6FF',
    fontWeight: '700',
  },
  triggerLeft: {
    flex: 1,
    marginRight: spacing.sm,
  },
  triggerLabel: {
    ...typography.caption,
    color: '#9AB0D4',
  },
  triggerValue: {
    ...typography.subtitle,
    color: '#F8FAFF',
    marginTop: spacing.xxs,
  },
  triggerIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#274169',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#162D4F',
  },
  triggerIcon: {
    ...typography.bodyStrong,
    color: '#D8E6FF',
    marginTop: -1,
  },
  modalContainer: {
    margin: spacing.lg,
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    maxHeight: '80%',
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CCD7E8',
    marginBottom: spacing.md,
  },
  modalTitle: {
    ...typography.subtitle,
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  modalCaption: {
    ...typography.caption,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  languageOptions: {
    marginTop: spacing.xxs,
  },
  languageOption: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  languageOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.accent,
  },
  languageOptionPressed: {
    opacity: 0.85,
  },
  optionTextWrap: {
    flex: 1,
    marginRight: spacing.sm,
  },
  optionPrimaryText: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  optionSecondaryText: {
    ...typography.caption,
    color: colors.muted,
    marginTop: spacing.xxs,
  },
  optionTag: {
    minWidth: 52,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTagActive: {
    borderColor: colors.primary,
    backgroundColor: '#DCEBFF',
  },
  optionTagIdle: {
    borderColor: colors.border,
    backgroundColor: colors.chip,
  },
  optionTagText: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '700',
  },
  optionTagTextActive: {
    color: colors.primary,
  },
  closeButton: {
    alignSelf: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
  },
  closeButtonPressed: {
    backgroundColor: colors.chip,
  },
  closeButtonText: {
    ...typography.bodyStrong,
    color: colors.primary,
  },
});
