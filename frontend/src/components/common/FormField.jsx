import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

/**
 * FormField wraps input controls with label, required asterisk, description, and react-hook-form error display.
 *
 * @param {object} props
 * @param {string|React.ReactNode} [props.label]
 * @param {string|{ message?: string }} [props.error] - Error message or react-hook-form FieldError
 * @param {boolean} [props.required=false]
 * @param {string|React.ReactNode} [props.hint]
 * @param {string} [props.id]
 * @param {React.ReactNode} props.children
 * @param {string} [props.className]
 */
export function FormField({
  label,
  error,
  required = false,
  hint,
  id,
  children,
  className,
}) {
  const errorMessage = typeof error === 'string' ? error : error?.message;

  return (
    <div className={cn('space-y-1.5 w-full text-left', className)}>
      {label && (
        <div className="flex items-center justify-between">
          <Label
            htmlFor={id}
            className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground"
          >
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
        </div>
      )}

      {children}

      {hint && !errorMessage && (
        <p className="font-sans text-xs text-muted-foreground">{hint}</p>
      )}

      {errorMessage && (
        <div className="flex items-center gap-1.5 font-mono text-xs text-destructive mt-1 animate-in fade-in">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}

export default FormField;

