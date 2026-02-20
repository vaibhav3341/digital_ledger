import React from 'react';
import { StyleSheet } from 'react-native';
import { IconButton, Menu } from 'react-native-paper';
import { colors } from '../theme/colors';

interface OverflowMenuItem {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

interface OverflowMenuProps {
  items: OverflowMenuItem[];
  icon?: string;
}

export default function OverflowMenu({
  items,
  icon = 'dots-vertical',
}: OverflowMenuProps) {
  const [visible, setVisible] = React.useState(false);

  return (
    <Menu
      visible={visible}
      onDismiss={() => setVisible(false)}
      anchor={
        <IconButton
          icon={icon}
          onPress={() => setVisible(true)}
          iconColor={colors.text}
          style={styles.trigger}
          size={20}
        />
      }
    >
      {items.map((item, index) => (
        <Menu.Item
          key={`${item.label}-${index}`}
          title={item.label}
          onPress={() => {
            setVisible(false);
            item.onPress();
          }}
          disabled={item.disabled}
        />
      ))}
    </Menu>
  );
}

const styles = StyleSheet.create({
  trigger: {
    margin: 0,
  },
});
