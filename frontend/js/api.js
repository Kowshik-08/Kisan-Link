/**
 * KisanLink Centralized API Client
 * Manages JWT tokens, automatic Authorization headers, global 401 interceptor,
 * and service modules for all backend REST endpoints.
 */

const API_BASE_URL = (() => {
  // 1. Explicit window or environment injection
  if (typeof window !== 'undefined' && window.KISANLINK_API_URL) {
    const customUrl = window.KISANLINK_API_URL.replace(/\/+$/, '');
    return customUrl.endsWith('/api/v1') ? customUrl : `${customUrl}/api/v1`;
  }
  if (typeof window !== 'undefined' && window.__ENV__?.NEXT_PUBLIC_API_URL) {
    const customUrl = window.__ENV__.NEXT_PUBLIC_API_URL.replace(/\/+$/, '');
    return customUrl.endsWith('/api/v1') ? customUrl : `${customUrl}/api/v1`;
  }

  // 2. Browser location context
  if (typeof window !== 'undefined' && window.location) {
    const { hostname, port, origin } = window.location;

    // A. Express static backend hosting (e.g. http://localhost:5000 or same-origin)
    if (port === '5000' || window.location.pathname.startsWith('/api')) {
      return `${origin}/api/v1`;
    }

    // B. Local development environments (e.g. Live Server on 5500, Vite 5173, etc.)
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000/api/v1';
    }

    // C. Deployed production host (e.g. Vercel) - routes through Vercel rewrites to backend
    return `${origin}/api/v1`;
  }

  return 'http://localhost:5000/api/v1';
})();

const TOKEN_KEY = 'kisanlink_access_token';
const REFRESH_TOKEN_KEY = 'kisanlink_refresh_token';
const USER_KEY = 'kisanlink_user_profile';

class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.onAuthExpiredCallback = null;
  }

  setAuthExpiredHandler(handler) {
    this.onAuthExpiredCallback = handler;
  }

  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  getUser() {
    try {
      const data = localStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  setSession(tokens, user) {
    if (tokens) {
      if (tokens.accessToken) localStorage.setItem(TOKEN_KEY, tokens.accessToken);
      if (tokens.refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    }
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  }

  clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers,
    };

    if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);

      // Handle 401 Unauthorized / Token Expired
      if (response.status === 401) {
        if (!endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
          this.clearSession();
          if (this.onAuthExpiredCallback) {
            this.onAuthExpiredCallback();
          }
          throw new Error('Your session has expired. Please log in again.');
        }
      }

      let data = null;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = { message: await response.text() };
      }

      if (!response.ok) {
        const errorMsg = data?.error?.message || data?.message || `HTTP ${response.status}: Request failed`;
        const err = new Error(errorMsg);
        err.status = response.status;
        err.data = data;
        throw err;
      }

      return data;
    } catch (err) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        const networkError = new Error('Cannot connect to KisanLink server at ' + this.baseUrl + '. Ensure the backend is running.');
        networkError.status = 0;
        throw networkError;
      }
      throw err;
    }
  }

  get(endpoint, params = null) {
    let url = endpoint;
    if (params) {
      const qs = new URLSearchParams(
        Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
      ).toString();
      if (qs) url += `?${qs}`;
    }
    return this.request(url, { method: 'GET' });
  }

  post(endpoint, body = {}) {
    return this.request(endpoint, { method: 'POST', body });
  }

  put(endpoint, body = {}) {
    return this.request(endpoint, { method: 'PUT', body });
  }

  patch(endpoint, body = {}) {
    return this.request(endpoint, { method: 'PATCH', body });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

const client = new ApiClient(API_BASE_URL);

// Expose globally as well as for module scripts
window.kisanlinkClient = client;

window.authApi = {
  login: (credentials) => client.post('/auth/login', credentials),
  register: (userData) => client.post('/auth/register', userData),
  getMe: () => client.get('/auth/me'),
  updateLanguage: (language) => client.patch('/auth/language', { language }),
  logout: () => client.post('/auth/logout', { refreshToken: client.getRefreshToken() }),
  setSession: (tokens, user) => client.setSession(tokens, user),
  clearSession: () => client.clearSession(),
  getUser: () => client.getUser(),
  getToken: () => client.getToken(),
};

window.farmerApi = {
  getTicker: () => client.get('/farmer/ticker'),
  getTrend: (crop) => client.get(`/farmer/trend/${crop}`),
  discoverBuyers: (searchParams) => client.post('/farmer/discover-buyers', searchParams),
  getMyDeals: () => client.get('/farmer/deals'),
  getMyListings: () => client.get('/farmer/listings'),
};

window.buyerApi = {
  getStats: () => client.get('/buyer/stats'),
  getListings: (params) => client.get('/buyer/listings', params),
  inquire: (data) => client.post('/buyer/inquire', data),
  getMyDeals: () => client.get('/buyer/deals'),
};

window.productApi = {
  getAll: (params) => client.get('/products', params),
  getCategories: () => client.get('/products/categories'),
  getByIdOrSlug: (idOrSlug) => client.get(`/products/${idOrSlug}`),
  create: (data) => client.post('/products', data),
  update: (id, data) => client.put(`/products/${id}`, data),
  delete: (id) => client.delete(`/products/${id}`),
};

window.cartApi = {
  getCart: () => client.get('/cart'),
  addItem: (data) => client.post('/cart/items', data),
  updateItem: (itemId, quantity) => client.patch(`/cart/items/${itemId}`, { quantity }),
  removeItem: (itemId) => client.delete(`/cart/items/${itemId}`),
  clearCart: () => client.delete('/cart'),
};

window.orderApi = {
  createOrder: (data) => client.post('/orders', data),
  getOrders: (params) => client.get('/orders', params),
  getOrderById: (orderId) => client.get(`/orders/${orderId}`),
  advanceStage: (orderId, stageData) => client.patch(`/orders/${orderId}/stage`, stageData),
};

window.addressApi = {
  getAddresses: () => client.get('/addresses'),
  createAddress: (data) => client.post('/addresses', data),
  updateAddress: (id, data) => client.put(`/addresses/${id}`, data),
  deleteAddress: (id) => client.delete(`/addresses/${id}`),
};

window.reviewApi = {
  createReview: (data) => client.post('/reviews', data),
  getUserReviews: (userId) => client.get('/reviews/user', userId ? { userId } : null),
};
