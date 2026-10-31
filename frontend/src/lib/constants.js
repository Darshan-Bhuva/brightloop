/**
 * Application Constants and Enums
 * Source of truth: docs/PLAN.md (Section 1, Section 3, Section 6)
 */

export const TOKEN_KEY = 'bl_token';
export const DEFAULT_CURRENCY = 'INR';
export const DEFAULT_PAGE = 1;
export const DEFAULT_PER_PAGE = 15;
export const MAX_PER_PAGE = 100;

// Password validation rules (min 9 chars, 1 uppercase, 1 lowercase, 1 special character)
export const PASSWORD_RULES = {
  minLength: 9,
  hasUpper: /[A-Z]/,
  hasLower: /[a-z]/,
  hasSymbol: /[^A-Za-z0-9]/,
};

// -------------------------------------------------------------
// Enums (exact values from PLAN.md Section 3)
// -------------------------------------------------------------

export const ROLES = {
  ADMIN: 'admin',
  STAFF: 'staff',
  CUSTOMER: 'customer',
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Admin',
  [ROLES.STAFF]: 'Staff',
  [ROLES.CUSTOMER]: 'Customer',
};

export const PRODUCT_TYPES = {
  SERVICE: 'service',
  GOODS: 'goods',
};

export const PRODUCT_TYPE_LABELS = {
  [PRODUCT_TYPES.SERVICE]: 'Service',
  [PRODUCT_TYPES.GOODS]: 'Goods',
};

export const TAX_TYPES = {
  PERCENTAGE: 'percentage',
  FIXED: 'fixed',
};

export const TAX_TYPE_LABELS = {
  [TAX_TYPES.PERCENTAGE]: 'Percentage (%)',
  [TAX_TYPES.FIXED]: 'Fixed Amount',
};

export const BILLING_PERIODS = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
};

export const BILLING_PERIOD_LABELS = {
  [BILLING_PERIODS.DAILY]: 'Daily',
  [BILLING_PERIODS.WEEKLY]: 'Weekly',
  [BILLING_PERIODS.MONTHLY]: 'Monthly',
  [BILLING_PERIODS.YEARLY]: 'Yearly',
};

export const DISCOUNT_TYPES = {
  FIXED: 'fixed',
  PERCENTAGE: 'percentage',
};

export const DISCOUNT_TYPE_LABELS = {
  [DISCOUNT_TYPES.PERCENTAGE]: 'Percentage (%)',
  [DISCOUNT_TYPES.FIXED]: 'Fixed Amount',
};

export const DISCOUNT_APPLIES_TO = {
  PRODUCTS: 'products',
  SUBSCRIPTION: 'subscription',
};

export const DISCOUNT_APPLIES_TO_LABELS = {
  [DISCOUNT_APPLIES_TO.PRODUCTS]: 'Products',
  [DISCOUNT_APPLIES_TO.SUBSCRIPTION]: 'Subscription',
};

export const DISCOUNT_STATES = {
  ACTIVE: 'active',
  SCHEDULED: 'scheduled',
  EXPIRED: 'expired',
  EXHAUSTED: 'exhausted',
  INACTIVE: 'inactive',
};

export const DISCOUNT_STATE_LABELS = {
  [DISCOUNT_STATES.ACTIVE]: 'Active',
  [DISCOUNT_STATES.SCHEDULED]: 'Scheduled',
  [DISCOUNT_STATES.EXPIRED]: 'Expired',
  [DISCOUNT_STATES.EXHAUSTED]: 'Exhausted',
  [DISCOUNT_STATES.INACTIVE]: 'Inactive',
};

export const SUBSCRIPTION_STATUSES = {
  DRAFT: 'draft',
  QUOTATION: 'quotation',
  CONFIRMED: 'confirmed',
  ACTIVE: 'active',
  CLOSED: 'closed',
};

export const SUBSCRIPTION_STATUS_LABELS = {
  [SUBSCRIPTION_STATUSES.DRAFT]: 'Draft',
  [SUBSCRIPTION_STATUSES.QUOTATION]: 'Quotation Sent',
  [SUBSCRIPTION_STATUSES.CONFIRMED]: 'Confirmed',
  [SUBSCRIPTION_STATUSES.ACTIVE]: 'Active',
  [SUBSCRIPTION_STATUSES.CLOSED]: 'Closed',
};

export const SUBSCRIPTION_LINE_TYPES = {
  PLAN: 'plan',
  PRODUCT: 'product',
};

export const SUBSCRIPTION_LINE_TYPE_LABELS = {
  [SUBSCRIPTION_LINE_TYPES.PLAN]: 'Plan Fee',
  [SUBSCRIPTION_LINE_TYPES.PRODUCT]: 'Product',
};

export const INVOICE_STATUSES = {
  DRAFT: 'draft',
  CONFIRMED: 'confirmed',
  PAID: 'paid',
  CANCELLED: 'cancelled',
};

export const INVOICE_STATUS_LABELS = {
  [INVOICE_STATUSES.DRAFT]: 'Draft',
  [INVOICE_STATUSES.CONFIRMED]: 'Confirmed',
  [INVOICE_STATUSES.PAID]: 'Paid',
  [INVOICE_STATUSES.CANCELLED]: 'Cancelled',
};

export const PAYMENT_METHODS = {
  CASH: 'cash',
  BANK_TRANSFER: 'bank_transfer',
  CARD: 'card',
  UPI: 'upi',
  CHEQUE: 'cheque',
  OTHER: 'other',
};

export const PAYMENT_METHOD_LABELS = {
  [PAYMENT_METHODS.CASH]: 'Cash',
  [PAYMENT_METHODS.BANK_TRANSFER]: 'Bank Transfer',
  [PAYMENT_METHODS.CARD]: 'Credit / Debit Card',
  [PAYMENT_METHODS.UPI]: 'UPI',
  [PAYMENT_METHODS.CHEQUE]: 'Cheque',
  [PAYMENT_METHODS.OTHER]: 'Other',
};

// -------------------------------------------------------------
// Status Color Mappings (Industrial & High Contrast)
// -------------------------------------------------------------

export const STATUS_COLORS = {
  // Subscription statuses
  [SUBSCRIPTION_STATUSES.DRAFT]: {
    bg: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700',
    dot: 'bg-zinc-500',
  },
  [SUBSCRIPTION_STATUSES.QUOTATION]: {
    bg: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-900',
    dot: 'bg-blue-500',
  },
  [SUBSCRIPTION_STATUSES.CONFIRMED]: {
    bg: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-900',
    dot: 'bg-purple-500',
  },
  [SUBSCRIPTION_STATUSES.ACTIVE]: {
    bg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
    dot: 'bg-emerald-500',
  },
  [SUBSCRIPTION_STATUSES.CLOSED]: {
    bg: 'bg-stone-100 text-stone-600 dark:bg-stone-900 dark:text-stone-400 border-stone-200 dark:border-stone-800',
    dot: 'bg-stone-500',
  },

  // Invoice statuses
  [INVOICE_STATUSES.DRAFT]: {
    bg: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700',
    dot: 'bg-zinc-500',
  },
  [INVOICE_STATUSES.CONFIRMED]: {
    bg: 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-900',
    dot: 'bg-amber-500',
  },
  [INVOICE_STATUSES.PAID]: {
    bg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
    dot: 'bg-emerald-500',
  },
  [INVOICE_STATUSES.CANCELLED]: {
    bg: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-900',
    dot: 'bg-rose-500',
  },

  // Discount states
  [DISCOUNT_STATES.ACTIVE]: {
    bg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
    dot: 'bg-emerald-500',
  },
  [DISCOUNT_STATES.SCHEDULED]: {
    bg: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-900',
    dot: 'bg-sky-500',
  },
  [DISCOUNT_STATES.EXPIRED]: {
    bg: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700',
    dot: 'bg-zinc-400',
  },
  [DISCOUNT_STATES.EXHAUSTED]: {
    bg: 'bg-orange-50 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300 border-orange-200 dark:border-orange-900',
    dot: 'bg-orange-500',
  },
  [DISCOUNT_STATES.INACTIVE]: {
    bg: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-900',
    dot: 'bg-rose-500',
  },

  // User roles
  [ROLES.ADMIN]: {
    bg: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-900',
    dot: 'bg-purple-500',
  },
  [ROLES.STAFF]: {
    bg: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-900',
    dot: 'bg-blue-500',
  },
  [ROLES.CUSTOMER]: {
    bg: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200 dark:border-teal-900',
    dot: 'bg-teal-500',
  },

  // Boolean active states
  active: {
    bg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
    dot: 'bg-emerald-500',
  },
  inactive: {
    bg: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700',
    dot: 'bg-zinc-400',
  },
  overdue: {
    bg: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border-red-200 dark:border-red-900 animate-pulse',
    dot: 'bg-red-500',
  },
  paused: {
    bg: 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-900',
    dot: 'bg-amber-500',
  },
};

