// Indian Number and Currency Formatters

/**
 * Formats a currency amount in Indian Rupees (INR)
 * @param amountInRs The amount in Rupees
 * @returns Formatted currency string
 */
export const formatRupees = (amountInRs: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amountInRs);
};

/**
 * Formats a Crores value into a readable string (Lakhs or Crores depending on size)
 * @param amountInCr The amount in Crores (Rs. Cr.)
 * @returns Formatted string (e.g., "₹8.28 Lakh" or "₹1.42 Cr")
 */
export const formatCr = (amountInCr: number): string => {
  const rs = amountInCr * 10000000;
  if (rs >= 10000000) {
    return `₹${amountInCr.toFixed(2)} Cr`;
  } else if (rs >= 100000) {
    const lakhs = rs / 100000;
    return `₹${lakhs.toFixed(2)} Lakh`;
  } else {
    return formatRupees(rs);
  }
};

/**
 * Formats a date string to a human-readable Indian format (DD-MMM-YYYY)
 * @param dateStr ISO date string
 * @returns Formatted date
 */
export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '-';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${String(d.getDate()).padStart(2, '0')}-${months[d.getMonth()]}-${d.getFullYear()}`;
};

/**
 * Calculates the age of a material in months
 * @param invoiceDateStr ISO date string
 * @returns Age in months
 */
export const calculateAgeMonths = (invoiceDateStr: string): number => {
  if (!invoiceDateStr) return 0;
  const d = new Date(invoiceDateStr);
  if (isNaN(d.getTime())) return 0;
  
  const today = new Date('2026-06-14'); // System date context (June 2026)
  const diffTime = Math.abs(today.getTime() - d.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.floor(diffDays / 30.4);
};
