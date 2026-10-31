/**
 * Mock Payments Fixtures & Handlers (PAY-01, PAY-02, PAY-03)
 * Source of truth: docs/PLAN.md (Section 3 Enums, Section 4 BR-8, Section 6 Resource shapes)
 */

import { mockSuccessEnvelope, mockPaginationMeta } from '@/api/mockable'
import { mockInvoices, computeInvoiceAllowedActions, computeInvoiceOverdue } from './invoices'

export let mockPayments = [
  {
    id: 1,
    invoice_id: 2,
    invoice_number: 'INV-000002',
    customer: { id: 2, name: 'Globex Logistics' },
    method: 'bank_transfer',
    amount: '1000.00',
    payment_date: '2026-10-10',
    reference: 'NEFT-8839201',
    note: 'Initial partial payment',
    recorded_by: { id: 1, name: 'Admin User' },
    created_at: '2026-10-10T14:30:00Z',
  },
  {
    id: 2,
    invoice_id: 1,
    invoice_number: 'INV-000001',
    customer: { id: 1, name: 'Acme Corp' },
    method: 'upi',
    amount: '4364.82',
    payment_date: '2026-09-02',
    reference: 'UPI-982314-ACME',
    note: 'Full settlement via UPI',
    recorded_by: { id: 1, name: 'Admin User' },
    created_at: '2026-09-02T10:30:00Z',
  },
]

/**
 * PAY-01 List Payments (Admin, Staff all; Customer own)
 * Filters: customer_id, invoice_id, method, date_from, date_to, search
 * Sort: payment_date|amount|created_at (default payment_date desc)
 */
export function mockGetPayments(params = {}) {
  let list = [...mockPayments]

  if (params.customer_id) {
    list = list.filter((p) => p.customer?.id === Number(params.customer_id))
  }
  if (params.invoice_id) {
    list = list.filter((p) => p.invoice_id === Number(params.invoice_id))
  }
  if (params.method && params.method !== 'all') {
    list = list.filter((p) => p.method === params.method)
  }
  if (params.date_from) {
    list = list.filter((p) => p.payment_date >= params.date_from)
  }
  if (params.date_to) {
    list = list.filter((p) => p.payment_date <= params.date_to)
  }
  if (params.search) {
    const q = params.search.toLowerCase()
    list = list.filter(
      (p) =>
        p.invoice_number?.toLowerCase().includes(q) ||
        p.customer?.name?.toLowerCase().includes(q) ||
        (p.reference && p.reference.toLowerCase().includes(q))
    )
  }

  // Sorting
  const sort = params.sort || 'payment_date'
  const direction = params.direction || 'desc'
  list.sort((a, b) => {
    let aVal = a[sort]
    let bVal = b[sort]

    if (sort === 'amount') {
      aVal = Number(aVal || 0)
      bVal = Number(bVal || 0)
    } else {
      aVal = String(aVal || '').toLowerCase()
      bVal = String(bVal || '').toLowerCase()
    }

    if (aVal < bVal) return direction === 'asc' ? -1 : 1
    if (aVal > bVal) return direction === 'asc' ? 1 : -1
    return 0
  })

  const page = Number(params.page) || 1
  const perPage = Number(params.per_page) || 15
  const total = list.length
  const paginated = list.slice((page - 1) * perPage, page * perPage)

  return mockSuccessEnvelope(
    paginated,
    mockPaginationMeta(page, Math.ceil(total / perPage) || 1, perPage, total)
  )
}

/**
 * PAY-02 Record Payment (Admin, Staff)
 * Body: invoice_id, method, amount, payment_date, reference?, note?
 */
export function mockRecordPayment(data, user = { id: 1, name: 'Admin User' }) {
  const invoiceId = Number(data.invoice_id)
  const invoice = mockInvoices.find((inv) => inv.id === invoiceId)

  if (!invoice) {
    const error = new Error('Invoice not found')
    error.response = { status: 404, data: { success: false, message: 'Invoice not found', errors: null } }
    throw error
  }

  // Rule: Invoice must be confirmed (409)
  if (invoice.status !== 'confirmed') {
    const error = new Error('Invoice must be confirmed before recording payments')
    error.response = {
      status: 409,
      data: {
        success: false,
        message: 'Invoice must be confirmed before recording payments',
        errors: null,
      },
    }
    throw error
  }

  const amount = Number(data.amount)
  const currentDue = Number(invoice.amount_due || 0)

  // Rule: amount > 0 and <= amount_due (422)
  if (isNaN(amount) || amount <= 0 || amount > currentDue) {
    const error = new Error('The amount cannot exceed the amount due.')
    error.response = {
      status: 422,
      data: {
        success: false,
        message: 'The given data was invalid.',
        errors: { amount: ['The amount cannot exceed the amount due.'] },
      },
    }
    throw error
  }

  // Rule: payment_date not in the future (422)
  const todayStr = new Date().toISOString().split('T')[0]
  if (data.payment_date && data.payment_date > todayStr) {
    const error = new Error('The payment date cannot be in the future.')
    error.response = {
      status: 422,
      data: {
        success: false,
        message: 'The given data was invalid.',
        errors: { payment_date: ['The payment date cannot be in the future.'] },
      },
    }
    throw error
  }

  // Update invoice financial balances
  const newAmountPaid = (Number(invoice.amount_paid || 0) + amount).toFixed(2)
  const newAmountDue = Math.max(0, currentDue - amount).toFixed(2)

  invoice.amount_paid = newAmountPaid
  invoice.amount_due = newAmountDue

  if (Number(newAmountDue) === 0) {
    invoice.status = 'paid'
  }

  const overdueState = computeInvoiceOverdue(invoice)
  invoice.is_overdue = overdueState.is_overdue
  invoice.days_overdue = overdueState.days_overdue
  invoice.allowed_actions = computeInvoiceAllowedActions(invoice)

  // Create new Payment object
  const newId = mockPayments.length > 0 ? Math.max(...mockPayments.map((p) => p.id)) + 1 : 1
  const newPayment = {
    id: newId,
    invoice_id: invoice.id,
    invoice_number: invoice.number,
    customer: {
      id: invoice.customer?.id,
      name: invoice.customer?.name,
    },
    method: data.method,
    amount: amount.toFixed(2),
    payment_date: data.payment_date || todayStr,
    reference: data.reference || null,
    note: data.note || null,
    recorded_by: user,
    created_at: new Date().toISOString(),
  }

  mockPayments.unshift(newPayment)

  if (!invoice.payments) {
    invoice.payments = []
  }
  invoice.payments.unshift(newPayment)

  const invoiceListItem = {
    id: invoice.id,
    number: invoice.number,
    status: invoice.status,
    is_overdue: invoice.is_overdue,
    days_overdue: invoice.days_overdue,
    customer: { id: invoice.customer.id, name: invoice.customer.name },
    subscription: { id: invoice.subscription?.id, number: invoice.subscription?.number },
    invoice_date: invoice.invoice_date,
    due_date: invoice.due_date,
    total: invoice.total,
    amount_paid: invoice.amount_paid,
    amount_due: invoice.amount_due,
    allowed_actions: invoice.allowed_actions,
  }

  return mockSuccessEnvelope(
    { payment: newPayment, invoice: invoiceListItem },
    null,
    'Payment recorded successfully'
  )
}

/**
 * PAY-03 Delete Payment (Admin only)
 * Reverses amounts; paid -> confirmed if due again > 0
 */
export function mockDeletePayment(id) {
  const paymentIndex = mockPayments.findIndex((p) => p.id === Number(id))
  if (paymentIndex === -1) {
    const error = new Error('Payment not found')
    error.response = { status: 404, data: { success: false, message: 'Payment not found', errors: null } }
    throw error
  }

  const payment = mockPayments[paymentIndex]
  const invoice = mockInvoices.find((inv) => inv.id === payment.invoice_id)

  if (invoice) {
    const amount = Number(payment.amount || 0)
    invoice.amount_paid = Math.max(0, Number(invoice.amount_paid || 0) - amount).toFixed(2)
    invoice.amount_due = (Number(invoice.amount_due || 0) + amount).toFixed(2)

    if (invoice.status === 'paid' && Number(invoice.amount_due) > 0) {
      invoice.status = 'confirmed'
    }

    const overdueState = computeInvoiceOverdue(invoice)
    invoice.is_overdue = overdueState.is_overdue
    invoice.days_overdue = overdueState.days_overdue
    invoice.allowed_actions = computeInvoiceAllowedActions(invoice)

    if (invoice.payments) {
      invoice.payments = invoice.payments.filter((p) => p.id !== Number(id))
    }
  }

  mockPayments.splice(paymentIndex, 1)

  return mockSuccessEnvelope(null, null, 'Payment deleted successfully')
}
