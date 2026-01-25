/**
 * BillKhata Settings Screen
 * Shop configuration and app preferences
 */

import { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useTheme, spacing, borderRadius } from '../../src/theme';
import { Text, Heading3, Card, Caption, Input, Button } from '../../src/components/ui';
import { useSettingsStore } from '../../src/stores';
import { InvoiceTemplate, SupportedLanguage } from '../../src/types';
import { InvoiceColorTheme } from '../../src/services';

interface SettingItemProps {
  label: string;
  value?: string;
  onPress?: () => void;
  showArrow?: boolean;
}

function SettingItem({ label, value, onPress, showArrow = true }: SettingItemProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[styles.settingItem, { borderBottomColor: colors.border }]}
      disabled={!onPress}
    >
      <Text variant="body">{label}</Text>
      <View style={styles.settingValue}>
        {value && (
          <Text variant="body" color="secondary">
            {value}
          </Text>
        )}
        {showArrow && onPress && (
          <Text color="tertiary" style={styles.arrow}>
            →
          </Text>
        )}
      </View>
    </Pressable>
  );
}

// Template Picker Modal Content
function TemplatePicker({
  selected,
  onSelect
}: {
  selected: InvoiceTemplate;
  onSelect: (template: InvoiceTemplate) => void;
}) {
  const { colors } = useTheme();
  const templates: { id: InvoiceTemplate; name: string; description: string }[] = [
    { id: 'classic', name: 'Classic', description: 'Traditional professional look' },
    { id: 'modern', name: 'Modern', description: 'Clean with rounded corners' },
    { id: 'compact', name: 'Compact', description: 'Smaller fonts, more items' },
  ];

  return (
    <View style={styles.pickerContainer}>
      {templates.map((template) => (
        <Pressable
          key={template.id}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onSelect(template.id);
          }}
          style={[
            styles.pickerOption,
            {
              backgroundColor: selected === template.id ? colors.primary : colors.surface,
              borderColor: selected === template.id ? colors.primary : colors.border,
            },
          ]}
        >
          <Text
            variant="label"
            style={{ color: selected === template.id ? colors.textInverse : colors.text }}
          >
            {template.name}
          </Text>
          <Caption
            style={{ color: selected === template.id ? colors.textInverse : colors.textSecondary }}
          >
            {template.description}
          </Caption>
        </Pressable>
      ))}
    </View>
  );
}

// Color Theme Picker
function ColorThemePicker({
  selected,
  onSelect,
}: {
  selected: InvoiceColorTheme;
  onSelect: (theme: InvoiceColorTheme) => void;
}) {
  const { colors } = useTheme();
  const themes: { id: InvoiceColorTheme; name: string; color: string }[] = [
    { id: 'blue', name: 'Blue', color: '#2563EB' },
    { id: 'green', name: 'Green', color: '#16A34A' },
    { id: 'orange', name: 'Orange', color: '#EA580C' },
    { id: 'purple', name: 'Purple', color: '#9333EA' },
  ];

  return (
    <View style={styles.colorPickerContainer}>
      {themes.map((theme) => (
        <Pressable
          key={theme.id}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onSelect(theme.id);
          }}
          style={[
            styles.colorOption,
            {
              borderColor: selected === theme.id ? colors.text : 'transparent',
              borderWidth: selected === theme.id ? 3 : 0,
            },
          ]}
        >
          <View style={[styles.colorSwatch, { backgroundColor: theme.color }]} />
          <Caption>{theme.name}</Caption>
        </Pressable>
      ))}
    </View>
  );
}

// GST Rate Picker
function GstRatePicker({
  selected,
  onSelect,
}: {
  selected: 5 | 12 | 18 | 28;
  onSelect: (rate: 5 | 12 | 18 | 28) => void;
}) {
  const { colors } = useTheme();
  const rates: (5 | 12 | 18 | 28)[] = [5, 12, 18, 28];

  return (
    <View style={styles.gstPickerContainer}>
      {rates.map((rate) => (
        <Pressable
          key={rate}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onSelect(rate);
          }}
          style={[
            styles.gstOption,
            {
              backgroundColor: selected === rate ? colors.primary : colors.surface,
              borderColor: selected === rate ? colors.primary : colors.border,
            },
          ]}
        >
          <Text
            variant="label"
            style={{ color: selected === rate ? colors.textInverse : colors.text }}
          >
            {rate}%
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function SettingsScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  // Settings from store
  const shopName = useSettingsStore((s) => s.shopName);
  const shopPhone = useSettingsStore((s) => s.shopPhone);
  const shopAddress = useSettingsStore((s) => s.shopAddress);
  const shopLogoUri = useSettingsStore((s) => s.shopLogoUri);
  const invoiceTemplate = useSettingsStore((s) => s.invoiceTemplate);
  const invoiceColorTheme = useSettingsStore((s) => s.invoiceColorTheme);
  const footerNote = useSettingsStore((s) => s.footerNote);
  const defaultGstEnabled = useSettingsStore((s) => s.defaultGstEnabled);
  const defaultGstRate = useSettingsStore((s) => s.defaultGstRate);

  // Setters
  const setShopName = useSettingsStore((s) => s.setShopName);
  const setShopPhone = useSettingsStore((s) => s.setShopPhone);
  const setShopAddress = useSettingsStore((s) => s.setShopAddress);
  const setShopLogo = useSettingsStore((s) => s.setShopLogo);
  const setInvoiceTemplate = useSettingsStore((s) => s.setInvoiceTemplate);
  const setInvoiceColorTheme = useSettingsStore((s) => s.setInvoiceColorTheme);
  const setFooterNote = useSettingsStore((s) => s.setFooterNote);
  const setDefaultGstEnabled = useSettingsStore((s) => s.setDefaultGstEnabled);
  const setDefaultGstRate = useSettingsStore((s) => s.setDefaultGstRate);

  // Editing state
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState('');

  const handleEditField = (field: string, currentValue: string) => {
    setEditingField(field);
    setTempValue(currentValue);
  };

  const handleSaveField = (field: string) => {
    switch (field) {
      case 'shopName':
        setShopName(tempValue);
        break;
      case 'shopPhone':
        setShopPhone(tempValue);
        break;
      case 'shopAddress':
        setShopAddress(tempValue);
        break;
      case 'footerNote':
        setFooterNote(tempValue);
        break;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setEditingField(null);
  };

  const handlePickLogo = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photos to select a logo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setShopLogo(result.assets[0].uri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleRemoveLogo = () => {
    Alert.alert('Remove Logo', 'Are you sure you want to remove the shop logo?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          setShopLogo(null);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        },
      },
    ]);
  };

  // Render edit modal for text fields
  const renderEditModal = () => {
    if (!editingField) return null;

    const fieldLabels: Record<string, string> = {
      shopName: 'Shop Name',
      shopPhone: 'Phone Number',
      shopAddress: 'Address',
      footerNote: 'Footer Note',
    };

    return (
      <View style={[styles.editOverlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.editModal, { backgroundColor: colors.surface }]}>
          <Heading3>{fieldLabels[editingField]}</Heading3>
          <Input
            value={tempValue}
            onChangeText={setTempValue}
            placeholder={`Enter ${fieldLabels[editingField].toLowerCase()}`}
            autoFocus
            multiline={editingField === 'shopAddress' || editingField === 'footerNote'}
            containerStyle={styles.editInput}
          />
          <View style={styles.editButtons}>
            <Button
              title="Cancel"
              variant="ghost"
              onPress={() => setEditingField(null)}
              style={styles.editButton}
            />
            <Button
              title="Save"
              variant="primary"
              onPress={() => handleSaveField(editingField)}
              style={styles.editButton}
            />
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Shop Details */}
        <View style={styles.section}>
          <Heading3 style={styles.sectionTitle}>Shop Details</Heading3>
          <Card variant="outlined" padding={0}>
            <SettingItem
              label="Shop Name"
              value={shopName || 'Not set'}
              onPress={() => handleEditField('shopName', shopName)}
            />
            <SettingItem
              label="Phone Number"
              value={shopPhone || 'Not set'}
              onPress={() => handleEditField('shopPhone', shopPhone)}
            />
            <SettingItem
              label="Address"
              value={shopAddress || 'Not set'}
              onPress={() => handleEditField('shopAddress', shopAddress)}
            />
          </Card>

          {/* Logo */}
          <Card variant="outlined" style={styles.logoCard}>
            <Text variant="label" style={styles.logoLabel}>Shop Logo</Text>
            <View style={styles.logoContainer}>
              {shopLogoUri ? (
                <Pressable onPress={handlePickLogo}>
                  <Image source={{ uri: shopLogoUri }} style={styles.logoImage} />
                </Pressable>
              ) : (
                <Pressable
                  onPress={handlePickLogo}
                  style={[styles.logoPlaceholder, { borderColor: colors.border }]}
                >
                  <Text style={styles.logoPlaceholderText}>📷</Text>
                  <Caption>Add Logo</Caption>
                </Pressable>
              )}
              {shopLogoUri && (
                <Button
                  title="Remove"
                  variant="ghost"
                  size="small"
                  onPress={handleRemoveLogo}
                />
              )}
            </View>
          </Card>
        </View>

        {/* Invoice Customization */}
        <View style={styles.section}>
          <Heading3 style={styles.sectionTitle}>Invoice Customization</Heading3>

          <Card variant="outlined" style={styles.customizeCard}>
            <Text variant="label" style={styles.customizeLabel}>Template</Text>
            <TemplatePicker
              selected={invoiceTemplate}
              onSelect={setInvoiceTemplate}
            />
          </Card>

          <Card variant="outlined" style={styles.customizeCard}>
            <Text variant="label" style={styles.customizeLabel}>Color Theme</Text>
            <ColorThemePicker
              selected={invoiceColorTheme}
              onSelect={setInvoiceColorTheme}
            />
          </Card>

          <Card variant="outlined" padding={0}>
            <SettingItem
              label="Footer Note"
              value={footerNote ? 'Set' : 'Not set'}
              onPress={() => handleEditField('footerNote', footerNote)}
            />
          </Card>
        </View>

        {/* GST Settings */}
        <View style={styles.section}>
          <Heading3 style={styles.sectionTitle}>GST Settings</Heading3>
          <Card variant="outlined" style={styles.customizeCard}>
            <View style={styles.gstToggleRow}>
              <Text variant="label">Default GST</Text>
              <Pressable
                onPress={() => {
                  setDefaultGstEnabled(!defaultGstEnabled);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={[
                  styles.toggleButton,
                  {
                    backgroundColor: defaultGstEnabled ? colors.primary : colors.surfaceSecondary,
                    borderColor: defaultGstEnabled ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  variant="caption"
                  style={{ color: defaultGstEnabled ? colors.textInverse : colors.text }}
                >
                  {defaultGstEnabled ? 'ON' : 'OFF'}
                </Text>
              </Pressable>
            </View>

            {defaultGstEnabled && (
              <>
                <Text variant="label" style={styles.customizeLabel}>Default Rate</Text>
                <GstRatePicker
                  selected={defaultGstRate}
                  onSelect={setDefaultGstRate}
                />
              </>
            )}
          </Card>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Card variant="outlined" padding={0}>
            <SettingItem
              label="Trash"
              value={undefined}
              onPress={() => router.push('/trash')}
            />
          </Card>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Card variant="filled">
            <Text variant="caption" color="secondary" align="center">
              BillKhata v1.0.0
            </Text>
            <Caption style={styles.aboutText}>
              Made with ❤️ for Indian shopkeepers
            </Caption>
          </Card>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Edit Modal */}
      {renderEditModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    marginBottom: spacing.sm,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingValue: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '50%',
  },
  arrow: {
    marginLeft: spacing.xs,
  },
  logoCard: {
    marginTop: spacing.sm,
  },
  logoLabel: {
    marginBottom: spacing.sm,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoPlaceholderText: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  customizeCard: {
    marginBottom: spacing.sm,
  },
  customizeLabel: {
    marginBottom: spacing.sm,
  },
  pickerContainer: {
    gap: spacing.sm,
  },
  pickerOption: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  colorPickerContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  colorOption: {
    alignItems: 'center',
    padding: spacing.xs,
    borderRadius: borderRadius.md,
  },
  colorSwatch: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    marginBottom: spacing.xs,
  },
  gstPickerContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  gstOption: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  gstToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  toggleButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  aboutText: {
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  bottomSpacer: {
    height: spacing.xl,
  },
  editOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  editModal: {
    width: '100%',
    maxWidth: 400,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  editInput: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  editButton: {
    minWidth: 80,
  },
});
