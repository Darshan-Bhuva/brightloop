import React from 'react'
import { cn } from '@/lib/utils'

export default function Logo({
  className,
  iconClassName,
  showWordmark = true,
  subtitle = 'Subscription Suite',
  size = 'md',
}) {
  const iconSizes = {
    sm: 'h-7 w-7',
    default: 'h-8 w-8',
    md: 'h-9 w-9',
    lg: 'h-12 w-12',
  }

  const svgSizes = {
    sm: 'h-4 w-4',
    default: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  }

  const textSizes = {
    sm: 'text-sm',
    default: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* Brightloop Geometric Infinity Mark */}
      <div
        className={cn(
          'flex items-center justify-center rounded-sm bg-primary text-primary-foreground shrink-0 shadow-none',
          iconSizes[size] || iconSizes.default,
          iconClassName
        )}
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={svgSizes[size] || svgSizes.default}
        >
          <path
            d="M9.5 11C6.46 11 4 13.46 4 16.5C4 19.54 6.46 22 9.5 22C13.2 22 15.5 18 16 16.5C16.5 15 18.8 11 22.5 11C25.54 11 28 13.46 28 16.5C28 19.54 25.54 22 22.5 22C18.8 22 16.5 18 16 16.5"
            stroke="currentColor"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {showWordmark && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                'font-sans font-bold tracking-tight text-foreground uppercase',
                textSizes[size] || textSizes.default
              )}
            >
              BRIGHTLOOP
            </span>
            <span className="h-1.5 w-1.5 rounded-sm bg-primary" />
          </div>
          {subtitle && (
            <span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase mt-1">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

