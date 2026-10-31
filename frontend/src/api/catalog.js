import apiClient from './client'
import { mockable, mockSuccessEnvelope } from './mockable'
import {
  mockPlans,
  mockProducts,
  mockPaymentTerms,
  mockTaxes,
  mockDiscounts,
} from '@/mocks/catalog'

/**
 * Fetch plans list (supports all=1)
 */
export async function getPlans(params = {}) {
  return mockable(
    async () => {
      try {
        return await apiClient.get('/plans', { params })
      } catch (err) {
        if (err.response?.status === 404 || err.code === 'ERR_NETWORK') {
          return mockSuccessEnvelope(mockPlans)
        }
        throw err
      }
    },
    () => mockSuccessEnvelope(mockPlans)
  )
}

/**
 * Fetch products list (supports all=1)
 */
export async function getProducts(params = {}) {
  return mockable(
    async () => {
      try {
        return await apiClient.get('/products', { params })
      } catch (err) {
        if (err.response?.status === 404 || err.code === 'ERR_NETWORK') {
          return mockSuccessEnvelope(mockProducts)
        }
        throw err
      }
    },
    () => mockSuccessEnvelope(mockProducts)
  )
}

/**
 * Fetch payment terms list (supports all=1)
 */
export async function getPaymentTerms(params = {}) {
  return mockable(
    async () => {
      try {
        return await apiClient.get('/payment-terms', { params })
      } catch (err) {
        if (err.response?.status === 404 || err.code === 'ERR_NETWORK') {
          return mockSuccessEnvelope(mockPaymentTerms)
        }
        throw err
      }
    },
    () => mockSuccessEnvelope(mockPaymentTerms)
  )
}

/**
 * Fetch taxes list (supports all=1)
 */
export async function getTaxes(params = {}) {
  return mockable(
    async () => {
      try {
        return await apiClient.get('/taxes', { params })
      } catch (err) {
        if (err.response?.status === 404 || err.code === 'ERR_NETWORK') {
          return mockSuccessEnvelope(mockTaxes)
        }
        throw err
      }
    },
    () => mockSuccessEnvelope(mockTaxes)
  )
}

/**
 * Fetch discounts list (supports all=1)
 */
export async function getDiscounts(params = {}) {
  return mockable(
    async () => {
      try {
        return await apiClient.get('/discounts', { params })
      } catch (err) {
        if (err.response?.status === 404 || err.code === 'ERR_NETWORK') {
          return mockSuccessEnvelope(mockDiscounts)
        }
        throw err
      }
    },
    () => mockSuccessEnvelope(mockDiscounts)
  )
}

