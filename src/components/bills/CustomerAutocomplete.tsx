/**
 * BillKhata Customer Autocomplete Component
 * Inline autocomplete for customer selection
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  Keyboard,
} from 'react-native';
import { useTheme, spacing, borderRadius } from '../../theme';
import { Text, Caption } from '../ui';
import { searchCustomers } from '../../db';

interface CustomerSuggestion {
  id: string;
  name: string;
  phone: string | null;
}

interface CustomerAutocompleteProps {
  value: string;
  onChangeText: (text: string) => void;
  onSelectCustomer: (id: string | null, name: string) => void;
  placeholder?: string;
}

export function CustomerAutocomplete({
  value,
  onChangeText,
  onSelectCustomer,
  placeholder = 'Customer name (optional)',
}: CustomerAutocompleteProps) {
  const { colors } = useTheme();
  const [suggestions, setSuggestions] = useState<CustomerSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Fetch suggestions when value changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (value.length >= 2) {
        try {
          const results = await searchCustomers(value, 5);
          setSuggestions(results);
          setShowSuggestions(results.length > 0 && isFocused);
        } catch (error) {
          console.error('Error fetching customer suggestions:', error);
          setSuggestions([]);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 150);
    return () => clearTimeout(debounce);
  }, [value, isFocused]);

  const handleSelectCustomer = useCallback(
    (customer: CustomerSuggestion) => {
      onSelectCustomer(customer.id, customer.name);
      onChangeText(customer.name);
      setShowSuggestions(false);
      Keyboard.dismiss();
    },
    [onSelectCustomer, onChangeText]
  );

  const handleChangeText = (text: string) => {
    onChangeText(text);
    // Clear customer ID if user is typing (not selecting)
    onSelectCustomer(null, text);
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      setIsFocused(false);
      setShowSuggestions(false);
    }, 200);
  };

  return (
    <View style={styles.container}>
      <Text variant="label" style={styles.label}>
        Customer (Optional)
      </Text>
      <TextInput
        value={value}
        onChangeText={handleChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        autoCapitalize="words"
        autoCorrect={false}
        style={[
          styles.input,
          {
            backgroundColor: colors.surface,
            borderColor: isFocused ? colors.primary : colors.border,
            color: colors.text,
          },
        ]}
      />

      {showSuggestions && suggestions.length > 0 && (
        <ScrollView
          style={[
            styles.suggestionsContainer,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              shadowColor: colors.shadow,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={true}
        >
          {suggestions.map((item, index) => (
            <React.Fragment key={item.id}>
              {index > 0 && (
                <View style={[styles.separator, { backgroundColor: colors.border }]} />
              )}
              <Pressable
                onPress={() => handleSelectCustomer(item)}
                style={({ pressed }) => [
                  styles.suggestionItem,
                  {
                    backgroundColor: pressed
                      ? colors.surfaceSecondary
                      : colors.surface,
                  },
                ]}
              >
                <View>
                  <Text variant="body" numberOfLines={1}>
                    {item.name}
                  </Text>
                  {item.phone && <Caption>{item.phone}</Caption>}
                </View>
              </Pressable>
            </React.Fragment>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 2,
    marginBottom: spacing.md,
  },
  label: {
    marginBottom: spacing.xs,
  },
  input: {
    height: 48,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    fontSize: 16,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 76,
    left: 0,
    right: 0,
    maxHeight: 200,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  suggestionItem: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
  },
});
