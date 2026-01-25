/**
 * BillKhata Home Dashboard
 * Main screen showing today's summary and create bill CTA
 */

import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme, spacing } from '../../src/theme';
import { Text, Heading2, MoneyLarge, Button, Card, Caption } from '../../src/components/ui';
import { formatMoney, getTodayISO } from '../../src/utils';
import { getDashboardStats } from '../../src/db';
import { useSettingsStore } from '../../src/stores';
import { useLicense } from '../../src/hooks';
import { UpgradePrompt } from '../../src/components/licensing';

interface DashboardStats {
  totalSalesPaise: number;
  cashSalesPaise: number;
  upiSalesPaise: number;
  billCount: number;
}

export default function HomeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const shopName = useSettingsStore((s) => s.shopName);

  const [stats, setStats] = useState<DashboardStats>({
    totalSalesPaise: 0,
    cashSalesPaise: 0,
    upiSalesPaise: 0,
    billCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const license = useLicense();

  const loadStats = useCallback(async () => {
    try {
      const today = getTodayISO();
      const dashboardStats = await getDashboardStats(today);
      setStats(dashboardStats);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Reload stats when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  const handleCreateBill = () => {
    if (license.canCreateBill) {
      router.push('/bill/create');
    } else {
      setShowUpgradePrompt(true);
    }
  };

  const handleViewTodayBills = () => {
    router.push('/(tabs)/bills');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Shop Name Header */}
        {shopName ? (
          <View style={styles.shopHeader}>
            <Heading2>{shopName}</Heading2>
          </View>
        ) : null}

        {/* Today's Sales Card */}
        <Pressable onPress={handleViewTodayBills}>
          <Card variant="elevated" style={styles.salesCard}>
            <View style={styles.salesHeader}>
              <Text variant="label" color="secondary">
                Today's Sales
              </Text>
              <Text color="secondary">→</Text>
            </View>
            <MoneyLarge style={[styles.salesAmount, { color: colors.text }]}>
              {formatMoney(stats.totalSalesPaise)}
            </MoneyLarge>
          </Card>
        </Pressable>

        {/* Payment Mode Breakdown */}
        <View style={styles.breakdownRow}>
          <Card variant="outlined" style={styles.breakdownCard}>
            <Caption>Cash</Caption>
            <Text variant="money" style={{ color: colors.text }}>
              {formatMoney(stats.cashSalesPaise)}
            </Text>
          </Card>
          <Card variant="outlined" style={styles.breakdownCard}>
            <Caption>UPI</Caption>
            <Text variant="money" style={{ color: colors.text }}>
              {formatMoney(stats.upiSalesPaise)}
            </Text>
          </Card>
        </View>

        {/* Bills Count */}
        <Card variant="filled" style={styles.countCard}>
          <View style={styles.countContent}>
            <Text variant="label" color="secondary">
              Bills Created Today
            </Text>
            <Heading2>{stats.billCount}</Heading2>
          </View>
        </Card>

        {/* Spacer */}
        <View style={styles.spacer} />
      </ScrollView>

      {/* Fixed Bottom CTA */}
      <View style={[styles.ctaContainer, { backgroundColor: colors.background }]}>
        <Button
          title="+ CREATE BILL"
          size="large"
          fullWidth
          onPress={handleCreateBill}
        />

        {/* Footer Disclaimer */}
        <Text
          variant="caption"
          color="tertiary"
          align="center"
          style={styles.disclaimer}
        >
          ⓘ Data stored locally on this device only
        </Text>

        {/* Trial/License Status */}
        {license.isTrialActive && license.daysRemaining !== null && (
          <Text
            variant="caption"
            color="secondary"
            align="center"
            style={styles.trialStatus}
          >
            Trial: {license.daysRemaining} day{license.daysRemaining === 1 ? '' : 's'} remaining
          </Text>
        )}
      </View>

      {/* Upgrade Prompt */}
      <UpgradePrompt
        visible={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
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
    paddingBottom: 160, // Space for fixed CTA
  },
  shopHeader: {
    marginBottom: spacing.md,
  },
  salesCard: {
    marginBottom: spacing.md,
  },
  salesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  salesAmount: {
    marginTop: spacing.xs,
  },
  breakdownRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  breakdownCard: {
    flex: 1,
  },
  countCard: {
    marginBottom: spacing.md,
  },
  countContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  spacer: {
    height: spacing.xl,
  },
  ctaContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  disclaimer: {
    marginTop: spacing.sm,
  },
  trialStatus: {
    marginTop: spacing.xs,
  },
});
