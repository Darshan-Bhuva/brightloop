import React from 'react'
import PlaceholderPage from '@/components/common/PlaceholderPage'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Repeat, Receipt, CreditCard } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function PortalHome() {
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="border-b border-border pb-6">
        <div className="flex items-center gap-2 mb-1.5">
          <Badge variant="default" className="text-[10px]">
            PORTAL-01
          </Badge>
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Customer Self-Service
          </span>
        </div>
        <h1 className="font-sans text-3xl font-bold tracking-tight text-foreground uppercase">
          Subscription Center
        </h1>
        <p className="font-sans text-sm text-muted-foreground mt-1">
          Review active service tiers, billing statements, and payment receipts.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-5">
            <span className="font-mono text-xs font-semibold uppercase text-muted-foreground">
              Active Subscriptions
            </span>
            <Repeat className="h-4 w-4 text-foreground" />
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="font-sans text-3xl font-bold">1</div>
            <p className="font-mono text-xs text-muted-foreground mt-1">Next Cycle: 2026-11-01</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-5">
            <span className="font-mono text-xs font-semibold uppercase text-muted-foreground">
              Outstanding Amount
            </span>
            <Receipt className="h-4 w-4 text-foreground" />
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="font-sans text-3xl font-bold">₹0.00</div>
            <p className="font-mono text-xs text-muted-foreground mt-1">All invoices cleared</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-5">
            <span className="font-mono text-xs font-semibold uppercase text-muted-foreground">
              Recent Payment
            </span>
            <CreditCard className="h-4 w-4 text-foreground" />
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="font-sans text-3xl font-bold">₹1,178.82</div>
            <p className="font-mono text-xs text-muted-foreground mt-1">Settled on 2026-10-15</p>
          </CardContent>
        </Card>
      </div>

      <PlaceholderPage
        title="Recent Billing History"
        module="M7"
        description="Portal summary endpoint (PORTAL-01) with live customer metrics and non-draft invoices."
      />
    </div>
  )
}
