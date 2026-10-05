import {
  AdminUser,
  AdminOrder,
  AdminProduct,
  AdminInventoryItem,
  AdminInventoryLedgerEntry,
  AdminCustomer,
  AdminAnalyticsSummary,
  AdminAlerts,
  AdminAuditEntry,
  AdminSettingsData,
} from './types';

const ADMIN_TOKEN_KEY = 'piercyn_admin_token';

export const AdminStorage = {
  getToken: (): string | null => {
    try {
      return localStorage.getItem(ADMIN_TOKEN_KEY);
    } catch {
      return null;
    }
  },
  setToken: (token: string): void => {
    try {
      localStorage.setItem(ADMIN_TOKEN_KEY, token);
    } catch {
      // ignore
    }
  },
  clearToken: (): void => {
    try {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
    } catch {
      // ignore
    }
  },
};

const RAW_API_URL = (import.meta.env?.VITE_API_URL || '').replace(/\/+$/, '');
const ADMIN_API_BASE = RAW_API_URL ? `${RAW_API_URL}/api/admin` : '/api/admin';

class AdminApiClient {
  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const token = AdminStorage.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      headers['x-admin-token'] = token;
    }
    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${ADMIN_API_BASE}${endpoint}`;
    const headers = { ...this.getHeaders(), ...(options.headers || {}) };

    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (res.status === 401 || res.status === 403) {
      // If unauthorized on protected endpoint, clear stale token
      if (!endpoint.includes('/auth/login')) {
        AdminStorage.clearToken();
        window.dispatchEvent(new CustomEvent('piercyn_admin_unauthorized'));
      }
    }

    let json: any = null;
    try {
      json = await res.json();
    } catch {
      throw new Error(`Server returned status ${res.status}`);
    }

    if (!res.ok || json.success === false) {
      throw new Error(json.error || `Request failed with status ${res.status}`);
    }

    return json.data !== undefined ? json.data : json;
  }

  // 1. Auth
  public async login(email: string, password: string): Promise<{ admin: AdminUser; token: string }> {
    const result = await this.request<{ admin: AdminUser; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    AdminStorage.setToken(result.token);
    return result;
  }

  public async getMe(): Promise<AdminUser> {
    return this.request<AdminUser>('/auth/me');
  }

  public async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      AdminStorage.clearToken();
    }
  }

  // 2. Orders
  public async getOrders(params?: {
    status?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<AdminOrder[]> {
    const query = new URLSearchParams();
    if (params?.status && params.status !== 'ALL') query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);

    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<AdminOrder[]>(`/orders${qs}`);
  }

  public async getOrder(id: string): Promise<AdminOrder> {
    return this.request<AdminOrder>(`/orders/${id}`);
  }

  public async updateOrderStatus(
    orderId: string,
    status: string,
    note?: string
  ): Promise<AdminOrder> {
    return this.request<AdminOrder>(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note }),
    });
  }

  public async createShipment(
    orderId: string,
    data: {
      courier?: string;
      trackingNumber?: string;
      deliveryFeeNGN?: number;
      deliveryAddress: string;
      recipientName: string;
      recipientPhone: string;
    }
  ): Promise<any> {
    return this.request(`/orders/${orderId}/shipment`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // 3. Products
  public async getProducts(params?: {
    category?: string;
    status?: string;
    search?: string;
  }): Promise<AdminProduct[]> {
    const query = new URLSearchParams();
    if (params?.category && params.category !== 'ALL') query.set('category', params.category);
    if (params?.status && params.status !== 'ALL') query.set('status', params.status);
    if (params?.search) query.set('search', params.search);

    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<AdminProduct[]>(`/products${qs}`);
  }

  public async createProduct(product: Partial<AdminProduct>): Promise<AdminProduct> {
    return this.request<AdminProduct>('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  }

  public async updateProduct(id: string, updates: Partial<AdminProduct>): Promise<AdminProduct> {
    return this.request<AdminProduct>(`/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  public async archiveProduct(id: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  // 4. Inventory
  public async getInventory(params?: {
    lowStockOnly?: boolean;
    outOfStockOnly?: boolean;
    search?: string;
  }): Promise<AdminInventoryItem[]> {
    const query = new URLSearchParams();
    if (params?.lowStockOnly) query.set('lowStockOnly', 'true');
    if (params?.outOfStockOnly) query.set('outOfStockOnly', 'true');
    if (params?.search) query.set('search', params.search);

    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<AdminInventoryItem[]>(`/inventory${qs}`);
  }

  public async adjustInventory(data: {
    variantId: string;
    quantity: number;
    type: 'PURCHASE' | 'SALE' | 'ADJUSTMENT' | 'DAMAGE' | 'RETURN';
    reference: string;
    reason?: string;
  }): Promise<{ success: boolean; message: string }> {
    return this.request('/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async getInventoryHistory(variantId?: string): Promise<AdminInventoryLedgerEntry[]> {
    const qs = variantId ? `?variantId=${variantId}` : '';
    return this.request<AdminInventoryLedgerEntry[]>(`/inventory/history${qs}`);
  }

  // 5. Customers
  public async getCustomers(search?: string): Promise<AdminCustomer[]> {
    const qs = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.request<AdminCustomer[]>(`/customers${qs}`);
  }

  public async getCustomer(id: string): Promise<AdminCustomer> {
    return this.request<AdminCustomer>(`/customers/${id}`);
  }

  // 6. Analytics
  public async getAnalytics(): Promise<AdminAnalyticsSummary> {
    return this.request<AdminAnalyticsSummary>('/analytics');
  }

  // 7. Operational Alerts
  public async getAlerts(): Promise<AdminAlerts> {
    return this.request<AdminAlerts>('/alerts');
  }

  // 8. Universal Search
  public async search(q: string): Promise<{
    orders: AdminOrder[];
    customers: AdminCustomer[];
    products: AdminProduct[];
  }> {
    return this.request(`/search?q=${encodeURIComponent(q)}`);
  }

  // 9. Audit Logs
  public async getAuditLogs(resource?: string): Promise<AdminAuditEntry[]> {
    const qs = resource && resource !== 'ALL' ? `?resource=${resource}` : '';
    return this.request<AdminAuditEntry[]>(`/audit-logs${qs}`);
  }

  // 10. Settings
  public async getSettings(): Promise<AdminSettingsData> {
    return this.request<AdminSettingsData>('/settings');
  }

  public async updateSettings(updates: Partial<AdminSettingsData>): Promise<AdminSettingsData> {
    return this.request<AdminSettingsData>('/settings', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  // 11. Seed sample orders
  public async seedSampleOrders(): Promise<{ success: boolean; message: string }> {
    return this.request('/seed-sample-orders', {
      method: 'POST',
    });
  }
}

export const AdminApi = new AdminApiClient();
