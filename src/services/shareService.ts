/**
 * BillKhata Share Service
 * Handle sharing invoices via WhatsApp and other apps
 */

import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Linking, Platform, Alert } from 'react-native';
import { generateInvoicePdf, InvoiceTemplate, InvoiceColorTheme } from './pdfGenerator';
import { getBillById } from '../db';
import { Invoice, InvoiceItem } from '../types';

interface ShareOptions {
  billId: string;
  shopName: string;
  shopPhone: string;
  shopAddress: string;
  shopLogoUri: string | null;
  template: InvoiceTemplate;
  colorTheme: InvoiceColorTheme;
  footerNote: string;
}

/**
 * Generate PDF and share via system share sheet
 */
export async function shareBill(options: ShareOptions): Promise<boolean> {
  try {
    // Fetch bill data
    const billData = await getBillById(options.billId);
    if (!billData) {
      Alert.alert('Error', 'Bill not found');
      return false;
    }

    // Generate PDF
    const pdfPath = await generateInvoicePdf({
      bill: billData.bill,
      items: billData.items,
      shopName: options.shopName,
      shopPhone: options.shopPhone,
      shopAddress: options.shopAddress,
      shopLogoUri: options.shopLogoUri,
      template: options.template,
      colorTheme: options.colorTheme,
      footerNote: options.footerNote,
    });

    // Check if sharing is available
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert('Error', 'Sharing is not available on this device');
      return false;
    }

    // Share the PDF
    await Sharing.shareAsync(pdfPath, {
      mimeType: 'application/pdf',
      dialogTitle: `Invoice #${billData.bill.billNumber}`,
      UTI: 'com.adobe.pdf',
    });

    return true;
  } catch (error) {
    console.error('Error sharing bill:', error);
    Alert.alert('Error', 'Failed to share bill. Please try again.');
    return false;
  }
}

/**
 * Share bill via WhatsApp specifically
 */
export async function shareViaWhatsApp(options: ShareOptions): Promise<boolean> {
  try {
    // Fetch bill data
    const billData = await getBillById(options.billId);
    if (!billData) {
      Alert.alert('Error', 'Bill not found');
      return false;
    }

    // Generate PDF
    const pdfPath = await generateInvoicePdf({
      bill: billData.bill,
      items: billData.items,
      shopName: options.shopName,
      shopPhone: options.shopPhone,
      shopAddress: options.shopAddress,
      shopLogoUri: options.shopLogoUri,
      template: options.template,
      colorTheme: options.colorTheme,
      footerNote: options.footerNote,
    });

    // Check if WhatsApp is installed
    const whatsappUrl = Platform.select({
      ios: 'whatsapp://',
      android: 'whatsapp://',
    });

    if (whatsappUrl) {
      const canOpen = await Linking.canOpenURL(whatsappUrl);

      if (!canOpen) {
        // WhatsApp not installed, fall back to regular share
        Alert.alert(
          'WhatsApp Not Found',
          'WhatsApp is not installed. Would you like to share via other apps?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Share',
              onPress: () => shareBill(options)
            },
          ]
        );
        return false;
      }
    }

    // Use system share which will include WhatsApp
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert('Error', 'Sharing is not available on this device');
      return false;
    }

    // Share - on Android, WhatsApp will appear in the share sheet
    await Sharing.shareAsync(pdfPath, {
      mimeType: 'application/pdf',
      dialogTitle: `Share Invoice #${billData.bill.billNumber}`,
      UTI: 'com.adobe.pdf',
    });

    return true;
  } catch (error) {
    console.error('Error sharing via WhatsApp:', error);
    Alert.alert('Error', 'Failed to share via WhatsApp. Please try again.');
    return false;
  }
}

/**
 * Generate a text summary of the bill (for SMS or clipboard)
 */
export function generateBillSummaryText(bill: Invoice, items: InvoiceItem[], shopName: string): string {
  const lines: string[] = [];

  lines.push(`📋 INVOICE #${bill.billNumber}`);
  lines.push(`${shopName}`);
  lines.push(`Date: ${bill.billDate}`);
  lines.push('');

  if (bill.customerName) {
    lines.push(`Customer: ${bill.customerName}`);
    lines.push('');
  }

  lines.push('Items:');
  items.forEach((item) => {
    const price = item.pricePaise === 0 ? 'FREE' : `₹${(item.totalPaise / 100).toFixed(2)}`;
    lines.push(`• ${item.itemName} (${item.quantity}x) - ${price}`);
  });

  lines.push('');
  lines.push(`Subtotal: ₹${(bill.subtotalPaise / 100).toFixed(2)}`);

  if (bill.discountPaise > 0) {
    lines.push(`Discount: -₹${(bill.discountPaise / 100).toFixed(2)}`);
  }

  if (bill.gstEnabled && bill.gstRate) {
    const gstHalf = bill.gstRate / 2;
    lines.push(`CGST @${gstHalf}%: ₹${(bill.cgstPaise / 100).toFixed(2)}`);
    lines.push(`SGST @${gstHalf}%: ₹${(bill.sgstPaise / 100).toFixed(2)}`);
  }

  lines.push('');
  lines.push(`💰 TOTAL: ₹${(bill.totalPaise / 100).toFixed(2)}`);
  lines.push(`Payment: ${bill.paymentMode === 'cash' ? 'Cash' : 'UPI'}`);

  return lines.join('\n');
}

/**
 * Save PDF to device (for manual sharing later)
 */
export async function savePdfToDevice(options: ShareOptions): Promise<string | null> {
  try {
    const billData = await getBillById(options.billId);
    if (!billData) {
      Alert.alert('Error', 'Bill not found');
      return null;
    }

    const pdfPath = await generateInvoicePdf({
      bill: billData.bill,
      items: billData.items,
      shopName: options.shopName,
      shopPhone: options.shopPhone,
      shopAddress: options.shopAddress,
      shopLogoUri: options.shopLogoUri,
      template: options.template,
      colorTheme: options.colorTheme,
      footerNote: options.footerNote,
    });

    Alert.alert(
      'PDF Saved',
      'Invoice PDF has been saved. You can share it manually from your files.',
      [{ text: 'OK' }]
    );

    return pdfPath;
  } catch (error) {
    console.error('Error saving PDF:', error);
    Alert.alert('Error', 'Failed to save PDF. Please try again.');
    return null;
  }
}
