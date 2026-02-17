import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Chip } from 'react-native-paper';
import { RecipientStatus } from '../models/types';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import Button from './Button';
import { formatSignedAmountFromCents } from '../utils/format';

interface RecipientCardProps {
  name: string;
  phoneNumber: string;
  status: RecipientStatus;
  netCents: number;
  onOpen: () => void;
  onSend: () => void;
  onReceive: () => void;
}

export default function RecipientCard({
  name,
  phoneNumber,
  status,
  netCents,
  onOpen,
  onSend,
  onReceive,
}: RecipientCardProps) {
  const statusColor = status === 'JOINED' ? colors.primary : colors.muted;
  const netColor = netCents >= 0 ? colors.primary : colors.danger;
  const statusChipBackground =
    status === 'JOINED' ? colors.accent : '#EEF3FA';

  return (
    <Pressable onPress={onOpen} style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.name}>{name}</Text>
        <Chip
          compact
          style={[styles.statusChip, { backgroundColor: statusChipBackground }]}
          textStyle={[styles.statusText, { color: statusColor }]}
        >
          {status}
        </Chip>
      </View>
      <Text style={styles.phone}>{phoneNumber}</Text>
      <Text style={[styles.net, { color: netColor }]}>
        Net: {formatSignedAmountFromCents(netCents)}
      </Text>
      <View style={styles.actions}>
        <Button
          label="Send"
          onPress={(event) => {
            event?.stopPropagation();
            onSend();
          }}
          style={styles.action}
        />
        <Button
          label="Receive"
          variant="secondary"
          onPress={(event) => {
            event?.stopPropagation();
            onReceive();
          }}
          style={styles.actionLast}
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
  statusChip: {
    minHeight: 26,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  phone: {
    marginTop: spacing.xs,
    fontSize: 12,
    color: colors.muted,
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
  actionLast: {
    flex: 1,
  },
});
