/**
 * BillKhata Bill Creation Screen
 * Core feature - create new bills quickly
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useHeaderHeight } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useTheme, spacing, borderRadius } from '../../src/theme';
import {
  Text,
  Button,
  NumericInput,
  Card,
  Caption,
  Heading3,
} from '../../src/components/ui';
import { ItemAutocomplete, CustomerAutocomplete } from '../../src/components/bills';
import {
  formatMoney,
  formatMoneyCompact,
  rupeesToPaise,
  paiseToRupees,
  calculateLineTotal,
  calculateBillSummary,
  getTodayISO,
  formatDate,
  generateId,
} from '../../src/utils';
import { BillLineItemForm, PaymentMode, GstRate } from '../../src/types';
import { createBill, getBillById } from '../../src/db';
import { useSettingsStore } from '../../src/stores';

const GST_RATES: GstRate[] = [5, 12, 18, 28];

export default function CreateBillScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { duplicateFromId } = useLocalSearchParams<{ duplicateFromId?: string }>();
  const headerHeight = useHeaderHeight();
  const scrollViewRef = useRef<ScrollView>(null);
  const { t } = useTranslation(['bills', 'common']);

  // Get defaults from settings
  const defaultGstEnabled = useSettingsStore((s) => s.defaultGstEnabled);
  const defaultGstRate = useSettingsStore((s) => s.defaultGstRate);
  const lastPaymentMode = useSettingsStore((s) => s.lastPaymentMode);
  const setLastPaymentMode = useSettingsStore((s) => s.setLastPaymentMode);

  // Loading state for duplicate
  const [isLoadingDuplicate, setIsLoadingDuplicate] = useState(!!duplicateFromId);

  // Form state
  const [customerName, setCustomerName] = useState('');
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [lineItems, setLineItems] = useState<BillLineItemForm[]>([]);
  const [discountInput, setDiscountInput] = useState('');
  const [gstEnabled, setGstEnabled] = useState(defaultGstEnabled);
  const [gstRate, setGstRate] = useState<GstRate>(defaultGstRate);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(lastPaymentMode);
  const [billDate] = useState(getTodayISO());
  const [isSaving, setIsSaving] = useState(false);

  // New item input state
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('1');
  const [newItemPrice, setNewItemPrice] = useState('');

  // Refs for auto-advance
  const qtyInputRef = useRef<TextInput>(null);
  const priceInputRef = useRef<TextInput>(null);

  // Load duplicate bill data if duplicateFromId is provided
  useEffect(() => {
    async function loadDuplicateBill() {
      if (!duplicateFromId) return;

      try {
        const data = await getBillById(duplicateFromId);
        if (data) {
          // Copy items (with new IDs) but NOT customer
          const duplicatedItems: BillLineItemForm[] = data.items.map((item) => ({
            id: generateId(),
            itemName: item.itemName,
            quantity: item.quantity,
            pricePaise: item.pricePaise,
            totalPaise: item.totalPaise,
          }));
          setLineItems(duplicatedItems);

          // Copy GST settings
          setGstEnabled(data.bill.gstEnabled);
          if (data.bill.gstRate) {
            setGstRate(data.bill.gstRate as GstRate);
          }

          // Copy payment mode
          setPaymentMode(data.bill.paymentMode as PaymentMode);

          // Copy discount
          if (data.bill.discountPaise > 0) {
            setDiscountInput(paiseToRupees(data.bill.discountPaise).toString());
          }
        }
      } catch (error) {
        console.error('Error loading bill for duplication:', error);
        Alert.alert('Error', 'Failed to load bill for duplication');
      } finally {
        setIsLoadingDuplicate(false);
      }
    }

    loadDuplicateBill();
  }, [duplicateFromId]);

  // Calculate summary
  const discountPaise = rupeesToPaise(parseFloat(discountInput) || 0);
  const summary = calculateBillSummary(lineItems, discountPaise, gstEnabled, gstRate);

  const handleItemSelected = useCallback((name: string, suggestedPricePaise: number | null) => {
    setNewItemName(name);
    if (suggestedPricePaise !== null) {
      setNewItemPrice(paiseToRupees(suggestedPricePaise).toString());
    }
    // Auto-advance to qty
    qtyInputRef.current?.focus();
  }, []);

  const handleCustomerSelected = useCallback((id: string | null, name: string) => {
    setCustomerId(id);
    setCustomerName(name);
  }, []);

  const handleAddItem = useCallback(() => {
    const name = newItemName.trim();
    const qty = parseFloat(newItemQty) || 1;
    const pricePaise = rupeesToPaise(parseFloat(newItemPrice) || 0);

    if (!name) {
      return;
    }

    const newItem: BillLineItemForm = {
      id: generateId(),
      itemName: name,
      quantity: qty,
      pricePaise,
      totalPaise: calculateLineTotal(qty, pricePaise),
    };

    setLineItems((prev) => [...prev, newItem]);

    // Reset inputs
    setNewItemName('');
    setNewItemQty('1');
    setNewItemPrice('');

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [newItemName, newItemQty, newItemPrice]);

  const handleRemoveItem = useCallback((itemId: string) => {
    setLineItems((prev) => prev.filter((item) => item.id !== itemId));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const handleSaveBill = async () => {
    if (lineItems.length === 0) {
      Alert.alert(t('create.noItems'), t('create.addItemPrompt'));
      return;
    }

    setIsSaving(true);

    try {
      await createBill({
        billDate,
        customerName: customerName.trim() || null,
        customerId,
        lineItems: lineItems.map((item) => ({
          itemName: item.itemName,
          quantity: item.quantity,
          pricePaise: item.pricePaise,
          totalPaise: item.totalPaise,
        })),
        subtotalPaise: summary.subtotalPaise,
        discountPaise: summary.discountPaise,
        gstEnabled,
        gstRate: gstEnabled ? gstRate : null,
        cgstPaise: summary.cgstPaise,
        sgstPaise: summary.sgstPaise,
        totalPaise: summary.grandTotalPaise,
        paymentMode,
        status: 'final',
        notes: null,
      });

      // Remember payment mode preference
      setLastPaymentMode(paymentMode);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      console.error('Error saving bill:', error);
      Alert.alert('Error', 'Failed to save bill. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading state when duplicating
  if (isLoadingDuplicate) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}
    >
      <ScrollView
        ref={scrollViewRef}
        style={[styles.scrollView, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="interactive"
      >
        {/* Bill Info */}
        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <Caption>{t('common:labels.billNumber')}</Caption>
            <Text variant="label">{t('common:labels.auto')}</Text>
          </View>
          <View style={styles.halfWidth}>
            <Caption>{t('common:labels.date')}</Caption>
            <Text variant="label">{formatDate(billDate, 'short')}</Text>
          </View>
        </View>

        {/* Customer */}
        <CustomerAutocomplete
          value={customerName}
          onChangeText={setCustomerName}
          onSelectCustomer={handleCustomerSelected}
        />

        {/* Line Items */}
        <View style={styles.section}>
          <Heading3>{t('common:labels.items')}</Heading3>

          {/* Existing items */}
          {lineItems.map((item) => (
            <Card key={item.id} variant="outlined" style={styles.lineItemCard}>
              <View style={styles.lineItemRow}>
                <View style={styles.lineItemInfo}>
                  <Text variant="body" numberOfLines={1}>
                    {item.itemName}
                  </Text>
                  <Caption>
                    {item.quantity} × {formatMoneyCompact(item.pricePaise)}
                  </Caption>
                </View>
                <View style={styles.lineItemActions}>
                  <Text variant="money">
                    {item.pricePaise === 0 ? 'FREE' : formatMoneyCompact(item.totalPaise)}
                  </Text>
                  <Pressable
                    onPress={() => handleRemoveItem(item.id)}
                    style={styles.removeButton}
                    hitSlop={8}
                  >
                    <Text color="error">✕</Text>
                  </Pressable>
                </View>
              </View>
            </Card>
          ))}

          {/* Add new item row */}
          <View style={styles.addItemWrapper}>
            <ItemAutocomplete
              value={newItemName}
              onChangeText={setNewItemName}
              onSelectItem={handleItemSelected}
              placeholder="Item name"
            />
          </View>
          <Card variant="filled" style={styles.addItemCard}>
            <View style={styles.qtyPriceRow}>
              <View style={styles.qtyInput}>
                <NumericInput
                  ref={qtyInputRef}
                  placeholder="Qty"
                  value={newItemQty}
                  onChangeValue={setNewItemQty}
                  returnKeyType="next"
                  onSubmitEditing={() => priceInputRef.current?.focus()}
                  containerStyle={{ marginBottom: 0 }}
                />
              </View>
              <View style={styles.priceInput}>
                <NumericInput
                  ref={priceInputRef}
                  placeholder="Price"
                  value={newItemPrice}
                  onChangeValue={setNewItemPrice}
                  prefix="₹"
                  returnKeyType="done"
                  onSubmitEditing={handleAddItem}
                  containerStyle={{ marginBottom: 0 }}
                />
              </View>
              <Button
                title={t('common:buttons.add')}
                size="small"
                variant="primary"
                onPress={handleAddItem}
                disabled={!newItemName.trim()}
              />
            </View>
          </Card>
        </View>

        {/* Summary */}
        <View style={styles.section}>
          <Card variant="elevated">
            {/* Subtotal */}
            <View style={styles.summaryRow}>
              <Text color="secondary">{t('common:labels.subtotal')}</Text>
              <Text variant="money">{formatMoney(summary.subtotalPaise)}</Text>
            </View>

            {/* Discount */}
            <View style={styles.summaryRow}>
              <Text color="secondary">{t('common:labels.discount')}</Text>
              <View style={styles.discountInput}>
                <NumericInput
                  placeholder="0"
                  value={discountInput}
                  onChangeValue={setDiscountInput}
                  prefix="₹"
                  containerStyle={{ marginBottom: 0, width: 120 }}
                />
              </View>
            </View>

            {/* GST Toggle */}
            <View style={styles.summaryRow}>
              <Text color="secondary">{t('common:labels.gst')}</Text>
              <View style={styles.gstControls}>
                <Pressable
                  onPress={() => setGstEnabled(!gstEnabled)}
                  style={[
                    styles.toggleButton,
                    {
                      backgroundColor: gstEnabled ? colors.primary : colors.surfaceSecondary,
                      borderColor: gstEnabled ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    variant="caption"
                    style={{ color: gstEnabled ? colors.textInverse : colors.text }}
                  >
                    {gstEnabled ? t('common:labels.on') : t('common:labels.off')}
                  </Text>
                </Pressable>

                {gstEnabled && (
                  <View style={styles.gstRates}>
                    {GST_RATES.map((rate) => (
                      <Pressable
                        key={rate}
                        onPress={() => setGstRate(rate)}
                        style={[
                          styles.gstRateButton,
                          {
                            backgroundColor:
                              gstRate === rate ? colors.primary : colors.surfaceSecondary,
                            borderColor: gstRate === rate ? colors.primary : colors.border,
                          },
                        ]}
                      >
                        <Text
                          variant="caption"
                          style={{
                            color: gstRate === rate ? colors.textInverse : colors.text,
                          }}
                        >
                          {rate}%
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* GST Breakdown */}
            {gstEnabled && summary.totalGstPaise > 0 && (
              <>
                <View style={styles.summaryRow}>
                  <Caption>CGST @{gstRate / 2}%</Caption>
                  <Caption>{formatMoney(summary.cgstPaise)}</Caption>
                </View>
                <View style={styles.summaryRow}>
                  <Caption>SGST @{gstRate / 2}%</Caption>
                  <Caption>{formatMoney(summary.sgstPaise)}</Caption>
                </View>
              </>
            )}

            {/* Total */}
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text variant="h3">{t('common:labels.total')}</Text>
              <Text variant="moneyLarge" style={{ color: colors.primary }}>
                {formatMoney(summary.grandTotalPaise)}
              </Text>
            </View>
          </Card>
        </View>

        {/* Payment Mode */}
        <View style={styles.section}>
          <Text variant="label" style={styles.sectionLabel}>
            {t('common:labels.paymentMode')}
          </Text>
          <View style={styles.paymentModes}>
            <Pressable
              onPress={() => setPaymentMode('cash')}
              style={[
                styles.paymentButton,
                {
                  backgroundColor:
                    paymentMode === 'cash' ? colors.primary : colors.surface,
                  borderColor: paymentMode === 'cash' ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                variant="button"
                style={{
                  color: paymentMode === 'cash' ? colors.textInverse : colors.text,
                }}
              >
                💵 Cash
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setPaymentMode('upi')}
              style={[
                styles.paymentButton,
                {
                  backgroundColor:
                    paymentMode === 'upi' ? colors.primary : colors.surface,
                  borderColor: paymentMode === 'upi' ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                variant="button"
                style={{
                  color: paymentMode === 'upi' ? colors.textInverse : colors.text,
                }}
              >
                📱 UPI
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Save Button */}
        <View style={styles.saveSection}>
          <Button
            title={t('create.saveBill')}
            size="large"
            fullWidth
            onPress={handleSaveBill}
            disabled={lineItems.length === 0}
            loading={isSaving}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  row: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    marginBottom: spacing.sm,
  },
  lineItemCard: {
    marginTop: spacing.sm,
    padding: spacing.sm,
  },
  lineItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lineItemInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  lineItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  removeButton: {
    padding: spacing.xs,
  },
  addItemWrapper: {
    marginTop: spacing.sm,
    zIndex: 1000,
  },
  addItemCard: {
    marginTop: spacing.sm,
    padding: spacing.sm,
  },
  qtyPriceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  qtyInput: {
    width: 70,
  },
  priceInput: {
    flex: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  discountInput: {
    alignItems: 'flex-end',
  },
  totalRow: {
    marginTop: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    marginBottom: 0,
  },
  gstControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  toggleButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  gstRates: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  gstRateButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  paymentModes: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  paymentButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  saveSection: {
    marginTop: spacing.md,
  },
});
