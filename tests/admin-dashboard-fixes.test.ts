import { afterEach, describe, expect, it, vi } from 'vitest';
import { AdminApi } from '../src/admin/api';
import { isLowStockAvailable } from '../apps/api/src/modules/analytics/stockMetrics';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('admin dashboard data consistency', () => {
  it('classifies zero available units as out of stock, not low stock', () => {
    expect(isLowStockAvailable(0, 5)).toBe(false);
    expect(isLowStockAvailable(1, 5)).toBe(true);
    expect(isLowStockAvailable(5, 5)).toBe(true);
    expect(isLowStockAvailable(6, 5)).toBe(false);
  });

  it('forwards recent-order limit and offset to the admin API', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({ success: true, data: [] }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await AdminApi.getOrders({ limit: 6, offset: 12 });

    const url = new URL(fetchMock.mock.calls[0][0] as string, 'http://localhost');
    expect(url.pathname).toBe('/api/admin/orders');
    expect(url.searchParams.get('limit')).toBe('6');
    expect(url.searchParams.get('offset')).toBe('12');
  });
});
