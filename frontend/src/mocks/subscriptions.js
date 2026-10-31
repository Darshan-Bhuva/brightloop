/**
 * Mock Subscriptions Fixtures & State Machine Handlers
 * Source of truth: docs/PLAN.md (Section 4 BR-1 to BR-4, Section 5 Seed data, Section 6 Resource shapes)
 */

import { mockSuccessEnvelope, mockPaginationMeta } from '@/api/mockable'
import { mockPlans, mockProducts, mockPaymentTerms } from './catalog'

// Helper to compute allowed_actions per BR-4
export function computeAllowedActions(sub, role = 'admin') {
  const actions = []
  const isCustomer = role === 'customer'
  const plan = sub.plan || {}

  if (!isCustomer) {
    if (sub.status === 'draft') {
      actions.push('edit', 'delete', 'send_quotation')
    } else if (sub.status === 'quotation') {
      actions.push('edit', 'confirm')
    } else if (sub.status === 'confirmed') {
      actions.push('activate')
    }

    if (['draft', 'quotation', 'confirmed', 'active'].includes(sub.status)) {
      actions.push('add_discount')
    }
  } else {
    // Contract change: SUB-07 confirm allowed for customer (own) when status = quotation
    if (sub.status === 'quotation') {
      actions.push('confirm')
    }
  }

  // Active state actions
  if (sub.status === 'active') {
    if (!sub.is_paused) {
      if (plan.pausable) actions.push('pause')
    } else {
      actions.push('resume')
    }

    if (plan.renewable) {
      actions.push('renew')
    }
  }

  // Close action (confirmed or active, if plan.closable)
  if (['confirmed', 'active'].includes(sub.status) && plan.closable) {
    actions.push('close')
  }

  return actions
}

export let mockSubscriptions = [
  // 1. Active & Due for Billing
  {
    id: 1,
    number: 'SUB-000001',
    status: 'active',
    is_paused: false,
    customer: { id: 1, name: 'Acme Corp', email: 'billing@acme.test', phone: '+91 98765 00001', company_name: 'Acme Corporation' },
    plan: { id: 1, name: 'Monthly Starter', billing_period: 'monthly', price: '999.00', closable: true, pausable: true, renewable: true, auto_close: false },
    payment_term: { id: 1, name: 'Immediate', due_days: 0 },
    quotation_template_id: 1,
    start_date: '2026-08-01',
    expiry_date: '2027-07-31',
    quotation_valid_until: null,
    next_invoice_date: '2026-10-01',
    notes: 'Primary monthly subscription for Acme team',
    lines: [
      {
        id: 1,
        line_type: 'plan',
        product_id: null,
        product_name: null,
        variant_id: null,
        variant_label: null,
        description: 'Plan: Monthly Starter (monthly)',
        quantity: 1,
        unit_price: '999.00',
        tax_id: 3,
        tax_name: 'GST 18%',
        tax_rate: '18.00',
        amount: '999.00',
        tax_amount: '179.82',
        total: '1178.82',
      },
      {
        id: 2,
        line_type: 'product',
        product_id: 2,
        product_name: 'Brightloop CRM Seat',
        variant_id: null,
        variant_label: null,
        description: 'Brightloop CRM Seat',
        quantity: 2,
        unit_price: '1200.00',
        tax_id: 3,
        tax_name: 'GST 18%',
        tax_rate: '18.00',
        amount: '2400.00',
        tax_amount: '432.00',
        total: '2832.00',
      },
      {
        id: 3,
        line_type: 'product',
        product_id: 3,
        product_name: 'Extra Storage 100GB',
        variant_id: null,
        variant_label: null,
        description: 'Extra Storage 100GB',
        quantity: 1,
        unit_price: '300.00',
        tax_id: 3,
        tax_name: 'GST 18%',
        tax_rate: '18.00',
        amount: '300.00',
        tax_amount: '54.00',
        total: '354.00',
      },
    ],
    discounts: [],
    subtotal: '3699.00',
    tax_total: '665.82',
    total: '4364.82',
    closed_at: null,
    close_reason: null,
    allowed_actions: ['pause', 'renew', 'close', 'add_discount'],
    created_at: '2026-08-01T10:00:00Z',
  },
  // 2. Active with Attached Discount
  {
    id: 2,
    number: 'SUB-000002',
    status: 'active',
    is_paused: false,
    customer: { id: 2, name: 'TechLabs India', email: 'accounts@techlabs.test', phone: '+91 98765 00002', company_name: 'TechLabs Pvt Ltd' },
    plan: { id: 2, name: 'Yearly Business', billing_period: 'yearly', price: '9999.00', closable: false, pausable: false, renewable: true, auto_close: true },
    payment_term: { id: 3, name: 'Net 30', due_days: 30 },
    quotation_template_id: null,
    start_date: '2026-05-15',
    expiry_date: '2027-05-14',
    quotation_valid_until: null,
    next_invoice_date: '2026-10-15',
    notes: 'Annual enterprise account',
    lines: [
      {
        id: 4,
        line_type: 'plan',
        product_id: null,
        product_name: null,
        variant_id: null,
        variant_label: null,
        description: 'Plan: Yearly Business (yearly)',
        quantity: 1,
        unit_price: '9999.00',
        tax_id: 3,
        tax_name: 'GST 18%',
        tax_rate: '18.00',
        amount: '9999.00',
        tax_amount: '1799.82',
        total: '11798.82',
      },
      {
        id: 5,
        line_type: 'product',
        product_id: 1,
        product_name: 'Brightloop Business Suite',
        variant_id: 1,
        variant_label: 'Brand: Odoo',
        description: 'Brightloop Business Suite (Brand: Odoo)',
        quantity: 5,
        unit_price: '4560.00',
        tax_id: 3,
        tax_name: 'GST 18%',
        tax_rate: '18.00',
        amount: '22800.00',
        tax_amount: '4104.00',
        total: '26904.00',
      },
    ],
    discounts: [
      { id: 2, name: 'Loyalty 500 Off', type: 'fixed', value: '500.00', state: 'active' },
    ],
    subtotal: '32799.00',
    tax_total: '5903.82',
    total: '38702.82',
    closed_at: null,
    close_reason: null,
    allowed_actions: ['renew', 'add_discount'], // Yearly Business is neither closable nor pausable
    created_at: '2026-05-15T09:30:00Z',
  },
  // 3. Active & Paused
  {
    id: 3,
    number: 'SUB-000003',
    status: 'active',
    is_paused: true,
    customer: { id: 3, name: 'Starlight Media', email: 'finance@starlight.test', phone: '+91 98765 00003', company_name: 'Starlight Media House' },
    plan: { id: 1, name: 'Monthly Starter', billing_period: 'monthly', price: '999.00', closable: true, pausable: true, renewable: true, auto_close: false },
    payment_term: { id: 2, name: 'Net 15', due_days: 15 },
    quotation_template_id: null,
    start_date: '2026-06-01',
    expiry_date: '2027-05-31',
    quotation_valid_until: null,
    next_invoice_date: '2026-11-01',
    notes: 'Paused temporarily during restructuring',
    lines: [
      {
        id: 6,
        line_type: 'plan',
        product_id: null,
        product_name: null,
        variant_id: null,
        variant_label: null,
        description: 'Plan: Monthly Starter (monthly)',
        quantity: 1,
        unit_price: '999.00',
        tax_id: 3,
        tax_name: 'GST 18%',
        tax_rate: '18.00',
        amount: '999.00',
        tax_amount: '179.82',
        total: '1178.82',
      },
      {
        id: 7,
        line_type: 'product',
        product_id: 2,
        product_name: 'Brightloop CRM Seat',
        variant_id: null,
        variant_label: null,
        description: 'Brightloop CRM Seat',
        quantity: 3,
        unit_price: '1200.00',
        tax_id: 3,
        tax_name: 'GST 18%',
        tax_rate: '18.00',
        amount: '3600.00',
        tax_amount: '648.00',
        total: '4248.00',
      },
    ],
    discounts: [],
    subtotal: '4599.00',
    tax_total: '827.82',
    total: '5426.82',
    closed_at: null,
    close_reason: null,
    allowed_actions: ['resume', 'renew', 'close', 'add_discount'],
    created_at: '2026-06-01T14:15:00Z',
  },
  // 4. Draft State
  {
    id: 4,
    number: 'SUB-000004',
    status: 'draft',
    is_paused: false,
    customer: { id: 4, name: 'Zenith Logistics', email: 'support@zenith.test', phone: '+91 98765 00004', company_name: 'Zenith Logistics LLP' },
    plan: { id: 1, name: 'Monthly Starter', billing_period: 'monthly', price: '999.00', closable: true, pausable: true, renewable: true, auto_close: false },
    payment_term: { id: 1, name: 'Immediate', due_days: 0 },
    quotation_template_id: 1,
    start_date: '2026-11-01',
    expiry_date: '2027-10-31',
    quotation_valid_until: null,
    next_invoice_date: null,
    notes: 'Draft proposal prepared for upcoming expansion',
    lines: [
      {
        id: 8,
        line_type: 'plan',
        product_id: null,
        product_name: null,
        variant_id: null,
        variant_label: null,
        description: 'Plan: Monthly Starter (monthly)',
        quantity: 1,
        unit_price: '999.00',
        tax_id: 3,
        tax_name: 'GST 18%',
        tax_rate: '18.00',
        amount: '999.00',
        tax_amount: '179.82',
        total: '1178.82',
      },
      {
        id: 9,
        line_type: 'product',
        product_id: 2,
        product_name: 'Brightloop CRM Seat',
        variant_id: null,
        variant_label: null,
        description: 'Brightloop CRM Seat',
        quantity: 2,
        unit_price: '1200.00',
        tax_id: 3,
        tax_name: 'GST 18%',
        tax_rate: '18.00',
        amount: '2400.00',
        tax_amount: '432.00',
        total: '2832.00',
      },
    ],
    discounts: [],
    subtotal: '3399.00',
    tax_total: '611.82',
    total: '4010.82',
    closed_at: null,
    close_reason: null,
    allowed_actions: ['edit', 'delete', 'send_quotation', 'add_discount'],
    created_at: '2026-10-25T11:20:00Z',
  },
  // 5. Quotation Sent
  {
    id: 5,
    number: 'SUB-000005',
    status: 'quotation',
    is_paused: false,
    customer: { id: 1, name: 'Acme Corp', email: 'billing@acme.test', phone: '+91 98765 00001', company_name: 'Acme Corporation' },
    plan: { id: 3, name: 'Weekly Trial', billing_period: 'weekly', price: '199.00', closable: true, pausable: false, renewable: false, auto_close: true },
    payment_term: { id: 1, name: 'Immediate', due_days: 0 },
    quotation_template_id: null,
    start_date: '2026-11-05',
    expiry_date: '2026-12-05',
    quotation_valid_until: '2026-11-25',
    next_invoice_date: null,
    notes: 'Quotation sent to BluePeak procurement team',
    lines: [
      {
        id: 10,
        line_type: 'plan',
        product_id: null,
        product_name: null,
        variant_id: null,
        variant_label: null,
        description: 'Plan: Weekly Trial (weekly)',
        quantity: 1,
        unit_price: '199.00',
        tax_id: 3,
        tax_name: 'GST 18%',
        tax_rate: '18.00',
        amount: '199.00',
        tax_amount: '35.82',
        total: '234.82',
      },
      {
        id: 11,
        line_type: 'product',
        product_id: 4,
        product_name: 'Priority Support',
        variant_id: null,
        variant_label: null,
        description: 'Priority Support',
        quantity: 1,
        unit_price: '800.00',
        tax_id: 3,
        tax_name: 'GST 18%',
        tax_rate: '18.00',
        amount: '800.00',
        tax_amount: '144.00',
        total: '944.00',
      },
    ],
    discounts: [],
    subtotal: '999.00',
    tax_total: '179.82',
    total: '1178.82',
    closed_at: null,
    close_reason: null,
    allowed_actions: ['confirm'],
    created_at: '2026-10-26T08:45:00Z',
  },
  // 6. Confirmed State
  {
    id: 6,
    number: 'SUB-000006',
    status: 'confirmed',
    is_paused: false,
    customer: { id: 1, name: 'Acme Corp', email: 'billing@acme.test', phone: '+91 98765 00001', company_name: 'Acme Corporation' },
    plan: { id: 1, name: 'Monthly Starter', billing_period: 'monthly', price: '999.00', closable: true, pausable: true, renewable: true, auto_close: false },
    payment_term: { id: 2, name: 'Net 15', due_days: 15 },
    quotation_template_id: null,
    start_date: '2026-11-01',
    expiry_date: '2027-10-31',
    quotation_valid_until: '2026-11-15',
    next_invoice_date: null,
    notes: 'Quotation accepted, pending activation on 1st November',
    lines: [
      {
        id: 12,
        line_type: 'plan',
        product_id: null,
        product_name: null,
        variant_id: null,
        variant_label: null,
        description: 'Plan: Monthly Starter (monthly)',
        quantity: 1,
        unit_price: '999.00',
        tax_id: 3,
        tax_name: 'GST 18%',
        tax_rate: '18.00',
        amount: '999.00',
        tax_amount: '179.82',
        total: '1178.82',
      },
    ],
    discounts: [],
    subtotal: '999.00',
    tax_total: '179.82',
    total: '1178.82',
    closed_at: null,
    close_reason: null,
    allowed_actions: ['activate', 'close', 'add_discount'],
    created_at: '2026-10-27T12:00:00Z',
  },
  // 7. Closed State
  {
    id: 7,
    number: 'SUB-000007',
    status: 'closed',
    is_paused: false,
    customer: { id: 2, name: 'TechLabs India', email: 'accounts@techlabs.test', phone: '+91 98765 00002', company_name: 'TechLabs Pvt Ltd' },
    plan: { id: 3, name: 'Weekly Trial', billing_period: 'weekly', price: '199.00', closable: true, pausable: false, renewable: false, auto_close: true },
    payment_term: { id: 1, name: 'Immediate', due_days: 0 },
    quotation_template_id: null,
    start_date: '2026-09-01',
    expiry_date: '2026-09-30',
    quotation_valid_until: null,
    next_invoice_date: null,
    notes: 'Trial completed and closed per schedule',
    lines: [
      {
        id: 13,
        line_type: 'plan',
        product_id: null,
        product_name: null,
        variant_id: null,
        variant_label: null,
        description: 'Plan: Weekly Trial (weekly)',
        quantity: 1,
        unit_price: '199.00',
        tax_id: 3,
        tax_name: 'GST 18%',
        tax_rate: '18.00',
        amount: '199.00',
        tax_amount: '35.82',
        total: '234.82',
      },
    ],
    discounts: [],
    subtotal: '199.00',
    tax_total: '35.82',
    total: '234.82',
    closed_at: '2026-10-01T00:00:00Z',
    close_reason: 'Trial period expired',
    allowed_actions: [],
    created_at: '2026-09-01T10:00:00Z',
  },
]

// Mock API Call Handlers
export function mockGetSubscriptions(params = {}) {
  let list = [...mockSubscriptions]

  if (params.status && params.status !== 'all') {
    list = list.filter((s) => s.status === params.status)
  }
  if (params.customer_id) {
    list = list.filter((s) => s.customer.id === Number(params.customer_id))
  }
  if (params.plan_id) {
    list = list.filter((s) => s.plan.id === Number(params.plan_id))
  }
  if (params.is_paused !== undefined && params.is_paused !== '') {
    const isPaused = params.is_paused === 'true' || params.is_paused === true
    list = list.filter((s) => Boolean(s.is_paused) === isPaused)
  }
  if (params.start_from) {
    list = list.filter((s) => s.start_date >= params.start_from)
  }
  if (params.start_to) {
    list = list.filter((s) => s.start_date <= params.start_to)
  }
  if (params.expiry_from) {
    list = list.filter((s) => s.expiry_date >= params.expiry_from)
  }
  if (params.expiry_to) {
    list = list.filter((s) => s.expiry_date <= params.expiry_to)
  }
  if (params.search) {
    const q = params.search.toLowerCase()
    list = list.filter(
      (s) =>
        s.number.toLowerCase().includes(q) ||
        s.customer.name.toLowerCase().includes(q)
    )
  }

  // Sort
  const sort = params.sort || 'created_at'
  const direction = params.direction || 'desc'
  list.sort((a, b) => {
    let aVal = a[sort]
    let bVal = b[sort]
    if (sort === 'total') {
      aVal = parseFloat(a.total)
      bVal = parseFloat(b.total)
    }
    if (aVal < bVal) return direction === 'asc' ? -1 : 1
    if (aVal > bVal) return direction === 'asc' ? 1 : -1
    return 0
  })

  // Format to SubscriptionListItem[] shape (Section 6)
  const items = list.map((s) => ({
    id: s.id,
    number: s.number,
    status: s.status,
    is_paused: s.is_paused,
    customer: { id: s.customer.id, name: s.customer.name },
    plan: { id: s.plan.id, name: s.plan.name, billing_period: s.plan.billing_period },
    start_date: s.start_date,
    expiry_date: s.expiry_date,
    next_invoice_date: s.next_invoice_date,
    total: s.total,
  }))

  const page = Number(params.page) || 1
  const perPage = Number(params.per_page) || 15
  const total = items.length
  const paginated = items.slice((page - 1) * perPage, page * perPage)

  return mockSuccessEnvelope(
    paginated,
    mockPaginationMeta(page, Math.ceil(total / perPage) || 1, perPage, total)
  )
}

export function mockGetSubscription(id, role = 'admin') {
  const sub = mockSubscriptions.find((s) => s.id === Number(id))
  if (!sub) {
    throw { response: { status: 404, data: { success: false, message: 'Subscription not found' } } }
  }
  // Compute allowed actions dynamically
  const updatedSub = {
    ...sub,
    allowed_actions: computeAllowedActions(
      sub,
      typeof window !== 'undefined' &&
        ((localStorage.getItem('bl_token') || '').includes('customer') ||
          window.location.pathname.startsWith('/portal'))
        ? 'customer'
        : role
    ),
  }
  return mockSuccessEnvelope(updatedSub)
}

export function mockCreateSubscription(data) {
  const newId = mockSubscriptions.length > 0 ? Math.max(...mockSubscriptions.map((s) => s.id)) + 1 : 1
  const number = `SUB-${String(newId).padStart(6, '0')}`

  const plan = mockPlans.find((p) => p.id === Number(data.plan_id)) || mockPlans[0]
  const paymentTerm = mockPaymentTerms.find((t) => t.id === Number(data.payment_term_id)) || mockPaymentTerms[0]

  // BR-2: Server generates plan fee line
  const lines = [
    {
      id: 1,
      line_type: 'plan',
      product_id: null,
      product_name: null,
      variant_id: null,
      variant_label: null,
      description: `Plan: ${plan.name} (${plan.billing_period})`,
      quantity: 1,
      unit_price: plan.price,
      tax_id: plan.tax_id,
      tax_name: plan.tax?.name || 'GST 18%',
      tax_rate: plan.tax?.rate || '18.00',
      amount: plan.price,
      tax_amount: ((parseFloat(plan.price) * (parseFloat(plan.tax?.rate || 18))) / 100).toFixed(2),
      total: (parseFloat(plan.price) * (1 + parseFloat(plan.tax?.rate || 18) / 100)).toFixed(2),
    },
  ]

  let lineCounter = 2
  let subtotal = parseFloat(plan.price)
  let taxTotal = parseFloat(lines[0].tax_amount)

  if (Array.isArray(data.lines)) {
    for (const l of data.lines) {
      const prod = mockProducts.find((p) => p.id === Number(l.product_id)) || {
        id: Number(l.product_id),
        name: 'Product',
        sales_price: '500.00',
        tax: { name: 'GST 18%', rate: '18.00' },
      }
      const variant = prod.variants?.find((v) => v.id === Number(l.variant_id))
      const extraPrice = variant ? parseFloat(variant.extra_price) : 0
      const unitPrice = (parseFloat(prod.sales_price) + extraPrice).toFixed(2)
      const qty = Number(l.quantity) || 1
      const amount = (parseFloat(unitPrice) * qty).toFixed(2)
      const taxRate = parseFloat(prod.tax?.rate || 18)
      const taxAmt = ((parseFloat(amount) * taxRate) / 100).toFixed(2)
      const lineTot = (parseFloat(amount) + parseFloat(taxAmt)).toFixed(2)

      subtotal += parseFloat(amount)
      taxTotal += parseFloat(taxAmt)

      lines.push({
        id: lineCounter++,
        line_type: 'product',
        product_id: prod.id,
        product_name: prod.name,
        variant_id: variant ? variant.id : null,
        variant_label: variant ? `${variant.attribute}: ${variant.value}` : null,
        description: variant ? `${prod.name} (${variant.attribute}: ${variant.value})` : prod.name,
        quantity: qty,
        unit_price: unitPrice,
        tax_id: prod.tax_id || 3,
        tax_name: prod.tax?.name || 'GST 18%',
        tax_rate: String(taxRate),
        amount,
        tax_amount: taxAmt,
        total: lineTot,
      })
    }
  }

  const total = (subtotal + taxTotal).toFixed(2)

  const newSub = {
    id: newId,
    number,
    status: 'draft',
    is_paused: false,
    customer: { id: Number(data.customer_id), name: 'Customer Partner', email: 'customer@example.test' },
    plan: {
      id: plan.id,
      name: plan.name,
      billing_period: plan.billing_period,
      price: plan.price,
      closable: plan.closable,
      pausable: plan.pausable,
      renewable: plan.renewable,
      auto_close: plan.auto_close,
    },
    payment_term: { id: paymentTerm.id, name: paymentTerm.name, due_days: paymentTerm.due_days },
    quotation_template_id: data.quotation_template_id ? Number(data.quotation_template_id) : null,
    start_date: data.start_date,
    expiry_date: data.expiry_date,
    quotation_valid_until: null,
    next_invoice_date: null,
    notes: data.notes || null,
    lines,
    discounts: [],
    subtotal: subtotal.toFixed(2),
    tax_total: taxTotal.toFixed(2),
    total,
    closed_at: null,
    close_reason: null,
    allowed_actions: ['edit', 'delete', 'send_quotation', 'add_discount'],
    created_at: new Date().toISOString(),
  }

  mockSubscriptions.unshift(newSub)
  return mockSuccessEnvelope(newSub, null, 'Subscription created successfully')
}

export function mockUpdateSubscription(id, data) {
  const index = mockSubscriptions.findIndex((s) => s.id === Number(id))
  if (index === -1) {
    throw { response: { status: 404, data: { success: false, message: 'Subscription not found' } } }
  }
  const existing = mockSubscriptions[index]
  if (!['draft', 'quotation'].includes(existing.status)) {
    throw { response: { status: 409, data: { success: false, message: 'Only draft or quotation subscriptions can be updated' } } }
  }

  // Update fields
  existing.start_date = data.start_date || existing.start_date
  existing.expiry_date = data.expiry_date || existing.expiry_date
  existing.notes = data.notes !== undefined ? data.notes : existing.notes
  existing.allowed_actions = computeAllowedActions(existing)

  return mockSuccessEnvelope(existing, null, 'Subscription updated successfully')
}

export function mockDeleteSubscription(id) {
  const index = mockSubscriptions.findIndex((s) => s.id === Number(id))
  if (index === -1) {
    throw { response: { status: 404, data: { success: false, message: 'Subscription not found' } } }
  }
  if (mockSubscriptions[index].status !== 'draft') {
    throw { response: { status: 409, data: { success: false, message: 'Only draft subscriptions can be deleted' } } }
  }
  mockSubscriptions.splice(index, 1)
  return mockSuccessEnvelope(null, null, 'Subscription deleted successfully')
}

// State Machine Actions (SUB-06 to SUB-12)
export function mockSendQuotation(id) {
  const sub = mockSubscriptions.find((s) => s.id === Number(id))
  if (!sub) throw { response: { status: 404, data: { success: false, message: 'Subscription not found' } } }
  if (sub.status !== 'draft') {
    throw { response: { status: 409, data: { success: false, message: 'Only draft subscriptions can be sent as quotation' } } }
  }

  const today = new Date()
  today.setDate(today.getDate() + 30)
  sub.status = 'quotation'
  sub.quotation_valid_until = today.toISOString().split('T')[0]
  sub.allowed_actions = computeAllowedActions(
    sub,
    typeof window !== 'undefined' &&
      ((localStorage.getItem('bl_token') || '').includes('customer') ||
        window.location.pathname.startsWith('/portal'))
      ? 'customer'
      : 'admin'
  )
  return mockSuccessEnvelope(sub, null, 'Quotation sent successfully')
}

export function mockConfirmSubscription(id) {
  const sub = mockSubscriptions.find((s) => s.id === Number(id))
  if (!sub) throw { response: { status: 404, data: { success: false, message: 'Subscription not found' } } }
  if (sub.status !== 'quotation') {
    throw { response: { status: 409, data: { success: false, message: 'Only quotation subscriptions can be confirmed' } } }
  }

  // BR-4 quotation_valid_until >= today check
  if (sub.quotation_valid_until && sub.quotation_valid_until < new Date().toISOString().split('T')[0]) {
    throw { response: { status: 409, data: { success: false, message: 'Quotation expired' } } }
  }

  sub.status = 'confirmed'
  sub.allowed_actions = computeAllowedActions(
    sub,
    typeof window !== 'undefined' &&
      ((localStorage.getItem('bl_token') || '').includes('customer') ||
        window.location.pathname.startsWith('/portal'))
      ? 'customer'
      : 'admin'
  )
  return mockSuccessEnvelope(sub, null, 'Subscription confirmed successfully')
}

export function mockActivateSubscription(id) {
  const sub = mockSubscriptions.find((s) => s.id === Number(id))
  if (!sub) throw { response: { status: 404, data: { success: false, message: 'Subscription not found' } } }
  if (sub.status !== 'confirmed') {
    throw { response: { status: 409, data: { success: false, message: 'Only confirmed subscriptions can be activated' } } }
  }

  sub.status = 'active'
  sub.next_invoice_date = sub.start_date
  sub.allowed_actions = computeAllowedActions(
    sub,
    typeof window !== 'undefined' &&
      ((localStorage.getItem('bl_token') || '').includes('customer') ||
        window.location.pathname.startsWith('/portal'))
      ? 'customer'
      : 'admin'
  )
  return mockSuccessEnvelope(sub, null, 'Subscription activated successfully')
}

export function mockPauseSubscription(id) {
  const sub = mockSubscriptions.find((s) => s.id === Number(id))
  if (!sub) throw { response: { status: 404, data: { success: false, message: 'Subscription not found' } } }
  if (sub.status !== 'active' || sub.is_paused) {
    throw { response: { status: 409, data: { success: false, message: 'Subscription cannot be paused' } } }
  }
  if (!sub.plan.pausable) {
    throw { response: { status: 409, data: { success: false, message: 'Plan is not pausable' } } }
  }

  sub.is_paused = true
  sub.paused_at = new Date().toISOString()
  sub.allowed_actions = computeAllowedActions(
    sub,
    typeof window !== 'undefined' &&
      ((localStorage.getItem('bl_token') || '').includes('customer') ||
        window.location.pathname.startsWith('/portal'))
      ? 'customer'
      : 'admin'
  )
  return mockSuccessEnvelope(sub, null, 'Subscription paused successfully')
}

export function mockResumeSubscription(id) {
  const sub = mockSubscriptions.find((s) => s.id === Number(id))
  if (!sub) throw { response: { status: 404, data: { success: false, message: 'Subscription not found' } } }
  if (sub.status !== 'active' || !sub.is_paused) {
    throw { response: { status: 409, data: { success: false, message: 'Subscription is not paused' } } }
  }

  sub.is_paused = false
  sub.paused_at = null
  const today = new Date().toISOString().split('T')[0]
  if (sub.next_invoice_date && sub.next_invoice_date < today) {
    sub.next_invoice_date = today
  }
  sub.allowed_actions = computeAllowedActions(
    sub,
    typeof window !== 'undefined' &&
      ((localStorage.getItem('bl_token') || '').includes('customer') ||
        window.location.pathname.startsWith('/portal'))
      ? 'customer'
      : 'admin'
  )
  return mockSuccessEnvelope(sub, null, 'Subscription resumed successfully')
}

export function mockCloseSubscription(id, data = {}) {
  const sub = mockSubscriptions.find((s) => s.id === Number(id))
  if (!sub) throw { response: { status: 404, data: { success: false, message: 'Subscription not found' } } }
  if (!['confirmed', 'active'].includes(sub.status)) {
    throw { response: { status: 409, data: { success: false, message: 'Subscription cannot be closed' } } }
  }
  if (!sub.plan.closable) {
    throw { response: { status: 409, data: { success: false, message: 'Plan is not closable' } } }
  }

  sub.status = 'closed'
  sub.closed_at = new Date().toISOString()
  sub.close_reason = data.reason || 'Closed per request'
  sub.next_invoice_date = null
  sub.allowed_actions = computeAllowedActions(
    sub,
    typeof window !== 'undefined' &&
      ((localStorage.getItem('bl_token') || '').includes('customer') ||
        window.location.pathname.startsWith('/portal'))
      ? 'customer'
      : 'admin'
  )
  return mockSuccessEnvelope(sub, null, 'Subscription closed successfully')
}

export function mockRenewSubscription(id, data) {
  const sub = mockSubscriptions.find((s) => s.id === Number(id))
  if (!sub) throw { response: { status: 404, data: { success: false, message: 'Subscription not found' } } }
  if (sub.status !== 'active') {
    throw { response: { status: 409, data: { success: false, message: 'Only active subscriptions can be renewed' } } }
  }
  if (!sub.plan.renewable) {
    throw { response: { status: 409, data: { success: false, message: 'Plan is not renewable' } } }
  }
  if (!data?.new_expiry_date || data.new_expiry_date <= sub.expiry_date) {
    throw { response: { status: 422, data: { success: false, message: 'Validation failed', errors: { new_expiry_date: ['New expiry date must be after current expiry date'] } } } }
  }

  sub.expiry_date = data.new_expiry_date
  sub.allowed_actions = computeAllowedActions(
    sub,
    typeof window !== 'undefined' &&
      ((localStorage.getItem('bl_token') || '').includes('customer') ||
        window.location.pathname.startsWith('/portal'))
      ? 'customer'
      : 'admin'
  )
  return mockSuccessEnvelope(sub, null, 'Subscription renewed successfully')
}

export function mockAttachDiscount(id, data) {
  const sub = mockSubscriptions.find((s) => s.id === Number(id))
  if (!sub) throw { response: { status: 404, data: { success: false, message: 'Subscription not found' } } }

  const discountId = Number(data.discount_id)
  const discount = {
    id: discountId,
    name: discountId === 2 ? 'Loyalty 500 Off' : 'Seasonal Discount',
    type: discountId === 2 ? 'fixed' : 'percentage',
    value: discountId === 2 ? '500.00' : '15.00',
    state: 'active',
  }

  if (!sub.discounts.some((d) => d.id === discountId)) {
    sub.discounts.push(discount)
  }
  sub.allowed_actions = computeAllowedActions(
    sub,
    typeof window !== 'undefined' &&
      ((localStorage.getItem('bl_token') || '').includes('customer') ||
        window.location.pathname.startsWith('/portal'))
      ? 'customer'
      : 'admin'
  )
  return mockSuccessEnvelope(sub, null, 'Discount attached successfully')
}

export function mockDetachDiscount(id, discountId) {
  const sub = mockSubscriptions.find((s) => s.id === Number(id))
  if (!sub) throw { response: { status: 404, data: { success: false, message: 'Subscription not found' } } }

  sub.discounts = sub.discounts.filter((d) => d.id !== Number(discountId))
  sub.allowed_actions = computeAllowedActions(
    sub,
    typeof window !== 'undefined' &&
      ((localStorage.getItem('bl_token') || '').includes('customer') ||
        window.location.pathname.startsWith('/portal'))
      ? 'customer'
      : 'admin'
  )
  return mockSuccessEnvelope(sub, null, 'Discount detached successfully')
}

