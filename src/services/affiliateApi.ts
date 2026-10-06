// ============================================================
// PIERCYN AFFILIATE API CLIENT
// Connects frontend with /api/affiliate endpoints
// ============================================================

const API_BASE = '/api/affiliate';
const TOKEN_STORAGE_KEY = 'piercyn_affiliate_jwt';

export interface AffiliateUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED';
  phone?: string;
  instagram?: string;
  tiktok?: string;
  otherSocials?: string;
  promotionChannels?: string;
  audienceSize?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  createdAt: string;
}

export interface AffiliateLinkItem {
  id: string;
  name: string;
  referralCode: string;
  destination: string;
  destinationType: string;
  isActive: boolean;
  clickCount: number;
  orderCount: number;
  createdAt: string;
}

export interface CommissionItem {
  id: string;
  orderId: string;
  orderNumber: string;
  orderItemId: string;
  productName: string;
  sku: string;
  colour: string;
  size: string;
  quantity: number;
  unitPriceNGN: number;
  amountKobo: number;
  amountNGN: number;
  status: 'PENDING' | 'AVAILABLE' | 'PAID' | 'REVERSED';
  createdAt: string;
  eligibleAt?: string;
  reversedAt?: string;
  reversalReason?: string;
}

export interface PayoutItem {
  id: string;
  amountKobo: number;
  amountNGN: number;
  status: 'PENDING' | 'PROCESSING' | 'PAID' | 'REJECTED';
  bankName: string;
  accountNumber: string;
  accountName: string;
  payoutReference?: string;
  notes?: string;
  requestedAt: string;
  processedAt?: string;
}

export interface DashboardStats {
  affiliate: AffiliateUser;
  earnings: {
    pendingKobo: number;
    pendingNGN: number;
    availableKobo: number;
    availableNGN: number;
    paidKobo: number;
    paidNGN: number;
    reversedKobo: number;
    reversedNGN: number;
    totalEarnedKobo: number;
    totalEarnedNGN: number;
  };
  metrics: {
    totalClicks: number;
    totalOrders: number;
    activeLinksCount: number;
    conversionRatePercent: number;
    averageOrderValueNGN: number;
  };
  config: {
    commissionPerProductNGN: number;
    returnWindowDays: number;
    attributionWindowDays: number;
    minimumPayoutNGN: number;
  };
  recentCommissions: CommissionItem[];
  recentPayouts: PayoutItem[];
  recentClicks: Array<{
    id: string;
    landingPage?: string;
    referrer?: string;
    linkName: string;
    referralCode: string;
    createdAt: string;
  }>;
}

export class AffiliateApiClient {
  public static getToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  }

  public static setToken(token: string): void {
    try {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } catch {}
  }

  public static clearToken(): void {
    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {}
  }

  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ success: boolean; data?: T; error?: string; message?: string }> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      });

      const json = await response.json();
      if (!response.ok) {
        return {
          success: false,
          error: json.error || json.message || `Request failed with status ${response.status}`,
        };
      }

      return json;
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Network error communicating with affiliate server',
      };
    }
  }

  // Auth & Onboarding
  public static async apply(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    instagram?: string;
    tiktok?: string;
    otherSocials?: string;
    promotionChannels?: string;
    audienceSize?: string;
    promotionExperience?: string;
    agreedToTerms: boolean;
  }) {
    const res = await this.request<{ affiliate: AffiliateUser; token: string; message: string }>(
      '/apply',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    if (res.success && res.data?.token) {
      this.setToken(res.data.token);
    }
    return res;
  }

  public static async login(credentials: { email: string; password: string }) {
    const res = await this.request<{ affiliate: AffiliateUser; token: string }>('/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (res.success && res.data?.token) {
      this.setToken(res.data.token);
    }
    return res;
  }

  public static async getMe() {
    return this.request<AffiliateUser>('/me');
  }

  public static logout(): void {
    this.clearToken();
  }

  // Dashboard & Analytics
  public static async getDashboard() {
    return this.request<DashboardStats>('/dashboard');
  }

  // Referral Links
  public static async getLinks() {
    return this.request<AffiliateLinkItem[]>('/links');
  }

  public static async createLink(data: {
    name: string;
    destination: string;
    destinationType?: 'collection' | 'product' | 'homepage';
  }) {
    return this.request<AffiliateLinkItem>('/links', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Commissions & Orders
  public static async getCommissions(filter?: { status?: string; limit?: number; offset?: number }) {
    const params = new URLSearchParams();
    if (filter?.status) params.set('status', filter.status);
    if (filter?.limit) params.set('limit', filter.limit.toString());
    if (filter?.offset) params.set('offset', filter.offset.toString());
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request<CommissionItem[]>(`/commissions${qs}`);
  }

  public static async getOrders(filter?: { limit?: number; offset?: number }) {
    const params = new URLSearchParams();
    if (filter?.limit) params.set('limit', filter.limit.toString());
    if (filter?.offset) params.set('offset', filter.offset.toString());
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request<any[]>(`/orders${qs}`);
  }

  // Payouts
  public static async getPayouts() {
    return this.request<PayoutItem[]>('/payouts');
  }

  public static async requestPayout(data: {
    amountNGN: number;
    bankName: string;
    accountNumber: string;
    accountName: string;
    notes?: string;
  }) {
    return this.request<PayoutItem>('/payouts/request', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Profile
  public static async updateProfile(data: {
    instagram?: string;
    tiktok?: string;
    otherSocials?: string;
    promotionChannels?: string;
    audienceSize?: string;
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
  }) {
    return this.request<AffiliateUser>('/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Public Tracking
  public static async trackClick(data: {
    code: string;
    sessionId?: string;
    referrer?: string;
    landingPage?: string;
  }) {
    return this.request<{ success: boolean; link: any }>('/track-click', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public static async resolveCode(code: string) {
    return this.request<{
      code: string;
      destination: string;
      destinationType: string;
      affiliateName: string;
      affiliateStatus: string;
    }>(`/resolve/${code}`);
  }
}
