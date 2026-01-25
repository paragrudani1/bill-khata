/**
 * BillKhata Tab Layout
 * Bottom tab navigation: Home, Bills, Settings
 */

import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../src/theme';
import { Text } from '../../src/components/ui';

// Simple icon components (we'll replace with proper icons later)
function HomeIcon({ color, size }: { color: string; size: number }) {
  return (
    <View style={[styles.iconContainer, { width: size, height: size }]}>
      <Text style={{ color, fontSize: size * 0.6 }}>🏠</Text>
    </View>
  );
}

function BillsIcon({ color, size }: { color: string; size: number }) {
  return (
    <View style={[styles.iconContainer, { width: size, height: size }]}>
      <Text style={{ color, fontSize: size * 0.6 }}>📋</Text>
    </View>
  );
}

function SettingsIcon({ color, size }: { color: string; size: number }) {
  return (
    <View style={[styles.iconContainer, { width: size, height: size }]}>
      <Text style={{ color, fontSize: size * 0.6 }}>⚙️</Text>
    </View>
  );
}

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingTop: 8,
          paddingBottom: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <HomeIcon color={color} size={size} />,
          headerTitle: 'BillKhata',
        }}
      />
      <Tabs.Screen
        name="bills"
        options={{
          title: 'Bills',
          tabBarIcon: ({ color, size }) => <BillsIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <SettingsIcon color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
