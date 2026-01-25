/**
 * BillKhata PDF Generator Service
 * Template-based PDF generation for invoices
 */

import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import { Invoice, InvoiceItem } from '../types';
import { formatMoney, formatDate, formatBillNumber, formatIndianNumber } from '../utils';
import { colors } from '../theme';

export type InvoiceTemplate = 'classic' | 'modern' | 'compact';
export type InvoiceColorTheme = 'blue' | 'green' | 'orange' | 'purple';

interface PdfGeneratorOptions {
  bill: Invoice;
  items: InvoiceItem[];
  shopName: string;
  shopPhone: string;
  shopAddress: string;
  shopLogoUri: string | null;
  template: InvoiceTemplate;
  colorTheme: InvoiceColorTheme;
  footerNote: string;
}

const themeColors: Record<InvoiceColorTheme, string> = {
  blue: '#2563EB',
  green: '#16A34A',
  orange: '#EA580C',
  purple: '#9333EA',
};

/**
 * Convert a local image URI to a base64 data URL
 */
async function getBase64Logo(uri: string | null): Promise<string | null> {
  if (!uri) return null;

  try {
    // Check if the file exists
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      console.warn('Logo file does not exist:', uri);
      return null;
    }

    // Read as base64
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Determine MIME type from extension
    const extension = uri.split('.').pop()?.toLowerCase();
    let mimeType = 'image/png';
    if (extension === 'jpg' || extension === 'jpeg') {
      mimeType = 'image/jpeg';
    } else if (extension === 'gif') {
      mimeType = 'image/gif';
    } else if (extension === 'webp') {
      mimeType = 'image/webp';
    }

    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error('Error converting logo to base64:', error);
    return null;
  }
}

/**
 * Generate HTML for the invoice
 */
function generateInvoiceHtml(options: PdfGeneratorOptions, logoBase64: string | null): string {
  const {
    bill,
    items,
    shopName,
    shopPhone,
    shopAddress,
    template,
    colorTheme,
    footerNote,
  } = options;

  const primaryColor = themeColors[colorTheme];
  const isCompact = template === 'compact';
  const isModern = template === 'modern';

  // Calculate GST rate display
  const gstRateHalf = bill.gstRate ? bill.gstRate / 2 : 0;

  // Format items for display
  const itemRows = items
    .map((item, index) => {
      const priceDisplay = item.pricePaise === 0 ? 'FREE' : formatMoney(item.pricePaise);
      const totalDisplay = item.pricePaise === 0 ? 'FREE' : formatMoney(item.totalPaise);

      return `
        <tr class="${index % 2 === 0 ? 'even' : 'odd'}">
          <td class="item-name">${escapeHtml(item.itemName)}</td>
          <td class="qty">${item.quantity}</td>
          <td class="rate">${priceDisplay}</td>
          <td class="amount">${totalDisplay}</td>
        </tr>
      `;
    })
    .join('');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: ${isCompact ? '11px' : '12px'};
      line-height: 1.4;
      color: #333;
      padding: ${isCompact ? '15px' : isModern ? '30px' : '20px'};
      background: #fff;
    }

    .invoice {
      max-width: 100%;
      margin: 0 auto;
    }

    /* Header */
    .header {
      text-align: center;
      margin-bottom: ${isCompact ? '15px' : '25px'};
      padding-bottom: ${isCompact ? '10px' : '15px'};
      border-bottom: 2px solid ${primaryColor};
    }

    .shop-logo {
      width: 60px;
      height: 60px;
      object-fit: contain;
      margin-bottom: 10px;
    }

    .shop-name {
      font-size: ${isCompact ? '18px' : '24px'};
      font-weight: bold;
      color: ${primaryColor};
      margin-bottom: 5px;
    }

    .shop-details {
      font-size: ${isCompact ? '10px' : '11px'};
      color: #666;
    }

    /* Invoice Info */
    .invoice-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: ${isCompact ? '15px' : '20px'};
      padding: ${isCompact ? '10px' : '15px'};
      background: ${isModern ? '#f8f9fa' : 'transparent'};
      border-radius: ${isModern ? '8px' : '0'};
    }

    .invoice-title {
      font-size: ${isCompact ? '14px' : '18px'};
      font-weight: bold;
      color: ${primaryColor};
    }

    .invoice-meta {
      text-align: right;
    }

    .invoice-meta div {
      margin-bottom: 3px;
    }

    .label {
      color: #666;
      font-size: 10px;
    }

    .value {
      font-weight: 600;
    }

    /* Customer */
    .customer {
      margin-bottom: ${isCompact ? '10px' : '15px'};
    }

    .customer-name {
      font-weight: 600;
    }

    /* Items Table */
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: ${isCompact ? '15px' : '20px'};
    }

    .items-table th {
      background: ${primaryColor};
      color: white;
      padding: ${isCompact ? '6px 8px' : '10px 12px'};
      text-align: left;
      font-size: ${isCompact ? '10px' : '11px'};
      text-transform: uppercase;
    }

    .items-table th:last-child,
    .items-table td:last-child {
      text-align: right;
    }

    .items-table th.qty,
    .items-table td.qty,
    .items-table th.rate,
    .items-table td.rate {
      text-align: center;
    }

    .items-table td {
      padding: ${isCompact ? '6px 8px' : '10px 12px'};
      border-bottom: 1px solid #eee;
    }

    .items-table tr.even {
      background: ${isModern ? '#f8f9fa' : 'transparent'};
    }

    .item-name {
      max-width: 200px;
    }

    /* Summary */
    .summary {
      margin-left: auto;
      width: ${isCompact ? '200px' : '250px'};
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: ${isCompact ? '4px 0' : '6px 0'};
      border-bottom: 1px solid #eee;
    }

    .summary-row.total {
      border-bottom: none;
      border-top: 2px solid ${primaryColor};
      margin-top: 8px;
      padding-top: 10px;
      font-size: ${isCompact ? '14px' : '16px'};
      font-weight: bold;
    }

    .summary-row.total .amount {
      color: ${primaryColor};
    }

    .summary-row .label {
      color: #666;
    }

    .summary-row .amount {
      font-weight: 600;
    }

    .gst-row {
      font-size: ${isCompact ? '10px' : '11px'};
    }

    /* Payment */
    .payment {
      margin-top: ${isCompact ? '15px' : '20px'};
      padding: ${isCompact ? '8px 12px' : '10px 15px'};
      background: #f8f9fa;
      border-radius: 4px;
      display: inline-block;
    }

    .payment-mode {
      font-weight: 600;
    }

    /* Footer */
    .footer {
      margin-top: ${isCompact ? '20px' : '30px'};
      padding-top: ${isCompact ? '15px' : '20px'};
      border-top: 1px solid #eee;
      text-align: center;
    }

    .footer-note {
      font-size: ${isCompact ? '10px' : '11px'};
      color: #666;
      font-style: italic;
    }

    .thank-you {
      font-size: ${isCompact ? '12px' : '14px'};
      font-weight: 600;
      color: ${primaryColor};
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="invoice">
    <!-- Header -->
    <div class="header">
      ${logoBase64 ? `<img src="${logoBase64}" class="shop-logo" alt="Logo">` : ''}
      <div class="shop-name">${escapeHtml(shopName || 'My Shop')}</div>
      <div class="shop-details">
        ${shopPhone ? `Phone: ${escapeHtml(shopPhone)}<br>` : ''}
        ${shopAddress ? escapeHtml(shopAddress) : ''}
      </div>
    </div>

    <!-- Invoice Info -->
    <div class="invoice-info">
      <div>
        <div class="invoice-title">INVOICE</div>
        ${bill.customerName ? `
          <div class="customer">
            <span class="label">Bill To:</span>
            <div class="customer-name">${escapeHtml(bill.customerName)}</div>
          </div>
        ` : ''}
      </div>
      <div class="invoice-meta">
        <div>
          <span class="label">Invoice No:</span>
          <span class="value">${formatBillNumber(bill.billNumber)}</span>
        </div>
        <div>
          <span class="label">Date:</span>
          <span class="value">${formatDate(bill.billDate, 'long')}</span>
        </div>
      </div>
    </div>

    <!-- Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th>Item</th>
          <th class="qty">Qty</th>
          <th class="rate">Rate</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
      </tbody>
    </table>

    <!-- Summary -->
    <div class="summary">
      <div class="summary-row">
        <span class="label">Subtotal</span>
        <span class="amount">${formatMoney(bill.subtotalPaise)}</span>
      </div>

      ${bill.discountPaise > 0 ? `
        <div class="summary-row">
          <span class="label">Discount</span>
          <span class="amount">-${formatMoney(bill.discountPaise)}</span>
        </div>
      ` : ''}

      ${bill.gstEnabled && bill.gstRate ? `
        <div class="summary-row gst-row">
          <span class="label">CGST @${gstRateHalf}%</span>
          <span class="amount">${formatMoney(bill.cgstPaise)}</span>
        </div>
        <div class="summary-row gst-row">
          <span class="label">SGST @${gstRateHalf}%</span>
          <span class="amount">${formatMoney(bill.sgstPaise)}</span>
        </div>
      ` : ''}

      <div class="summary-row total">
        <span>GRAND TOTAL</span>
        <span class="amount">${formatMoney(bill.totalPaise)}</span>
      </div>
    </div>

    <!-- Payment Mode -->
    <div class="payment">
      <span class="label">Payment Mode:</span>
      <span class="payment-mode">${bill.paymentMode === 'cash' ? '💵 Cash' : '📱 UPI'}</span>
    </div>

    <!-- Footer -->
    <div class="footer">
      ${footerNote ? `<div class="footer-note">${escapeHtml(footerNote)}</div>` : ''}
      <div class="thank-you">Thank you for your business!</div>
    </div>
  </div>
</body>
</html>
  `;

  return html;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Get the cache directory for PDFs
 */
function getPdfCacheDir(): string {
  return `${FileSystem.cacheDirectory}invoices/`;
}

/**
 * Get cached PDF path for a bill
 */
function getCachedPdfPath(billId: string): string {
  return `${getPdfCacheDir()}invoice_${billId}.pdf`;
}

/**
 * Check if a cached PDF exists and is valid
 */
async function getCachedPdf(billId: string): Promise<string | null> {
  try {
    const pdfPath = getCachedPdfPath(billId);
    const fileInfo = await FileSystem.getInfoAsync(pdfPath);

    if (fileInfo.exists) {
      // Check if file is less than 7 days old
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      if (fileInfo.modificationTime && fileInfo.modificationTime * 1000 > sevenDaysAgo) {
        return pdfPath;
      }
      // Delete old cache
      await FileSystem.deleteAsync(pdfPath, { idempotent: true });
    }
  } catch (error) {
    console.error('Error checking cached PDF:', error);
  }
  return null;
}

/**
 * Generate and cache a PDF for a bill
 */
export async function generateInvoicePdf(options: PdfGeneratorOptions): Promise<string> {
  const { bill } = options;

  // Check cache first
  const cachedPdf = await getCachedPdf(bill.id);
  if (cachedPdf) {
    console.log('Using cached PDF:', cachedPdf);
    return cachedPdf;
  }

  // Convert logo to base64 for embedding in HTML
  const logoBase64 = await getBase64Logo(options.shopLogoUri);

  // Generate HTML
  const html = generateInvoiceHtml(options, logoBase64);

  // Create PDF
  const { uri } = await Print.printToFileAsync({
    html,
    base64: false,
  });

  // Ensure cache directory exists
  const cacheDir = getPdfCacheDir();
  const dirInfo = await FileSystem.getInfoAsync(cacheDir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
  }

  // Move to cache with proper name
  const cachedPath = getCachedPdfPath(bill.id);
  await FileSystem.moveAsync({
    from: uri,
    to: cachedPath,
  });

  console.log('Generated PDF:', cachedPath);
  return cachedPath;
}

/**
 * Clean up old cached PDFs (older than 7 days)
 */
export async function cleanupPdfCache(): Promise<number> {
  let deletedCount = 0;

  try {
    const cacheDir = getPdfCacheDir();
    const dirInfo = await FileSystem.getInfoAsync(cacheDir);

    if (!dirInfo.exists) return 0;

    const files = await FileSystem.readDirectoryAsync(cacheDir);
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    for (const file of files) {
      const filePath = `${cacheDir}${file}`;
      const fileInfo = await FileSystem.getInfoAsync(filePath);

      if (fileInfo.exists && fileInfo.modificationTime) {
        if (fileInfo.modificationTime * 1000 < sevenDaysAgo) {
          await FileSystem.deleteAsync(filePath, { idempotent: true });
          deletedCount++;
        }
      }
    }
  } catch (error) {
    console.error('Error cleaning PDF cache:', error);
  }

  return deletedCount;
}

/**
 * Delete a specific cached PDF
 */
export async function deleteCachedPdf(billId: string): Promise<void> {
  try {
    const pdfPath = getCachedPdfPath(billId);
    await FileSystem.deleteAsync(pdfPath, { idempotent: true });
  } catch (error) {
    console.error('Error deleting cached PDF:', error);
  }
}
