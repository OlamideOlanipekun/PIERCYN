import { AnalyticsEvent } from '../types';
import { api } from './apiClient';

class EventTrackerService {
  private events: AnalyticsEvent[] = [];
  private isDevelopment = (import.meta as any).env?.DEV ?? (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production');

  public track(eventName: AnalyticsEvent['eventName'], data: Record<string, any> = {}) {
    const event: AnalyticsEvent = {
      eventName,
      data,
      timestamp: new Date().toISOString(),
    };

    this.events.push(event);

    if (this.isDevelopment) {
      console.log(`[PIERCYN EVENT] ${eventName}:`, data);
    }

    // Persist to server backend
    api.trackEvent(eventName, data, data.productId, data.variantId, data.orderId || data.orderNumber);

    try {
      const stored = localStorage.getItem('piercyn_analytics_events');
      const eventList = stored ? JSON.parse(stored) : [];
      const updated = [...eventList, event].slice(-100);
      localStorage.setItem('piercyn_analytics_events', JSON.stringify(updated));
    } catch {
      // localStorage disabled or full
    }
  }

  public getEvents(): AnalyticsEvent[] {
    return this.events;
  }
}

export const eventTracker = new EventTrackerService();
