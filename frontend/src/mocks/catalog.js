/**
 * Catalog Mock Fixtures conforming to docs/PLAN.md Section 5 Seed Data & Section 6 Resource Shapes
 */

import { mockSuccessEnvelope, mockPaginationMeta } from '../api/mockable';

export let mockTaxes = [
  { id: 1, name: 'GST 5%', type: 'percentage', rate: '5.00', is_active: true },
  { id: 2, name: 'GST 12%', type: 'percentage', rate: '12.00', is_active: true },
  { id: 3, name: 'GST 18%', type: 'percentage', rate: '18.00', is_active: true },
  { id: 4, name: 'No Tax', type: 'fixed', rate: '0.00', is_active: true },
];

export let mockPaymentTerms = [
  { id: 1, name: 'Immediate', due_days: 0 },
  { id: 2, name: 'Net 15', due_days: 15 },
  { id: 3, name: 'Net 30', due_days: 30 },
  { id: 4, name: 'Net 45', due_days: 45 },
];

export let mockProducts = [
  {
    id: 1,
    name: 'Brightloop Business Suite',
    type: 'service',
    sales_price: '4000.00',
    cost_price: '1500.00',
    tax_id: 3,
    tax: { id: 3, name: 'GST 18%', type: 'percentage', rate: '18.00' },
    notes: 'Complete enterprise operations and ERP suite.',
    is_active: true,
    variants: [
      { id: 1, attribute: 'Brand', value: 'Odoo', extra_price: '560.00' },
      { id: 2, attribute: 'Brand', value: 'Zoho', extra_price: '300.00' },
      { id: 3, attribute: 'Brand', value: 'Custom', extra_price: '0.00' },
    ],
    created_at: '2026-08-01T10:00:00Z',
  },
  {
    id: 2,
    name: 'Brightloop CRM Seat',
    type: 'service',
    sales_price: '1200.00',
    cost_price: '400.00',
    tax_id: 3,
    tax: { id: 3, name: 'GST 18%', type: 'percentage', rate: '18.00' },
    notes: 'Per-seat license for CRM workspace.',
    is_active: true,
    variants: [],
    created_at: '2026-08-05T10:00:00Z',
  },
  {
    id: 3,
    name: 'Extra Storage 100GB',
    type: 'service',
    sales_price: '300.00',
    cost_price: '100.00',
    tax_id: 3,
    tax: { id: 3, name: 'GST 18%', type: 'percentage', rate: '18.00' },
    notes: 'Cloud block storage expansion pack.',
    is_active: true,
    variants: [],
    created_at: '2026-08-10T10:00:00Z',
  },
  {
    id: 4,
    name: 'Priority Support',
    type: 'service',
    sales_price: '800.00',
    cost_price: '300.00',
    tax_id: 3,
    tax: { id: 3, name: 'GST 18%', type: 'percentage', rate: '18.00' },
    notes: '24/7 dedicated engineering SLA.',
    is_active: true,
    variants: [],
    created_at: '2026-08-15T10:00:00Z',
  },
  {
    id: 5,
    name: 'Onboarding Kit',
    type: 'goods',
    sales_price: '2500.00',
    cost_price: '1200.00',
    tax_id: 2,
    tax: { id: 2, name: 'GST 12%', type: 'percentage', rate: '12.00' },
    notes: 'Hardware security keys and welcome pack.',
    is_active: true,
    variants: [],
    created_at: '2026-08-20T10:00:00Z',
  },
];

export let mockPlans = [
  {
    id: 1,
    name: 'Monthly Starter',
    price: '999.00',
    billing_period: 'monthly',
    min_quantity: 1,
    start_date: '2026-01-01',
    end_date: null,
    tax_id: 3,
    tax: { id: 3, name: 'GST 18%', rate: '18.00' },
    auto_close: false,
    closable: true,
    pausable: true,
    renewable: true,
    is_active: true,
    is_available: true,
  },
  {
    id: 2,
    name: 'Yearly Business',
    price: '9999.00',
    billing_period: 'yearly',
    min_quantity: 5,
    start_date: '2026-01-01',
    end_date: null,
    tax_id: 3,
    tax: { id: 3, name: 'GST 18%', rate: '18.00' },
    auto_close: true,
    closable: false,
    pausable: false,
    renewable: true,
    is_active: true,
    is_available: true,
  },
  {
    id: 3,
    name: 'Weekly Trial',
    price: '199.00',
    billing_period: 'weekly',
    min_quantity: 1,
    start_date: '2026-01-01',
    end_date: null,
    tax_id: 3,
    tax: { id: 3, name: 'GST 18%', rate: '18.00' },
    auto_close: true,
    closable: true,
    pausable: false,
    renewable: false,
    is_active: true,
    is_available: true,
  },
  {
    id: 4,
    name: 'Daily Pass',
    price: '49.00',
    billing_period: 'daily',
    min_quantity: 1,
    start_date: '2026-01-01',
    end_date: null,
    tax_id: 3,
    tax: { id: 3, name: 'GST 18%', rate: '18.00' },
    auto_close: false,
    closable: true,
    pausable: false,
    renewable: false,
    is_active: true,
    is_available: true,
  },
];

export let mockDiscounts = [
  {
    id: 1,
    name: 'Volume 10%',
    code: 'VOL10',
    type: 'percentage',
    value: '10.00',
    applies_to: 'products',
    product_ids: [2],
    products: [{ id: 2, name: 'Brightloop CRM Seat' }],
    min_purchase: null,
    min_quantity: 10,
    start_date: '2026-09-01',
    end_date: '2027-04-30',
    usage_limit: null,
    used_count: 0,
    remaining_uses: null,
    state: 'active',
    is_active: true,
  },
  {
    id: 2,
    name: 'Loyalty 500 Off',
    code: 'LOYAL500',
    type: 'fixed',
    value: '500.00',
    applies_to: 'subscription',
    product_ids: [],
    products: [],
    min_purchase: '5000.00',
    min_quantity: null,
    start_date: '2026-01-01',
    end_date: '2027-12-31',
    usage_limit: 5,
    used_count: 0,
    remaining_uses: 5,
    state: 'active',
    is_active: true,
  },
  {
    id: 3,
    name: 'Expired Promo',
    code: 'EXPIRED20',
    type: 'percentage',
    value: '20.00',
    applies_to: 'subscription',
    product_ids: [],
    products: [],
    min_purchase: null,
    min_quantity: null,
    start_date: '2026-01-01',
    end_date: '2026-10-20',
    usage_limit: null,
    used_count: 10,
    remaining_uses: 0,
    state: 'expired',
    is_active: false,
  },
];

// --- Mock Handlers ---

export function getMockTaxes(params = {}) {
  let list = [...mockTaxes];
  if (params.search) {
    const q = params.search.toLowerCase();
    list = list.filter((t) => t.name.toLowerCase().includes(q));
  }
  if (params.is_active !== undefined && params.is_active !== '') {
    const active = String(params.is_active) === 'true';
    list = list.filter((t) => t.is_active === active);
  }
  return mockSuccessEnvelope(list, null);
}

export function createMockTax(data) {
  const newTax = {
    id: Date.now(),
    name: data.name,
    type: data.type,
    rate: Number(data.rate).toFixed(2),
    is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
  };
  mockTaxes.push(newTax);
  return mockSuccessEnvelope(newTax, null, 'Tax created successfully');
}

export function updateMockTax(id, data) {
  const numId = Number(id);
  const idx = mockTaxes.findIndex((t) => t.id === numId);
  if (idx === -1) {
    throw { response: { status: 404, data: { success: false, message: 'Tax not found' } } };
  }
  mockTaxes[idx] = {
    ...mockTaxes[idx],
    ...data,
    rate: data.rate !== undefined ? Number(data.rate).toFixed(2) : mockTaxes[idx].rate,
  };
  return mockSuccessEnvelope(mockTaxes[idx], null, 'Tax updated successfully');
}

export function deleteMockTax(id) {
  const numId = Number(id);
  // Business rule BR-7: 409 if in use
  const inUse = mockProducts.some((p) => p.tax_id === numId);
  if (inUse) {
    throw {
      response: {
        status: 409,
        data: { success: false, message: 'Tax is in use; deactivate it instead' },
      },
    };
  }
  mockTaxes = mockTaxes.filter((t) => t.id !== numId);
  return mockSuccessEnvelope(null, null, 'Tax deleted successfully');
}

export function getMockPaymentTerms(params = {}) {
  let list = [...mockPaymentTerms];
  if (params.search) {
    const q = params.search.toLowerCase();
    list = list.filter((pt) => pt.name.toLowerCase().includes(q));
  }
  return mockSuccessEnvelope(list, null);
}

export function createMockPaymentTerm(data) {
  const newPt = {
    id: Date.now(),
    name: data.name,
    due_days: Number(data.due_days),
  };
  mockPaymentTerms.push(newPt);
  return mockSuccessEnvelope(newPt, null, 'Payment term created successfully');
}

export function updateMockPaymentTerm(id, data) {
  const numId = Number(id);
  const idx = mockPaymentTerms.findIndex((pt) => pt.id === numId);
  if (idx === -1) {
    throw { response: { status: 404, data: { success: false, message: 'Payment term not found' } } };
  }
  mockPaymentTerms[idx] = {
    ...mockPaymentTerms[idx],
    name: data.name ?? mockPaymentTerms[idx].name,
    due_days: data.due_days !== undefined ? Number(data.due_days) : mockPaymentTerms[idx].due_days,
  };
  return mockSuccessEnvelope(mockPaymentTerms[idx], null, 'Payment term updated successfully');
}

export function deleteMockPaymentTerm(id) {
  const numId = Number(id);
  if (numId === 1 || numId === 3) {
    throw {
      response: {
        status: 409,
        data: { success: false, message: 'Payment term is in use by subscriptions or invoices.' },
      },
    };
  }
  mockPaymentTerms = mockPaymentTerms.filter((pt) => pt.id !== numId);
  return mockSuccessEnvelope(null, null, 'Payment term deleted successfully');
}

export function getMockProducts(params = {}) {
  let list = [...mockProducts];

  if (params.search) {
    const q = params.search.toLowerCase();
    list = list.filter((p) => p.name.toLowerCase().includes(q));
  }
  if (params.type) {
    list = list.filter((p) => p.type === params.type);
  }
  if (params.is_active !== undefined && params.is_active !== '') {
    const active = String(params.is_active) === 'true';
    list = list.filter((p) => p.is_active === active);
  }

  // Sorting
  const sort = params.sort || 'name';
  const direction = params.direction || 'asc';
  list.sort((a, b) => {
    let aVal = a[sort];
    let bVal = b[sort];
    if (sort === 'sales_price' || sort === 'cost_price') {
      aVal = parseFloat(aVal) || 0;
      bVal = parseFloat(bVal) || 0;
    }
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  if (params.all) {
    return mockSuccessEnvelope(list, null);
  }

  const page = Number(params.page) || 1;
  const perPage = Number(params.per_page) || 15;
  const total = list.length;
  const lastPage = Math.ceil(total / perPage) || 1;
  const start = (page - 1) * perPage;
  const paginated = list.slice(start, start + perPage);

  return mockSuccessEnvelope(paginated, mockPaginationMeta(page, lastPage, perPage, total));
}

export function getMockProduct(id) {
  const numId = Number(id);
  const found = mockProducts.find((p) => p.id === numId);
  if (!found) {
    throw { response: { status: 404, data: { success: false, message: 'Product not found' } } };
  }
  return mockSuccessEnvelope(found);
}

export function createMockProduct(data) {
  const tax = data.tax_id ? mockTaxes.find((t) => t.id === Number(data.tax_id)) : null;
  const newProduct = {
    id: Date.now(),
    name: data.name,
    type: data.type,
    sales_price: Number(data.sales_price).toFixed(2),
    cost_price: Number(data.cost_price).toFixed(2),
    tax_id: data.tax_id ? Number(data.tax_id) : null,
    tax: tax ? { id: tax.id, name: tax.name, type: tax.type, rate: tax.rate } : null,
    notes: data.notes || null,
    is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
    variants: (data.variants || []).map((v, i) => ({
      id: Date.now() + i,
      attribute: v.attribute,
      value: v.value,
      extra_price: Number(v.extra_price || 0).toFixed(2),
    })),
    created_at: new Date().toISOString(),
  };

  mockProducts.unshift(newProduct);
  return mockSuccessEnvelope(newProduct, null, 'Product created successfully');
}

export function updateMockProduct(id, data) {
  const numId = Number(id);
  const idx = mockProducts.findIndex((p) => p.id === numId);
  if (idx === -1) {
    throw { response: { status: 404, data: { success: false, message: 'Product not found' } } };
  }

  const tax = data.tax_id ? mockTaxes.find((t) => t.id === Number(data.tax_id)) : null;
  const existing = mockProducts[idx];

  mockProducts[idx] = {
    ...existing,
    name: data.name ?? existing.name,
    type: data.type ?? existing.type,
    sales_price: data.sales_price !== undefined ? Number(data.sales_price).toFixed(2) : existing.sales_price,
    cost_price: data.cost_price !== undefined ? Number(data.cost_price).toFixed(2) : existing.cost_price,
    tax_id: data.tax_id !== undefined ? (data.tax_id ? Number(data.tax_id) : null) : existing.tax_id,
    tax: tax ? { id: tax.id, name: tax.name, type: tax.type, rate: tax.rate } : (data.tax_id === null ? null : existing.tax),
    notes: data.notes !== undefined ? data.notes : existing.notes,
    is_active: data.is_active !== undefined ? Boolean(data.is_active) : existing.is_active,
    variants: (data.variants || []).map((v, i) => ({
      id: v.id || Date.now() + i,
      attribute: v.attribute,
      value: v.value,
      extra_price: Number(v.extra_price || 0).toFixed(2),
    })),
  };

  return mockSuccessEnvelope(mockProducts[idx], null, 'Product updated successfully');
}

export function deleteMockProduct(id) {
  const numId = Number(id);
  if (numId === 1) {
    throw {
      response: {
        status: 409,
        data: { success: false, message: 'Product is used by active subscriptions; cannot delete.' },
      },
    };
  }
  mockProducts = mockProducts.filter((p) => p.id !== numId);
  return mockSuccessEnvelope(null, null, 'Product deleted successfully');
}

export function getMockPlans(params = {}) {
  let list = [...mockPlans];
  if (params.search) {
    const q = params.search.toLowerCase();
    list = list.filter((p) => p.name.toLowerCase().includes(q));
  }
  return mockSuccessEnvelope(list, null);
}

export function getMockDiscounts(params = {}) {
  let list = [...mockDiscounts];
  if (params.search) {
    const q = params.search.toLowerCase();
    list = list.filter((d) => d.name.toLowerCase().includes(q) || (d.code && d.code.toLowerCase().includes(q)));
  }
  return mockSuccessEnvelope(list, null);
}
