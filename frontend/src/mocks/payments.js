/**
 * Mock Payments Fixtures (PAY-01)
 * Source of truth: docs/PLAN.md (Section 6 Resource shapes)
 */

import { mockSuccessEnvelope, mockPaginationMeta } from '@/api/mockable'

export const mockPayments = [
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
  {
    id: 2,
    invoice_id: 3,
    invoice_number: 'INV-000003',
    customer: { id: 3, name: 'Starlight Media' },
    method: 'upi',
    amount: '5426.82',
    payment_date: '2026-10-01',
    reference: 'UPI-9821734612',
    note: 'Instant settlement for October',
    recorded_by: { id: 1, name: 'Admin User' },
    created_at: '2026-10-01T10:15:00Z',
  },
  {
    id: 3,
    invoice_id: 1,
    invoice_number: 'INV-000001',
    customer: { id: 1, name: 'Acme Corporation' },
    method: 'card',
    amount: '4364.82',
    payment_date: '2026-09-01',
    reference: 'TXN-4920193',
    note: 'Auto-charged corporate card',
    recorded_by: { id: 2, name: 'Staff User' },
    created_at: '2026-09-01T09:00:00Z',
  },
]

export function mockGetPayments(params = {}) {
  let list = [...mockPayments]

  if (params.customer_id) {
    list = list.filter((p) => p.customer?.id === Number(params.customer_id))
  }
  if (params.invoice_id) {
    list = list.filter((p) => p.invoice_id === Number(params.invoice_id))
  }
  if (params.method) {
    list = list.filter((p) => p.method === params.method)
  }
  if (params.search) {
    const q = params.search.toLowerCase()
    list = list.filter(
      (p) =>
        p.invoice_number.toLowerCase().includes(q) ||
        p.customer?.name.toLowerCase().includes(q) ||
        (p.reference && p.reference.toLowerCase().includes(q))
    )
  }

  const page = Number(params.page) || 1
  const perPage = Number(params.per_page) || 15
  const total = list.length
  const paginated = list.slice((page - 1) * perPage, page * perPage)

  return mockSuccessEnvelope(
    paginated,
    mockPaginationMeta(page, Math.ceil(total / perPage) || 1, perPage, total)
  )
}
