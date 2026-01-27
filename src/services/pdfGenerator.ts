/**
 * BillKhata PDF Generator Service
 * Template-based PDF generation for invoices
 */

import { File, Directory, Paths } from 'expo-file-system';
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
    // Create a File instance from the URI
    const file = new File(uri);

    // Check if the file exists
    if (!file.exists) {
      console.warn('Logo file does not exist:', uri);
      return null;
    }

    // Read as base64
    const base64 = await file.base64();

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
      font-size: ${isCompact ? '16px' : '18px'};
      line-height: 1.5;
      color: #333;
      padding: 40px 30px;
      background: #fff;
    }

    .invoice {
      max-width: 100%;
      margin: 0 auto;
    }

    /* Header */
    .header {
      text-align: center;
      margin-bottom: ${isCompact ? '20px' : '30px'};
      padding-bottom: ${isCompact ? '15px' : '20px'};
      border-bottom: 2px solid ${primaryColor};
    }

    .shop-logo {
      width: 90px;
      height: 90px;
      object-fit: contain;
      margin-bottom: 12px;
    }

    .shop-name {
      font-size: 28px;
      font-weight: bold;
      color: ${primaryColor};
      margin-bottom: 8px;
    }

    .shop-details {
      font-size: ${isCompact ? '14px' : '15px'};
      color: #666;
    }

    /* Invoice Info */
    .invoice-info {
      display: block;
      margin-bottom: ${isCompact ? '20px' : '25px'};
      padding: ${isCompact ? '15px' : '20px'};
      background: ${isModern ? '#f8f9fa' : 'transparent'};
      border-radius: ${isModern ? '8px' : '0'};
    }

    .invoice-title {
      font-size: ${isCompact ? '20px' : '24px'};
      font-weight: bold;
      color: ${primaryColor};
    }

    .invoice-meta {
      text-align: left;
      margin-top: 12px;
    }

    .invoice-meta div {
      margin-bottom: 5px;
    }

    .label {
      color: #666;
      font-size: 12px;
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
      margin-bottom: ${isCompact ? '20px' : '25px'};
    }

    .items-table th {
      background: ${primaryColor};
      color: white;
      padding: ${isCompact ? '10px 12px' : '14px 18px'};
      text-align: left;
      font-size: ${isCompact ? '14px' : '15px'};
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
      padding: ${isCompact ? '10px 12px' : '14px 18px'};
      border-bottom: 1px solid #eee;
    }

    .items-table tr.even {
      background: ${isModern ? '#f8f9fa' : 'transparent'};
    }

    .item-name {
      word-break: break-word;
    }

    /* Summary */
    .summary {
      width: 100%;
      max-width: 100%;
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
      margin-top: 10px;
      padding-top: 12px;
      font-size: ${isCompact ? '18px' : '20px'};
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
      font-size: ${isCompact ? '12px' : '13px'};
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
      margin-top: ${isCompact ? '25px' : '35px'};
      padding-top: ${isCompact ? '20px' : '25px'};
      border-top: 1px solid #eee;
      text-align: center;
    }

    .footer-note {
      font-size: ${isCompact ? '12px' : '13px'};
      color: #666;
      font-style: italic;
    }

    .thank-you {
      font-size: ${isCompact ? '14px' : '16px'};
      font-weight: 600;
      color: ${primaryColor};
      margin-top: 12px;
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
function getPdfCacheDir(): Directory {
  return new Directory(Paths.cache, 'invoices');
}

/**
 * Get cached PDF path for a bill
 */
function getCachedPdfFile(billId: string): File {
  return new File(getPdfCacheDir(), `invoice_${billId}.pdf`);
}

/**
 * Check if a cached PDF exists and is valid
 */
async function getCachedPdf(billId: string): Promise<string | null> {
  try {
    const pdfFile = getCachedPdfFile(billId);

    if (pdfFile.exists) {
      // Check if file is less than 7 days old
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const modTime = pdfFile.modificationTime;
      if (modTime && modTime > sevenDaysAgo) {
        return pdfFile.uri;
      }
      // Delete old cache
      await pdfFile.delete();
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

  // Create PDF with larger width for mobile readability
  const { uri } = await Print.printToFileAsync({
    html,
    base64: false,
    width: 794, // A4 width at 96 DPI
  });

  // Ensure cache directory exists
  const cacheDir = getPdfCacheDir();
  if (!cacheDir.exists) {
    await cacheDir.create();
  }

  // Move to cache with proper name
  const tempFile = new File(uri);
  const cachedFile = getCachedPdfFile(bill.id);
  await tempFile.move(cachedFile);

  console.log('Generated PDF:', cachedFile.uri);
  return cachedFile.uri;
}

/**
 * Clean up old cached PDFs (older than 7 days)
 */
export async function cleanupPdfCache(): Promise<number> {
  let deletedCount = 0;

  try {
    const cacheDir = getPdfCacheDir();

    if (!cacheDir.exists) return 0;

    const files = await cacheDir.list();
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    for (const item of files) {
      if (item instanceof File) {
        const modTime = item.modificationTime;
        if (modTime && modTime < sevenDaysAgo) {
          await item.delete();
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
    const pdfFile = getCachedPdfFile(billId);
    if (pdfFile.exists) {
      await pdfFile.delete();
    }
  } catch (error) {
    console.error('Error deleting cached PDF:', error);
  }
}
