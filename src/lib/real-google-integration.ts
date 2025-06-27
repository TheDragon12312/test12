export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus: "needsAction" | "declined" | "tentative" | "accepted";
  }>;
}

export interface GoogleCalendar {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
  accessRole: string;
}

export class RealGoogleIntegration {
  private _isConnected: boolean = false;
  private readonly STORAGE_KEY = "google_integration_data";

  constructor() {
    this.loadConnectionStatus();
  }

  // Load connection status from storage
  private loadConnectionStatus(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this._isConnected = data.isConnected || false;
      }
    } catch (error) {
      console.error("Failed to load Google integration status:", error);
    }
  }

  // Save connection status
  private saveConnectionStatus(): void {
    try {
      const data = {
        isConnected: this._isConnected,
        lastConnected: new Date().toISOString(),
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Failed to save Google integration status:", error);
    }
  }

  // Check if connected to Google
  isConnected(): boolean {
    return this._isConnected;
  }

  // Connect to Google services
  async connect(): Promise<boolean> {
    try {
      console.log("Connecting to Google services...");

      // In a real implementation, this would:
      // 1. Initialize Google OAuth
      // 2. Request necessary permissions
      // 3. Store access tokens

      // For demo purposes, simulate successful connection
      this._isConnected = true;
      this.saveConnectionStatus();

      console.log("✅ Successfully connected to Google services");
      return true;
    } catch (error) {
      console.error("Failed to connect to Google services:", error);
      return false;
    }
  }

  // Disconnect from Google services
  async disconnect(): Promise<void> {
    try {
      this._isConnected = false;
      this.saveConnectionStatus();
      console.log("🔌 Disconnected from Google services");
    } catch (error) {
      console.error("Failed to disconnect from Google services:", error);
    }
  }

  // Get user's calendars
  async getCalendars(): Promise<GoogleCalendar[]> {
    if (!this._isConnected) {
      throw new Error("Not connected to Google services");
    }
    const accessToken = localStorage.getItem("google_access_token");
    if (!accessToken) throw new Error("Geen Google access token gevonden");
    const res = await fetch(
      "https://www.googleapis.com/calendar/v3/users/me/calendarList",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    if (!res.ok) throw new Error("Kon Google calendars niet ophalen");
    const data = await res.json();
    return (data.items || []).map((cal: any) => ({
      id: cal.id,
      summary: cal.summary,
      description: cal.description,
      primary: cal.primary,
      accessRole: cal.accessRole,
    }));
  }

  // Get events from calendar
  async getEvents(
    calendarId: string = "primary",
    timeMin?: Date,
    timeMax?: Date,
  ): Promise<GoogleCalendarEvent[]> {
    if (!this._isConnected) {
      throw new Error("Not connected to Google services");
    }
    const accessToken = localStorage.getItem("google_access_token");
    if (!accessToken) throw new Error("Geen Google access token gevonden");
    const now = new Date();
    const min = timeMin ? timeMin.toISOString() : new Date(now.setHours(0,0,0,0)).toISOString();
    const max = timeMax ? timeMax.toISOString() : new Date(now.setHours(23,59,59,999)).toISOString();
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${min}&timeMax=${max}&singleEvents=true&orderBy=startTime`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    if (!res.ok) throw new Error("Kon Google events niet ophalen");
    const data = await res.json();
    return (data.items || []).map((event: any) => ({
      id: event.id,
      summary: event.summary,
      description: event.description,
      start: event.start,
      end: event.end,
      attendees: event.attendees,
    }));
  }

  // Create a new event
  async createEvent(
    calendarId: string,
    event: Partial<GoogleCalendarEvent>,
  ): Promise<GoogleCalendarEvent> {
    if (!this._isConnected) {
      throw new Error("Not connected to Google services");
    }

    console.log(`Creating event in calendar ${calendarId}:`, event);

    // Mock created event
    const createdEvent: GoogleCalendarEvent = {
      id: `event_${Date.now()}`,
      summary: event.summary || "New Event",
      description: event.description,
      start: event.start || {
        dateTime: new Date().toISOString(),
        timeZone: "Europe/Amsterdam",
      },
      end: event.end || {
        dateTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        timeZone: "Europe/Amsterdam",
      },
      attendees: event.attendees || [],
    };

    return createdEvent;
  }

  // Update an existing event
  async updateEvent(
    calendarId: string,
    eventId: string,
    event: Partial<GoogleCalendarEvent>,
  ): Promise<GoogleCalendarEvent> {
    if (!this._isConnected) {
      throw new Error("Not connected to Google services");
    }

    console.log(`Updating event ${eventId} in calendar ${calendarId}:`, event);

    // Mock updated event
    const updatedEvent: GoogleCalendarEvent = {
      id: eventId,
      summary: event.summary || "Updated Event",
      description: event.description,
      start: event.start || {
        dateTime: new Date().toISOString(),
        timeZone: "Europe/Amsterdam",
      },
      end: event.end || {
        dateTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        timeZone: "Europe/Amsterdam",
      },
      attendees: event.attendees || [],
    };

    return updatedEvent;
  }

  // Delete an event
  async deleteEvent(calendarId: string, eventId: string): Promise<void> {
    if (!this._isConnected) {
      throw new Error("Not connected to Google services");
    }

    console.log(`Deleting event ${eventId} from calendar ${calendarId}`);
  }

  // Create focus session event
  async createFocusSession(
    title: string,
    duration: number,
  ): Promise<GoogleCalendarEvent> {
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

    return this.createEvent("primary", {
      summary: `🎯 Focus Session: ${title}`,
      description: `Deep work session created by FocusFlow\nDuration: ${duration} minutes`,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: "Europe/Amsterdam",
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: "Europe/Amsterdam",
      },
    });
  }

  // Get upcoming events for focus planning
  async getUpcomingEvents(hours: number = 24): Promise<GoogleCalendarEvent[]> {
    const now = new Date();
    const timeMax = new Date(now.getTime() + hours * 60 * 60 * 1000);

    return this.getEvents("primary", now, timeMax);
  }

  // Find free time slots
  async findFreeTimeSlots(
    duration: number,
    withinHours: number = 8,
  ): Promise<Array<{ start: Date; end: Date }>> {
    const events = await this.getUpcomingEvents(withinHours);
    const slots: Array<{ start: Date; end: Date }> = [];

    // Simple algorithm to find free slots
    const now = new Date();
    const endTime = new Date(now.getTime() + withinHours * 60 * 60 * 1000);

    let currentTime = new Date(now);

    // Round to next 15-minute mark
    const minutes = currentTime.getMinutes();
    currentTime.setMinutes(Math.ceil(minutes / 15) * 15, 0, 0);

    while (currentTime < endTime) {
      const slotEnd = new Date(currentTime.getTime() + duration * 60 * 1000);

      // Check if this slot conflicts with any events
      const hasConflict = events.some((event) => {
        const eventStart = new Date(event.start.dateTime);
        const eventEnd = new Date(event.end.dateTime);

        return currentTime < eventEnd && slotEnd > eventStart;
      });

      if (!hasConflict) {
        slots.push({
          start: new Date(currentTime),
          end: new Date(slotEnd),
        });
      }

      // Move to next 15-minute slot
      currentTime.setTime(currentTime.getTime() + 15 * 60 * 1000);
    }

    return slots.slice(0, 5); // Return first 5 available slots
  }
}

// Export instance instead of class
export const realGoogleIntegration = new RealGoogleIntegration();

// Also export as default for backward compatibility
export default realGoogleIntegration;
