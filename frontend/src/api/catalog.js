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
  getMockPlans,
  getMockPlan,
  createMockPlan,
  updateMockPlan,
  deleteMockPlan,
  getMockDiscounts,
  getMockDiscount,
  createMockDiscount,
  updateMockDiscount,
  deleteMockDiscount,
  mockTaxes,
  mockPaymentTerms,
} from '@/mocks/catalog';

// ============================================================================
// TAXES (TAX-01 .. TAX-04)
// ============================================================================

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

export async function createTax(data) {
  return mockable(
    () => apiClient.post('/taxes', data),
    () => createMockTax(data)
  );
}

export async function updateTax(id, data) {
  return mockable(
    () => apiClient.put(`/taxes/${id}`, data),
    () => updateMockTax(id, data)
  );
}

export async function deleteTax(id) {
  return mockable(
    () => apiClient.delete(`/taxes/${id}`),
    () => deleteMockTax(id)
  );
}

// ============================================================================
// PAYMENT TERMS (TRM-01 .. TRM-04)
// ============================================================================

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

export async function createPaymentTerm(data) {
  return mockable(
    () => apiClient.post('/payment-terms', data),
    () => createMockPaymentTerm(data)
  );
}

export async function updatePaymentTerm(id, data) {
  return mockable(
    () => apiClient.put(`/payment-terms/${id}`, data),
    () => updateMockPaymentTerm(id, data)
  );
}

export async function deletePaymentTerm(id) {
  return mockable(
    () => apiClient.delete(`/payment-terms/${id}`),
    () => deleteMockPaymentTerm(id)
  );
}

// ============================================================================
// PRODUCTS (PRD-01 .. PRD-05)
// ============================================================================

export async function getProducts(params = {}) {
  return mockable(
    async () => {
      try {
        return await apiClient.get('/products', { params });
      } catch (err) {
        if (err.response?.status === 404 || err.code === 'ERR_NETWORK') {
          return getMockProducts(params);
        }
        throw err;
      }
    },
    () => getMockProducts(params)
  );
}

export async function getProduct(id) {
  return mockable(
    async () => {
      try {
        return await apiClient.get(`/products/${id}`);
      } catch (err) {
        if (err.response?.status === 404 || err.code === 'ERR_NETWORK') {
          return getMockProduct(id);
        }
        throw err;
      }
    },
    () => getMockProduct(id)
  );
}

export async function createProduct(data) {
  return mockable(
    () => apiClient.post('/products', data),
    () => createMockProduct(data)
  );
}

export async function updateProduct(id, data) {
  return mockable(
    () => apiClient.put(`/products/${id}`, data),
    () => updateMockProduct(id, data)
  );
}

export async function deleteProduct(id) {
  return mockable(
    () => apiClient.delete(`/products/${id}`),
    () => deleteMockProduct(id)
  );
}

// ============================================================================
// PLANS (PLN-01 .. PLN-05)
// ============================================================================

export async function getPlans(params = {}) {
  return mockable(
    async () => {
      try {
        return await apiClient.get('/plans', { params });
      } catch (err) {
        if (err.response?.status === 404 || err.code === 'ERR_NETWORK') {
          return getMockPlans(params);
        }
        throw err;
      }
    },
    () => getMockPlans(params)
  );
}

export async function getPlan(id) {
  return mockable(
    async () => {
      try {
        return await apiClient.get(`/plans/${id}`);
      } catch (err) {
        if (err.response?.status === 404 || err.code === 'ERR_NETWORK') {
          return getMockPlan(id);
        }
        throw err;
      }
    },
    () => getMockPlan(id)
  );
}

export async function createPlan(data) {
  return mockable(
    () => apiClient.post('/plans', data),
    () => createMockPlan(data)
  );
}

export async function updatePlan(id, data) {
  return mockable(
    () => apiClient.put(`/plans/${id}`, data),
    () => updateMockPlan(id, data)
  );
}

export async function deletePlan(id) {
  return mockable(
    () => apiClient.delete(`/plans/${id}`),
    () => deleteMockPlan(id)
  );
}

// ============================================================================
// DISCOUNTS (DSC-01 .. DSC-05)
// ============================================================================

export async function getDiscounts(params = {}) {
  return mockable(
    async () => {
      try {
        return await apiClient.get('/discounts', { params });
      } catch (err) {
        if (err.response?.status === 404 || err.code === 'ERR_NETWORK') {
          return getMockDiscounts(params);
        }
        throw err;
      }
    },
    () => getMockDiscounts(params)
  );
}

export async function getDiscount(id) {
  return mockable(
    async () => {
      try {
        return await apiClient.get(`/discounts/${id}`);
      } catch (err) {
        if (err.response?.status === 404 || err.code === 'ERR_NETWORK') {
          return getMockDiscount(id);
        }
        throw err;
      }
    },
    () => getMockDiscount(id)
  );
}

export async function createDiscount(data) {
  return mockable(
    () => apiClient.post('/discounts', data),
    () => createMockDiscount(data)
  );
}

export async function updateDiscount(id, data) {
  return mockable(
    () => apiClient.put(`/discounts/${id}`, data),
    () => updateMockDiscount(id, data)
  );
}

export async function deleteDiscount(id) {
  return mockable(
    () => apiClient.delete(`/discounts/${id}`),
    () => deleteMockDiscount(id)
  );
}
