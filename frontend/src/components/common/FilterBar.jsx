import React, { useState, useEffect } from 'react';
import { Search, X, RotateCcw, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/**
 * FilterBar provides debounced text search, select dropdowns, date range filters, and reset actions.
 *
 * @param {object} props
 * @param {string} [props.search='']
 * @param {(value: string) => void} [props.onSearchChange]
 * @param {string} [props.searchPlaceholder='Search...']
 * @param {number} [props.debounceMs=300]
 * @param {Array<{ key: string, label?: string, value: any, options: Array<{ label: string, value: any }>, onChange: (val: any) => void, placeholder?: string }>} [props.filters=[]]
 * @param {{ start?: string, end?: string }} [props.dateRange]
 * @param {(range: { start?: string, end?: string }) => void} [props.onDateRangeChange]
 * @param {() => void} [props.onReset]
 * @param {React.ReactNode} [props.children] - Additional buttons or elements
 * @param {string} [props.className]
 */
export function FilterBar({
  search = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  debounceMs = 300,
  filters = [],
  dateRange,
  onDateRangeChange,
  onReset,
  children,
  className,
}) {
  const [prevSearch, setPrevSearch] = useState(search);
  const [internalSearch, setInternalSearch] = useState(search);

  // Synchronize internal state when outer search prop changes
  if (prevSearch !== search) {
    setPrevSearch(search);
    setInternalSearch(search);
  }

  // Debounce search input dispatch
  useEffect(() => {
    if (!onSearchChange) return;
    const timer = setTimeout(() => {
      if (internalSearch !== search) {
        onSearchChange(internalSearch);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [internalSearch, onSearchChange, debounceMs, search]);

  const handleClearSearch = () => {
    setInternalSearch('');
    if (onSearchChange) {
      onSearchChange('');
    }
  };

  const hasActiveFilters = Boolean(
    internalSearch ||
    filters.some((f) => f.value !== '' && f.value !== undefined && f.value !== null) ||
    (dateRange && (dateRange.start || dateRange.end))
  );

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 p-3 bg-card border border-border rounded-sm shadow-sm',
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[260px]">
        {/* Search Input with Debounce */}
        {onSearchChange && (
          <div className="relative min-w-[200px] max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              value={internalSearch}
              onChange={(e) => setInternalSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="pl-9 pr-8 h-9 text-xs font-mono rounded-sm border-border bg-background placeholder:text-muted-foreground focus-visible:ring-primary"
            />
            {internalSearch && (
              <button
                type="button"
                onClick={handleClearSearch}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {/* Dropdown Filters */}
        {filters.map((filter) => (
          <div key={filter.key} className="min-w-[130px]">
            <select
              value={filter.value ?? ''}
              onChange={(e) => filter.onChange(e.target.value)}
              aria-label={filter.label || filter.placeholder || filter.key}
              className="w-full h-9 px-3 text-xs font-mono rounded-sm border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="">{filter.placeholder || filter.label || `All ${filter.key}`}</option>
              {filter.options.map((opt) => (
                <option key={String(opt.value)} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ))}

        {/* Optional Date Range Filter */}
        {onDateRangeChange && (
          <div className="flex items-center gap-1.5 bg-muted/40 border border-border rounded-sm px-2.5 h-9 font-mono">
            <Calendar className="h-4 w-4 text-muted-foreground mr-1" />
            <input
              type="date"
              value={dateRange?.start || ''}
              onChange={(e) =>
                onDateRangeChange({
                  ...dateRange,
                  start: e.target.value || undefined,
                })
              }
              aria-label="Filter start date"
              className="text-xs bg-transparent text-foreground focus:outline-none"
            />
            <span className="text-muted-foreground text-xs">TO</span>
            <input
              type="date"
              value={dateRange?.end || ''}
              onChange={(e) =>
                onDateRangeChange({
                  ...dateRange,
                  end: e.target.value || undefined,
                })
              }
              aria-label="Filter end date"
              className="text-xs bg-transparent text-foreground focus:outline-none"
            />
          </div>
        )}

        {/* Reset button */}
        {hasActiveFilters && onReset && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-9 px-2.5 text-xs font-mono uppercase text-muted-foreground hover:text-foreground"
            title="Reset filters"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            <span>RESET</span>
          </Button>
        )}
      </div>

      {/* Trailing slot for export or custom actions */}
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

export default FilterBar;

