import React from 'react'
import { useParams } from 'react-router-dom'
import PlaceholderPage from '@/components/common/PlaceholderPage'

export default function InvoiceDetail() {
  const { id } = useParams()
  return (
    <PlaceholderPage
      title={`Invoice #${id}`}
      module="M5"
      description="Invoice breakdown, line discounts, taxes, payments history, confirm/cancel/send actions (INV-02)."
    />
  )
}

