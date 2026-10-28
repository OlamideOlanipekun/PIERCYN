import { beforeEach, describe, expect, it, vi } from 'vitest';

const { analyticsEvent } = vi.hoisted(() => ({
  analyticsEvent: {
    create: vi.fn(),
    count: vi.fn(),
    groupBy: vi.fn(),
  },
}));

vi.mock('../apps/api/src/db/prisma', () => ({
  prisma: { analyticsEvent },
}));

import { EventService } from '../apps/api/src/services/eventService';
import { AnalyticsService } from '../apps/api/src/modules/analytics/analyticsService';

describe('storefront traffic analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('persists page views as their own event with only the supplied pathname and browser/session IDs', async () => {
    analyticsEvent.create.mockResolvedValue({ id: 'event-1' });

    await EventService.track({
      eventType: 'page_view',
      sessionId: 'session-1',
      visitorId: 'visitor-1',
      path: '/products/linen-shirt?email=private@example.com',
      metadata: { path: '/products/linen-shirt?email=private@example.com' },
    });

    expect(analyticsEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        eventType: 'PAGE_VIEW',
        sessionId: 'session-1',
        visitorId: 'visitor-1',
        path: '/products/linen-shirt',
        metadata: undefined,
      }),
    });
  });

  it('does not classify unsupported browser events as product views', async () => {
    const result = await EventService.track({ eventType: 'filter_used' });

    expect(result).toBeNull();
    expect(analyticsEvent.create).not.toHaveBeenCalled();
  });

  it('aggregates actual page views, distinct browsers, sessions and top paths for the requested range', async () => {
    analyticsEvent.count.mockResolvedValue(17);
    analyticsEvent.groupBy
      .mockResolvedValueOnce([{ visitorId: 'visitor-1' }, { visitorId: 'visitor-2' }])
      .mockResolvedValueOnce([{ sessionId: 'session-1' }, { sessionId: 'session-2' }, { sessionId: 'session-3' }])
      .mockResolvedValueOnce([
        { path: '/', _count: { path: 9 } },
        { path: '/shop', _count: { path: 8 } },
      ]);

    const result = await AnalyticsService.getTrafficSummary(7);

    expect(result).toEqual({
      trackingEnabled: true,
      periodDays: 7,
      pageViews: 17,
      uniqueVisitors: 2,
      sessions: 3,
      topPages: [
        { path: '/', views: 9 },
        { path: '/shop', views: 8 },
      ],
    });
    expect(analyticsEvent.count).toHaveBeenCalledWith({
      where: { eventType: 'PAGE_VIEW', createdAt: { gte: expect.any(Date) } },
    });
    expect(analyticsEvent.groupBy).toHaveBeenCalledTimes(3);
  });

  it('reports tracking as inactive when the database migration is not available', async () => {
    analyticsEvent.count.mockRejectedValue(new Error('missing PAGE_VIEW schema'));

    await expect(AnalyticsService.getTrafficSummary(30)).resolves.toEqual({
      trackingEnabled: false,
      periodDays: 30,
      pageViews: 0,
      uniqueVisitors: 0,
      sessions: 0,
      topPages: [],
    });
  });
});
