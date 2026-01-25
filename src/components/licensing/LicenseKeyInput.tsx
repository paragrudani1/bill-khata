/**
 * BillKhata License Key Input
 * Modal for entering and activating a license key
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../theme';
import { spacing, borderRadius } from '../../theme/spacing';
import { Text } from '../ui/Text';
import { Button } from '../ui/Button';
import { useLicense } from '../../hooks/useLicense';

interface LicenseKeyInputProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function LicenseKeyInput({
  visible,
  onClose,
  onSuccess,
}: LicenseKeyInputProps) {
  const { colors } = useTheme();
  const license = useLicense();

  const [licenseKey, setLicenseKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isActivating, setIsActivating] = useState(false);

  // Format input as XXXX-XXXX-XXXX-XXXX
  const handleKeyChange = (text: string) => {
    // Remove any non-alphanumeric characters
    const cleaned = text.toUpperCase().replace(/[^A-Z0-9]/g, '');

    // Add dashes every 4 characters
    const parts = [];
    for (let i = 0; i < cleaned.length && i < 16; i += 4) {
      parts.push(cleaned.slice(i, i + 4));
    }

    setLicenseKey(parts.join('-'));
    setError(null);
  };

  const handleActivate = async () => {
    if (licenseKey.length !== 19) {
      setError('Please enter a complete license key');
      return;
    }

    setIsActivating(true);
    setError(null);

    try {
      const result = await license.activateLicense(licenseKey);

      if (result.success) {
        onSuccess?.();
        onClose();
      } else {
        setError(result.error || 'Invalid license key');
      }
    } catch (e) {
      setError('Activation failed. Please try again.');
    } finally {
      setIsActivating(false);
    }
  };

  const handleClose = () => {
    setLicenseKey('');
    setError(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <Pressable style={styles.backdrop} onPress={handleClose} />

        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <View style={styles.handle} />

          <View style={styles.content}>
            <Text variant="h2" style={styles.title}>
              Enter License Key
            </Text>

            <Text variant="body" color="secondary" style={styles.message}>
              Enter the license key you received to unlock all features.
            </Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surfaceSecondary,
                    color: colors.text,
                    borderColor: error ? colors.error : colors.border,
                  },
                ]}
                value={licenseKey}
                onChangeText={handleKeyChange}
                placeholder="XXXX-XXXX-XXXX-XXXX"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={19}
                editable={!isActivating}
              />

              {error && (
                <Text variant="caption" color="error" style={styles.errorText}>
                  {error}
                </Text>
              )}
            </View>

            <Button
              title={isActivating ? 'Activating...' : 'Activate'}
              variant="primary"
              onPress={handleActivate}
              disabled={licenseKey.length !== 19 || isActivating}
              loading={isActivating}
              fullWidth
              style={styles.activateButton}
            />

            <Pressable onPress={handleClose} style={styles.cancelButton}>
              <Text variant="body" color="secondary">
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingBottom: spacing.xl,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#ccc',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  content: {
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  title: {
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  message: {
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  input: {
    width: '100%',
    height: 56,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    paddingHorizontal: spacing.lg,
    fontSize: 20,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 2,
    textAlign: 'center',
  },
  errorText: {
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  activateButton: {
    marginBottom: spacing.md,
  },
  cancelButton: {
    padding: spacing.sm,
  },
});
