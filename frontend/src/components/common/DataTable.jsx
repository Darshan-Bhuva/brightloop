import React from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { Pagination } from './Pagination';
import { EmptyState } from './EmptyState';
import { cn } from '@/lib/utils';

/**
 * DataTable with server-side sorting headers and integrated pagination.
 * Matches docs/PLAN.md Section 3 query params (page, per_page, sort, direction).
 *
 * @param {object} props
 * @param {Array<{ key: string, label: string, sortable?: boolean, render?: (val: any, row: any, index: number) => React.ReactNode, align?: 'left'|'center'|'right', className?: string, headerClassName?: string }>} props.columns
 * @param {Array<any>} [props.data=[]]
 * @param {boolean} [props.loading=false]
 * @param {string} [props.sort] - Currently sorted column key
 * @param {'asc'|'desc'} [props.direction='asc'] - Current sort direction
 * @param {(field: string) => void} [props.onSort] - Sort toggle callback
 * @param {{ current_page?: number, last_page?: number, per_page?: number, total?: number } | null} [props.meta]
 * @param {number} [props.page]
 * @param {number} [props.perPage]
 * @param {(page: number) => void} [props.onPageChange]
 * @param {(perPage: number) => void} [props.onPerPageChange]
 * @param {string|React.ReactNode} [props.emptyTitle='No data available']
 * @param {string} [props.emptyDescription]
 * @param {(row: any) => void} [props.onRowClick]
 * @param {string} [props.keyField='id']
 * @param {string} [props.className]
 */
export function DataTable({
  columns = [],
  data = [],
  loading = false,
  sort,
  direction = 'asc',
  onSort,
  meta,
  page,
  perPage,
  onPageChange,
  onPerPageChange,
  emptyTitle = 'No data available',
  emptyDescription = 'There are no records matching your request.',
  onRowClick,
  keyField = 'id',
  className,
}) {
  const currentPage = meta?.current_page ?? page ?? 1;
  const lastPage = meta?.last_page ?? 1;
  const total = meta?.total ?? data.length;
  const activePerPage = meta?.per_page ?? perPage ?? 15;

  const handleHeaderClick = (col) => {
    if (!col.sortable || !onSort) return;
    onSort(col.key);
  };

  const getSortIcon = (colKey) => {
    if (sort !== colKey) {
      return <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground opacity-60" />;
    }
    return direction === 'desc' ? (
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
              {columns.map((col) => {
                const alignClass =
                  col.align === 'right'
                    ? 'text-right justify-end'
                    : col.align === 'center'
                    ? 'text-center justify-center'
                    : 'text-left justify-start';

                return (
                  <th
                    key={col.key}
                    scope="col"
                    className={cn(
                      'px-4 py-3 font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground select-none',
                      col.sortable && 'cursor-pointer hover:text-foreground',
                      col.headerClassName
                    )}
                    onClick={() => handleHeaderClick(col)}
                  >
                    <div className={cn('inline-flex items-center gap-1.5', alignClass)}>
                      <span>{col.label}</span>
                      {col.sortable && getSortIcon(col.key)}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-border/60">
            {loading ? (
              // Loading skeleton rows
              Array.from({ length: 5 }).map((_, rIdx) => (
                <tr key={`skeleton-${rIdx}`} className="animate-pulse">
                  {columns.map((col, cIdx) => (
                    <td key={`skeleton-${rIdx}-${cIdx}`} className="px-4 py-3.5">
                      <div className="h-4 bg-muted rounded-sm w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              // Empty state inside table
              <tr>
                <td colSpan={columns.length} className="p-0">
                  <EmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                    className="border-0 rounded-none bg-transparent py-14"
                  />
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
                    {columns.map((col) => {
                      const value = row[col.key];
                      const alignClass =
                        col.align === 'right'
                          ? 'text-right'
                          : col.align === 'center'
                          ? 'text-center'
                          : 'text-left';

                      return (
                        <td
                          key={`${rowKey}-${col.key}`}
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
      {onPageChange && (meta || data.length > 0) && (
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

