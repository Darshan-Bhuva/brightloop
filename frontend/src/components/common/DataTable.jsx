import React from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, AlertTriangle } from 'lucide-react';
import { Pagination } from './Pagination';
import { EmptyState } from './EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Hardened DataTable with loading skeletons, server-side sorting headers,
 * empty/error states, and integrated pagination.
 * Matches docs/PLAN.md Section 3 query params (page, per_page, sort, direction) and Module M8 specifications.
 */
export function DataTable({
  columns = [],
  data = [],
  loading = false,
  error = null,
  onRetry,
  sort,
  sortField,
  direction = 'asc',
  sortDirection,
  onSort,
  onSortChange,
  meta,
  pagination,
  page,
  perPage,
  onPageChange,
  onPerPageChange,
  emptyTitle = 'No data available',
  emptyDescription = 'There are no records matching your request.',
  emptyState = null,
  onRowClick,
  keyField = 'id',
  className,
}) {
  const activeSort = sortField ?? sort;
  const activeDirection = sortDirection ?? direction ?? 'asc';
  const activeMeta = meta ?? pagination;

  const currentPage = activeMeta?.current_page ?? page ?? 1;
  const lastPage = activeMeta?.last_page ?? 1;
  const total = activeMeta?.total ?? data.length;
  const activePerPage = activeMeta?.per_page ?? perPage ?? 15;

  const handleHeaderClick = (col) => {
    if (!col.sortable) return;
    if (onSort) onSort(col.key);
    if (onSortChange) {
      const nextDir = activeSort === col.key && activeDirection === 'asc' ? 'desc' : 'asc';
      onSortChange(col.key, nextDir);
    }
  };

  const getSortIcon = (colKey) => {
    if (activeSort !== colKey) {
      return <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground opacity-60" />;
    }
    return activeDirection === 'desc' ? (
      <ChevronDown className="h-3.5 w-3.5 text-primary" />
    ) : (
      <ChevronUp className="h-3.5 w-3.5 text-primary" />
    );
  };

  return (
    <div className={cn('w-full flex flex-col rounded-sm border border-border bg-card shadow-sm overflow-hidden', className)}>
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {columns.map((col, idx) => {
                const alignClass =
                  col.align === 'right'
                    ? 'text-right justify-end'
                    : col.align === 'center'
                    ? 'text-center justify-center'
                    : 'text-left justify-start';

                return (
                  <th
                    key={col.key || `col-${idx}`}
                    scope="col"
                    className={cn(
                      'px-4 py-3 font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground select-none',
                      col.sortable && 'cursor-pointer hover:text-foreground',
                      col.headerClassName
                    )}
                    onClick={() => handleHeaderClick(col)}
                  >
                    <div className={cn('inline-flex items-center gap-1.5', alignClass)}>
                      <span>{col.label || col.title || ''}</span>
                      {col.sortable && getSortIcon(col.key)}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-border/60">
            {loading ? (
              // Hardened loading skeleton rows with varied widths
              Array.from({ length: 5 }).map((_, rIdx) => (
                <tr key={`skeleton-${rIdx}`}>
                  {columns.map((_, cIdx) => {
                    const widthClasses = ['w-3/4', 'w-1/2', 'w-2/3', 'w-4/5', 'w-1/3'];
                    const wClass = widthClasses[(rIdx + cIdx) % widthClasses.length];
                    return (
                      <td key={`skeleton-${rIdx}-${cIdx}`} className="px-4 py-3.5">
                        <Skeleton className={cn('h-4 rounded-sm', wClass)} />
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : error ? (
              // Error state inside table
              <tr>
                <td colSpan={columns.length} className="p-8">
                  <div className="flex flex-col items-center justify-center text-center space-y-2">
                    <AlertTriangle className="h-8 w-8 text-destructive opacity-80" />
                    <p className="font-semibold text-foreground">
                      {typeof error === 'string' ? error : 'Failed to load records'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      An error occurred while communicating with the API.
                    </p>
                    {onRetry && (
                      <Button variant="outline" size="sm" onClick={onRetry} className="mt-2 text-xs">
                        Retry Request
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              // Empty state inside table
              <tr>
                <td colSpan={columns.length} className="p-0">
                  {emptyState ? (
                    emptyState
                  ) : (
                    <EmptyState
                      title={emptyTitle}
                      description={emptyDescription}
                      className="border-0 rounded-none bg-transparent py-14"
                    />
                  )}
                </td>
              </tr>
            ) : (
              // Data rows
              data.map((row, index) => {
                const rowKey = row[keyField] ?? index;
                const isClickable = Boolean(onRowClick);

                return (
                  <tr
                    key={rowKey}
                    onClick={() => isClickable && onRowClick(row)}
                    className={cn(
                      'transition-colors hover:bg-muted/40',
                      isClickable && 'cursor-pointer'
                    )}
                  >
                    {columns.map((col, cIdx) => {
                      const value = row[col.key];
                      const alignClass =
                        col.align === 'right'
                          ? 'text-right'
                          : col.align === 'center'
                          ? 'text-center'
                          : 'text-left';

                      return (
                        <td
                          key={`${rowKey}-${col.key || cIdx}`}
                          className={cn('px-4 py-3 text-foreground font-sans', alignClass, col.className)}
                        >
                          {col.render ? col.render(value, row, index) : (value ?? '-')}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      {onPageChange && (activeMeta || data.length > 0) && (
        <div className="border-t border-border px-4 bg-card">
          <Pagination
            currentPage={currentPage}
            lastPage={lastPage}
            total={total}
            perPage={activePerPage}
            onPageChange={onPageChange}
            onPerPageChange={onPerPageChange}
          />
        </div>
      )}
    </div>
  );
}

export default DataTable;
