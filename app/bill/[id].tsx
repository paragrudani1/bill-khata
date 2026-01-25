/**
 * BillKhata Bill Detail Screen
 * View, edit, share, duplicate a bill
 */

import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme, spacing } from '../../src/theme';
import {
  Text,
  Heading2,
  Button,
  Card,
  Caption,
} from '../../src/components/ui';
import { formatMoney, formatDate, formatTime, formatBillNumber } from '../../src/utils';
import { getBillById, deleteBill } from '../../src/db';
import { shareBill, shareViaWhatsApp } from '../../src/services';
import { useSettingsStore } from '../../src/stores';
import { Invoice, InvoiceItem } from '../../src/types';

export default function BillDetailScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  // Settings for PDF generation
  const shopName = useSettingsStore((s) => s.shopName);
  const shopPhone = useSettingsStore((s) => s.shopPhone);
  const shopAddress = useSettingsStore((s) => s.shopAddress);
  const shopLogoUri = useSettingsStore((s) => s.shopLogoUri);
  const invoiceTemplate = useSettingsStore((s) => s.invoiceTemplate);
  const invoiceColorTheme = useSettingsStore((s) => s.invoiceColorTheme);
  const footerNote = useSettingsStore((s) => s.footerNote);

  const [bill, setBill] = useState<Invoice | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSharing, setIsSharing] = useState(false);

  const loadBill = useCallback(async () => {
    if (!id) return;

    try {
      const data = await getBillById(id);
      if (data) {
        setBill(data.bill);
        setItems(data.items);
      }
    } catch (error) {
      console.error('Error loading bill:', error);
      Alert.alert('Error', 'Failed to load bill details');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadBill();
  }, [loadBill]);

  const shareOptions = {
    billId: id!,
    shopName: shopName || 'My Shop',
    shopPhone,
    shopAddress,
    shopLogoUri,
    template: invoiceTemplate,
    colorTheme: invoiceColorTheme,
    footerNote,
  };

  const handleWhatsAppShare = async () => {
    if (!id) return;

    setIsSharing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await shareViaWhatsApp(shareOptions);
    } finally {
      setIsSharing(false);
    }
  };

  const handleShare = async () => {
    if (!id) return;

    setIsSharing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await shareBill(shareOptions);
    } finally {
      setIsSharing(false);
    }
  };

  const handleEdit = () => {
    router.push(`/bill/edit/${id}`);
  };

  const handleDuplicate = () => {
    // Navigate to create screen with bill data pre-filled
    router.push({
      pathname: '/bill/create',
      params: {
        duplicateFromId: id,
      },
    });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Bill',
      'Are you sure you want to delete this bill? It will be moved to trash for 30 days.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBill(id!);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete bill');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!bill) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text color="secondary">Bill not found</Text>
      </View>
    );
  }

  const gstRateHalf = bill.gstRate ? bill.gstRate / 2 : 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Bill Header */}
      <Card variant="elevated" style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View>
            <Heading2>{formatBillNumber(bill.billNumber)}</Heading2>
            <Caption>{formatDate(bill.billDate, 'long')}</Caption>
          </View>
          <View style={[styles.statusBadge, {
            backgroundColor: bill.status === 'final'
              ? 'rgba(22, 163, 74, 0.1)'
              : 'rgba(245, 158, 11, 0.1)'
          }]}>
            <Text
              variant="caption"
              style={{ color: bill.status === 'final' ? colors.success : colors.warning }}
            >
              {bill.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.customerRow}>
          <Text variant="label" color="secondary">
            Customer
          </Text>
          <Text variant="body">{bill.customerName || 'Walk-in'}</Text>
        </View>

        <Caption>
          Last modified: {formatDate(bill.updatedAt, 'short')} {formatTime(bill.updatedAt)}
        </Caption>
      </Card>

      {/* Items */}
      <View style={styles.section}>
        <Text variant="label" color="secondary" style={styles.sectionTitle}>
          Items ({items.length})
        </Text>
        <Card variant="outlined">
          {items.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.itemRow,
                index < items.length - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: colors.border,
                },
              ]}
            >
              <View style={styles.itemInfo}>
                <Text variant="body">{item.itemName}</Text>
                <Caption>
                  {item.quantity} × {item.pricePaise === 0 ? 'FREE' : formatMoney(item.pricePaise)}
                </Caption>
              </View>
              <Text variant="money">
                {item.pricePaise === 0 ? 'FREE' : formatMoney(item.totalPaise)}
              </Text>
            </View>
          ))}
        </Card>
      </View>

      {/* Summary */}
      <View style={styles.section}>
        <Card variant="elevated">
          <View style={styles.summaryRow}>
            <Text color="secondary">Subtotal</Text>
            <Text variant="money">{formatMoney(bill.subtotalPaise)}</Text>
          </View>

          {bill.discountPaise > 0 && (
            <View style={styles.summaryRow}>
              <Text color="secondary">Discount</Text>
              <Text variant="money" style={{ color: colors.success }}>
                -{formatMoney(bill.discountPaise)}
              </Text>
            </View>
          )}

          {bill.gstEnabled && bill.gstRate && (
            <>
              <View style={styles.summaryRow}>
                <Caption>CGST @{gstRateHalf}%</Caption>
                <Caption>{formatMoney(bill.cgstPaise)}</Caption>
              </View>
              <View style={styles.summaryRow}>
                <Caption>SGST @{gstRateHalf}%</Caption>
                <Caption>{formatMoney(bill.sgstPaise)}</Caption>
              </View>
            </>
          )}

          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text variant="h3">TOTAL</Text>
            <Text variant="moneyLarge" style={{ color: colors.primary }}>
              {formatMoney(bill.totalPaise)}
            </Text>
          </View>
        </Card>
      </View>

      {/* Payment Mode */}
      <View style={styles.section}>
        <Card variant="filled">
          <View style={styles.paymentRow}>
            <Text color="secondary">Payment Mode</Text>
            <Text variant="label">
              {bill.paymentMode === 'cash' ? '💵 Cash' : '📱 UPI'}
            </Text>
          </View>
        </Card>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <View style={styles.actionRow}>
          <Button
            title="📱 WhatsApp"
            variant="primary"
            onPress={handleWhatsAppShare}
            style={styles.actionButton}
            loading={isSharing}
            disabled={isSharing}
          />
          <Button
            title="📤 Share"
            variant="secondary"
            onPress={handleShare}
            style={styles.actionButton}
            disabled={isSharing}
          />
        </View>
        <View style={styles.actionRow}>
          <Button
            title="✏️ Edit"
            variant="outline"
            onPress={handleEdit}
            style={styles.actionButton}
          />
          <Button
            title="📋 Duplicate"
            variant="outline"
            onPress={handleDuplicate}
            style={styles.actionButton}
          />
        </View>
        <Button
          title="🗑️ Delete"
          variant="ghost"
          onPress={handleDelete}
          style={styles.deleteButton}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCard: {
    marginBottom: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
  },
  customerRow: {
    marginBottom: spacing.sm,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    marginBottom: spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  itemInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  totalRow: {
    marginTop: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    marginBottom: 0,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actions: {
    gap: spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  deleteButton: {
    marginTop: spacing.sm,
  },
});
