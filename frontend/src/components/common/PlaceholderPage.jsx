import React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function PlaceholderPage({ title, module, description, children }) {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Module Placeholder
            </span>
          </div>
          <h1 className="font-sans text-2xl sm:text-3xl font-bold tracking-tight text-foreground uppercase">
            {title}
          </h1>
          {description && (
            <p className="font-sans text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        {module && (
          <Badge variant="default" className="font-mono text-xs">
            MODULE {module}
          </Badge>
        )}
      </div>

      <Card className="border-border">
        <CardHeader className="p-6 pb-4">
          <CardTitle className="font-sans text-base font-semibold">{title}</CardTitle>
          <CardDescription className="font-sans text-xs text-muted-foreground">
            Configured in the application route skeleton. Functional view lands in Module {module}.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-2">
          {children || (
            <div className="flex h-36 items-center justify-center rounded-sm border border-dashed border-border bg-muted/30 font-mono text-xs uppercase tracking-wider text-muted-foreground">
              [ {title} : Contract Wireframe Ready ]
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
