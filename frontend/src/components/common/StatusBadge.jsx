import React from 'react';
import {
  STATUS_COLORS,
  SUBSCRIPTION_STATUS_LABELS,
  INVOICE_STATUS_LABELS,
  DISCOUNT_STATE_LABELS,
  ROLE_LABELS,
} from '@/lib/constants';
import { snakeToTitle } from '@/lib/format';
import { cn } from '@/lib/utils';

/**
 * StatusBadge renders status chips for Subscriptions, Invoices, Discounts, Roles, and active flags.
 *
 * @param {object} props
 * @param {string|boolean} props.status - Status code or boolean
 * @param {'subscription'|'invoice'|'discount'|'role'|'auto'} [props.type='auto'] - Specific entity context
 * @param {string} [props.label] - Custom label override
 * @param {boolean} [props.showDot=true] - Display status dot
 * @param {'sm'|'md'} [props.size='sm'] - Badge size
 * @param {string} [props.className] - Additional classes
 */
export function StatusBadge({
  status,
  type = 'auto',
  label: customLabel,
  showDot = true,
  size = 'sm',
  className,
  ...props
}) {
  if (status === null || status === undefined) {
    return null;
  }

  // Handle boolean active/inactive
  const rawStatus = typeof status === 'boolean' ? (status ? 'active' : 'inactive') : String(status).toLowerCase();

  // Determine appropriate label
  let displayLabel = customLabel;
  if (!displayLabel) {
    if (typeof status === 'boolean') {
      displayLabel = status ? 'Active' : 'Inactive';
    } else if (type === 'subscription' && SUBSCRIPTION_STATUS_LABELS[rawStatus]) {
      displayLabel = SUBSCRIPTION_STATUS_LABELS[rawStatus];
    } else if (type === 'invoice' && INVOICE_STATUS_LABELS[rawStatus]) {
      displayLabel = INVOICE_STATUS_LABELS[rawStatus];
    } else if (type === 'discount' && DISCOUNT_STATE_LABELS[rawStatus]) {
      displayLabel = DISCOUNT_STATE_LABELS[rawStatus];
    } else if (type === 'role' && ROLE_LABELS[rawStatus]) {
      displayLabel = ROLE_LABELS[rawStatus];
    } else {
      displayLabel =
        SUBSCRIPTION_STATUS_LABELS[rawStatus] ||
        INVOICE_STATUS_LABELS[rawStatus] ||
        DISCOUNT_STATE_LABELS[rawStatus] ||
        ROLE_LABELS[rawStatus] ||
        snakeToTitle(rawStatus);
    }
  }

  // Look up styling
  const styleConfig = STATUS_COLORS[rawStatus] || {
    bg: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700',
    dot: 'bg-zinc-400',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs font-mono font-medium',
    md: 'px-2.5 py-1 text-xs sm:text-sm font-mono font-medium',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-sm border transition-colors select-none',
        sizeClasses[size] || sizeClasses.sm,
        styleConfig.bg,
        className
      )}
      {...props}
    >
      {showDot && (
        <span
          className={cn('h-1.5 w-1.5 rounded-full flex-shrink-0', styleConfig.dot)}
          aria-hidden="true"
        />
      )}
      <span>{displayLabel}</span>
    </span>
  );
}

export default StatusBadge;

