/**
 * Mock Reports Fixtures (RPT-01, RPT-02, RPT-03, PORTAL-01)
 * Source of truth: docs/PLAN.md (Section 6 & Module M7)
 */

import { mockSuccessEnvelope } from '@/api/mockable'

export const mockReportsSummary = {
  period: { date_from: '2026-10-01', date_to: '2026-10-31' },
  subscriptions: {
    total: 3000,
    active: 1800,
    paused: 40,
    by_status: {
      draft: 100,
      quotation: 60,
      confirmed: 40,
      active: 1800,
      closed: 1000,
    },
    new_in_period: 120,
    closed_in_period: 35,
  },
  mrr: '1250000.00',
  revenue: {
    invoiced_in_period: '900000.00',
    collected_in_period: '750000.00',
  },
  receivables: {
    outstanding_amount: '300000.00',
    outstanding_count: 210,
    overdue_amount: '90000.00',
    overdue_count: 55,
  },
  invoices_by_status: {
    draft: 40,
    confirmed: 210,
    paid: 2500,
    cancelled: 12,
  },
}

export const mockRevenueTrend = [
  { period: '2026-05', invoiced: '620000.00', collected: '580000.00' },
  { period: '2026-06', invoiced: '710000.00', collected: '670000.00' },
  { period: '2026-07', invoiced: '780000.00', collected: '740000.00' },
  { period: '2026-08', invoiced: '830000.00', collected: '790000.00' },
  { period: '2026-09', invoiced: '880000.00', collected: '820000.00' },
  { period: '2026-10', invoiced: '900000.00', collected: '750000.00' },
]

export const mockOverdueAging = {
  total_overdue: '90000.00',
  buckets: [
    { label: '1-30', count: 25, amount: '40000.00' },
    { label: '31-60', count: 15, amount: '25000.00' },
    { label: '61-90', count: 10, amount: '15000.00' },
    { label: '90+', count: 5, amount: '10000.00' },
  ],
}

export const mockPortalSummary = {
  active_subscriptions: 2,
  next_billing_date: '2026-11-01',
  outstanding_amount: '4364.82',
  overdue_count: 0,
  recent_invoices: [
    {
      id: 1,
      number: 'INV-000001',
      status: 'confirmed',
      is_overdue: false,
      days_overdue: 0,
      customer: { id: 1, name: 'Acme Corp' },
      subscription: { id: 1, number: 'SUB-000001' },
      invoice_date: '2026-10-01',
      due_date: '2026-11-01',
      total: '4364.82',
      amount_paid: '0.00',
      amount_due: '4364.82',
    },
    {
      id: 2,
      number: 'INV-000002',
      status: 'paid',
      is_overdue: false,
      days_overdue: 0,
      customer: { id: 1, name: 'Acme Corp' },
      subscription: { id: 1, number: 'SUB-000001' },
      invoice_date: '2026-09-01',
      due_date: '2026-10-01',
      total: '4364.82',
      amount_paid: '4364.82',
      amount_due: '0.00',
    },
    {
      id: 3,
      number: 'INV-000003',
      status: 'paid',
      is_overdue: false,
      days_overdue: 0,
      customer: { id: 1, name: 'Acme Corp' },
      subscription: { id: 1, number: 'SUB-000001' },
      invoice_date: '2026-08-01',
      due_date: '2026-09-01',
      total: '4364.82',
      amount_paid: '4364.82',
      amount_due: '0.00',
    },
  ],
}

export function mockGetReportsSummary(params = {}) {
  // If dates are provided, return summary with matching period
  return mockSuccessEnvelope({
    ...mockReportsSummary,
    period: {
      date_from: params.date_from || '2026-10-01',
      date_to: params.date_to || '2026-10-31',
    },
  })
}

export function mockGetRevenueTrend(_params = {}) {
  return mockSuccessEnvelope(mockRevenueTrend)
}

export function mockGetOverdueAging() {
  return mockSuccessEnvelope(mockOverdueAging)
}

export function mockGetPortalSummary() {
  return mockSuccessEnvelope(mockPortalSummary)
}

