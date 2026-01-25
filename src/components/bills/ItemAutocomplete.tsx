/**
 * BillKhata Item Autocomplete Component
 * Shows item suggestions with most frequent price
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
import { searchItems } from '../../db';
import { formatMoneyCompact } from '../../utils';

interface ItemSuggestion {
  id: string;
  name: string;
  suggestedPricePaise: number | null;
}

interface ItemAutocompleteProps {
  value: string;
  onChangeText: (text: string) => void;
  onSelectItem: (name: string, suggestedPricePaise: number | null) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function ItemAutocomplete({
  value,
  onChangeText,
  onSelectItem,
  placeholder = 'Item name',
  autoFocus = false,
}: ItemAutocompleteProps) {
  const { colors } = useTheme();
  const [suggestions, setSuggestions] = useState<ItemSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Fetch suggestions when value changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (value.length >= 2) {
        try {
          const results = await searchItems(value, 5);
          setSuggestions(results);
          setShowSuggestions(results.length > 0 && isFocused);
        } catch (error) {
          console.error('Error fetching suggestions:', error);
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

  const handleSelectItem = useCallback(
    (item: ItemSuggestion) => {
      onSelectItem(item.name, item.suggestedPricePaise);
      onChangeText(item.name);
      setShowSuggestions(false);
      Keyboard.dismiss();
    },
    [onSelectItem, onChangeText]
  );

  const handleFocus = () => {
    setIsFocused(true);
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = () => {
    // Delay hiding to allow tap on suggestion
    setTimeout(() => {
      setIsFocused(false);
      setShowSuggestions(false);
    }, 200);
  };

  return (
    <View style={styles.container}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        autoFocus={autoFocus}
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
                onPress={() => handleSelectItem(item)}
                style={({ pressed }) => [
                  styles.suggestionItem,
                  {
                    backgroundColor: pressed
                      ? colors.surfaceSecondary
                      : colors.surface,
                  },
                ]}
              >
                <Text variant="body" numberOfLines={1}>
                  {item.name}
                </Text>
                {item.suggestedPricePaise !== null && (
                  <Caption>
                    {formatMoneyCompact(item.suggestedPricePaise)}
                  </Caption>
                )}
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
    zIndex: 1000,
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
    top: 52,
    left: 0,
    right: 0,
    maxHeight: 200,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 1001,
  },
  suggestionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
  },
});
