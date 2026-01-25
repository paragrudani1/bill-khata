/**
 * BillKhata Money Utilities
 * All monetary values stored as paise (integer) internally
 * Displayed as rupees with proper Indian formatting
 */

/**
 * Convert rupees to paise (integer)
 * @param rupees - Amount in rupees (can have decimals)
 * @returns Amount in paise (integer)
 */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/**
 * Convert paise to rupees
 * @param paise - Amount in paise (integer)
 * @returns Amount in rupees (with decimals)
 */
export function paiseToRupees(paise: number): number {
  return paise / 100;
}

/**
 * Format paise as Indian rupee string
 * Uses Indian number system (lakhs, crores)
 * @param paise - Amount in paise
 * @param includeSymbol - Whether to include ₹ symbol (default: true)
 * @returns Formatted string like "₹1,23,456.78"
 */
export function formatMoney(paise: number, includeSymbol: boolean = true): string {
  const rupees = paiseToRupees(paise);
  const formatted = formatIndianNumber(rupees, 2);
  return includeSymbol ? `₹${formatted}` : formatted;
}

/**
 * Format paise as compact string (no decimals if whole number)
 * @param paise - Amount in paise
 * @param includeSymbol - Whether to include ₹ symbol (default: true)
 */
export function formatMoneyCompact(paise: number, includeSymbol: boolean = true): string {
  const rupees = paiseToRupees(paise);
  const decimals = paise % 100 === 0 ? 0 : 2;
  const formatted = formatIndianNumber(rupees, decimals);
  return includeSymbol ? `₹${formatted}` : formatted;
}

/**
 * Format number using Indian numbering system
 * 1,00,000 (one lakh) instead of 100,000
 * @param num - Number to format
 * @param decimals - Number of decimal places
 */
export function formatIndianNumber(num: number, decimals: number = 0): string {
  const [integerPart, decimalPart] = num.toFixed(decimals).split('.');

  // Handle negative numbers
  const isNegative = integerPart.startsWith('-');
  const absInteger = isNegative ? integerPart.slice(1) : integerPart;

  // Indian number formatting: XX,XX,XX,XXX
  let formatted = '';
  const len = absInteger.length;

  if (len <= 3) {
    formatted = absInteger;
  } else {
    // Last 3 digits
    formatted = absInteger.slice(-3);
    let remaining = absInteger.slice(0, -3);

    // Add pairs of digits separated by commas
    while (remaining.length > 0) {
      const chunk = remaining.slice(-2);
      formatted = chunk + ',' + formatted;
      remaining = remaining.slice(0, -2);
    }
  }

  // Add back negative sign and decimals
  const sign = isNegative ? '-' : '';
  const decimal = decimalPart ? '.' + decimalPart : '';

  return sign + formatted + decimal;
}

/**
 * Parse a string input to paise
 * Handles various input formats
 * @param input - String input (e.g., "100", "100.50", "1,00,000")
 * @returns Amount in paise, or null if invalid
 */
export function parseToPaise(input: string): number | null {
  // Remove currency symbol, spaces, and commas
  const cleaned = input.replace(/[₹Rs.\s,]/gi, '').trim();

  if (!cleaned || isNaN(Number(cleaned))) {
    return null;
  }

  const rupees = parseFloat(cleaned);
  return rupeesToPaise(rupees);
}

/**
 * Calculate line item total
 * @param quantity - Item quantity
 * @param pricePaise - Unit price in paise
 * @returns Total in paise
 */
export function calculateLineTotal(quantity: number, pricePaise: number): number {
  return Math.round(quantity * pricePaise);
}

/**
 * Calculate GST breakdown
 * @param amountPaise - Amount before GST (after discount)
 * @param gstRate - GST rate (5, 12, 18, or 28)
 * @returns Object with cgst, sgst, and total GST in paise
 */
export function calculateGst(amountPaise: number, gstRate: number): {
  cgstPaise: number;
  sgstPaise: number;
  totalGstPaise: number;
} {
  const totalGstPaise = Math.round(amountPaise * (gstRate / 100));
  const cgstPaise = Math.round(totalGstPaise / 2);
  const sgstPaise = totalGstPaise - cgstPaise; // Avoid rounding errors

  return {
    cgstPaise,
    sgstPaise,
    totalGstPaise,
  };
}

/**
 * Calculate full bill summary
 * @param lineItems - Array of line items with totalPaise
 * @param discountPaise - Flat discount amount
 * @param gstEnabled - Whether GST is enabled
 * @param gstRate - GST rate if enabled
 */
export function calculateBillSummary(
  lineItems: { totalPaise: number }[],
  discountPaise: number,
  gstEnabled: boolean,
  gstRate: number | null
): {
  subtotalPaise: number;
  discountPaise: number;
  discountedSubtotalPaise: number;
  cgstPaise: number;
  sgstPaise: number;
  totalGstPaise: number;
  grandTotalPaise: number;
} {
  // Calculate subtotal
  const subtotalPaise = lineItems.reduce((sum, item) => sum + item.totalPaise, 0);

  // Apply discount (ensure we don't go negative)
  const effectiveDiscount = Math.min(discountPaise, subtotalPaise);
  const discountedSubtotalPaise = subtotalPaise - effectiveDiscount;

  // Calculate GST on discounted amount
  let cgstPaise = 0;
  let sgstPaise = 0;
  let totalGstPaise = 0;

  if (gstEnabled && gstRate) {
    const gst = calculateGst(discountedSubtotalPaise, gstRate);
    cgstPaise = gst.cgstPaise;
    sgstPaise = gst.sgstPaise;
    totalGstPaise = gst.totalGstPaise;
  }

  // Grand total
  const grandTotalPaise = discountedSubtotalPaise + totalGstPaise;

  return {
    subtotalPaise,
    discountPaise: effectiveDiscount,
    discountedSubtotalPaise,
    cgstPaise,
    sgstPaise,
    totalGstPaise,
    grandTotalPaise,
  };
}
