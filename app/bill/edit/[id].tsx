/**
 * BillKhata Bill Edit Screen
 * Edit existing bills
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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme, spacing, borderRadius } from '../../../src/theme';
import {
  Text,
  Button,
  NumericInput,
  Card,
  Caption,
  Heading3,
} from '../../../src/components/ui';
import { ItemAutocomplete, CustomerAutocomplete } from '../../../src/components/bills';
import {
  formatMoney,
  formatMoneyCompact,
  rupeesToPaise,
  paiseToRupees,
  calculateLineTotal,
  calculateBillSummary,
  formatDate,
  generateId,
  getNowISO,
} from '../../../src/utils';
import { BillLineItemForm, PaymentMode, GstRate, Invoice, InvoiceItem } from '../../../src/types';
import { getBillById, db, invoices, invoiceItems } from '../../../src/db';
import { eq } from 'drizzle-orm';
import { useLicense } from '../../../src/hooks';
import { UpgradePrompt } from '../../../src/components/licensing';

const GST_RATES: GstRate[] = [5, 12, 18, 28];

export default function EditBillScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const license = useLicense();

  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [originalBill, setOriginalBill] = useState<Invoice | null>(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  // Form state
  const [customerName, setCustomerName] = useState('');
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [lineItems, setLineItems] = useState<BillLineItemForm[]>([]);
  const [discountInput, setDiscountInput] = useState('');
  const [gstEnabled, setGstEnabled] = useState(false);
  const [gstRate, setGstRate] = useState<GstRate>(18);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
  const [billDate, setBillDate] = useState('');

  // New item input state
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('1');
  const [newItemPrice, setNewItemPrice] = useState('');

  // Refs for auto-advance
  const qtyInputRef = useRef<TextInput>(null);
  const priceInputRef = useRef<TextInput>(null);

  // Load bill data
  useEffect(() => {
    async function loadBill() {
      if (!id) return;

      try {
        const data = await getBillById(id);
        if (data) {
          setOriginalBill(data.bill);
          setCustomerName(data.bill.customerName || '');
          setCustomerId(data.bill.customerId);
          setBillDate(data.bill.billDate);
          setGstEnabled(data.bill.gstEnabled);
          setGstRate((data.bill.gstRate as GstRate) || 18);
          setPaymentMode(data.bill.paymentMode as PaymentMode);
          setDiscountInput(data.bill.discountPaise > 0 ? paiseToRupees(data.bill.discountPaise).toString() : '');

          // Convert invoice items to form items
          const formItems: BillLineItemForm[] = data.items.map((item) => ({
            id: item.id,
            itemName: item.itemName,
            quantity: item.quantity,
            pricePaise: item.pricePaise,
            totalPaise: item.totalPaise,
          }));
          setLineItems(formItems);
        }
      } catch (error) {
        console.error('Error loading bill:', error);
        Alert.alert('Error', 'Failed to load bill');
        router.back();
      } finally {
        setIsLoading(false);
      }
    }

    loadBill();
  }, [id]);

  // Calculate summary
  const discountPaise = rupeesToPaise(parseFloat(discountInput) || 0);
  const summary = calculateBillSummary(lineItems, discountPaise, gstEnabled, gstRate);

  const handleItemSelected = useCallback((name: string, suggestedPricePaise: number | null) => {
    setNewItemName(name);
    if (suggestedPricePaise !== null) {
      setNewItemPrice(paiseToRupees(suggestedPricePaise).toString());
    }
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

    if (!name) return;

    const newItem: BillLineItemForm = {
      id: generateId(),
      itemName: name,
      quantity: qty,
      pricePaise,
      totalPaise: calculateLineTotal(qty, pricePaise),
    };

    setLineItems((prev) => [...prev, newItem]);
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
    if (!id || !originalBill) return;

    // Check license before saving
    if (!license.canEditBill) {
      setShowUpgradePrompt(true);
      return;
    }

    if (lineItems.length === 0) {
      Alert.alert('No Items', 'Please add at least one item to the bill.');
      return;
    }

    setIsSaving(true);

    try {
      const now = getNowISO();

      // Update invoice
      await db.update(invoices).set({
        customerName: customerName.trim() || null,
        customerId,
        subtotalPaise: summary.subtotalPaise,
        discountPaise: summary.discountPaise,
        gstEnabled,
        gstRate: gstEnabled ? gstRate : null,
        cgstPaise: summary.cgstPaise,
        sgstPaise: summary.sgstPaise,
        totalPaise: summary.grandTotalPaise,
        paymentMode,
        updatedAt: now,
      }).where(eq(invoices.id, id));

      // Delete existing items
      await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));

      // Insert new items
      for (let i = 0; i < lineItems.length; i++) {
        const item = lineItems[i];
        await db.insert(invoiceItems).values({
          id: generateId(),
          invoiceId: id,
          itemId: null,
          itemName: item.itemName,
          quantity: item.quantity,
          pricePaise: item.pricePaise,
          totalPaise: item.totalPaise,
          sortOrder: i,
          createdAt: now,
          updatedAt: now,
        });
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      console.error('Error saving bill:', error);
      Alert.alert('Error', 'Failed to save bill. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
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
    >
      <ScrollView
        style={[styles.scrollView, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Bill Info */}
        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <Caption>Bill #</Caption>
            <Text variant="label">#{originalBill?.billNumber}</Text>
          </View>
          <View style={styles.halfWidth}>
            <Caption>Date</Caption>
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
          <Heading3>Items</Heading3>

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
          <Card variant="filled" style={styles.addItemCard}>
            <ItemAutocomplete
              value={newItemName}
              onChangeText={setNewItemName}
              onSelectItem={handleItemSelected}
              placeholder="Item name"
            />
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
                title="Add"
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
            <View style={styles.summaryRow}>
              <Text color="secondary">Subtotal</Text>
              <Text variant="money">{formatMoney(summary.subtotalPaise)}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text color="secondary">Discount</Text>
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

            <View style={styles.summaryRow}>
              <Text color="secondary">GST</Text>
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
                    {gstEnabled ? 'ON' : 'OFF'}
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
                            backgroundColor: gstRate === rate ? colors.primary : colors.surfaceSecondary,
                            borderColor: gstRate === rate ? colors.primary : colors.border,
                          },
                        ]}
                      >
                        <Text
                          variant="caption"
                          style={{ color: gstRate === rate ? colors.textInverse : colors.text }}
                        >
                          {rate}%
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            </View>

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

            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text variant="h3">TOTAL</Text>
              <Text variant="moneyLarge" style={{ color: colors.primary }}>
                {formatMoney(summary.grandTotalPaise)}
              </Text>
            </View>
          </Card>
        </View>

        {/* Payment Mode */}
        <View style={styles.section}>
          <Text variant="label" style={styles.sectionLabel}>Payment Mode</Text>
          <View style={styles.paymentModes}>
            <Pressable
              onPress={() => setPaymentMode('cash')}
              style={[
                styles.paymentButton,
                {
                  backgroundColor: paymentMode === 'cash' ? colors.primary : colors.surface,
                  borderColor: paymentMode === 'cash' ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                variant="button"
                style={{ color: paymentMode === 'cash' ? colors.textInverse : colors.text }}
              >
                💵 Cash
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setPaymentMode('upi')}
              style={[
                styles.paymentButton,
                {
                  backgroundColor: paymentMode === 'upi' ? colors.primary : colors.surface,
                  borderColor: paymentMode === 'upi' ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                variant="button"
                style={{ color: paymentMode === 'upi' ? colors.textInverse : colors.text }}
              >
                📱 UPI
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Save Button */}
        <View style={styles.saveSection}>
          <Button
            title="SAVE CHANGES"
            size="large"
            fullWidth
            onPress={handleSaveBill}
            disabled={lineItems.length === 0}
            loading={isSaving}
          />
        </View>
      </ScrollView>

      {/* Upgrade Prompt */}
      <UpgradePrompt
        visible={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xxxl },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  row: { flexDirection: 'row', marginBottom: spacing.md },
  halfWidth: { flex: 1 },
  section: { marginBottom: spacing.lg },
  sectionLabel: { marginBottom: spacing.sm },
  lineItemCard: { marginTop: spacing.sm, padding: spacing.sm },
  lineItemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lineItemInfo: { flex: 1, marginRight: spacing.md },
  lineItemActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  removeButton: { padding: spacing.xs },
  addItemCard: { marginTop: spacing.sm, padding: spacing.sm },
  qtyPriceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, marginTop: spacing.sm },
  qtyInput: { width: 70 },
  priceInput: { flex: 1 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  discountInput: { alignItems: 'flex-end' },
  totalRow: { marginTop: spacing.sm, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.1)', marginBottom: 0 },
  gstControls: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  toggleButton: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.sm, borderWidth: 1 },
  gstRates: { flexDirection: 'row', gap: spacing.xs },
  gstRateButton: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.sm, borderWidth: 1 },
  paymentModes: { flexDirection: 'row', gap: spacing.md },
  paymentButton: { flex: 1, paddingVertical: spacing.md, borderRadius: borderRadius.md, borderWidth: 1, alignItems: 'center' },
  saveSection: { marginTop: spacing.md },
});
