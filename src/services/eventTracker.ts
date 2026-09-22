import { AnalyticsEvent } from '../types';

class EventTrackerService {
  private events: AnalyticsEvent[] = [];
  private isDevelopment = true;

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

    try {
      const stored = localStorage.getItem('piercyn_analytics_events');
      const eventList = stored ? JSON.parse(stored) : [];
      // Keep last 100 events
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
