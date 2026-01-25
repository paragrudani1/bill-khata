/**
 * BillKhata Input Component
 * Text input with label and error states
 */

import React, { forwardRef, useState } from 'react';
import {
  View,
  TextInput,
  TextInputProps,
  StyleSheet,
  ViewStyle,
  Pressable,
} from 'react-native';
import { useTheme } from '../../theme';
import { spacing, borderRadius, touchTargets } from '../../theme/spacing';
import { fontSizes, fontWeights } from '../../theme/typography';
import { Text } from './Text';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
}

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      onRightIconPress,
      containerStyle,
      style,
      editable = true,
      ...props
    },
    ref
  ) => {
    const { colors } = useTheme();
    const [isFocused, setIsFocused] = useState(false);

    const getBorderColor = () => {
      if (error) return colors.error;
      if (isFocused) return colors.primary;
      return colors.border;
    };

    return (
      <View style={[styles.container, containerStyle]}>
        {label && (
          <Text variant="label" style={styles.label}>
            {label}
          </Text>
        )}

        <View
          style={[
            styles.inputContainer,
            {
              borderColor: getBorderColor(),
              backgroundColor: editable ? colors.surface : colors.surfaceSecondary,
            },
          ]}
        >
          {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

          <TextInput
            ref={ref}
            style={[
              styles.input,
              {
                color: colors.text,
              },
              leftIcon ? styles.inputWithLeftIcon : undefined,
              rightIcon ? styles.inputWithRightIcon : undefined,
              style,
            ]}
            placeholderTextColor={colors.textTertiary}
            editable={editable}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            {...props}
          />

          {rightIcon && (
            <Pressable
              onPress={onRightIconPress}
              style={styles.rightIcon}
              disabled={!onRightIconPress}
            >
              {rightIcon}
            </Pressable>
          )}
        </View>

        {(error || hint) && (
          <Text
            variant="caption"
            color={error ? 'error' : 'secondary'}
            style={styles.helperText}
          >
            {error || hint}
          </Text>
        )}
      </View>
    );
  }
);

Input.displayName = 'Input';

// Numeric input variant
interface NumericInputProps extends Omit<InputProps, 'keyboardType'> {
  value: string;
  onChangeValue: (value: string) => void;
  allowDecimal?: boolean;
  prefix?: string;
}

export const NumericInput = forwardRef<TextInput, NumericInputProps>(
  ({ value, onChangeValue, allowDecimal = true, prefix, ...props }, ref) => {
    const handleChange = (text: string) => {
      // Remove non-numeric characters except decimal point
      let cleaned = text.replace(/[^0-9.]/g, '');

      // Handle decimal points
      if (!allowDecimal) {
        cleaned = cleaned.replace(/\./g, '');
      } else {
        // Only allow one decimal point
        const parts = cleaned.split('.');
        if (parts.length > 2) {
          cleaned = parts[0] + '.' + parts.slice(1).join('');
        }
        // Limit to 2 decimal places
        if (parts[1]?.length > 2) {
          cleaned = parts[0] + '.' + parts[1].slice(0, 2);
        }
      }

      onChangeValue(cleaned);
    };

    return (
      <Input
        ref={ref}
        value={prefix ? `${prefix}${value}` : value}
        onChangeText={(text) => {
          const valueWithoutPrefix = prefix ? text.replace(prefix, '') : text;
          handleChange(valueWithoutPrefix);
        }}
        keyboardType="decimal-pad"
        {...props}
      />
    );
  }
);

NumericInput.displayName = 'NumericInput';

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    marginBottom: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    minHeight: touchTargets.standard,
  },
  input: {
    flex: 1,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.regular,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  inputWithLeftIcon: {
    paddingLeft: spacing.xs,
  },
  inputWithRightIcon: {
    paddingRight: spacing.xs,
  },
  leftIcon: {
    paddingLeft: spacing.md,
  },
  rightIcon: {
    paddingRight: spacing.md,
    minWidth: touchTargets.minimum,
    minHeight: touchTargets.minimum,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helperText: {
    marginTop: spacing.xs,
  },
});
