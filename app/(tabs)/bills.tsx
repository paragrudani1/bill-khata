/**
 * BillKhata Bills History Screen
 * View past bills grouped by date
 */

import { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme, spacing } from '../../src/theme';
import { Text, Card, Caption } from '../../src/components/ui';
import { formatMoney, formatTime, formatBillNumber, getDateGroupKey } from '../../src/utils';
import { getBills } from '../../src/db';
import { Invoice } from '../../src/types';

interface GroupedBills {
  title: string;
  data: Invoice[];
}

function groupBillsByDate(bills: Invoice[]): GroupedBills[] {
  const groups: Record<string, Invoice[]> = {};

  bills.forEach((bill) => {
    const group = getDateGroupKey(bill.createdAt);
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(bill);
  });

  // Convert to array and maintain order
  const orderedKeys = Object.keys(groups);
  return orderedKeys.map((title) => ({ title, data: groups[title] }));
}

export default function BillsScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const [bills, setBills] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadBills = useCallback(async () => {
    try {
      const fetchedBills = await getBills(100, 0);
      setBills(fetchedBills);
    } catch (error) {
      console.error('Error loading bills:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Reload bills when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadBills();
    }, [loadBills])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadBills();
  };

  const groupedBills = groupBillsByDate(bills);

  const handleBillPress = (billId: string) => {
    router.push(`/bill/${billId}`);
  };

  const handleShare = (billId: string) => {
    // TODO: Implement share functionality
    console.log('Share bill:', billId);
  };

  const renderBillItem = (bill: Invoice) => (
    <Pressable onPress={() => handleBillPress(bill.id)} key={bill.id}>
      <Card variant="outlined" style={styles.billCard}>
        <View style={styles.billHeader}>
          <View style={styles.billInfo}>
            <Text variant="label">{formatBillNumber(bill.billNumber)}</Text>
            <Text variant="body" numberOfLines={1}>
              {bill.customerName || 'Walk-in'}
            </Text>
          </View>
          <Text variant="money" style={{ color: colors.text }}>
            {formatMoney(bill.totalPaise)}
          </Text>
        </View>
        <View style={styles.billFooter}>
          <Caption>
            {formatTime(bill.createdAt)} • {bill.paymentMode.toUpperCase()}
            {bill.status === 'draft' && ' • DRAFT'}
          </Caption>
          <Pressable
            onPress={() => handleShare(bill.id)}
            style={styles.shareButton}
          >
            <Text variant="caption" style={{ color: colors.primary }}>
              Share
            </Text>
          </Pressable>
        </View>
      </Card>
    </Pressable>
  );

  const renderSectionHeader = (title: string) => (
    <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
      <Text variant="label" color="secondary">
        {title}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={groupedBills}
        keyExtractor={(item) => item.title}
        renderItem={({ item: group }) => (
          <View>
            {renderSectionHeader(group.title)}
            {group.data.map((bill) => (
              <View key={bill.id} style={styles.billItemContainer}>
                {renderBillItem(bill)}
              </View>
            ))}
          </View>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="h2" align="center" style={styles.emptyIcon}>
              📋
            </Text>
            <Text variant="body" color="secondary" align="center">
              No bills yet
            </Text>
            <Caption style={styles.emptyHint}>
              Create your first bill to see it here
            </Caption>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: spacing.md,
    paddingTop: spacing.sm,
    flexGrow: 1,
  },
  sectionHeader: {
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
  },
  billItemContainer: {
    marginBottom: spacing.sm,
  },
  billCard: {
    padding: spacing.md,
  },
  billHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  billInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  billFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shareButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    minHeight: 300,
  },
  emptyIcon: {
    marginBottom: spacing.md,
  },
  emptyHint: {
    marginTop: spacing.xs,
  },
});
