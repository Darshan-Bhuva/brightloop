import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { Printer, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function InvoicePrint() {
  const { id } = useParams()

  return (
    <div className="min-h-screen bg-background p-8 print:p-0">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between print:hidden">
          <Button asChild variant="outline" size="sm">
            <Link to={`/invoices/${id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Invoice
            </Link>
          </Button>
          <Button onClick={() => window.print()} size="sm">
            <Printer className="mr-2 h-4 w-4" />
            Print Invoice
          </Button>
        </div>

        <div className="rounded-lg border p-8 shadow-sm print:border-none print:shadow-none">
          <div className="flex justify-between items-start border-b pb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">INVOICE</h1>
              <p className="text-sm font-mono text-muted-foreground mt-1">INV-{id ? String(id).padStart(6, '0') : '000000'}</p>
            </div>
            <div className="text-right">
              <h2 className="font-bold text-lg">Brightloop Inc.</h2>
              <p className="text-xs text-muted-foreground">Subscription Management System</p>
            </div>
          </div>
          <div className="py-12 text-center text-sm text-muted-foreground">
            Clean printable invoice layout ready for invoice data in Module M5.
          </div>
        </div>
      </div>
    </div>
  )
}

