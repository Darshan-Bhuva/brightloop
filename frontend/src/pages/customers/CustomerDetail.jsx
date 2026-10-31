import React from 'react'
import { useParams } from 'react-router-dom'
import PlaceholderPage from '@/components/common/PlaceholderPage'

export default function CustomerDetail() {
  const { id } = useParams()
  return (
    <PlaceholderPage
      title={`Customer #${id}`}
      module="M1"
      description="Customer profile card, editing, and linked subscriptions table (CUS-03, CUS-04)."
    />
  )
}

