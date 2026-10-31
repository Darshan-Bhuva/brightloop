import React from 'react'
import { useParams } from 'react-router-dom'
import PlaceholderPage from '@/components/common/PlaceholderPage'

export default function ProductForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)

  return (
    <PlaceholderPage
      title={isEdit ? `Edit Product #${id}` : 'Create New Product'}
      module="M2"
      description="Product details, tax assignment, and variants repeater (PRD-02, PRD-04)."
    />
  )
}

