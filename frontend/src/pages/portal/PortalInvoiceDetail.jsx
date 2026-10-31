import React from 'react'
import { useParams, Link } from 'react-router-dom'
import PlaceholderPage from '@/components/common/PlaceholderPage'
import { Button } from '@/components/ui/button'
import { Printer } from 'lucide-react'

export default function PortalInvoiceDetail() {
  const { id } = useParams()
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button asChild size="sm" variant="outline">
          <Link to={`/invoices/${id}/print`}>
            <Printer className="mr-2 h-4 w-4" />
            Print View
          </Link>
        </Button>
      </div>
      <PlaceholderPage
        title={`My Invoice #${id}`}
        module="M7"
        description="Inspect invoice lines, tax breakdown, and payments made."
      />
    </div>
  )
}

