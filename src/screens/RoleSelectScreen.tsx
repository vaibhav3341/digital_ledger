import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import Button from '../components/Button';
import Input from '../components/Input';
import { createOwnerProfile } from '../services/firestore';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { RootStackParamList } from '../navigation/RootNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export default function RoleSelectScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleOwner = async () => {
    const user = auth().currentUser;
    if (!user) {
      return;
    }
    if (!name.trim()) {
      Alert.alert('Enter your name');
      return;
    }
    try {
      setLoading(true);
      await createOwnerProfile({ uid: user.uid, name: name.trim(), phone });
    } catch (error) {
      Alert.alert('Failed to create profile', String(error));
    } finally {
      setLoading(false);
    }
  };

  const handleCoworker = () => {
    if (!name.trim()) {
      Alert.alert('Enter your name');
      return;
    }
    navigation.navigate('JoinInvite', { name: name.trim(), phone });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set up your account</Text>
      <Text style={styles.subtitle}>Select your role</Text>

      <Input
        label="Your name"
        value={name}
        placeholder="Full name"
        onChangeText={setName}
      />
      <Input
        label="Phone (optional)"
        value={phone}
        placeholder="+91XXXXXXXXXX"
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />

      <View style={styles.buttons}>
        <Button
          label={loading ? 'Creating...' : 'I am the Owner'}
          onPress={handleOwner}
          disabled={loading}
        />
        <Button
          label="I am a Coworker"
          onPress={handleCoworker}
          variant="secondary"
          style={styles.secondaryButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  title: {
    ...typography.title,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.muted,
    marginBottom: spacing.xl,
  },
  buttons: {
    marginTop: spacing.lg,
  },
  secondaryButton: {
    marginTop: spacing.sm,
  },
});
