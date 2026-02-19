import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Chip } from 'react-native-paper';
import { RecipientStatus } from '../models/types';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { formatSignedAmountFromCents } from '../utils/format';
import Button from './Button';

interface RecipientCardProps {
  name: string;
  status: RecipientStatus;
  netCents: number;
  onOpen: () => void;
  onSend: () => void;
  onReceive: () => void;
  onDelete?: () => void;
  deleteDisabled?: boolean;
}

export default function RecipientCard({
  name,
  status,
  netCents,
  onOpen,
  onSend,
  onReceive,
  onDelete,
  deleteDisabled,
}: RecipientCardProps) {
  const statusColor = status === 'JOINED' ? colors.primary : colors.muted;
  const netColor = netCents >= 0 ? colors.primary : colors.danger;
  const statusChipBackground = status === 'JOINED' ? colors.accent : colors.chip;

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

      <Text style={[styles.net, { color: netColor }]}>
        Net {formatSignedAmountFromCents(netCents)}
      </Text>

      <View style={styles.actions}>
        <Button
          label="Send"
          size="compact"
          variant="secondary"
          onPress={(event) => {
            event?.stopPropagation();
            onSend();
          }}
          style={styles.action}
        />
        <Button
          label="Receive"
          size="compact"
          variant="secondary"
          onPress={(event) => {
            event?.stopPropagation();
            onReceive();
          }}
          style={styles.action}
        />
      </View>

      {onDelete ? (
        <Button
          label={deleteDisabled ? 'Deleting...' : 'Delete Recipient'}
          variant="danger"
          size="compact"
          onPress={(event) => {
            event?.stopPropagation();
            onDelete();
          }}
          disabled={deleteDisabled}
          style={styles.deleteAction}
        />
      ) : null}
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
    ...typography.subtitle,
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  statusChip: {
    minHeight: 24,
    marginRight: spacing.xs,
  },
  statusText: {
    ...typography.chip,
  },
  net: {
    ...typography.bodyStrong,
    marginTop: spacing.sm,
  },
  actions: {
    marginTop: spacing.md,
    flexDirection: 'row',
  },
  action: {
    flex: 1,
    marginRight: spacing.sm,
  },
  deleteAction: {
    marginTop: spacing.sm,
  },
});
