import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { RecipientStatus } from '../models/types';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import Button from './Button';
import { formatSignedAmountFromCents } from '../utils/format';

interface RecipientCardProps {
  name: string;
  status: RecipientStatus;
  netCents: number;
  onOpen: () => void;
  onSend: () => void;
  onReceive: () => void;
}

export default function RecipientCard({
  name,
  status,
  netCents,
  onOpen,
  onSend,
  onReceive,
}: RecipientCardProps) {
  const statusColor = status === 'JOINED' ? colors.primary : colors.muted;
  const netColor = netCents >= 0 ? colors.primary : colors.danger;

  return (
    <Pressable onPress={onOpen} style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.name}>{name}</Text>
        <Text style={[styles.status, { color: statusColor }]}>{status}</Text>
      </View>
      <Text style={[styles.net, { color: netColor }]}>
        Net: {formatSignedAmountFromCents(netCents)}
      </Text>
      <View style={styles.actions}>
        <Button
          label="Open"
          variant="secondary"
          onPress={onOpen}
          style={styles.action}
        />
        <Button label="Send" onPress={onSend} style={styles.action} />
        <Button
          label="Receive"
          variant="secondary"
          onPress={onReceive}
          style={styles.action}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
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
  status: {
    fontSize: 12,
    fontWeight: '700',
  },
  net: {
    marginTop: spacing.sm,
    fontSize: 13,
    fontWeight: '600',
  },
  actions: {
    marginTop: spacing.md,
    flexDirection: 'row',
  },
  action: {
    flex: 1,
    marginRight: spacing.sm,
  },
});
