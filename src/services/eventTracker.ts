import { AnalyticsEvent } from '../types';
import { api } from './apiClient';

interface TrafficIdentity {
  visitorId: string;
  sessionId: string;
  path: string;
}

const VISITOR_KEY = 'piercyn_traffic_visitor';
const SESSION_KEY = 'piercyn_traffic_session';
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

class EventTrackerService {
  private events: AnalyticsEvent[] = [];
  private lastTrackedPage: string | null = null;
  private isDevelopment = (import.meta as any).env?.DEV ?? (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production');

  private createId(prefix: string): string {
    const randomId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
    return `${prefix}_${randomId}`;
  }

  private getTrafficIdentity(path: string): TrafficIdentity | null {
    try {
      const visitorId = localStorage.getItem(VISITOR_KEY) || this.createId('v');
      localStorage.setItem(VISITOR_KEY, visitorId);

      const now = Date.now();
      let sessionId = '';
      const storedSession = localStorage.getItem(SESSION_KEY);
      if (storedSession) {
        try {
          const parsed = JSON.parse(storedSession) as { id?: string; lastSeen?: number };
          if (parsed.id && typeof parsed.lastSeen === 'number' && now - parsed.lastSeen < SESSION_TIMEOUT_MS) {
            sessionId = parsed.id;
          }
        } catch {
          // Replace an invalid or obsolete session record below.
        }
      }
      if (!sessionId) sessionId = this.createId('s');
      localStorage.setItem(SESSION_KEY, JSON.stringify({ id: sessionId, lastSeen: now }));

      return { visitorId, sessionId, path };
    } catch {
      // Do not claim a visitor count when browser storage is unavailable.
      return null;
    }
  }

  public track(eventName: AnalyticsEvent['eventName'], data: Record<string, any> = {}, traffic?: TrafficIdentity) {
    const event: AnalyticsEvent = {
      eventName,
      data,
      timestamp: new Date().toISOString(),
    };

    this.events.push(event);

    if (this.isDevelopment) {
      console.log(`[PIERCYN EVENT] ${eventName}:`, data);
    }

    // Persist to server backend. Unsupported legacy client events are safely ignored by the API.
    api.trackEvent(eventName, data, data.productId, data.variantId, data.orderId || data.orderNumber, traffic);

    try {
      const stored = localStorage.getItem('piercyn_analytics_events');
      const eventList = stored ? JSON.parse(stored) : [];
      const updated = [...eventList, event].slice(-100);
      localStorage.setItem('piercyn_analytics_events', JSON.stringify(updated));
    } catch {
      // localStorage disabled or full
    }
  }

  public trackPageView(rawPath: string): void {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return;
    if (navigator.doNotTrack === '1' || (window as any).doNotTrack === '1') return;

    let path = rawPath.split(/[?#]/, 1)[0].toLowerCase().replace(/\/+$/, '') || '/';
    path = path.replace(/^\/product\//, '/products/').replace(/^\/categories\//, '/category/');
    if (path === '/new' || path === '/new-in') path = '/new-arrivals';

    // Keep staff, account and checkout/order journeys out of general storefront traffic totals.
    if (/^\/(admin|affiliate|account|cart|checkout|order|orders|track-order|order-confirmation)(\/|$)/.test(path)) return;
    if (this.lastTrackedPage === path) return;

    const traffic = this.getTrafficIdentity(path);
    if (!traffic) return;
    this.lastTrackedPage = path;
    this.track('page_view', { path }, traffic);
  }

  public getEvents(): AnalyticsEvent[] {
    return this.events;
  }
}

export const eventTracker = new EventTrackerService();
