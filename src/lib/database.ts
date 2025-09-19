export interface NavigationEvent {
  id: string;
  phoneNumber: string;
  currentState: string;
  lastDigit: string;
  timestamp: Date;
  callSid: string;
}

export interface WebsiteState {
  currentSection: string;
  lastActivity: Date;
  totalNavigations: number;
  recentEvents: NavigationEvent[];
}

class NavigationDatabase {
  private currentState: WebsiteState = {
    currentSection: 'home',
    lastActivity: new Date(),
    totalNavigations: 0,
    recentEvents: []
  };

  private readonly MAX_RECENT_EVENTS = 10;

  async recordNavigation(event: Omit<NavigationEvent, 'id'>): Promise<NavigationEvent> {
    const navigationEvent: NavigationEvent = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      ...event
    };

    this.currentState = {
      currentSection: event.currentState,
      lastActivity: event.timestamp,
      totalNavigations: this.currentState.totalNavigations + 1,
      recentEvents: [
        navigationEvent,
        ...this.currentState.recentEvents.slice(0, this.MAX_RECENT_EVENTS - 1)
      ]
    };

    return navigationEvent;
  }

  async getCurrentState(): Promise<WebsiteState> {
    return { ...this.currentState };
  }

  async getRecentEvents(limit: number = 10): Promise<NavigationEvent[]> {
    return this.currentState.recentEvents.slice(0, limit);
  }

  async clearHistory(): Promise<void> {
    this.currentState = {
      currentSection: 'home',
      lastActivity: new Date(),
      totalNavigations: 0,
      recentEvents: []
    };
  }

  async getNavigationStats(): Promise<Record<string, number>> {
    const stats: Record<string, number> = {};

    this.currentState.recentEvents.forEach(event => {
      stats[event.currentState] = (stats[event.currentState] || 0) + 1;
    });

    return stats;
  }
}

export const navigationDB = new NavigationDatabase();

export async function recordWebsiteNavigation(
  phoneNumber: string,
  digit: string,
  state: string,
  callSid: string
): Promise<NavigationEvent> {
  return await navigationDB.recordNavigation({
    phoneNumber,
    currentState: state,
    lastDigit: digit,
    timestamp: new Date(),
    callSid
  });
}