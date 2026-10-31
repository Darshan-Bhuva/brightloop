import apiClient from './client';
import { mockable, mockSuccessEnvelope } from './mockable';
import {
  getMockTaxes,
  createMockTax,
  updateMockTax,
  deleteMockTax,
  getMockPaymentTerms,
  createMockPaymentTerm,
  updateMockPaymentTerm,
  deleteMockPaymentTerm,
  getMockProducts,
  getMockProduct,
  createMockProduct,
  updateMockProduct,
  deleteMockProduct,
  mockPlans,
  mockDiscounts,
  mockTaxes,
  mockPaymentTerms,
  mockProducts,
} from '@/mocks/catalog';

// ============================================================================
// TAXES (TAX-01 .. TAX-04)
// ============================================================================

/**
 * TAX-01 List taxes (Admin, Staff)
 * @param {object} [params] - { is_active, search, all }
 */
export async function getTaxes(params = {}) {
  return mockable(
    async () => {
      try {
        return await apiClient.get('/taxes', { params });
      } catch (err) {
        if (err.response?.status === 404 || err.code === 'ERR_NETWORK') {
          return mockSuccessEnvelope(mockTaxes);
        }
        throw err;
      }
    },
    () => getMockTaxes(params)
  );
}

/**
 * TAX-02 Create tax (Admin only)
 * @param {{ name: string, type: 'percentage'|'fixed', rate: number|string, is_active?: boolean }} data
 */
export async function createTax(data) {
  return mockable(
    () => apiClient.post('/taxes', data),
    () => createMockTax(data)
  );
}

/**
 * TAX-03 Update tax (Admin only)
 * @param {number|string} id
 * @param {{ name?: string, type?: 'percentage'|'fixed', rate?: number|string, is_active?: boolean }} data
 */
export async function updateTax(id, data) {
  return mockable(
    () => apiClient.put(`/taxes/${id}`, data),
    () => updateMockTax(id, data)
  );
}

/**
 * TAX-04 Delete tax (Admin only)
 * @param {number|string} id
 */
export async function deleteTax(id) {
  return mockable(
    () => apiClient.delete(`/taxes/${id}`),
    () => deleteMockTax(id)
  );
}

// ============================================================================
// PAYMENT TERMS (PT-01 .. PT-04)
// ============================================================================

/**
 * PT-01 List payment terms (Admin, Staff)
 * @param {object} [params] - { all, search }
 */
export async function getPaymentTerms(params = {}) {
  return mockable(
    async () => {
      try {
        return await apiClient.get('/payment-terms', { params });
      } catch (err) {
        if (err.response?.status === 404 || err.code === 'ERR_NETWORK') {
          return mockSuccessEnvelope(mockPaymentTerms);
        }
        throw err;
      }
    },
    () => getMockPaymentTerms(params)
  );
}

/**
 * PT-02 Create payment term (Admin only)
 * @param {{ name: string, due_days: number }} data
 */
export async function createPaymentTerm(data) {
  return mockable(
    () => apiClient.post('/payment-terms', data),
    () => createMockPaymentTerm(data)
  );
}

/**
 * PT-03 Update payment term (Admin only)
 * @param {number|string} id
 * @param {{ name?: string, due_days?: number }} data
 */
export async function updatePaymentTerm(id, data) {
  return mockable(
    () => apiClient.put(`/payment-terms/${id}`, data),
    () => updateMockPaymentTerm(id, data)
  );
}

/**
 * PT-04 Delete payment term (Admin only)
 * @param {number|string} id
 */
export async function deletePaymentTerm(id) {
  return mockable(
    () => apiClient.delete(`/payment-terms/${id}`),
    () => deleteMockPaymentTerm(id)
  );
}

// ============================================================================
// PRODUCTS & VARIANTS (PRD-01 .. PRD-05)
// ============================================================================

/**
 * PRD-01 List products (Admin, Staff)
 * @param {object} [params] - { type, is_active, search, sort, direction, page, per_page, all }
 */
export async function getProducts(params = {}) {
  return mockable(
    async () => {
      try {
        return await apiClient.get('/products', { params });
      } catch (err) {
        if (err.response?.status === 404 || err.code === 'ERR_NETWORK') {
          return mockSuccessEnvelope(mockProducts);
        }
        throw err;
      }
    },
    () => getMockProducts(params)
  );
}

/**
 * PRD-03 Show product (Admin, Staff)
 * @param {number|string} id
 */
export async function getProduct(id) {
  return mockable(
    () => apiClient.get(`/products/${id}`),
    () => getMockProduct(id)
  );
}

/**
 * PRD-02 Create product (Admin only)
 * @param {{ name: string, type: 'service'|'goods', sales_price: number|string, cost_price: number|string, tax_id?: number|null, notes?: string, is_active?: boolean, variants?: Array<{ attribute: string, value: string, extra_price?: number|string }> }} data
 */
export async function createProduct(data) {
  return mockable(
    () => apiClient.post('/products', data),
    () => createMockProduct(data)
  );
}

/**
 * PRD-04 Update product (Admin only)
 * @param {number|string} id
 * @param {object} data
 */
export async function updateProduct(id, data) {
  return mockable(
    () => apiClient.put(`/products/${id}`, data),
    () => updateMockProduct(id, data)
  );
}

/**
 * PRD-05 Delete product (Admin only)
 * @param {number|string} id
 */
export async function deleteProduct(id) {
  return mockable(
    () => apiClient.delete(`/products/${id}`),
    () => deleteMockProduct(id)
  );
}

// ============================================================================
// PLANS (PLN-01) - for quotation & subscription selection
// ============================================================================

/**
 * Fetch plans list (supports all=1)
 */
export async function getPlans(params = {}) {
  return mockable(
    async () => {
      try {
        return await apiClient.get('/plans', { params });
      } catch (err) {
        if (err.response?.status === 404 || err.code === 'ERR_NETWORK') {
          return mockSuccessEnvelope(mockPlans);
        }
        throw err;
      }
    },
    () => mockSuccessEnvelope(mockPlans)
  );
}

// ============================================================================
// DISCOUNTS (DSC-01) - for subscription discounts selection
// ============================================================================

/**
 * Fetch discounts list (supports all=1)
 */
export async function getDiscounts(params = {}) {
  return mockable(
    async () => {
      try {
        return await apiClient.get('/discounts', { params });
      } catch (err) {
        if (err.response?.status === 404 || err.code === 'ERR_NETWORK') {
          return mockSuccessEnvelope(mockDiscounts);
        }
        throw err;
      }
    },
    () => mockSuccessEnvelope(mockDiscounts)
  );
}
