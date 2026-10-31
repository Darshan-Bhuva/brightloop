import React from 'react';
import { formatDate, formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';

/**
 * DateText renders formatted dates and timestamps safely.
 *
 * @param {object} props
 * @param {string|Date|null} props.date - YYYY-MM-DD string or ISO timestamp
 * @param {string} [props.format] - Date-fns format string (default 'dd MMM yyyy')
 * @param {boolean} [props.includeTime=false] - Whether to render date and time
 * @param {string} [props.fallback='-'] - Text displayed if date is missing/invalid
 * @param {string} [props.className] - Additional CSS classes
 */
export function DateText({
  date,
  format: pattern = 'dd MMM yyyy',
  includeTime = false,
  fallback = '-',
  className,
  ...props
}) {
  const formatted = includeTime
    ? formatDateTime(date, undefined, fallback)
    : formatDate(date, pattern, fallback);

  return (
    <time
      dateTime={typeof date === 'string' ? date : undefined}
      className={cn('font-sans text-sm text-foreground', className)}
      {...props}
    >
      {formatted}
    </time>
  );
}

export default DateText;

