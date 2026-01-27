/**
 * BillKhata Root Layout
 * App entry point with providers
 */

import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider, useTheme } from '../src/theme';
import { initializeDatabase } from '../src/db';
import { useSettingsStore, useLicenseStore } from '../src/stores';
import { Text } from '../src/components/ui';
import i18n from '../src/i18n';
import { useTranslation } from 'react-i18next';

function RootLayoutContent() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const segments = useSegments();
  const { t } = useTranslation(['bills', 'settings']);

  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wizardCompleted = useSettingsStore((s) => s.wizardCompleted);
  const language = useSettingsStore((s) => s.language);
  const initializeLicense = useLicenseStore((s) => s.initialize);

  // Sync language from settings store to i18n
  useEffect(() => {
    if (language && i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language]);

  useEffect(() => {
    async function initialize() {
      try {
        await initializeDatabase();
        await initializeLicense();
        setIsReady(true);
      } catch (e) {
        console.error('Initialization error:', e);
        setError('Failed to initialize app');
      }
    }

    initialize();
  }, []);

  // Handle navigation based on wizard status
  useEffect(() => {
    if (!isReady) return;

    const inWizard = segments[0] === 'wizard';
    const inTabs = segments[0] === '(tabs)';

    if (!wizardCompleted && !inWizard) {
      // Redirect to wizard if not completed
      router.replace('/wizard');
    } else if (wizardCompleted && inWizard) {
      // Redirect to main app if wizard is completed
      router.replace('/(tabs)');
    }
  }, [isReady, wizardCompleted, segments]);

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text color="error">{error}</Text>
      </View>
    );
  }

  if (!isReady) {
    return (
      <View style={[styles.center, { backgroundColor: colors.primary }]}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText} color="inverse">
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: '600',
          },
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="wizard/index"
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="bill/create"
          options={{
            title: t('bills:create.title'),
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="bill/[id]"
          options={{
            title: t('bills:detail.title'),
          }}
        />
        <Stack.Screen
          name="bill/edit/[id]"
          options={{
            title: t('bills:edit.title'),
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="trash/index"
          options={{
            title: t('bills:trash.title'),
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <ThemeProvider>
        <RootLayoutContent />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
});
