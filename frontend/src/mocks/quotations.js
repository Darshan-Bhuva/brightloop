/**
 * Mock Quotation Templates Fixtures
 * Source of truth: docs/PLAN.md (Section 5 Seed data & Section 6 Resource shapes)
 */

import { mockSuccessEnvelope } from '@/api/mockable'

export let mockQuotationTemplates = [
  {
    id: 1,
    name: 'Standard SMB Offer',
    validity_days: 14,
    plan_id: 1,
    plan: {
      id: 1,
      name: 'Monthly Starter',
      billing_period: 'monthly',
      price: '999.00',
    },
    notes: 'Standard SMB onboarding offer with CRM seats and block storage',
    lines: [
      {
        id: 1,
        product_id: 2,
        product: { id: 2, name: 'Brightloop CRM Seat' },
        variant_id: null,
        variant: null,
        quantity: 2,
      },
      {
        id: 2,
        product_id: 3,
        product: { id: 3, name: 'Extra Storage 100GB' },
        variant_id: null,
        variant: null,
        quantity: 1,
      },
    ],
  },
  {
    id: 2,
    name: 'Enterprise Growth Package',
    validity_days: 30,
    plan_id: 2,
    plan: {
      id: 2,
      name: 'Yearly Business',
      billing_period: 'yearly',
      price: '9999.00',
    },
    notes: 'Complete annual enterprise setup with priority assistance',
    lines: [
      {
        id: 3,
        product_id: 1,
        product: { id: 1, name: 'Brightloop Business Suite' },
        variant_id: 1,
        variant: { id: 1, attribute: 'Brand', value: 'Odoo', extra_price: '560.00' },
        quantity: 5,
      },
      {
        id: 4,
        product_id: 4,
        product: { id: 4, name: 'Priority Support' },
        variant_id: null,
        variant: null,
        quantity: 1,
      },
    ],
  },
]

export function mockGetQuotationTemplates(params = {}) {
  let list = [...mockQuotationTemplates]
  if (params.search) {
    const q = params.search.toLowerCase()
    list = list.filter((item) => item.name.toLowerCase().includes(q))
  }
  return mockSuccessEnvelope(list, null)
}

export function mockGetQuotationTemplate(id) {
  const item = mockQuotationTemplates.find((t) => t.id === Number(id))
  if (!item) {
    throw { response: { status: 404, data: { success: false, message: 'Quotation template not found' } } }
  }
  return mockSuccessEnvelope(item)
}

export function mockCreateQuotationTemplate(data) {
  const newId = mockQuotationTemplates.length > 0 ? Math.max(...mockQuotationTemplates.map((t) => t.id)) + 1 : 1
  const newTemplate = {
    id: newId,
    name: data.name,
    validity_days: Number(data.validity_days) || 30,
    plan_id: Number(data.plan_id),
    plan: {
      id: Number(data.plan_id),
      name: Number(data.plan_id) === 2 ? 'Yearly Business' : 'Monthly Starter',
      billing_period: Number(data.plan_id) === 2 ? 'yearly' : 'monthly',
      price: Number(data.plan_id) === 2 ? '9999.00' : '999.00',
    },
    notes: data.notes || null,
    lines: (data.lines || []).map((l, index) => ({
      id: index + 1,
      product_id: Number(l.product_id),
      product: {
        id: Number(l.product_id),
        name: Number(l.product_id) === 1 ? 'Brightloop Business Suite' : Number(l.product_id) === 2 ? 'Brightloop CRM Seat' : 'Extra Storage 100GB',
      },
      variant_id: l.variant_id ? Number(l.variant_id) : null,
      variant: l.variant_id ? { id: Number(l.variant_id), attribute: 'Brand', value: 'Odoo', extra_price: '560.00' } : null,
      quantity: Number(l.quantity) || 1,
    })),
  }
  mockQuotationTemplates.push(newTemplate)
  return mockSuccessEnvelope(newTemplate, null, 'Quotation template created successfully')
}

export function mockUpdateQuotationTemplate(id, data) {
  const index = mockQuotationTemplates.findIndex((t) => t.id === Number(id))
  if (index === -1) {
    throw { response: { status: 404, data: { success: false, message: 'Quotation template not found' } } }
  }
  const existing = mockQuotationTemplates[index]
  const updated = {
    ...existing,
    name: data.name || existing.name,
    validity_days: data.validity_days !== undefined ? Number(data.validity_days) : existing.validity_days,
    plan_id: data.plan_id !== undefined ? Number(data.plan_id) : existing.plan_id,
    notes: data.notes !== undefined ? data.notes : existing.notes,
    lines: data.lines
      ? data.lines.map((l, idx) => ({
          id: idx + 1,
          product_id: Number(l.product_id),
          product: { id: Number(l.product_id), name: 'Selected Product' },
          variant_id: l.variant_id ? Number(l.variant_id) : null,
          variant: null,
          quantity: Number(l.quantity) || 1,
        }))
      : existing.lines,
  }
  mockQuotationTemplates[index] = updated
  return mockSuccessEnvelope(updated, null, 'Quotation template updated successfully')
}

export function mockDeleteQuotationTemplate(id) {
  mockQuotationTemplates = mockQuotationTemplates.filter((t) => t.id !== Number(id))
  return mockSuccessEnvelope(null, null, 'Quotation template deleted successfully')
}

