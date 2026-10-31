import apiClient from './client'
import { mockable } from './mockable'
import {
  mockGetReportsSummary,
  mockGetRevenueTrend,
  mockGetOverdueAging,
} from '@/mocks/reports'

/**
 * RPT-01 Summary (Admin, Staff)
 * @param {object} [params] - { date_from, date_to }
 * @returns {Promise<{ success: boolean, message: string, data: object }>}
 */
export async function getReportsSummary(params = {}) {
  return mockable(
    async () => {
      try {
        return await apiClient.get('/reports/summary', { params })
      } catch (err) {
        if (err.response?.status === 404 || err.code === 'ERR_NETWORK') {
          return mockGetReportsSummary(params)
        }
        throw err
      }
    },
    () => mockGetReportsSummary(params)
  )
}

/**
 * RPT-02 Revenue Trend (Admin, Staff)
 * @param {object} [params] - { date_from, date_to, interval: 'day'|'week'|'month' }
 * @returns {Promise<{ success: boolean, message: string, data: object[] }>}
 */
export async function getRevenueTrend(params = {}) {
  return mockable(
    async () => {
      try {
        return await apiClient.get('/reports/revenue-trend', { params })
      } catch (err) {
        if (err.response?.status === 404 || err.code === 'ERR_NETWORK') {
          return mockGetRevenueTrend(params)
        }
        throw err
      }
    },
    () => mockGetRevenueTrend(params)
  )
}

/**
 * RPT-03 Overdue Aging (Admin, Staff - P1)
 * @returns {Promise<{ success: boolean, message: string, data: object }>}
 */
export async function getOverdueAging() {
  return mockable(
    async () => {
      try {
        return await apiClient.get('/reports/overdue-aging')
      } catch (err) {
        if (err.response?.status === 404 || err.code === 'ERR_NETWORK') {
          return mockGetOverdueAging()
        }
        throw err
      }
    },
    () => mockGetOverdueAging()
  )
}
