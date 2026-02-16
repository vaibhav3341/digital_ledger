import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from 'react-native-paper';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { formatAmount, formatDate } from '../utils/format';

interface CoworkerCardProps {
  name: string;
  balance: number;
  lastActivity?: Date | null;
  onPress: () => void;
}

export default function CoworkerCard({
  name,
  balance,
  lastActivity,
  onPress,
}: CoworkerCardProps) {
  return (
    <Card onPress={onPress} style={styles.card} mode="contained">
      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.balance}>{formatAmount(balance)}</Text>
        </View>
        <Text style={styles.meta}>
          Last entry: {lastActivity ? formatDate(lastActivity) : 'No entries'}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  content: {
    padding: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  balance: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  meta: {
    marginTop: spacing.sm,
    color: colors.muted,
    fontSize: 12,
  },
});
