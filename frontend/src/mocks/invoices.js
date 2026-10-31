/**
 * Mock Invoices Fixtures (INV-01, INV-02)
 * Source of truth: docs/PLAN.md (Section 4 BR-8, BR-9, Section 6 Resource shapes)
 */

import { mockSuccessEnvelope, mockPaginationMeta } from '@/api/mockable'

export let mockInvoices = [
  {
    id: 1,
    number: 'INV-000001',
    status: 'confirmed',
    is_overdue: true,
    days_overdue: 14,
    customer: {
      id: 1,
      name: 'Acme Corporation',
      email: 'billing@acme.test',
      phone: '+91 98765 00001',
      company_name: 'Acme Corp',
      address_line: 'Plot 42, Tech Zone',
      city: 'Ahmedabad',
      state: 'Gujarat',
      country: 'India',
      postal_code: '380015',
    },
    subscription: { id: 1, number: 'SUB-000001' },
    payment_term: { id: 1, name: 'Immediate', due_days: 0 },
    invoice_date: '2026-10-15',
    due_date: '2026-10-15',
    period_start: '2026-10-15',
    period_end: '2026-11-14',
    subtotal: '3699.00',
    discount_total: '0.00',
    tax_total: '665.82',
    total: '4364.82',
    amount_paid: '0.00',
    amount_due: '4364.82',
    sent_at: '2026-10-15T10:00:00Z',
    notes: 'October billing cycle',
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
    payments: [],
    allowed_actions: ['send', 'record_payment', 'print', 'cancel'],
    created_at: '2026-10-15T09:00:00Z',
  },
  {
    id: 2,
    number: 'INV-000002',
    status: 'confirmed',
    is_overdue: true,
    days_overdue: 22,
    customer: {
      id: 2,
      name: 'TechLabs India',
      email: 'accounts@techlabs.test',
      phone: '+91 98765 00002',
      company_name: 'TechLabs Pvt Ltd',
      address_line: 'Block B, Cyber City',
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
      postal_code: '560001',
    },
    subscription: { id: 2, number: 'SUB-000002' },
    payment_term: { id: 3, name: 'Net 30', due_days: 30 },
    invoice_date: '2026-09-08',
    due_date: '2026-10-08',
    period_start: '2026-09-08',
    period_end: '2027-09-07',
    subtotal: '32799.00',
    discount_total: '500.00',
    tax_total: '5813.82',
    total: '38112.82',
    amount_paid: '10000.00',
    amount_due: '28112.82',
    sent_at: '2026-09-08T11:00:00Z',
    notes: 'Annual renewal for TechLabs team',
    lines: [
      {
        id: 4,
        product_id: null,
        description: 'Plan: Yearly Business (yearly)',
        quantity: 1,
        unit_price: '9999.00',
        discount_amount: '152.42',
        discount_name: 'Loyalty 500 Off',
        tax_name: 'GST 18%',
        tax_rate: '18.00',
        tax_amount: '1772.38',
        line_total: '11618.96',
      },
    ],
    payments: [
      {
        id: 1,
        invoice_id: 2,
        invoice_number: 'INV-000002',
        customer: { id: 2, name: 'TechLabs India' },
        method: 'bank_transfer',
        amount: '10000.00',
        payment_date: '2026-09-15',
        reference: 'NEFT-8839201',
        note: 'First installment payment',
        recorded_by: { id: 1, name: 'Admin User' },
        created_at: '2026-09-15T14:30:00Z',
      },
    ],
    allowed_actions: ['send', 'record_payment', 'print'],
    created_at: '2026-09-08T10:00:00Z',
  },
  {
    id: 3,
    number: 'INV-000003',
    status: 'paid',
    is_overdue: false,
    days_overdue: 0,
    customer: {
      id: 3,
      name: 'Starlight Media',
      email: 'finance@starlight.test',
      phone: '+91 98765 00003',
      company_name: 'Starlight Media House',
    },
    subscription: { id: 3, number: 'SUB-000003' },
    payment_term: { id: 1, name: 'Immediate', due_days: 0 },
    invoice_date: '2026-10-01',
    due_date: '2026-10-01',
    period_start: '2026-10-01',
    period_end: '2026-10-31',
    subtotal: '4599.00',
    discount_total: '0.00',
    tax_total: '827.82',
    total: '5426.82',
    amount_paid: '5426.82',
    amount_due: '0.00',
    sent_at: '2026-10-01T10:00:00Z',
    notes: 'Paid via UPI',
    lines: [],
    payments: [],
    allowed_actions: ['send', 'print'],
    created_at: '2026-10-01T08:00:00Z',
  },
  {
    id: 4,
    number: 'INV-000004',
    status: 'draft',
    is_overdue: false,
    days_overdue: 0,
    customer: {
      id: 4,
      name: 'Zenith Logistics',
      email: 'support@zenith.test',
    },
    subscription: { id: 4, number: 'SUB-000004' },
    payment_term: { id: 2, name: 'Net 15', due_days: 15 },
    invoice_date: '2026-10-25',
    due_date: '2026-11-09',
    period_start: '2026-10-25',
    period_end: '2026-11-24',
    subtotal: '3399.00',
    discount_total: '0.00',
    tax_total: '611.82',
    total: '4010.82',
    amount_paid: '0.00',
    amount_due: '4010.82',
    sent_at: null,
    notes: 'Draft awaiting confirmation',
    lines: [],
    payments: [],
    allowed_actions: ['edit', 'confirm', 'cancel'],
    created_at: '2026-10-25T11:00:00Z',
  },
  {
    id: 5,
    number: 'INV-000005',
    status: 'confirmed',
    is_overdue: true,
    days_overdue: 5,
    customer: {
      id: 5,
      name: 'BluePeak Solutions',
      email: 'contact@bluepeak.test',
    },
    subscription: { id: 5, number: 'SUB-000005' },
    payment_term: { id: 1, name: 'Immediate', due_days: 0 },
    invoice_date: '2026-10-25',
    due_date: '2026-10-25',
    period_start: '2026-10-25',
    period_end: '2026-11-01',
    subtotal: '999.00',
    discount_total: '0.00',
    tax_total: '179.82',
    total: '1178.82',
    amount_paid: '0.00',
    amount_due: '1178.82',
    sent_at: '2026-10-25T10:00:00Z',
    notes: 'Weekly trial invoice',
    lines: [],
    payments: [],
    allowed_actions: ['send', 'record_payment', 'print', 'cancel'],
    created_at: '2026-10-25T09:30:00Z',
  },
]

export function mockGetInvoices(params = {}, userRole = 'admin') {
  let list = [...mockInvoices]

  // Customer role never sees draft invoices (BR-8 / PLAN.md line 177)
  if (userRole === 'customer') {
    list = list.filter((inv) => inv.status !== 'draft')
  }

  if (params.status && params.status !== 'all') {
    list = list.filter((inv) => inv.status === params.status)
  }

  if (params.customer_id) {
    list = list.filter((inv) => inv.customer?.id === Number(params.customer_id))
  }

  if (params.subscription_id) {
    list = list.filter((inv) => inv.subscription?.id === Number(params.subscription_id))
  }

  if (params.overdue === true || params.overdue === 'true') {
    list = list.filter((inv) => inv.is_overdue)
  }

  if (params.search) {
    const q = params.search.toLowerCase()
    list = list.filter(
      (inv) =>
        inv.number.toLowerCase().includes(q) ||
        inv.customer?.name.toLowerCase().includes(q)
    )
  }

  // Sort
  const sort = params.sort || 'invoice_date'
  const direction = params.direction || 'desc'
  list.sort((a, b) => {
    let aVal = a[sort]
    let bVal = b[sort]
    if (sort === 'total' || sort === 'amount_due') {
      aVal = parseFloat(a[sort])
      bVal = parseFloat(b[sort])
    }
    if (aVal < bVal) return direction === 'asc' ? -1 : 1
    if (aVal > bVal) return direction === 'asc' ? 1 : -1
    return 0
  })

  // Format as InvoiceListItem[] (Section 6)
  const items = list.map((inv) => ({
    id: inv.id,
    number: inv.number,
    status: inv.status,
    is_overdue: inv.is_overdue,
    days_overdue: inv.days_overdue,
    customer: { id: inv.customer.id, name: inv.customer.name },
    subscription: { id: inv.subscription.id, number: inv.subscription.number },
    invoice_date: inv.invoice_date,
    due_date: inv.due_date,
    total: inv.total,
    amount_paid: inv.amount_paid,
    amount_due: inv.amount_due,
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

export function mockGetInvoice(id, userRole = 'admin') {
  const inv = mockInvoices.find((i) => i.id === Number(id))
  if (!inv) {
    throw { response: { status: 404, data: { success: false, message: 'Invoice not found' } } }
  }

  // Customer role restriction
  if (userRole === 'customer') {
    if (inv.status === 'draft') {
      throw { response: { status: 404, data: { success: false, message: 'Invoice not found' } } }
    }
    return mockSuccessEnvelope({
      ...inv,
      allowed_actions: ['print'],
    })
  }

  return mockSuccessEnvelope(inv)
}
