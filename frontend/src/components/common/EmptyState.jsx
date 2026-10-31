import React from 'react';
import { Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * EmptyState renders when a table, list, or section contains no items.
 *
 * @param {object} props
 * @param {React.ComponentType<{ className?: string }> | React.ReactNode} [props.icon]
 * @param {string} [props.title='No records found']
 * @param {string} [props.description]
 * @param {string} [props.actionLabel]
 * @param {() => void} [props.onAction]
 * @param {React.ReactNode} [props.action]
 * @param {string} [props.className]
 */
export function EmptyState({
  icon: Icon = Inbox,
  title = 'No records found',
  description,
  actionLabel,
  onAction,
  action,
  className,
}) {
  const isComponent = typeof Icon === 'function' || (typeof Icon === 'object' && Icon !== null && !React.isValidElement(Icon));

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center rounded-sm border border-dashed border-border bg-muted/20',
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-muted text-muted-foreground mb-3">
        {React.isValidElement(Icon) ? (
          Icon
        ) : isComponent ? (
          <Icon className="h-6 w-6" />
        ) : (
          <Inbox className="h-6 w-6" />
        )}
      </div>

      <h3 className="font-sans text-sm font-semibold uppercase tracking-wider text-foreground mb-1">
        {title}
      </h3>

      {description && (
        <p className="font-sans text-xs sm:text-sm text-muted-foreground max-w-sm mb-4">
          {description}
        </p>
      )}

      {action ? (
        action
      ) : actionLabel && onAction ? (
        <Button
          type="button"
          onClick={onAction}
          size="sm"
          className="font-mono text-xs uppercase tracking-wider"
        >
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

export default EmptyState;

