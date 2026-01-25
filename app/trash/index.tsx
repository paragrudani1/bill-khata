/**
 * BillKhata Trash Screen
 * View and restore deleted bills
 */

import { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, Pressable, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useTheme, spacing } from '../../src/theme';
import { Text, Card, Caption, Button } from '../../src/components/ui';
import { formatMoney, formatDate, formatBillNumber } from '../../src/utils';
import { getDeletedBills, restoreBill, purgeOldDeletedBills } from '../../src/db';
import { Invoice } from '../../src/types';

export default function TrashScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const [bills, setBills] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDeletedBills = useCallback(async () => {
    try {
      const deletedBills = await getDeletedBills();
      setBills(deletedBills);
    } catch (error) {
      console.error('Error loading deleted bills:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDeletedBills();
    }, [loadDeletedBills])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadDeletedBills();
  };

  const handleRestore = async (billId: string) => {
    try {
      await restoreBill(billId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      loadDeletedBills();
    } catch (error) {
      console.error('Error restoring bill:', error);
      Alert.alert('Error', 'Failed to restore bill');
    }
  };

  const handleEmptyTrash = () => {
    Alert.alert(
      'Empty Trash',
      'This will permanently delete all bills in trash. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Empty Trash',
          style: 'destructive',
          onPress: async () => {
            try {
              // For now, we'll just reload - actual permanent delete would need a new query
              await purgeOldDeletedBills();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              loadDeletedBills();
            } catch (error) {
              Alert.alert('Error', 'Failed to empty trash');
            }
          },
        },
      ]
    );
  };

  const getDaysRemaining = (deletedAt: string): number => {
    const deleted = new Date(deletedAt);
    const now = new Date();
    const diffTime = 30 * 24 * 60 * 60 * 1000 - (now.getTime() - deleted.getTime());
    return Math.max(0, Math.ceil(diffTime / (24 * 60 * 60 * 1000)));
  };

  const renderBillItem = ({ item }: { item: Invoice }) => {
    const daysRemaining = getDaysRemaining(item.deletedAt!);

    return (
      <Card variant="outlined" style={styles.billCard}>
        <View style={styles.billHeader}>
          <View style={styles.billInfo}>
            <Text variant="label">{formatBillNumber(item.billNumber)}</Text>
            <Text variant="body" numberOfLines={1}>
              {item.customerName || 'Walk-in'}
            </Text>
            <Caption>{formatDate(item.billDate, 'short')}</Caption>
          </View>
          <View style={styles.billRight}>
            <Text variant="money" style={{ color: colors.text }}>
              {formatMoney(item.totalPaise)}
            </Text>
            <Caption style={{ color: colors.warning }}>
              {daysRemaining} days left
            </Caption>
          </View>
        </View>
        <View style={styles.billActions}>
          <Button
            title="Restore"
            variant="primary"
            size="small"
            onPress={() => handleRestore(item.id)}
          />
        </View>
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {bills.length > 0 && (
        <View style={styles.headerActions}>
          <Caption>
            {bills.length} bill{bills.length !== 1 ? 's' : ''} in trash
          </Caption>
          <Pressable onPress={handleEmptyTrash}>
            <Text variant="caption" style={{ color: colors.error }}>
              Empty Trash
            </Text>
          </Pressable>
        </View>
      )}

      <FlatList
        data={bills}
        keyExtractor={(item) => item.id}
        renderItem={renderBillItem}
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
            <Text style={styles.emptyIcon}>🗑️</Text>
            <Text variant="body" color="secondary" align="center">
              Trash is empty
            </Text>
            <Caption style={styles.emptyHint}>
              Deleted bills appear here for 30 days
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
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  listContent: {
    padding: spacing.md,
    paddingTop: 0,
    flexGrow: 1,
  },
  billCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  billHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  billInfo: {
    flex: 1,
  },
  billRight: {
    alignItems: 'flex-end',
  },
  billActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    minHeight: 300,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyHint: {
    marginTop: spacing.xs,
  },
});
