import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach token ─────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (err) => Promise.reject(err)
);

// ── Response interceptor: handle auth errors ──────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            return api(original);
          })
          .catch(Promise.reject.bind(Promise));
      }

      original._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        processQueue(error);
        isRefreshing = false;
        redirectToLogin();
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL || '/api/v1'}/auth/refresh`,
          { refreshToken }
        );
        const newToken = data.data.accessToken;
        localStorage.setItem('accessToken', newToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        api.defaults.headers.Authorization = `Bearer ${newToken}`;
        processQueue(null, newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (refreshErr) {
        processQueue(refreshErr);
        redirectToLogin();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    // Show error toast for non-auth errors
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
    if (error.response?.status !== 401) {
      toast.error(message, { duration: 4000 });
    }

    return Promise.reject(error);
  }
);

function redirectToLogin() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  window.location.href = '/login';
}

// ── Typed API helpers ─────────────────────────────────────
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data),
  refresh: (token) => api.post('/auth/refresh', { refreshToken: token }),
};

export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  getOne: (id) => api.get(`/products/${id}`),
  getByBarcode: (barcode) => api.get(`/products/barcode/${barcode}`),
  getBySku: (sku) => api.get(`/products/sku/${sku}`),
  getLowStock: () => api.get('/products/low-stock'),
  getCategories: () => api.get('/products/categories'),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

export const ordersAPI = {
  getAll: (params) => api.get('/orders', { params }),
  getOne: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  updateStatus: (id, data) => api.patch(`/orders/${id}/status`, data),
  updatePayment: (id, data) => api.patch(`/orders/${id}/payment`, data),
  cancel: (id, reason) => api.delete(`/orders/${id}`, { data: { reason } }),
};

export const invoicesAPI = {
  getAll: (params) => api.get('/invoices', { params }),
  getOne: (id) => api.get(`/invoices/${id}`),
  getOverdue: () => api.get('/invoices/overdue'),
  create: (data) => api.post('/invoices', data),
  update: (id, data) => api.put(`/invoices/${id}`, data),
  updateStatus: (id, status) => api.patch(`/invoices/${id}/status`, { status }),
  recordPayment: (id, data) => api.post(`/invoices/${id}/payments`, data),
  downloadPDF: (id) => api.get(`/invoices/${id}/pdf`, { responseType: 'blob' }),
};

export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getSales: (params) => api.get('/analytics/sales', { params }),
  getTopProducts: (params) => api.get('/analytics/top-products', { params }),
  getInventoryValue: () => api.get('/analytics/inventory-value'),
  getSalesByCategory: (params) => api.get('/analytics/sales-by-category', { params }),
};

export const inventoryAPI = {
  getMovements: (params) => api.get('/inventory/movements', { params }),
  getSummary: () => api.get('/inventory/summary'),
  adjust: (data) => api.post('/inventory/adjust', data),
  getProductHistory: (productId) => api.get(`/inventory/product/${productId}/history`),
};

export const usersAPI = {
  getAll: () => api.get('/users'),
  getOne: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.patch(`/users/${id}`, data),
  deactivate: (id) => api.delete(`/users/${id}`),
};

export default api;
