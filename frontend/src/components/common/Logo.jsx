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
    sm: 'h-6 w-6',
    default: 'h-8 w-8',
    md: 'h-9 w-9',
    lg: 'h-11 w-11',
  }

  const textSizes = {
    sm: 'text-sm',
    default: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* BrightLoop Dynamic Turbine Symbol */}
      <div
        className={cn(
          'flex items-center justify-center shrink-0',
          iconSizes[size] || iconSizes.default,
          iconClassName
        )}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 256 256"
          className="h-full w-full"
          role="img"
          aria-labelledby="title-v1"
        >
          <title id="title-v1">BrightLoop Dynamic Turbine Symbol</title>
          <path
            fill="#F81927"
            d="M 46 128 C 46 78 86 38 136 38 C 172 38 204 56 226 84 L 198 112 C 182 92 160 78 136 78 C 108 78 86 100 86 128 C 86 148 98 164 116 172 L 102 208 C 68 194 46 164 46 128 Z"
          />
          <path
            className="fill-black dark:fill-white"
            fill="#000000"
            d="M 210 128 C 210 178 170 218 120 218 C 84 218 52 200 30 172 L 58 144 C 74 164 96 178 120 178 C 148 178 170 156 170 128 C 170 108 158 92 140 84 L 154 48 C 188 62 210 92 210 128 Z"
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
