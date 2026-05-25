/**
 * Microsoft Graph API client for Outlook Calendar integration
 * Provides functions to read and write calendar events for student availability
 */

export interface CalendarEvent {
  id: string;
  subject: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  location?: {
    displayName: string;
  };
  isAllDay: boolean;
  isCancelled: boolean;
  organizer?: {
    emailAddress: {
      name: string;
      address: string;
    };
  };
}

export interface CreateEventInput {
  subject: string;
  start: string; // ISO 8601 format
  end: string; // ISO 8601 format
  location?: string;
  body?: string;
  isAllDay?: boolean;
}

/**
 * Fetch user's calendar events within a date range
 */
export async function getCalendarEvents(
  accessToken: string,
  startDate: Date,
  endDate: Date
): Promise<CalendarEvent[]> {
  const startDateTime = startDate.toISOString();
  const endDateTime = endDate.toISOString();

  const response = await fetch(
    `https://graph.microsoft.com/v1.0/me/calendarview?startDateTime=${startDateTime}&endDateTime=${endDateTime}&$select=id,subject,start,end,location,isAllDay,isCancelled,organizer&$orderby=start/dateTime`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch calendar events: ${response.status} ${error}`);
  }

  const data = await response.json();
  return data.value as CalendarEvent[];
}

/**
 * Create a new calendar event
 */
export async function createCalendarEvent(
  accessToken: string,
  event: CreateEventInput
): Promise<CalendarEvent> {
  const eventData = {
    subject: event.subject,
    start: {
      dateTime: event.start,
      timeZone: "Asia/Manila", // Philippines timezone
    },
    end: {
      dateTime: event.end,
      timeZone: "Asia/Manila",
    },
    location: event.location
      ? {
          displayName: event.location,
        }
      : undefined,
    body: event.body
      ? {
          contentType: "HTML",
          content: event.body,
        }
      : undefined,
    isAllDay: event.isAllDay || false,
  };

  const response = await fetch(
    "https://graph.microsoft.com/v1.0/me/calendar/events",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventData),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create calendar event: ${response.status} ${error}`);
  }

  return await response.json();
}

/**
 * Get user's free/busy schedule for availability checking
 */
export async function getFreeBusySchedule(
  accessToken: string,
  startDate: Date,
  endDate: Date,
  emails: string[]
): Promise<any> {
  const response = await fetch(
    "https://graph.microsoft.com/v1.0/me/calendar/getSchedule",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        schedules: emails,
        startTime: {
          dateTime: startDate.toISOString(),
          timeZone: "Asia/Manila",
        },
        endTime: {
          dateTime: endDate.toISOString(),
          timeZone: "Asia/Manila",
        },
        availabilityViewInterval: 60, // 60-minute intervals
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch free/busy schedule: ${response.status} ${error}`);
  }

  return await response.json();
}

/**
 * Get user profile information
 */
export async function getUserProfile(accessToken: string) {
  const response = await fetch("https://graph.microsoft.com/v1.0/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch user profile: ${response.status} ${error}`);
  }

  return await response.json();
}
