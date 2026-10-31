import React from 'react';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';

/**
 * MoneyText renders formatted currency amounts using VITE_CURRENCY and en-IN locale.
 *
 * @param {object} props
 * @param {string|number|null} props.amount - Amount as decimal string or number
 * @param {string} [props.currency] - Override default currency
 * @param {string} [props.className] - Additional classes
 * @param {React.ReactNode} [props.prefix] - Optional prefix element
 * @param {React.ReactNode} [props.suffix] - Optional suffix element
 */
export function MoneyText({
  amount,
  currency,
  className,
  prefix,
  suffix,
  ...props
}) {
  const formatted = formatMoney(amount, currency);

  return (
    <span
      className={cn('font-mono font-medium tracking-tight text-foreground', className)}
      {...props}
    >
      {prefix && <span className="mr-1">{prefix}</span>}
      {formatted}
      {suffix && <span className="ml-1 text-xs text-muted-foreground font-normal">{suffix}</span>}
    </span>
  );
}

export default MoneyText;

