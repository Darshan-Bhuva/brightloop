import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Server-side pagination controls matching Brightloop conventions.
 *
 * @param {object} props
 * @param {number} [props.currentPage=1]
 * @param {number} [props.lastPage=1]
 * @param {number} [props.total=0]
 * @param {number} [props.perPage=15]
 * @param {(page: number) => void} props.onPageChange
 * @param {(perPage: number) => void} [props.onPerPageChange]
 * @param {number[]} [props.perPageOptions=[10, 15, 25, 50, 100]]
 * @param {string} [props.className]
 */
export function Pagination({
  currentPage = 1,
  lastPage = 1,
  total = 0,
  perPage = 15,
  onPageChange,
  onPerPageChange,
  perPageOptions = [10, 15, 25, 50, 100],
  className,
}) {
  const from = total === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const to = Math.min(currentPage * perPage, total);

  // Generate pagination window with ellipses
  const getPageNumbers = () => {
    const pages = [];
    const delta = 1;

    const left = Math.max(2, currentPage - delta);
    const right = Math.min(lastPage - 1, currentPage + delta);

    pages.push(1);

    if (left > 2) {
      pages.push('...');
    }

    for (let i = left; i <= right; i++) {
      pages.push(i);
    }

    if (right < lastPage - 1) {
      pages.push('...');
    }

    if (lastPage > 1) {
      pages.push(lastPage);
    }

    return pages;
  };

  const handlePrev = () => {
    if (currentPage > 1 && onPageChange) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < lastPage && onPageChange) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-2 text-xs font-mono text-muted-foreground',
        className
      )}
    >
      {/* Range summary and optional Per-Page selector */}
      <div className="flex items-center gap-3">
        <span>
          SHOWING <span className="font-semibold text-foreground">{from}</span> TO{' '}
          <span className="font-semibold text-foreground">{to}</span> OF{' '}
          <span className="font-semibold text-foreground">{total}</span>
        </span>

        {onPerPageChange && (
          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">ROWS:</span>
            <select
              value={perPage}
              onChange={(e) => onPerPageChange(Number(e.target.value))}
              aria-label="Rows per page"
              className="h-8 rounded-sm border border-border bg-background px-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              {perPageOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Page navigation buttons */}
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handlePrev}
          disabled={currentPage <= 1}
          aria-label="Previous page"
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {getPageNumbers().map((pageItem, index) => {
          if (pageItem === '...') {
            return (
              <span
                key={`ellipsis-${index}`}
                className="inline-flex h-8 w-8 items-center justify-center text-muted-foreground select-none"
              >
                ...
              </span>
            );
          }

          const pageNum = Number(pageItem);
          const isCurrent = pageNum === currentPage;

          return (
            <Button
              key={pageNum}
              type="button"
              variant={isCurrent ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPageChange && onPageChange(pageNum)}
              aria-current={isCurrent ? 'page' : undefined}
              className="h-8 w-8 p-0 font-mono text-xs"
            >
              {pageNum}
            </Button>
          );
        })}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={currentPage >= lastPage}
          aria-label="Next page"
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default Pagination;

