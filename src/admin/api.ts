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
  AdminMediaAsset,
  AdminVariantRecord,
  AdminCategory,
  AdminReviewsResult,
  AdminReview,
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

  // Product media library
  public async getMedia(params?: { limit?: number; offset?: number }): Promise<AdminMediaAsset[]> {
    const query = new URLSearchParams();
    if (params?.limit !== undefined) query.set('limit', String(params.limit));
    if (params?.offset !== undefined) query.set('offset', String(params.offset));
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<AdminMediaAsset[]>(`/media${qs}`);
  }

  public async deleteMedia(path: string): Promise<{ success: boolean; message: string }> {
    return this.request('/media', { method: 'DELETE', body: JSON.stringify({ path }) });
  }

  // Product category CRUD
  public async getCategories(includeInactive = false): Promise<AdminCategory[]> {
    return this.request<AdminCategory[]>(`/categories${includeInactive ? '?includeInactive=true' : ''}`);
  }

  public async createCategory(input: { name: string; slug?: string; description?: string; imageUrl?: string; sortOrder?: number }): Promise<AdminCategory> {
    return this.request<AdminCategory>('/categories', { method: 'POST', body: JSON.stringify(input) });
  }

  public async updateCategory(id: string, updates: Partial<AdminCategory>): Promise<AdminCategory> {
    return this.request<AdminCategory>(`/categories/${id}`, { method: 'PATCH', body: JSON.stringify(updates) });
  }

  public async archiveCategory(id: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/categories/${id}`, { method: 'DELETE' });
  }

  // Product variant CRUD (delete is a safe deactivation to preserve order history)
  public async getVariants(): Promise<AdminVariantRecord[]> {
    return this.request<AdminVariantRecord[]>('/variants');
  }

  public async createVariant(input: { productId: string; sku?: string; size: string; colour: string; colourHex?: string; priceNGN?: number; priceUSD?: number; priceGBP?: number; priceEUR?: number; costPriceNGN?: number; image?: string; altImage?: string; initialStock: number }): Promise<AdminVariantRecord> {
    return this.request<AdminVariantRecord>('/variants', { method: 'POST', body: JSON.stringify(input) });
  }

  public async updateVariant(id: string, updates: Partial<AdminVariantRecord> & { isActive?: boolean }): Promise<AdminVariantRecord> {
    return this.request<AdminVariantRecord>(`/variants/${id}`, { method: 'PATCH', body: JSON.stringify(updates) });
  }

  public async archiveVariant(id: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/variants/${id}`, { method: 'DELETE' });
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

  // 12. Affiliate & Creator Program Administration
  public async getAffiliateOverview(): Promise<any> {
    return this.request('/affiliates/overview');
  }

  public async getAffiliates(params?: { status?: string; search?: string; limit?: number; offset?: number }): Promise<any[]> {
    const filtered = Object.fromEntries(
      Object.entries(params ?? {}).filter(([, v]) => v !== undefined && v !== null && v !== '')
    );
    const qs = new URLSearchParams(filtered as any).toString();
    return this.request(`/affiliates${qs ? `?${qs}` : ''}`);
  }

  public async getAffiliate(id: string): Promise<any> {
    return this.request(`/affiliates/${id}`);
  }

  public async reviewAffiliate(
    id: string,
    action: 'APPROVE' | 'REJECT',
    notes?: string
  ): Promise<any> {
    return this.request(`/affiliates/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ action, adminNotes: notes, rejectionReason: notes }),
    });
  }

  public async updateAffiliateStatus(
    id: string,
    status: 'ACTIVE' | 'SUSPENDED',
    reason?: string
  ): Promise<any> {
    return this.request(`/affiliates/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status, reason }),
    });
  }

  public async getAffiliatePayouts(params?: { status?: string; limit?: number; offset?: number }): Promise<any[]> {
    const filtered = Object.fromEntries(
      Object.entries(params ?? {}).filter(([, v]) => v !== undefined && v !== null && v !== '')
    );
    const qs = new URLSearchParams(filtered as any).toString();
    return this.request(`/affiliates/payouts/all${qs ? `?${qs}` : ''}`);
  }

  public async processAffiliatePayout(
    id: string,
    action: 'PROCESSING' | 'PAID' | 'REJECTED',
    notes?: string,
    payoutReference?: string
  ): Promise<any> {
    return this.request(`/affiliates/payouts/${id}/process`, {
      method: 'POST',
      body: JSON.stringify({ action, notes, payoutReference }),
    });
  }

  // 13. Review Management
  public async getReviews(params?: {
    page?: number;
    limit?: number;
    status?: string;
    rating?: number;
    productId?: string;
    search?: string;
  }): Promise<AdminReviewsResult> {
    const filtered = Object.fromEntries(
      Object.entries(params ?? {}).filter(([, v]) => v !== undefined && v !== null && v !== '')
    );
    const qs = new URLSearchParams(filtered as any).toString();
    return this.request<AdminReviewsResult>(`/reviews${qs ? `?${qs}` : ''}`);
  }

  public async getReview(reviewId: string): Promise<AdminReview> {
    return this.request<AdminReview>(`/reviews/${reviewId}`);
  }

  public async moderateReview(
    reviewId: string,
    action: 'PUBLISH' | 'HIDE' | 'REJECT' | 'RESTORE',
    note?: string
  ): Promise<AdminReview> {
    return this.request<AdminReview>(`/reviews/${reviewId}/moderate`, {
      method: 'POST',
      body: JSON.stringify({ action, note }),
    });
  }
}

export const AdminApi = new AdminApiClient();
