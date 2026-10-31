import React from 'react'
import { Check, X } from 'lucide-react'
import { checkPasswordCriteria } from '@/lib/validation'
import { cn } from '@/lib/utils'

export default function PasswordChecklist({ password = '' }) {
  const criteria = checkPasswordCriteria(password)

  const items = [
    { label: 'At least 9 characters', met: criteria.minLength },
    { label: 'At least 1 uppercase letter (A-Z)', met: criteria.hasUpper },
    { label: 'At least 1 lowercase letter (a-z)', met: criteria.hasLower },
    { label: 'At least 1 special character (!@#$%^&*)', met: criteria.hasSpecial },
  ]

  return (
    <div className="space-y-1.5 rounded-sm border border-border bg-muted/30 p-3 font-mono text-xs">
      <div className="font-semibold uppercase tracking-wider text-muted-foreground text-[10px]">
        Password Requirements:
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
        {items.map((item, index) => (
          <div
            key={index}
            className={cn(
              'flex items-center gap-1.5 transition-colors',
              item.met
                ? 'text-foreground font-medium'
                : 'text-muted-foreground'
            )}
          >
            {item.met ? (
              <Check className="h-3.5 w-3.5 text-primary stroke-[3]" />
            ) : (
              <X className="h-3.5 w-3.5 text-muted-foreground/60" />
            )}
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

