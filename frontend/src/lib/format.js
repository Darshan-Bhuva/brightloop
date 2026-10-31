import { format, parseISO, isValid } from 'date-fns';
import { DEFAULT_CURRENCY } from './constants';

/**
 * Format money string/number into localized currency text.
 * Default currency is VITE_CURRENCY (default: INR) using en-IN locale.
 *
 * @param {string|number|null} amount - Decimal string e.g. "1560.00" or number
 * @param {string} [currency] - Currency code (e.g. 'INR', 'USD')
 * @returns {string} Formatted currency text, e.g. "₹1,560.00"
 */
export function formatMoney(amount, currency = import.meta.env.VITE_CURRENCY || DEFAULT_CURRENCY) {
  if (amount === null || amount === undefined || amount === '') {
    return '₹0.00';
  }

  const numericValue = typeof amount === 'number' ? amount : parseFloat(amount);
  if (isNaN(numericValue)) {
    return '₹0.00';
  }

  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericValue);
  } catch {
    return `${currency} ${numericValue.toFixed(2)}`;
  }
}

/**
 * Format a rate or tax value.
 *
 * @param {string|number} rate - e.g. "18.00"
 * @param {'percentage'|'fixed'} [type='percentage']
 * @param {string} [currency]
 * @returns {string} e.g. "18%" or "₹18.00"
 */
export function formatRate(rate, type = 'percentage', currency = import.meta.env.VITE_CURRENCY || DEFAULT_CURRENCY) {
  if (rate === null || rate === undefined || rate === '') {
    return '-';
  }

  const numericRate = typeof rate === 'number' ? rate : parseFloat(rate);
  if (isNaN(numericRate)) {
    return String(rate);
  }

  if (type === 'percentage') {
    return `${numericRate}%`;
  }

  return formatMoney(numericRate, currency);
}

/**
 * Format a date string (YYYY-MM-DD or ISO timestamp).
 *
 * @param {string|Date|null} date
 * @param {string} [pattern='dd MMM yyyy']
 * @param {string} [fallback='-']
 * @returns {string}
 */
export function formatDate(date, pattern = 'dd MMM yyyy', fallback = '-') {
  if (!date) return fallback;

  try {
    const parsed = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(parsed)) return fallback;
    return format(parsed, pattern);
  } catch {
    return fallback;
  }
}

/**
 * Format an ISO timestamp into a date-time string.
 *
 * @param {string|Date|null} timestamp
 * @param {string} [pattern='dd MMM yyyy, hh:mm a']
 * @param {string} [fallback='-']
 * @returns {string}
 */
export function formatDateTime(timestamp, pattern = 'dd MMM yyyy, hh:mm a', fallback = '-') {
  return formatDate(timestamp, pattern, fallback);
}

/**
 * Format numbers with locale grouping.
 *
 * @param {number|string} value
 * @param {number} [decimals]
 * @returns {string}
 */
export function formatNumber(value, decimals = 0) {
  if (value === null || value === undefined || value === '') return '0';
  const num = typeof value === 'number' ? value : parseFloat(value);
  if (isNaN(num)) return '0';

  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * Convert snake_case or kebab-case to Title Case.
 *
 * @param {string} str
 * @returns {string}
 */
export function snakeToTitle(str) {
  if (!str) return '';
  return str
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

