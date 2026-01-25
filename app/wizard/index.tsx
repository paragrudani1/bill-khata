/**
 * BillKhata Setup Wizard
 * First-launch onboarding flow (all steps skippable)
 */

import { useState } from 'react';
import { View, StyleSheet, Pressable, Image, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useTheme, spacing, borderRadius } from '../../src/theme';
import { Text, Heading1, Heading2, Button, Input, Card, Caption } from '../../src/components/ui';
import { useSettingsStore } from '../../src/stores';
import { InvoiceTemplate } from '../../src/types';
import { InvoiceColorTheme } from '../../src/services';

type WizardStep = 'welcome' | 'shop-info' | 'logo' | 'branding' | 'gst' | 'done';

const STEPS: WizardStep[] = ['welcome', 'shop-info', 'logo', 'branding', 'gst', 'done'];

export default function SetupWizard() {
  const { colors } = useTheme();
  const router = useRouter();

  // Current step
  const [currentStep, setCurrentStep] = useState<WizardStep>('welcome');
  const stepIndex = STEPS.indexOf(currentStep);

  // Form state
  const [shopName, setShopName] = useState('');
  const [shopPhone, setShopPhone] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [template, setTemplate] = useState<InvoiceTemplate>('classic');
  const [colorTheme, setColorTheme] = useState<InvoiceColorTheme>('blue');
  const [gstEnabled, setGstEnabled] = useState(false);
  const [gstRate, setGstRate] = useState<5 | 12 | 18 | 28>(18);

  // Store setters
  const setStoreShopName = useSettingsStore((s) => s.setShopName);
  const setStoreShopPhone = useSettingsStore((s) => s.setShopPhone);
  const setStoreShopAddress = useSettingsStore((s) => s.setShopAddress);
  const setStoreLogo = useSettingsStore((s) => s.setShopLogo);
  const setStoreTemplate = useSettingsStore((s) => s.setInvoiceTemplate);
  const setStoreColorTheme = useSettingsStore((s) => s.setInvoiceColorTheme);
  const setStoreGstEnabled = useSettingsStore((s) => s.setDefaultGstEnabled);
  const setStoreGstRate = useSettingsStore((s) => s.setDefaultGstRate);
  const setWizardCompleted = useSettingsStore((s) => s.setWizardCompleted);

  const goNext = () => {
    const nextIndex = stepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const goBack = () => {
    const prevIndex = stepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex]);
    }
  };

  const skipWizard = () => {
    setWizardCompleted(true);
    router.replace('/(tabs)');
  };

  const finishWizard = () => {
    // Save all settings
    if (shopName) setStoreShopName(shopName);
    if (shopPhone) setStoreShopPhone(shopPhone);
    if (shopAddress) setStoreShopAddress(shopAddress);
    if (logoUri) setStoreLogo(logoUri);
    setStoreTemplate(template);
    setStoreColorTheme(colorTheme);
    setStoreGstEnabled(gstEnabled);
    setStoreGstRate(gstRate);
    setWizardCompleted(true);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace('/(tabs)');
  };

  const handlePickLogo = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setLogoUri(result.assets[0].uri);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // Progress indicator
  const renderProgress = () => (
    <View style={styles.progressContainer}>
      {STEPS.slice(0, -1).map((step, index) => (
        <View
          key={step}
          style={[
            styles.progressDot,
            {
              backgroundColor: index <= stepIndex ? colors.primary : colors.border,
            },
          ]}
        />
      ))}
    </View>
  );

  // Welcome Screen
  const renderWelcome = () => (
    <View style={styles.stepContent}>
      <View style={styles.welcomeIcon}>
        <Text style={styles.welcomeEmoji}>📋</Text>
      </View>
      <Heading1 align="center" style={styles.welcomeTitle}>
        Welcome to BillKhata
      </Heading1>
      <Text variant="body" color="secondary" align="center" style={styles.welcomeSubtitle}>
        Create professional bills in seconds.{'\n'}Share instantly via WhatsApp.
      </Text>

      <View style={styles.featureList}>
        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>⚡</Text>
          <Text variant="body">Super-fast billing</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>📱</Text>
          <Text variant="body">WhatsApp sharing</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>🔒</Text>
          <Text variant="body">Works offline</Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <Button title="Get Started" size="large" fullWidth onPress={goNext} />
        <Pressable onPress={skipWizard} style={styles.skipButton}>
          <Text variant="body" color="secondary">
            Skip setup →
          </Text>
        </Pressable>
      </View>
    </View>
  );

  // Shop Info Screen
  const renderShopInfo = () => (
    <ScrollView style={styles.scrollStep} contentContainerStyle={styles.stepContent}>
      <Heading2 align="center">Your Shop Details</Heading2>
      <Text variant="body" color="secondary" align="center" style={styles.stepSubtitle}>
        This will appear on your invoices
      </Text>

      <View style={styles.formContainer}>
        <Input
          label="Shop Name"
          placeholder="e.g., Sharma General Store"
          value={shopName}
          onChangeText={setShopName}
          autoCapitalize="words"
        />
        <Input
          label="Phone Number (Optional)"
          placeholder="e.g., 98765 43210"
          value={shopPhone}
          onChangeText={setShopPhone}
          keyboardType="phone-pad"
        />
        <Input
          label="Address (Optional)"
          placeholder="e.g., 123 Main Road, City"
          value={shopAddress}
          onChangeText={setShopAddress}
          multiline
        />
      </View>

      <View style={styles.buttonContainer}>
        <Button title="Continue" size="large" fullWidth onPress={goNext} />
        <Pressable onPress={goNext} style={styles.skipButton}>
          <Text variant="body" color="secondary">
            Skip for now
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );

  // Logo Screen
  const renderLogo = () => (
    <View style={styles.stepContent}>
      <Heading2 align="center">Add Your Logo</Heading2>
      <Text variant="body" color="secondary" align="center" style={styles.stepSubtitle}>
        Make your invoices look professional
      </Text>

      <Pressable onPress={handlePickLogo} style={styles.logoPickerContainer}>
        {logoUri ? (
          <Image source={{ uri: logoUri }} style={styles.logoPreview} />
        ) : (
          <View style={[styles.logoPlaceholder, { borderColor: colors.border }]}>
            <Text style={styles.logoPlaceholderIcon}>📷</Text>
            <Text variant="body" color="secondary">
              Tap to select
            </Text>
          </View>
        )}
      </Pressable>

      {logoUri && (
        <Button
          title="Change Logo"
          variant="ghost"
          onPress={handlePickLogo}
          style={styles.changeLogoButton}
        />
      )}

      <View style={styles.buttonContainer}>
        <Button title="Continue" size="large" fullWidth onPress={goNext} />
        <Pressable onPress={goNext} style={styles.skipButton}>
          <Text variant="body" color="secondary">
            Skip for now
          </Text>
        </Pressable>
      </View>
    </View>
  );

  // Branding Screen
  const renderBranding = () => (
    <ScrollView style={styles.scrollStep} contentContainerStyle={styles.stepContent}>
      <Heading2 align="center">Customize Your Invoice</Heading2>
      <Text variant="body" color="secondary" align="center" style={styles.stepSubtitle}>
        Choose your preferred style
      </Text>

      <View style={styles.formContainer}>
        <Text variant="label" style={styles.optionLabel}>
          Template
        </Text>
        <View style={styles.templateOptions}>
          {(['classic', 'modern', 'compact'] as InvoiceTemplate[]).map((t) => (
            <Pressable
              key={t}
              onPress={() => {
                setTemplate(t);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={[
                styles.templateOption,
                {
                  backgroundColor: template === t ? colors.primary : colors.surface,
                  borderColor: template === t ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                variant="label"
                style={{ color: template === t ? colors.textInverse : colors.text }}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text variant="label" style={styles.optionLabel}>
          Color
        </Text>
        <View style={styles.colorOptions}>
          {([
            { id: 'blue', color: '#2563EB' },
            { id: 'green', color: '#16A34A' },
            { id: 'orange', color: '#EA580C' },
            { id: 'purple', color: '#9333EA' },
          ] as { id: InvoiceColorTheme; color: string }[]).map((c) => (
            <Pressable
              key={c.id}
              onPress={() => {
                setColorTheme(c.id);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={[
                styles.colorOption,
                {
                  borderColor: colorTheme === c.id ? colors.text : 'transparent',
                  borderWidth: colorTheme === c.id ? 3 : 0,
                },
              ]}
            >
              <View style={[styles.colorSwatch, { backgroundColor: c.color }]} />
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <Button title="Continue" size="large" fullWidth onPress={goNext} />
      </View>
    </ScrollView>
  );

  // GST Screen
  const renderGst = () => (
    <View style={styles.stepContent}>
      <Heading2 align="center">GST Preferences</Heading2>
      <Text variant="body" color="secondary" align="center" style={styles.stepSubtitle}>
        Set your default GST settings
      </Text>

      <Card variant="outlined" style={styles.gstCard}>
        <View style={styles.gstToggleRow}>
          <View>
            <Text variant="label">Enable GST by default</Text>
            <Caption>GST will be ON for new bills</Caption>
          </View>
          <Pressable
            onPress={() => {
              setGstEnabled(!gstEnabled);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            style={[
              styles.toggleButton,
              {
                backgroundColor: gstEnabled ? colors.primary : colors.surfaceSecondary,
                borderColor: gstEnabled ? colors.primary : colors.border,
              },
            ]}
          >
            <Text
              variant="label"
              style={{ color: gstEnabled ? colors.textInverse : colors.text }}
            >
              {gstEnabled ? 'ON' : 'OFF'}
            </Text>
          </Pressable>
        </View>

        {gstEnabled && (
          <>
            <Text variant="label" style={styles.optionLabel}>
              Default Rate
            </Text>
            <View style={styles.gstRateOptions}>
              {([5, 12, 18, 28] as (5 | 12 | 18 | 28)[]).map((rate) => (
                <Pressable
                  key={rate}
                  onPress={() => {
                    setGstRate(rate);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={[
                    styles.gstRateOption,
                    {
                      backgroundColor: gstRate === rate ? colors.primary : colors.surface,
                      borderColor: gstRate === rate ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    variant="label"
                    style={{ color: gstRate === rate ? colors.textInverse : colors.text }}
                  >
                    {rate}%
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        )}
      </Card>

      <View style={styles.buttonContainer}>
        <Button title="Continue" size="large" fullWidth onPress={goNext} />
        <Pressable onPress={goNext} style={styles.skipButton}>
          <Text variant="body" color="secondary">
            Skip for now
          </Text>
        </Pressable>
      </View>
    </View>
  );

  // Done Screen
  const renderDone = () => (
    <View style={styles.stepContent}>
      <View style={styles.doneIcon}>
        <Text style={styles.doneEmoji}>🎉</Text>
      </View>
      <Heading1 align="center" style={styles.doneTitle}>
        You're All Set!
      </Heading1>
      <Text variant="body" color="secondary" align="center" style={styles.doneSubtitle}>
        Start creating bills in seconds.{'\n'}You can change settings anytime.
      </Text>

      <View style={styles.buttonContainer}>
        <Button title="Start Billing" size="large" fullWidth onPress={finishWizard} />
      </View>
    </View>
  );

  // Render current step
  const renderStep = () => {
    switch (currentStep) {
      case 'welcome':
        return renderWelcome();
      case 'shop-info':
        return renderShopInfo();
      case 'logo':
        return renderLogo();
      case 'branding':
        return renderBranding();
      case 'gst':
        return renderGst();
      case 'done':
        return renderDone();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Progress */}
      {currentStep !== 'welcome' && currentStep !== 'done' && renderProgress()}

      {/* Back button */}
      {stepIndex > 0 && currentStep !== 'done' && (
        <Pressable onPress={goBack} style={styles.backButton}>
          <Text variant="body" color="secondary">
            ← Back
          </Text>
        </Pressable>
      )}

      {/* Content */}
      {renderStep()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  backButton: {
    position: 'absolute',
    top: spacing.xl,
    left: spacing.md,
    zIndex: 10,
    padding: spacing.sm,
  },
  scrollStep: {
    flex: 1,
  },
  stepContent: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  stepSubtitle: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  formContainer: {
    marginBottom: spacing.xl,
  },
  buttonContainer: {
    marginTop: 'auto',
    paddingTop: spacing.lg,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },

  // Welcome
  welcomeIcon: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  welcomeEmoji: {
    fontSize: 80,
  },
  welcomeTitle: {
    marginBottom: spacing.sm,
  },
  welcomeSubtitle: {
    marginBottom: spacing.xl,
  },
  featureList: {
    marginBottom: spacing.xl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: spacing.md,
    width: 32,
  },

  // Logo
  logoPickerContainer: {
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  logoPreview: {
    width: 150,
    height: 150,
    borderRadius: borderRadius.lg,
  },
  logoPlaceholder: {
    width: 150,
    height: 150,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoPlaceholderIcon: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  changeLogoButton: {
    alignSelf: 'center',
  },

  // Branding
  optionLabel: {
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  templateOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  templateOption: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  colorOptions: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'center',
  },
  colorOption: {
    padding: spacing.xs,
    borderRadius: borderRadius.md,
  },
  colorSwatch: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
  },

  // GST
  gstCard: {
    marginVertical: spacing.xl,
  },
  gstToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  gstRateOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  gstRateOption: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },

  // Done
  doneIcon: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  doneEmoji: {
    fontSize: 80,
  },
  doneTitle: {
    marginBottom: spacing.sm,
  },
  doneSubtitle: {
    marginBottom: spacing.xl,
  },
});
