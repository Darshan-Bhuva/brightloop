import React from 'react';
import { AlertTriangle, AlertCircle, Info, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

/**
 * ConfirmDialog prompts the user to confirm destructive or critical actions.
 * Built on Radix Dialog with 7Span industrial design tokens and loading state.
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {(open: boolean) => void} props.onOpenChange
 * @param {string} [props.title='Are you sure?']
 * @param {string|React.ReactNode} [props.description='This action cannot be undone.']
 * @param {string} [props.confirmText='Confirm']
 * @param {string} [props.cancelText='Cancel']
 * @param {'danger'|'primary'|'warning'|'info'} [props.variant='danger']
 * @param {() => void | Promise<void>} props.onConfirm
 * @param {() => void} [props.onCancel]
 * @param {boolean} [props.loading=false]
 * @param {React.ReactNode} [props.children]
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title = 'Are you sure?',
  description = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
  loading = false,
  children,
}) {
  const handleClose = () => {
    if (loading) return;
    if (onCancel) onCancel();
    if (onOpenChange) onOpenChange(false);
  };

  const handleConfirm = async () => {
    if (loading || !onConfirm) return;
    await onConfirm();
  };

  const variantIcons = {
    danger: <AlertTriangle className="h-5 w-5 text-destructive" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-500" />,
    primary: <AlertCircle className="h-5 w-5 text-primary" />,
    info: <Info className="h-5 w-5 text-blue-500" />,
  };

  const buttonVariants = {
    danger: 'destructive',
    warning: 'default',
    primary: 'default',
    info: 'default',
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] border-border bg-card">
        <DialogHeader className="gap-2 sm:text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-sm bg-muted">
              {variantIcons[variant] || variantIcons.danger}
            </div>
            <DialogTitle className="font-sans text-base font-bold uppercase tracking-tight text-foreground">
              {title}
            </DialogTitle>
          </div>
          {description && (
            <DialogDescription className="font-sans text-xs sm:text-sm text-muted-foreground pt-1">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        {children && <div className="py-2">{children}</div>}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClose}
            disabled={loading}
            className="font-mono text-xs uppercase"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={buttonVariants[variant] || 'destructive'}
            size="sm"
            onClick={handleConfirm}
            disabled={loading}
            className="font-mono text-xs uppercase"
          >
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
            <span>{confirmText}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ConfirmDialog;
