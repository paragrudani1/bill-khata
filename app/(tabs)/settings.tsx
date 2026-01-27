/**
 * BillKhata Settings Screen
 * Shop configuration and app preferences
 */

import { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Alert, Image, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useTheme, spacing, borderRadius } from '../../src/theme';
import { Text, Heading3, Card, Caption, Input, Button } from '../../src/components/ui';
import { useSettingsStore } from '../../src/stores';
import { InvoiceTemplate, SupportedLanguage } from '../../src/types';
import { InvoiceColorTheme } from '../../src/services';
import { useLicense } from '../../src/hooks';
import { UpgradePrompt, LicenseKeyInput } from '../../src/components/licensing';
import { LANGUAGE_NAMES, changeLanguage } from '../../src/i18n';

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
  const { t } = useTranslation('settings');
  const templates: { id: InvoiceTemplate; name: string; description: string }[] = [
    { id: 'classic', name: t('templates.classic'), description: t('templates.classicDesc') },
    { id: 'modern', name: t('templates.modern'), description: t('templates.modernDesc') },
    { id: 'compact', name: t('templates.compact'), description: t('templates.compactDesc') },
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
  const { t } = useTranslation('settings');
  const themes: { id: InvoiceColorTheme; name: string; color: string }[] = [
    { id: 'blue', name: t('colors.blue'), color: '#2563EB' },
    { id: 'green', name: t('colors.green'), color: '#16A34A' },
    { id: 'orange', name: t('colors.orange'), color: '#EA580C' },
    { id: 'purple', name: t('colors.purple'), color: '#9333EA' },
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

// Language Picker
function LanguagePicker({
  selected,
  onSelect,
}: {
  selected: SupportedLanguage;
  onSelect: (language: SupportedLanguage) => void;
}) {
  const { colors } = useTheme();
  const languages: { id: SupportedLanguage; name: string }[] = [
    { id: 'en', name: LANGUAGE_NAMES['en'] },
    { id: 'gu', name: LANGUAGE_NAMES['gu'] },
    { id: 'hi', name: LANGUAGE_NAMES['hi'] },
  ];

  return (
    <View style={styles.languagePickerContainer}>
      {languages.map((lang) => (
        <Pressable
          key={lang.id}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onSelect(lang.id);
          }}
          style={[
            styles.languageOption,
            {
              backgroundColor: selected === lang.id ? colors.primary : colors.surface,
              borderColor: selected === lang.id ? colors.primary : colors.border,
            },
          ]}
        >
          <Text
            variant="label"
            style={{ color: selected === lang.id ? colors.textInverse : colors.text }}
          >
            {lang.name}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function SettingsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const license = useLicense();
  const { t } = useTranslation(['settings', 'common']);

  // License-related state
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [showLicenseKeyInput, setShowLicenseKeyInput] = useState(false);

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
  const language = useSettingsStore((s) => s.language);

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
  const setLanguage = useSettingsStore((s) => s.setLanguage);

  // Handle language change
  const handleLanguageChange = (newLanguage: SupportedLanguage) => {
    setLanguage(newLanguage);
    changeLanguage(newLanguage);
  };

  // Editing state
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState('');

  const handleEditField = (field: string, currentValue: string) => {
    // Check license for protected fields
    if (!license.canEditSettings) {
      setShowUpgradePrompt(true);
      return;
    }
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
    // Check license
    if (!license.canEditSettings) {
      setShowUpgradePrompt(true);
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('common:messages.permissionRequired'), t('common:messages.allowPhotosAccess'));
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
    Alert.alert(t('removeLogo.title'), t('removeLogo.confirm'), [
      { text: t('common:buttons.cancel'), style: 'cancel' },
      {
        text: t('common:buttons.remove'),
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
      shopName: t('fields.shopName'),
      shopPhone: t('fields.phoneNumber'),
      shopAddress: t('fields.address'),
      footerNote: t('fields.footerNote'),
    };

    return (
      <View style={[styles.editOverlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.editModal, { backgroundColor: colors.surface }]}>
          <Heading3>{fieldLabels[editingField]}</Heading3>
          <Input
            value={tempValue}
            onChangeText={setTempValue}
            placeholder={fieldLabels[editingField]}
            autoFocus
            multiline={editingField === 'shopAddress' || editingField === 'footerNote'}
            containerStyle={styles.editInput}
          />
          <View style={styles.editButtons}>
            <Button
              title={t('common:buttons.cancel')}
              variant="ghost"
              onPress={() => setEditingField(null)}
              style={styles.editButton}
            />
            <Button
              title={t('common:buttons.save')}
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
          <Heading3 style={styles.sectionTitle}>{t('sections.shopDetails')}</Heading3>
          <Card variant="outlined" padding={0}>
            <SettingItem
              label={t('fields.shopName')}
              value={shopName || t('common:labels.notSet')}
              onPress={() => handleEditField('shopName', shopName)}
            />
            <SettingItem
              label={t('fields.phoneNumber')}
              value={shopPhone || t('common:labels.notSet')}
              onPress={() => handleEditField('shopPhone', shopPhone)}
            />
            <SettingItem
              label={t('fields.address')}
              value={shopAddress || t('common:labels.notSet')}
              onPress={() => handleEditField('shopAddress', shopAddress)}
            />
          </Card>

          {/* Logo */}
          <Card variant="outlined" style={styles.logoCard}>
            <Text variant="label" style={styles.logoLabel}>{t('fields.shopLogo')}</Text>
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
                  <Caption>{t('fields.addLogo')}</Caption>
                </Pressable>
              )}
              {shopLogoUri && (
                <Button
                  title={t('common:buttons.remove')}
                  variant="ghost"
                  size="small"
                  onPress={handleRemoveLogo}
                />
              )}
            </View>
          </Card>
        </View>

        {/* App Preferences - Language */}
        <View style={styles.section}>
          <Heading3 style={styles.sectionTitle}>{t('sections.appPreferences')}</Heading3>
          <Card variant="outlined" style={styles.customizeCard}>
            <Text variant="label" style={styles.customizeLabel}>{t('sections.language')}</Text>
            <LanguagePicker
              selected={language}
              onSelect={handleLanguageChange}
            />
          </Card>
        </View>

        {/* Invoice Customization */}
        <View style={styles.section}>
          <Heading3 style={styles.sectionTitle}>{t('sections.invoice')}</Heading3>

          <Card variant="outlined" style={styles.customizeCard}>
            <Text variant="label" style={styles.customizeLabel}>{t('fields.template')}</Text>
            <TemplatePicker
              selected={invoiceTemplate}
              onSelect={setInvoiceTemplate}
            />
          </Card>

          <Card variant="outlined" style={styles.customizeCard}>
            <Text variant="label" style={styles.customizeLabel}>{t('fields.colorTheme')}</Text>
            <ColorThemePicker
              selected={invoiceColorTheme}
              onSelect={setInvoiceColorTheme}
            />
          </Card>

          <Card variant="outlined" padding={0}>
            <SettingItem
              label={t('fields.footerNote')}
              value={footerNote ? t('common:labels.set') : t('common:labels.notSet')}
              onPress={() => handleEditField('footerNote', footerNote)}
            />
          </Card>
        </View>

        {/* GST Settings */}
        <View style={styles.section}>
          <Heading3 style={styles.sectionTitle}>{t('sections.gst')}</Heading3>
          <Card variant="outlined" style={styles.customizeCard}>
            <View style={styles.gstToggleRow}>
              <Text variant="label">{t('fields.defaultGst')}</Text>
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
                  {defaultGstEnabled ? t('common:labels.on') : t('common:labels.off')}
                </Text>
              </Pressable>
            </View>

            {defaultGstEnabled && (
              <>
                <Text variant="label" style={styles.customizeLabel}>{t('fields.defaultRate')}</Text>
                <GstRatePicker
                  selected={defaultGstRate}
                  onSelect={setDefaultGstRate}
                />
              </>
            )}
          </Card>
        </View>

        {/* Trash */}
        <View style={styles.section}>
          <Card variant="outlined" padding={0}>
            <SettingItem
              label={t('trash')}
              value={undefined}
              onPress={() => router.push('/trash')}
            />
          </Card>
        </View>

        {/* License */}
        <View style={styles.section}>
          <Heading3 style={styles.sectionTitle}>{t('sections.license')}</Heading3>
          <Card variant="outlined" style={styles.licenseCard}>
            <View style={styles.licenseStatus}>
              <Text variant="label">{t('license.status')}</Text>
              <View style={[
                styles.statusBadge,
                {
                  backgroundColor: license.isLicensed
                    ? colors.success + '20'
                    : license.isTrialActive
                    ? colors.primary + '20'
                    : colors.error + '20',
                }
              ]}>
                <Text
                  variant="caption"
                  style={{
                    color: license.isLicensed
                      ? colors.success
                      : license.isTrialActive
                      ? colors.primary
                      : colors.error,
                  }}
                >
                  {license.isLicensed
                    ? t('license.licensed')
                    : license.isTrialActive
                    ? t('license.trial', { days: license.daysRemaining })
                    : t('license.expired')}
                </Text>
              </View>
            </View>

            {license.deviceFingerprint && (
              <View style={styles.deviceIdContainer}>
                <Text variant="label">{t('fields.deviceId')}</Text>
                <Text
                  variant="caption"
                  color="secondary"
                  style={styles.deviceIdText}
                  selectable
                >
                  {license.deviceFingerprint}
                </Text>
              </View>
            )}

            {!license.isLicensed && (
              <View style={styles.licenseActions}>
                <Button
                  title={t('fields.enterLicenseKey')}
                  variant="outline"
                  size="small"
                  onPress={() => setShowLicenseKeyInput(true)}
                  style={styles.licenseButton}
                />
                <Button
                  title={t('fields.getLicense')}
                  variant="primary"
                  size="small"
                  onPress={license.openWhatsAppSupport}
                  style={styles.licenseButton}
                />
              </View>
            )}
          </Card>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Card variant="filled">
            <Text variant="caption" color="secondary" align="center">
              {t('about.version')}
            </Text>
            <Caption style={styles.aboutText}>
              {t('about.madeWith')}
            </Caption>
          </Card>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Edit Modal */}
      {renderEditModal()}

      {/* Upgrade Prompt */}
      <UpgradePrompt
        visible={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
      />

      {/* License Key Input */}
      <LicenseKeyInput
        visible={showLicenseKeyInput}
        onClose={() => setShowLicenseKeyInput(false)}
      />
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
  languagePickerContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  languageOption: {
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
  licenseCard: {
    gap: spacing.md,
  },
  licenseStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  deviceIdContainer: {
    gap: spacing.xs,
  },
  deviceIdText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 1,
  },
  licenseActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  licenseButton: {
    flex: 1,
  },
});
