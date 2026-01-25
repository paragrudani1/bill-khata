/**
 * BillKhata Card Component
 * Container with shadow and rounded corners
 */

import React from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  ViewStyle,
  PressableProps,
} from 'react-native';
import { useTheme } from '../../theme';
import { spacing, borderRadius } from '../../theme/spacing';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'elevated' | 'outlined' | 'filled';
  padding?: keyof typeof spacing | number;
}

export function Card({
  children,
  style,
  variant = 'elevated',
  padding = 'md',
}: CardProps) {
  const { colors } = useTheme();

  const paddingValue = typeof padding === 'number' ? padding : spacing[padding];

  const variantStyles: Record<string, ViewStyle> = {
    elevated: {
      backgroundColor: colors.surface,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 8,
      elevation: 3,
    },
    outlined: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filled: {
      backgroundColor: colors.surfaceSecondary,
    },
  };

  return (
    <View
      style={[
        styles.base,
        variantStyles[variant],
        { padding: paddingValue },
        style,
      ]}
    >
      {children}
    </View>
  );
}

// Pressable card variant
interface PressableCardProps extends CardProps, Omit<PressableProps, 'children' | 'style'> {}

export function PressableCard({
  children,
  style,
  variant = 'elevated',
  padding = 'md',
  onPress,
  ...props
}: PressableCardProps) {
  const { colors } = useTheme();

  const paddingValue = typeof padding === 'number' ? padding : spacing[padding];

  const getVariantStyles = (pressed: boolean): ViewStyle => {
    const base: Record<string, ViewStyle> = {
      elevated: {
        backgroundColor: pressed ? colors.surfaceSecondary : colors.surface,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: pressed ? 1 : 2 },
        shadowOpacity: 1,
        shadowRadius: pressed ? 4 : 8,
        elevation: pressed ? 1 : 3,
      },
      outlined: {
        backgroundColor: pressed ? colors.surfaceSecondary : colors.surface,
        borderWidth: 1,
        borderColor: pressed ? colors.primary : colors.border,
      },
      filled: {
        backgroundColor: pressed ? colors.border : colors.surfaceSecondary,
      },
    };

    return base[variant];
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        getVariantStyles(pressed),
        { padding: paddingValue },
        style,
      ]}
      {...props}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
});
