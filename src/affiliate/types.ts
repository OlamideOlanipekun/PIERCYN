export type AffiliatePublicRoute = 'landing' | 'register' | 'login' | 'application';

export type AffiliateDashboardTab =
  | 'overview'
  | 'links'
  | 'products'
  | 'media'
  | 'referrals'
  | 'earnings'
  | 'withdrawals'
  | 'notifications'
  | 'settings';

export interface AffiliateNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'order' | 'commission' | 'payout' | 'announcement' | 'system';
  isRead: boolean;
  linkTab?: AffiliateDashboardTab;
}

export const formatNGN = (amount: number | null | undefined): string => {
  const val = Number.isFinite(amount) ? (amount as number) : 0;
  return `₦${val.toLocaleString('en-NG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

export const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

export const formatDateTime = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return `${d.toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })} · ${d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}`;
  } catch {
    return dateStr;
  }
};

