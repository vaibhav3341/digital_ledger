import React, { useRef } from 'react';
import {
  Animated,
  GestureResponderEvent,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Button, ButtonProps } from 'react-native-paper';

interface AnimatedButtonProps extends ButtonProps {
  containerStyle?: StyleProp<ViewStyle>;
  pressScale?: number;
}

export default function AnimatedButton({
  containerStyle,
  pressScale = 0.96,
  disabled,
  onPressIn,
  onPressOut,
  ...props
}: AnimatedButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (toValue: number) => {
    Animated.spring(scale, {
      toValue,
      useNativeDriver: true,
      speed: 30,
      bounciness: 8,
    }).start();
  };

  const handlePressIn = (event: GestureResponderEvent) => {
    if (!disabled) {
      animateTo(pressScale);
    }
    onPressIn?.(event);
  };

  const handlePressOut = (event: GestureResponderEvent) => {
    if (!disabled) {
      animateTo(1);
    }
    onPressOut?.(event);
  };

  return (
    <Animated.View
      style={[styles.container, { transform: [{ scale }] }, containerStyle]}
    >
      <Button
        {...props}
        disabled={disabled}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
  },
});
