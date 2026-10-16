// API Service Layer for AL RIZQ ELITE

let currentRole = localStorage.getItem('al_rizq_role') || 'admin';

export const setRole = (role) => {
  currentRole = role;
  localStorage.setItem('al_rizq_role', role);
};

export const getRole = () => currentRole;

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

async function request(endpoint, options = {}) {
  const headers = {
    'Accept': 'application/json',
    'X-User-Role': currentRole,
    ...(options.headers || {}),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.message || `Request failed with status ${response.status}`;
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  // Stats
  getDashboardStats: () => request('/dashboard/stats'),

  // Categories
  getCategories: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/categories${query ? '?' + query : ''}`);
  },
  createCategory: (data) => request('/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id, data) => request(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCategory: (id) => request(`/categories/${id}`, { method: 'DELETE' }),

  // Products
  getProducts: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/products${query ? '?' + query : ''}`);
  },
  getProduct: (id) => request(`/products/${id}`),
  createProduct: (data) => request('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id, data) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),
  toggleProductStatus: (id) => request(`/products/${id}/toggle-status`, { method: 'PATCH' }),
  toggleProductAvailability: (id) => request(`/products/${id}/toggle-availability`, { method: 'PATCH' }),
  bulkAvailability: (productIds, isAvailable) => request('/products/bulk-availability', {
    method: 'POST',
    body: JSON.stringify({ product_ids: productIds, is_available: isAvailable })
  }),

  // Product Images
  getProductImages: (productId) => request(`/products/${productId}/images`),
  uploadProductImage: (productId, formData) => request(`/products/${productId}/images`, {
    method: 'POST',
    body: formData,
  }),
  setPrimaryImage: (productId, imageId) => request(`/products/${productId}/images/${imageId}/set-primary`, {
    method: 'PATCH',
  }),
  deleteProductImage: (productId, imageId) => request(`/products/${productId}/images/${imageId}`, {
    method: 'DELETE',
  }),

  // Offers
  getOffers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/offers${query ? '?' + query : ''}`);
  },
  createOffer: (data) => request('/offers', { method: 'POST', body: JSON.stringify(data) }),
  updateOffer: (id, data) => request(`/offers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteOffer: (id) => request(`/offers/${id}`, { method: 'DELETE' }),
  toggleOfferStatus: (id) => request(`/offers/${id}/toggle-status`, { method: 'PATCH' }),
  validateOffer: (code, subtotal) => request('/offers/validate', {
    method: 'POST',
    body: JSON.stringify({ code, subtotal })
  }),

  // Combos
  getCombos: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/combos${query ? '?' + query : ''}`);
  },
  createCombo: (data) => request('/combos', { method: 'POST', body: JSON.stringify(data) }),
  updateCombo: (id, data) => request(`/combos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  duplicateCombo: (id) => request(`/combos/${id}/duplicate`, { method: 'POST' }),
  deleteCombo: (id) => request(`/combos/${id}`, { method: 'DELETE' }),
  toggleComboStatus: (id) => request(`/combos/${id}/toggle-status`, { method: 'PATCH' }),
  toggleComboAvailability: (id) => request(`/combos/${id}/toggle-availability`, { method: 'PATCH' }),

  // Orders & POS Checkout
  getOrders: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/orders${query ? '?' + query : ''}`);
  },
  getZReport: () => request('/orders/z-report'),
  createOrder: (orderData) => request('/orders', {
    method: 'POST',
    body: JSON.stringify(orderData)
  }),
  getOrder: (id) => request(`/orders/${id}`),

  // Dining Tables
  getTables: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/tables${query ? '?' + query : ''}`);
  },
  createTable: (data) => request('/tables', { method: 'POST', body: JSON.stringify(data) }),
  updateTable: (id, data) => request(`/tables/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTable: (id) => request(`/tables/${id}`, { method: 'DELETE' }),
  toggleTableStatus: (id) => request(`/tables/${id}/toggle-status`, { method: 'PATCH' }),

  // Client Permission Requests & Approvals
  getClientRequests: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/client-requests${query ? '?' + query : ''}`);
  },
  registerClient: (data) => request('/client-requests', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  loginClient: (data) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  checkClientStatus: (identifier) => request(`/auth/check-status?identifier=${encodeURIComponent(identifier)}`),
  approveClientRequest: (id, adminNotes = '') => request(`/client-requests/${id}/approve`, {
    method: 'PATCH',
    body: JSON.stringify({ admin_notes: adminNotes }),
  }),
  rejectClientRequest: (id, adminNotes = '') => request(`/client-requests/${id}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ admin_notes: adminNotes }),
  }),
  deleteClientRequest: (id) => request(`/client-requests/${id}`, {
    method: 'DELETE',
  }),
};
