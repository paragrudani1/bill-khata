/**
 * BillKhata Upgrade Prompt
 * Bottom sheet prompting user to upgrade or enter license key
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../../theme';
import { spacing, borderRadius } from '../../theme/spacing';
import { Text } from '../ui/Text';
import { Button } from '../ui/Button';
import { useLicense } from '../../hooks/useLicense';
import { LicenseKeyInput } from './LicenseKeyInput';

interface UpgradePromptProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

export function UpgradePrompt({
  visible,
  onClose,
  title,
  message,
}: UpgradePromptProps) {
  const { colors } = useTheme();
  const license = useLicense();
  const [showKeyInput, setShowKeyInput] = useState(false);

  const displayTitle = title || (license.isExpired ? 'Your trial has ended' : 'Upgrade Required');
  const displayMessage = message || 'Contact us to get a license key and unlock all features.';

  const handleWhatsApp = async () => {
    await license.openWhatsAppSupport();
  };

  const handleEnterKey = () => {
    setShowKeyInput(true);
  };

  const handleKeyInputClose = () => {
    setShowKeyInput(false);
  };

  const handleLicenseActivated = () => {
    setShowKeyInput(false);
    onClose();
  };

  if (showKeyInput) {
    return (
      <LicenseKeyInput
        visible={true}
        onClose={handleKeyInputClose}
        onSuccess={handleLicenseActivated}
      />
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <View style={styles.handle} />

          <View style={styles.content}>
            <Text variant="h2" style={styles.title}>
              {displayTitle}
            </Text>

            <Text variant="body" color="secondary" style={styles.message}>
              {displayMessage}
            </Text>

            {license.deviceFingerprint && (
              <View style={[styles.deviceInfo, { backgroundColor: colors.surfaceSecondary }]}>
                <Text variant="caption" color="secondary">
                  Device ID
                </Text>
                <Text variant="bodySmall" style={styles.deviceId}>
                  {license.deviceFingerprint}
                </Text>
              </View>
            )}

            <View style={styles.actions}>
              <Button
                title="WhatsApp"
                variant="primary"
                onPress={handleWhatsApp}
                style={styles.button}
                icon={<Text style={{ color: '#fff', marginRight: 4 }}>💬</Text>}
              />

              <Button
                title="Enter License Key"
                variant="outline"
                onPress={handleEnterKey}
                style={styles.button}
              />
            </View>

            <Pressable onPress={onClose} style={styles.cancelButton}>
              <Text variant="body" color="secondary">
                Maybe later
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
  deviceInfo: {
    width: '100%',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  deviceId: {
    marginTop: spacing.xs,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 1,
  },
  actions: {
    width: '100%',
    gap: spacing.sm,
  },
  button: {
    width: '100%',
  },
  cancelButton: {
    marginTop: spacing.lg,
    padding: spacing.sm,
  },
});
