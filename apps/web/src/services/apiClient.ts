/**
 * PIERCYN Commerce API Client
 * Seamless communication with backend /api endpoints
 */

const RAW_API_URL = (import.meta.env?.VITE_API_URL || '').replace(/\/+$/, '');
const API_BASE = RAW_API_URL ? `${RAW_API_URL}/api` : '/api';


// Generate or retrieve persistent anonymous session ID
export const getSessionId = (): string => {
  let sessionId = localStorage.getItem('piercyn_session_id');
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('piercyn_session_id', sessionId);
  }
  return sessionId;
};

export const getAuthToken = (): string | null => {
  try {
    return localStorage.getItem('piercyn_auth_token');
  } catch {
    return null;
  }
};

const getHeaders = (): HeadersInit => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-session-id': getSessionId(),
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

async function parseResponse(res: Response): Promise<any> {
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      return await res.json();
    } catch {
      // JSON parse error
    }
  }
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return {
      success: false,
      error: !res.ok
        ? `Server error (${res.status}): Please try again.`
        : `Unexpected non-JSON response from server (${res.status}).`,
    };
  }
}

export const api = {
  // Products
  async getProducts(params?: { category?: string; collection?: string }) {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`${API_BASE}/products${query ? `?${query}` : ''}`, { headers: getHeaders() });
    return parseResponse(res);
  },

  async getProduct(slug: string) {
    const res = await fetch(`${API_BASE}/products/${slug}`, { headers: getHeaders() });
    return parseResponse(res);
  },

  // Cart
  async getCart() {
    const res = await fetch(`${API_BASE}/cart`, { headers: getHeaders() });
    return parseResponse(res);
  },

  async addToCart(variantId: string, quantity: number = 1) {
    const res = await fetch(`${API_BASE}/cart/items`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ variantId, quantity }),
    });
    return parseResponse(res);
  },

  async updateCartItem(variantId: string, quantity: number) {
    const res = await fetch(`${API_BASE}/cart/items`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ variantId, quantity }),
    });
    return parseResponse(res);
  },

  async clearCart() {
    const res = await fetch(`${API_BASE}/cart`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return parseResponse(res);
  },

  // Shipping
  async getShippingOptions(subtotalNGN: number = 0) {
    const res = await fetch(`${API_BASE}/shipping/options?subtotal=${subtotalNGN}`, { headers: getHeaders() });
    return parseResponse(res);
  },

  // Checkout Quote
  async getCheckoutQuote(shippingRegion: 'lagos' | 'nationwide', items: { variantId: string; quantity: number }[], discountCode?: string) {
    const res = await fetch(`${API_BASE}/checkout/quote`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ shippingRegion, items, discountCode }),
    });
    return parseResponse(res);
  },

  // Orders
  async createOrder(payload: {
    customer: {
      fullName: string;
      email: string;
      phone: string;
      state: string;
      city: string;
      address: string;
      orderNote?: string;
    };
    shippingRegion: 'lagos' | 'nationwide';
    paymentMethod: 'paystack' | 'transfer' | 'mock';
    items: { variantId: string; quantity: number }[];
    discountCode?: string;
  }) {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return parseResponse(res);
  },

  async getOrders(email?: string) {
    const url = email ? `${API_BASE}/orders?email=${encodeURIComponent(email)}` : `${API_BASE}/orders`;
    const res = await fetch(url, { headers: getHeaders() });
    return parseResponse(res);
  },

  async getOrder(orderId: string) {
    const res = await fetch(`${API_BASE}/orders/${orderId}`, { headers: getHeaders() });
    return parseResponse(res);
  },

  // Payments
  async initializePayment(orderNumber: string, callbackUrl?: string) {
    const res = await fetch(`${API_BASE}/payments/initialize`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ orderNumber, callbackUrl }),
    });
    return parseResponse(res);
  },

  async verifyPayment(reference: string) {
    const res = await fetch(`${API_BASE}/payments/verify`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ reference }),
    });
    return parseResponse(res);
  },

  // Events & Analytics
  async trackEvent(eventType: string, metadata: Record<string, any> = {}, productId?: string, variantId?: string, orderId?: string) {
    try {
      await fetch(`${API_BASE}/events`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          eventType,
          sessionId: getSessionId(),
          productId,
          variantId,
          orderId,
          metadata,
        }),
      });
    } catch {
      // Non-blocking
    }
  },

  async getAnalyticsOverview() {
    const res = await fetch(`${API_BASE}/analytics/overview`, { headers: getHeaders() });
    return parseResponse(res);
  },

  // Atelier Client Authentication
  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    city?: string;
    address?: string;
  }) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return parseResponse(res);
  },

  async login(data: { email: string; password: string }) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return parseResponse(res);
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, { headers: getHeaders() });
    return parseResponse(res);
  },

  async logout() {
    const res = await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return parseResponse(res);
  },
};
