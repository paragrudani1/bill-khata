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
import { useSettingsStore } from '../src/stores';
import { Text } from '../src/components/ui';

function RootLayoutContent() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const segments = useSegments();

  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wizardCompleted = useSettingsStore((s) => s.wizardCompleted);

  useEffect(() => {
    async function initialize() {
      try {
        await initializeDatabase();
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
            title: 'Create Bill',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="bill/[id]"
          options={{
            title: 'Bill Details',
          }}
        />
        <Stack.Screen
          name="bill/edit/[id]"
          options={{
            title: 'Edit Bill',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="trash/index"
          options={{
            title: 'Trash',
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
