/**
 * BillKhata Button Component
 * Primary action button with variants
 */

import React from 'react';
import {
  Pressable,
  PressableProps,
  StyleSheet,
  ViewStyle,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme';
import { spacing, borderRadius, touchTargets } from '../../theme/spacing';
import { Text } from './Text';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps extends Omit<PressableProps, 'children'> {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export function Button({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  disabled,
  onPress,
  style,
  ...props
}: ButtonProps) {
  const { colors } = useTheme();

  const handlePress = async (e: any) => {
    if (!disabled && !loading) {
      // Haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress?.(e);
    }
  };

  const sizeStyles: Record<ButtonSize, ViewStyle> = {
    small: {
      height: touchTargets.minimum,
      paddingHorizontal: spacing.md,
    },
    medium: {
      height: touchTargets.standard,
      paddingHorizontal: spacing.lg,
    },
    large: {
      height: touchTargets.large,
      paddingHorizontal: spacing.xl,
    },
  };

  const getVariantStyles = (pressed: boolean): ViewStyle => {
    const baseStyles: Record<ButtonVariant, ViewStyle> = {
      primary: {
        backgroundColor: pressed ? colors.primaryDark : colors.primary,
      },
      secondary: {
        backgroundColor: pressed ? colors.surfaceSecondary : colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: pressed ? colors.primaryDark : colors.primary,
      },
      ghost: {
        backgroundColor: pressed ? colors.surfaceSecondary : 'transparent',
      },
    };

    return baseStyles[variant];
  };

  const getTextColor = () => {
    if (disabled) return colors.textDisabled;

    switch (variant) {
      case 'primary':
        return colors.textInverse;
      case 'secondary':
        return colors.text;
      case 'outline':
        return colors.primary;
      case 'ghost':
        return colors.primary;
      default:
        return colors.text;
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        sizeStyles[size],
        getVariantStyles(pressed),
        disabled && styles.disabled,
        fullWidth && styles.fullWidth,
        style as ViewStyle,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          <Text
            variant={size === 'small' ? 'buttonSmall' : 'button'}
            style={{ color: getTextColor(), marginHorizontal: icon ? spacing.xs : 0 }}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
  },
  disabled: {
    opacity: 0.5,
  },
  fullWidth: {
    width: '100%',
  },
});
