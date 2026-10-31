import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-none border px-2 py-0.5 font-mono text-xs font-semibold uppercase tracking-wider transition-colors focus:outline-none focus:ring-1 focus:ring-primary",
  {
    variants: {
      variant: {
        default:
          "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black",
        secondary:
          "border-border bg-muted text-foreground",
        destructive:
          "border-primary bg-primary text-primary-foreground",
        outline:
          "border-black bg-transparent text-foreground dark:border-white",
        signal:
          "border-primary bg-primary/10 text-primary border",
        subtle:
          "border-transparent bg-muted text-muted-foreground font-normal lowercase",
      },
    },
    defaultVariants: {
      variant: "secondary",
    },
  }
)

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
