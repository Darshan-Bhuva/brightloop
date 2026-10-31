/**
 * Mock Invoices Fixtures & State Machine Handlers
 * Source of truth: docs/PLAN.md (Section 3 Enums, Section 4 BR-3 to BR-9, Section 5 Seed data, Section 6 Resource shapes)
 */

import { mockSuccessEnvelope, mockPaginationMeta } from '@/api/mockable'

/**
 * Computes overdue status and overdue days count dynamically.
 * Rule BR-9: is_overdue = status=confirmed AND due_date < today AND amount_due > 0
 * days_overdue = today - due_date
 */
export function computeInvoiceOverdue(invoice, today = new Date()) {
  const todayStr = today.toISOString().split('T')[0]
  const isConfirmed = invoice.status === 'confirmed'
  const isPastDue = invoice.due_date && invoice.due_date < todayStr
  const hasDue = Number(invoice.amount_due || 0) > 0

  const isOverdue = Boolean(isConfirmed && isPastDue && hasDue)

  let daysOverdue = 0
  if (isOverdue && invoice.due_date) {
    const dueDateObj = new Date(invoice.due_date)
    const diffTime = today.getTime() - dueDateObj.getTime()
    daysOverdue = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)))
  }

  return {
    is_overdue: isOverdue,
    days_overdue: daysOverdue,
  }
}

/**
 * Computes allowed_actions for an invoice based on role and status.
 * Rule BR-8:
 * draft: edit, confirm, cancel
 * confirmed: send, record_payment, print, plus cancel if amount_paid = 0
 * paid: send, print
 * cancelled: print
 * Customer: only print
 */
export function computeInvoiceAllowedActions(invoice, role = 'admin') {
  if (role === 'customer') {
    return ['print']
  }

  const actions = []
  const status = invoice.status
  const amountPaid = Number(invoice.amount_paid || 0)

  if (status === 'draft') {
    actions.push('edit', 'confirm', 'cancel')
  } else if (status === 'confirmed') {
    actions.push('send', 'record_payment', 'print')
    if (amountPaid === 0) {
      actions.push('cancel')
    }
  } else if (status === 'paid') {
    actions.push('send', 'print')
  } else if (status === 'cancelled') {
    actions.push('print')
  }

  return actions
}

/**
 * Seeded Demo Invoices (Section 5: 3 existing invoices - 1 paid, 1 confirmed overdue, 1 draft)
 */
export let mockInvoices = [
  // 1. Paid Invoice
  {
    id: 1,
    number: 'INV-000001',
    status: 'paid',
    is_overdue: false,
    days_overdue: 0,
    customer: {
      id: 1,
      name: 'Acme Corp',
      email: 'billing@acme.test',
      phone: '+91 98765 00001',
      company_name: 'Acme Corporation',
      address_line: '123 Business Hub, MG Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
      postal_code: '560001',
    },
    subscription: {
      id: 1,
      number: 'SUB-000001',
    },
    payment_term: {
      id: 1,
      name: 'Immediate',
      due_days: 0,
    },
    invoice_date: '2026-09-01',
    due_date: '2026-09-01',
    period_start: '2026-09-01',
    period_end: '2026-09-30',
    subtotal: '3699.00',
    discount_total: '0.00',
    tax_total: '665.82',
    total: '4364.82',
    amount_paid: '4364.82',
    amount_due: '0.00',
    sent_at: '2026-09-01T10:00:00.000000Z',
    notes: 'Thank you for your business. First month onboarding and CRM setup.',
    lines: [
      {
        id: 1,
        product_id: null,
        description: 'Plan: Monthly Starter (monthly)',
        quantity: 1,
        unit_price: '999.00',
        discount_amount: '0.00',
        discount_name: null,
        tax_name: 'GST 18%',
        tax_rate: '18.00',
        tax_amount: '179.82',
        line_total: '1178.82',
      },
      {
        id: 2,
        product_id: 2,
        description: 'Brightloop CRM Seat',
        quantity: 2,
        unit_price: '1200.00',
        discount_amount: '0.00',
        discount_name: null,
        tax_name: 'GST 18%',
        tax_rate: '18.00',
        tax_amount: '432.00',
        line_total: '2832.00',
      },
      {
        id: 3,
        product_id: 3,
        description: 'Extra Storage 100GB',
        quantity: 1,
        unit_price: '300.00',
        discount_amount: '0.00',
        discount_name: null,
        tax_name: 'GST 18%',
        tax_rate: '18.00',
        tax_amount: '54.00',
        line_total: '354.00',
      },
    ],
    payments: [
      {
        id: 1,
        invoice_id: 1,
        invoice_number: 'INV-000001',
        customer: { id: 1, name: 'Acme Corp' },
        method: 'upi',
        amount: '4364.82',
        payment_date: '2026-09-02',
        reference: 'UPI-982314-ACME',
        note: 'Full settlement via UPI',
        recorded_by: { id: 1, name: 'Admin User' },
        created_at: '2026-09-02T10:30:00.000000Z',
      },
    ],
    allowed_actions: ['send', 'print'],
    created_at: '2026-09-01T08:00:00.000000Z',
  },

  // 2. Confirmed Overdue Invoice
  {
    id: 2,
    number: 'INV-000002',
    status: 'confirmed',
    is_overdue: true,
    days_overdue: 15,
    customer: {
      id: 2,
      name: 'Globex Logistics',
      email: 'accounts@globex.test',
      phone: '+91 98765 00002',
      company_name: 'Globex Logistics Ltd',
      address_line: '456 Freight Way, Cargo Complex',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      postal_code: '400001',
    },
    subscription: {
      id: 2,
      number: 'SUB-000002',
    },
    payment_term: {
      id: 2,
      name: 'Net 15',
      due_days: 15,
    },
    invoice_date: '2026-10-01',
    due_date: '2026-10-16',
    period_start: '2026-10-01',
    period_end: '2026-10-31',
    subtotal: '2788.14',
    discount_total: '0.00',
    tax_total: '501.86',
    total: '3290.00',
    amount_paid: '0.00',
    amount_due: '3290.00',
    sent_at: '2026-10-01T11:00:00.000000Z',
    notes: 'Priority support SLA package for October billing period.',
    lines: [
      {
        id: 4,
        product_id: null,
        description: 'Plan: Monthly Starter (monthly)',
        quantity: 1,
        unit_price: '999.00',
        discount_amount: '0.00',
        discount_name: null,
        tax_name: 'GST 18%',
        tax_rate: '18.00',
        tax_amount: '179.82',
        line_total: '1178.82',
      },
      {
        id: 5,
        product_id: 4,
        description: 'Priority Support',
        quantity: 2,
        unit_price: '800.00',
        discount_amount: '0.00',
        discount_name: null,
        tax_name: 'GST 18%',
        tax_rate: '18.00',
        tax_amount: '288.00',
        line_total: '1888.00',
      },
      {
        id: 6,
        product_id: 3,
        description: 'Extra Storage 100GB',
        quantity: 1,
        unit_price: '300.00',
        discount_amount: '76.82',
        discount_name: 'Promo 25%',
        tax_name: 'GST 18%',
        tax_rate: '18.00',
        tax_amount: '40.17',
        line_total: '223.18',
      },
    ],
    payments: [],
    allowed_actions: ['send', 'record_payment', 'print', 'cancel'],
    created_at: '2026-10-01T08:00:00.000000Z',
  },

  // 3. Draft Invoice
  {
    id: 3,
    number: 'INV-000003',
    status: 'draft',
    is_overdue: false,
    days_overdue: 0,
    customer: {
      id: 3,
      name: 'Initech Systems',
      email: 'finance@initech.test',
      phone: '+91 98765 00003',
      company_name: 'Initech Systems India',
      address_line: '789 Cyber Park, Hitech City',
      city: 'Hyderabad',
      state: 'Telangana',
      country: 'India',
      postal_code: '500081',
    },
    subscription: {
      id: 3,
      number: 'SUB-000003',
    },
    payment_term: {
      id: 3,
      name: 'Net 30',
      due_days: 30,
    },
    invoice_date: '2026-10-31',
    due_date: '2026-11-30',
    period_start: '2026-10-31',
    period_end: '2026-11-29',
    subtotal: '999.00',
    discount_total: '0.00',
    tax_total: '179.82',
    total: '1178.82',
    amount_paid: '0.00',
    amount_due: '1178.82',
    sent_at: null,
    notes: 'Draft recurring invoice waiting for review.',
    lines: [
      {
        id: 7,
        product_id: null,
        description: 'Plan: Monthly Starter (monthly)',
        quantity: 1,
        unit_price: '999.00',
        discount_amount: '0.00',
        discount_name: null,
        tax_name: 'GST 18%',
        tax_rate: '18.00',
        tax_amount: '179.82',
        line_total: '1178.82',
      },
    ],
    payments: [],
    allowed_actions: ['edit', 'confirm', 'cancel'],
    created_at: '2026-10-31T09:00:00.000000Z',
  },
]

/**
 * INV-01 List invoices (Admin, Staff all; Customer own, never draft)
 */
export function mockGetInvoices(params = {}) {
  const {
    page = 1,
    per_page = 15,
    status,
    customer_id,
    subscription_id,
    overdue,
    invoice_from,
    invoice_to,
    due_from,
    due_to,
    search,
    sort = 'invoice_date',
    direction = 'desc',
    role = 'admin',
  } = params

  let filtered = [...mockInvoices]

  // Customer role never sees draft invoices
  if (role === 'customer') {
    filtered = filtered.filter((inv) => inv.status !== 'draft')
  }

  // Filter: status
  if (status && status !== 'all') {
    filtered = filtered.filter((inv) => inv.status === status)
  }

  // Filter: customer_id
  if (customer_id) {
    filtered = filtered.filter((inv) => inv.customer?.id === Number(customer_id))
  }

  // Filter: subscription_id
  if (subscription_id) {
    filtered = filtered.filter((inv) => inv.subscription?.id === Number(subscription_id))
  }

  // Filter: overdue (true)
  if (overdue === true || overdue === 'true' || overdue === '1' || overdue === 1) {
    filtered = filtered.filter((inv) => {
      const { is_overdue } = computeInvoiceOverdue(inv)
      return is_overdue
    })
  }

  // Date range filters
  if (invoice_from) {
    filtered = filtered.filter((inv) => inv.invoice_date >= invoice_from)
  }
  if (invoice_to) {
    filtered = filtered.filter((inv) => inv.invoice_date <= invoice_to)
  }
  if (due_from) {
    filtered = filtered.filter((inv) => inv.due_date >= due_from)
  }
  if (due_to) {
    filtered = filtered.filter((inv) => inv.due_date <= due_to)
  }

  // Search filter (number, customer name)
  if (search) {
    const q = search.toLowerCase()
    filtered = filtered.filter(
      (inv) =>
        inv.number?.toLowerCase().includes(q) ||
        inv.customer?.name?.toLowerCase().includes(q) ||
        inv.subscription?.number?.toLowerCase().includes(q)
    )
  }

  // Sort: number | invoice_date | due_date | total | amount_due
  filtered.sort((a, b) => {
    let fieldA = a[sort]
    let fieldB = b[sort]

    if (sort === 'total' || sort === 'amount_due' || sort === 'amount_paid') {
      fieldA = Number(fieldA || 0)
      fieldB = Number(fieldB || 0)
    } else {
      fieldA = String(fieldA || '').toLowerCase()
      fieldB = String(fieldB || '').toLowerCase()
    }

    if (fieldA < fieldB) return direction === 'asc' ? -1 : 1
    if (fieldA > fieldB) return direction === 'asc' ? 1 : -1
    return 0
  })

  // Format to InvoiceListItem shape
  const listItems = filtered.map((inv) => {
    const overdueState = computeInvoiceOverdue(inv)
    return {
      id: inv.id,
      number: inv.number,
      status: inv.status,
      is_overdue: overdueState.is_overdue,
      days_overdue: overdueState.days_overdue,
      customer: {
        id: inv.customer.id,
        name: inv.customer.name,
      },
      subscription: {
        id: inv.subscription.id,
        number: inv.subscription.number,
      },
      invoice_date: inv.invoice_date,
      due_date: inv.due_date,
      total: inv.total,
      amount_paid: inv.amount_paid,
      amount_due: inv.amount_due,
      allowed_actions: computeInvoiceAllowedActions(inv, role),
    }
  })

  // Pagination
  const total = listItems.length
  const numPage = Number(page) || 1
  const numPerPage = Number(per_page) || 15
  const lastPage = Math.max(1, Math.ceil(total / numPerPage))
  const startIndex = (numPage - 1) * numPerPage
  const paginatedData = listItems.slice(startIndex, startIndex + numPerPage)

  return mockSuccessEnvelope(paginatedData, mockPaginationMeta(numPage, lastPage, numPerPage, total))
}

/**
 * INV-02 Show invoice
 */
export function mockGetInvoice(id, role = 'admin') {
  const inv = mockInvoices.find((i) => i.id === Number(id))
  if (!inv) {
    const error = new Error('Invoice not found')
    error.response = { status: 404, data: { success: false, message: 'Invoice not found', errors: null } }
    throw error
  }

  const overdueState = computeInvoiceOverdue(inv)
  const fullInvoice = {
    ...inv,
    is_overdue: overdueState.is_overdue,
    days_overdue: overdueState.days_overdue,
    allowed_actions: computeInvoiceAllowedActions(inv, role),
  }

  return mockSuccessEnvelope(fullInvoice)
}

/**
 * INV-03 Update invoice (only draft)
 */
export function mockUpdateInvoice(id, data) {
  const inv = mockInvoices.find((i) => i.id === Number(id))
  if (!inv) {
    const error = new Error('Invoice not found')
    error.response = { status: 404, data: { success: false, message: 'Invoice not found', errors: null } }
    throw error
  }

  if (inv.status !== 'draft') {
    const error = new Error('Only draft invoices can be updated')
    error.response = { status: 409, data: { success: false, message: 'Only draft invoices can be updated', errors: null } }
    throw error
  }

  if (data.due_date !== undefined) inv.due_date = data.due_date
  if (data.notes !== undefined) inv.notes = data.notes

  inv.allowed_actions = computeInvoiceAllowedActions(inv)
  return mockSuccessEnvelope(inv, null, 'Invoice updated successfully')
}

/**
 * INV-04 Confirm invoice (draft -> confirmed)
 */
export function mockConfirmInvoice(id) {
  const inv = mockInvoices.find((i) => i.id === Number(id))
  if (!inv) {
    const error = new Error('Invoice not found')
    error.response = { status: 404, data: { success: false, message: 'Invoice not found', errors: null } }
    throw error
  }

  if (inv.status !== 'draft') {
    const error = new Error('Only draft invoices can be confirmed')
    error.response = { status: 409, data: { success: false, message: 'Invoice is not in draft status', errors: null } }
    throw error
  }

  // If amount_due = 0 go straight to paid
  if (Number(inv.amount_due || 0) === 0) {
    inv.status = 'paid'
  } else {
    inv.status = 'confirmed'
  }

  const overdueState = computeInvoiceOverdue(inv)
  inv.is_overdue = overdueState.is_overdue
  inv.days_overdue = overdueState.days_overdue
  inv.allowed_actions = computeInvoiceAllowedActions(inv)

  return mockSuccessEnvelope(inv, null, 'Invoice confirmed successfully')
}

/**
 * INV-05 Cancel invoice (draft/confirmed -> cancelled)
 */
export function mockCancelInvoice(id, data = {}) {
  const inv = mockInvoices.find((i) => i.id === Number(id))
  if (!inv) {
    const error = new Error('Invoice not found')
    error.response = { status: 404, data: { success: false, message: 'Invoice not found', errors: null } }
    throw error
  }

  if (!['draft', 'confirmed'].includes(inv.status)) {
    const error = new Error('Only draft or confirmed invoices can be cancelled')
    error.response = { status: 409, data: { success: false, message: 'Only draft or confirmed invoices can be cancelled', errors: null } }
    throw error
  }

  if (Number(inv.amount_paid || 0) > 0 || (inv.payments && inv.payments.length > 0)) {
    const error = new Error('Cannot cancel an invoice with recorded payments')
    error.response = { status: 409, data: { success: false, message: 'Cannot cancel an invoice with recorded payments', errors: null } }
    throw error
  }

  inv.status = 'cancelled'
  inv.cancelled_at = new Date().toISOString()
  inv.cancel_reason = data.reason || 'Cancelled by admin'
  inv.is_overdue = false
  inv.days_overdue = 0
  inv.allowed_actions = computeInvoiceAllowedActions(inv)

  return mockSuccessEnvelope(inv, null, 'Invoice cancelled successfully')
}

/**
 * INV-06 Send invoice
 */
export function mockSendInvoice(id) {
  const inv = mockInvoices.find((i) => i.id === Number(id))
  if (!inv) {
    const error = new Error('Invoice not found')
    error.response = { status: 404, data: { success: false, message: 'Invoice not found', errors: null } }
    throw error
  }

  if (!['confirmed', 'paid'].includes(inv.status)) {
    const error = new Error('Only confirmed or paid invoices can be sent')
    error.response = { status: 409, data: { success: false, message: 'Only confirmed or paid invoices can be sent', errors: null } }
    throw error
  }

  inv.sent_at = new Date().toISOString()
  return mockSuccessEnvelope(inv, null, 'Invoice sent to customer successfully')
}

/**
 * INV-07 Bulk confirm invoices
 */
export function mockBulkConfirmInvoices(data = {}) {
  const ids = data.ids || []
  let confirmed = 0
  const skipped = []

  ids.forEach((id) => {
    const inv = mockInvoices.find((i) => i.id === Number(id))
    if (!inv) {
      skipped.push({ id, message: 'Invoice not found' })
    } else if (inv.status !== 'draft') {
      skipped.push({ id, message: `Status is ${inv.status}, not draft` })
    } else {
      if (Number(inv.amount_due || 0) === 0) {
        inv.status = 'paid'
      } else {
        inv.status = 'confirmed'
      }
      const overdueState = computeInvoiceOverdue(inv)
      inv.is_overdue = overdueState.is_overdue
      inv.days_overdue = overdueState.days_overdue
      inv.allowed_actions = computeInvoiceAllowedActions(inv)
      confirmed++
    }
  })

  return mockSuccessEnvelope({ confirmed, skipped }, null, `Bulk confirm completed. ${confirmed} confirmed.`)
}

