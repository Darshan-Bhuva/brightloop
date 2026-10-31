/**
 * Mock Billing Engine Fixtures & Handlers
 * Source of truth: docs/PLAN.md (Section 4 BR-5, Module M5 BIL-01, BIL-02)
 */

import { mockSuccessEnvelope, mockPaginationMeta } from '@/api/mockable'
import { mockSubscriptions } from './subscriptions'
import { mockInvoices } from './invoices'

/**
 * Calculate next period end date based on billing period.
 */
function calculatePeriodEnd(startDateStr, billingPeriod, expiryDateStr) {
  const start = new Date(startDateStr)
  let end = new Date(start)

  switch (billingPeriod) {
    case 'daily':
      // same day
      break
    case 'weekly':
      end.setDate(end.getDate() + 6)
      break
    case 'yearly':
      end.setFullYear(end.getFullYear() + 1)
      end.setDate(end.getDate() - 1)
      break
    case 'monthly':
    default:
      end.setMonth(end.getMonth() + 1)
      end.setDate(end.getDate() - 1)
      break
  }

  const expiry = expiryDateStr ? new Date(expiryDateStr) : null
  if (expiry && end > expiry) {
    end = expiry
  }

  return end.toISOString().split('T')[0]
}

/**
 * Add days to date string.
 */
function addDays(dateStr, days) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

/**
 * BIL-01 Due list GET /billing/due (A,S)
 */
export function mockGetDueSubscriptions(params = {}) {
  const { as_of_date = new Date().toISOString().split('T')[0], page = 1, per_page = 15 } = params

  // Active, not paused, next_invoice_date <= as_of_date and <= expiry_date
  const due = mockSubscriptions.filter((sub) => {
    if (sub.status !== 'active') return false
    if (sub.is_paused) return false
    if (!sub.next_invoice_date) return false
    if (sub.next_invoice_date > as_of_date) return false
    if (sub.expiry_date && sub.next_invoice_date > sub.expiry_date) return false
    return true
  })

  const mapped = due.map((sub) => {
    // Estimate periods due
    const startDate = new Date(sub.next_invoice_date)
    const asOf = new Date(as_of_date)
    let periodsDue = 1

    if (sub.plan?.billing_period === 'monthly') {
      const months = (asOf.getFullYear() - startDate.getFullYear()) * 12 + (asOf.getMonth() - startDate.getMonth())
      periodsDue = Math.max(1, months + 1)
    }

    return {
      id: sub.id,
      number: sub.number,
      customer: {
        id: sub.customer?.id,
        name: sub.customer?.name,
      },
      plan: {
        id: sub.plan?.id,
        name: sub.plan?.name,
        billing_period: sub.plan?.billing_period,
      },
      next_invoice_date: sub.next_invoice_date,
      periods_due: periodsDue,
      estimated_total: sub.total || '0.00',
    }
  })

  const total = mapped.length
  const numPage = Number(page) || 1
  const numPerPage = Number(per_page) || 15
  const lastPage = Math.max(1, Math.ceil(total / numPerPage))
  const startIndex = (numPage - 1) * numPerPage
  const paginatedData = mapped.slice(startIndex, startIndex + numPerPage)

  return mockSuccessEnvelope(paginatedData, mockPaginationMeta(numPage, lastPage, numPerPage, total))
}

/**
 * BIL-02 Run billing POST /billing/run (A,S)
 */
export function mockRunBilling(data = {}) {
  const as_of_date = data.as_of_date || new Date().toISOString().split('T')[0]
  const targetIds = data.subscription_ids ? data.subscription_ids.map(Number) : null

  let autoClosed = 0
  let invoicesCreated = 0
  let skipped = 0
  let processed = 0
  const failures = []

  // 1. Auto-close expired subscriptions with plan.auto_close = true
  mockSubscriptions.forEach((sub) => {
    if (sub.status === 'active' && sub.expiry_date && sub.expiry_date < as_of_date && sub.plan?.auto_close) {
      sub.status = 'closed'
      sub.closed_at = new Date().toISOString()
      sub.close_reason = 'Expired'
      sub.next_invoice_date = null
      autoClosed++
    }
  })

  // 2. Find due subscriptions
  const due = mockSubscriptions.filter((sub) => {
    if (targetIds && !targetIds.includes(sub.id)) return false
    if (sub.status !== 'active') return false
    if (sub.is_paused) return false
    if (!sub.next_invoice_date) return false
    if (sub.next_invoice_date > as_of_date) return false
    if (sub.expiry_date && sub.next_invoice_date > sub.expiry_date) return false
    return true
  })

  due.forEach((sub) => {
    processed++
    try {
      let currentNextDate = sub.next_invoice_date
      const billingPeriod = sub.plan?.billing_period || 'monthly'

      while (currentNextDate <= as_of_date && (!sub.expiry_date || currentNextDate <= sub.expiry_date)) {
        const periodStart = currentNextDate
        const periodEnd = calculatePeriodEnd(periodStart, billingPeriod, sub.expiry_date)

        // Check if invoice already exists for (sub.id, periodStart)
        const alreadyExists = mockInvoices.some(
          (inv) => inv.subscription?.id === sub.id && inv.period_start === periodStart
        )

        if (alreadyExists) {
          skipped++
          currentNextDate = addDays(periodEnd, 1)
          continue
        }

        const newId = mockInvoices.length > 0 ? Math.max(...mockInvoices.map((i) => i.id)) + 1 : 1
        const invNumber = `INV-${String(newId).padStart(6, '0')}`
        const dueDays = sub.payment_term?.due_days || 0
        const dueDate = addDays(as_of_date, dueDays)

        // Copy subscription lines to invoice lines
        const invoiceLines = (sub.lines || []).map((line, idx) => ({
          id: (newId * 10) + idx + 1,
          product_id: line.product_id || null,
          description: line.description,
          quantity: line.quantity,
          unit_price: line.unit_price,
          discount_amount: '0.00',
          discount_name: null,
          tax_name: line.tax_name || 'GST 18%',
          tax_rate: line.tax_rate || '18.00',
          tax_amount: line.tax_amount || '0.00',
          line_total: line.total || (Number(line.quantity) * Number(line.unit_price)).toFixed(2),
        }))

        const totalAmount = sub.total || '0.00'

        const newInvoice = {
          id: newId,
          number: invNumber,
          status: 'draft',
          is_overdue: false,
          days_overdue: 0,
          customer: {
            id: sub.customer?.id,
            name: sub.customer?.name,
            email: sub.customer?.email || 'customer@brightloop.test',
            phone: sub.customer?.phone || null,
            company_name: sub.customer?.company_name || null,
            address_line: sub.customer?.address_line || 'Customer Address',
            city: sub.customer?.city || 'Bengaluru',
            state: sub.customer?.state || 'Karnataka',
            country: sub.customer?.country || 'India',
            postal_code: sub.customer?.postal_code || '560001',
          },
          subscription: {
            id: sub.id,
            number: sub.number,
          },
          payment_term: {
            id: sub.payment_term?.id || 1,
            name: sub.payment_term?.name || 'Immediate',
            due_days: dueDays,
          },
          invoice_date: as_of_date,
          due_date: dueDate,
          period_start: periodStart,
          period_end: periodEnd,
          subtotal: sub.subtotal || totalAmount,
          discount_total: '0.00',
          tax_total: sub.tax_total || '0.00',
          total: totalAmount,
          amount_paid: '0.00',
          amount_due: totalAmount,
          sent_at: null,
          notes: `Generated from recurring billing run on ${as_of_date}.`,
          lines: invoiceLines,
          payments: [],
          allowed_actions: ['edit', 'confirm', 'cancel'],
          created_at: new Date().toISOString(),
        }

        mockInvoices.unshift(newInvoice)
        invoicesCreated++

        // Advance to next invoice period
        currentNextDate = addDays(periodEnd, 1)
      }

      // Update subscription next_invoice_date
      if (sub.expiry_date && currentNextDate > sub.expiry_date) {
        sub.next_invoice_date = null
      } else {
        sub.next_invoice_date = currentNextDate
      }
    } catch (err) {
      failures.push({
        subscription_id: sub.id,
        number: sub.number,
        message: err.message || 'Billing calculation failed',
      })
    }
  })

  return mockSuccessEnvelope(
    {
      as_of_date,
      processed,
      invoices_created: invoicesCreated,
      skipped,
      failed: failures.length,
      auto_closed: autoClosed,
      failures,
    },
    null,
    `Billing run complete: ${invoicesCreated} invoices created.`
  )
}
