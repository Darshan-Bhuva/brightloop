import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * PageHeader provides title, subtitle, breadcrumbs, and action button slot for views.
 *
 * @param {object} props
 * @param {string|React.ReactNode} props.title
 * @param {string|React.ReactNode} [props.description]
 * @param {Array<{ label: string, href?: string }>} [props.breadcrumbs]
 * @param {React.ReactNode} [props.actions]
 * @param {React.ReactNode} [props.badge]
 * @param {string} [props.backHref]
 * @param {() => void} [props.onBack]
 * @param {string} [props.className]
 */
export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  badge,
  backHref,
  onBack,
  className,
}) {
  return (
    <header className={cn('mb-6 space-y-2', className)}>
      {/* Optional Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-1">
          <ol className="flex items-center space-x-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <li key={idx} className="flex items-center">
                  {idx > 0 && <span className="mx-1.5 text-muted-foreground/60">/</span>}
                  {crumb.href && !isLast ? (
                    <a
                      href={crumb.href}
                      className="hover:text-foreground transition-colors"
                    >
                      {crumb.label}
                    </a>
                  ) : (
                    <span className={cn(isLast && 'font-semibold text-foreground')}>
                      {crumb.label}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      )}

      {/* Main Title + Actions Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-start sm:items-center gap-3">
          {(backHref || onBack) && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onBack ? onBack : () => backHref && (window.location.href = backHref)}
              aria-label="Back"
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="font-sans text-2xl sm:text-3xl font-bold tracking-tight text-foreground uppercase">
                {title}
              </h1>
              {badge && <div>{badge}</div>}
            </div>

            {description && (
              <p className="font-sans text-xs sm:text-sm text-muted-foreground mt-1">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons Slot */}
        {actions && (
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}

export default PageHeader;

