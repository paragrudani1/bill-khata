/**
 * BillKhata Text Component
 * Themed text with predefined styles
 */

import React from 'react';
import {
  Text as RNText,
  TextProps as RNTextProps,
  StyleSheet,
  TextStyle,
} from 'react-native';
import { useTheme } from '../../theme';
import { textStyles, fontWeights } from '../../theme/typography';

type TextVariant = keyof typeof textStyles;

interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: 'primary' | 'secondary' | 'tertiary' | 'error' | 'success' | 'inverse';
  weight?: keyof typeof fontWeights;
  align?: TextStyle['textAlign'];
  children: React.ReactNode;
}

export function Text({
  variant = 'body',
  color = 'primary',
  weight,
  align,
  style,
  children,
  ...props
}: TextProps) {
  const { colors } = useTheme();

  const colorMap = {
    primary: colors.text,
    secondary: colors.textSecondary,
    tertiary: colors.textTertiary,
    error: colors.error,
    success: colors.success,
    inverse: colors.textInverse,
  };

  const variantStyle = textStyles[variant];

  return (
    <RNText
      style={[
        variantStyle,
        { color: colorMap[color] },
        weight && { fontWeight: fontWeights[weight] },
        align && { textAlign: align },
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  );
}

// Convenience components
export function Heading1(props: Omit<TextProps, 'variant'>) {
  return <Text variant="h1" {...props} />;
}

export function Heading2(props: Omit<TextProps, 'variant'>) {
  return <Text variant="h2" {...props} />;
}

export function Heading3(props: Omit<TextProps, 'variant'>) {
  return <Text variant="h3" {...props} />;
}

export function Caption(props: Omit<TextProps, 'variant'>) {
  return <Text variant="caption" color="secondary" {...props} />;
}

export function MoneyText(props: Omit<TextProps, 'variant'>) {
  return <Text variant="money" {...props} />;
}

export function MoneyLarge(props: Omit<TextProps, 'variant'>) {
  return <Text variant="moneyLarge" {...props} />;
}
