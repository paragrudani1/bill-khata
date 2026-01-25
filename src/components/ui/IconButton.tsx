/**
 * BillKhata IconButton Component
 * Circular button for icons
 */

import React from 'react';
import {
  Pressable,
  PressableProps,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme';
import { touchTargets, borderRadius } from '../../theme/spacing';

type IconButtonSize = 'small' | 'medium' | 'large';
type IconButtonVariant = 'default' | 'primary' | 'ghost';

interface IconButtonProps extends Omit<PressableProps, 'children'> {
  icon: React.ReactNode;
  size?: IconButtonSize;
  variant?: IconButtonVariant;
  accessibilityLabel: string;
}

export function IconButton({
  icon,
  size = 'medium',
  variant = 'default',
  disabled,
  onPress,
  style,
  accessibilityLabel,
  ...props
}: IconButtonProps) {
  const { colors } = useTheme();

  const handlePress = async (e: any) => {
    if (!disabled) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress?.(e);
    }
  };

  const sizeValue: Record<IconButtonSize, number> = {
    small: touchTargets.minimum,
    medium: touchTargets.standard,
    large: touchTargets.large,
  };

  const getVariantStyles = (pressed: boolean): ViewStyle => {
    const styles: Record<IconButtonVariant, ViewStyle> = {
      default: {
        backgroundColor: pressed ? colors.surfaceSecondary : colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
      },
      primary: {
        backgroundColor: pressed ? colors.primaryDark : colors.primary,
      },
      ghost: {
        backgroundColor: pressed ? colors.surfaceSecondary : 'transparent',
      },
    };

    return styles[variant];
  };

  const dimension = sizeValue[size];

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: disabled ?? false }}
      style={({ pressed }) => [
        styles.base,
        {
          width: dimension,
          height: dimension,
        },
        getVariantStyles(pressed),
        disabled && styles.disabled,
        style as ViewStyle,
      ]}
      {...props}
    >
      {icon}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
  },
  disabled: {
    opacity: 0.5,
  },
});
