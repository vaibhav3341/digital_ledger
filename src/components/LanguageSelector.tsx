import React, {useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {Modal, Portal, RadioButton} from 'react-native-paper';
import Button from './Button';
import {useLanguage} from '../hooks/useLanguage';
import {useTranslation} from 'react-i18next';
import {colors} from '../theme/colors';
import {spacing} from '../theme/spacing';
import {typography} from '../theme/typography';

interface LanguageSelectorProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  style?: object;
}

export default function LanguageSelector({
  variant = 'ghost',
  style,
}: LanguageSelectorProps) {
  const {t} = useTranslation();
  const {
    currentLanguage,
    availableLanguages,
    changeLanguage,
    isLanguageLoaded,
  } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage);
  const [isChanging, setIsChanging] = useState(false);

  const currentLanguageName =
    availableLanguages.find(lang => lang.code === currentLanguage)
      ?.nativeName || currentLanguage;

  const openModal = () => {
    setSelectedLanguage(currentLanguage);
    setVisible(true);
  };

  const closeModal = () => {
    setVisible(false);
  };

  const handleLanguageSelect = (languageCode: string) => {
    setSelectedLanguage(languageCode);
  };

  const handleConfirm = async () => {
    if (selectedLanguage !== currentLanguage) {
      setIsChanging(true);
      await changeLanguage(selectedLanguage);
      setIsChanging(false);
    }
    closeModal();
  };

  if (!isLanguageLoaded) {
    return null;
  }

  return (
    <>
      <Button
        label={`${t('welcome.language')}: ${currentLanguageName}`}
        variant={variant}
        onPress={openModal}
        style={style}
      />

      <Portal>
        <Modal
          visible={visible}
          onDismiss={closeModal}
          contentContainerStyle={styles.modalContainer}>
          <Text style={styles.modalTitle}>{t('welcome.selectLanguage')}</Text>

          <RadioButton.Group
            onValueChange={handleLanguageSelect}
            value={selectedLanguage}>
            {availableLanguages.map(language => (
              <View key={language.code} style={styles.languageOption}>
                <RadioButton.Item
                  label={`${language.nativeName} (${language.name})`}
                  value={language.code}
                  labelStyle={styles.radioLabel}
                  color={colors.primary}
                />
              </View>
            ))}
          </RadioButton.Group>

          <View style={styles.buttonRow}>
            <Button
              label={t('common.cancel')}
              variant="ghost"
              onPress={closeModal}
              style={styles.button}
            />
            <Button
              label={isChanging ? t('common.saving') : t('common.confirm')}
              onPress={handleConfirm}
              disabled={isChanging}
              style={styles.button}
            />
          </View>
        </Modal>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    margin: spacing.lg,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    maxHeight: '80%',
  },
  modalTitle: {
    ...typography.subtitle,
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  languageOption: {
    marginVertical: spacing.xs,
  },
  radioLabel: {
    fontSize: 14,
    color: colors.text,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.md,
  },
  button: {
    marginLeft: spacing.sm,
  },
});
