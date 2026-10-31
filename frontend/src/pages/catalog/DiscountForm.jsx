import React from 'react'
import { useParams } from 'react-router-dom'
import PlaceholderPage from '@/components/common/PlaceholderPage'

export default function DiscountForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)

  return (
    <PlaceholderPage
      title={isEdit ? `Edit Discount #${id}` : 'Create New Discount'}
      module="M3"
      description="Define percentage or fixed discounts, scopes, usage limits, and eligibility windows (DSC-02, DSC-04)."
    />
  )
}

