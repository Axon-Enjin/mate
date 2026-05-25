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
  calendar_id?: string;
  calendar_name?: string;
  organizer?: {
    emailAddress: {
      name: string;
      address: string;
    };
  };
}

export interface CalendarInfo {
  id: string;
  name: string;
  isDefaultCalendar?: boolean;
  canEdit?: boolean;
  canShare?: boolean;
  canViewPrivateItems?: boolean;
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
 * List all calendars the user can access
 */
export async function getCalendars(accessToken: string): Promise<CalendarInfo[]> {
  const response = await fetch(
    "https://graph.microsoft.com/v1.0/me/calendars?$select=id,name,isDefaultCalendar,canEdit,canShare,canViewPrivateItems",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch calendars: ${response.status} ${error}`);
  }

  const data = await response.json();
  return data.value as CalendarInfo[];
}

/**
 * Fetch calendar events for a specific calendar
 */
export async function getCalendarView(
  accessToken: string,
  calendarId: string,
  startDate: Date,
  endDate: Date
): Promise<CalendarEvent[]> {
  const startDateTime = startDate.toISOString();
  const endDateTime = endDate.toISOString();

  const response = await fetch(
    `https://graph.microsoft.com/v1.0/me/calendars/${calendarId}/calendarView?startDateTime=${startDateTime}&endDateTime=${endDateTime}&$select=id,subject,start,end,location,isAllDay,isCancelled,organizer&$orderby=start/dateTime`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch calendar view: ${response.status} ${error}`);
  }

  const data = await response.json();
  return data.value as CalendarEvent[];
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
 * Fetch events from all calendars and annotate with calendar metadata
 */
export async function getAllCalendarEvents(
  accessToken: string,
  startDate: Date,
  endDate: Date
): Promise<CalendarEvent[]> {
  const calendars = await getCalendars(accessToken);
  const results = await Promise.all(
    calendars.map(async (calendar) => {
      const events = await getCalendarView(accessToken, calendar.id, startDate, endDate);
      return events.map((event) => ({
        ...event,
        calendar_id: calendar.id,
        calendar_name: calendar.name,
      }));
    })
  );

  return results.flat();
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
 * Convert calendar events into merged busy blocks
 */
export function mergeBusyBlocks(events: CalendarEvent[]): import("@/types").BusyBlock[] {
  const blocks = events
    .filter((event) => !event.isCancelled)
    .map((event) => ({
      start_at: event.start.dateTime,
      end_at: event.end.dateTime,
      source: "outlook" as const,
      is_all_day: event.isAllDay,
      calendar_id: event.calendar_id,
      calendar_name: event.calendar_name,
    }))
    .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());

  if (blocks.length === 0) {
    return [];
  }

  const merged: typeof blocks = [];
  let current = { ...blocks[0] };

  for (let i = 1; i < blocks.length; i += 1) {
    const next = blocks[i];
    const currentEnd = new Date(current.end_at).getTime();
    const nextStart = new Date(next.start_at).getTime();
    const nextEnd = new Date(next.end_at).getTime();

    if (nextStart <= currentEnd) {
      if (nextEnd > currentEnd) {
        current.end_at = next.end_at;
      }
      current.is_all_day = current.is_all_day || next.is_all_day;
      continue;
    }

    merged.push(current);
    current = { ...next };
  }

  merged.push(current);
  return merged;
}

/**
 * Fetch merged busy blocks from all calendars
 */
export async function getOutlookBusyBlocks(
  accessToken: string,
  startDate: Date,
  endDate: Date
): Promise<import("@/types").BusyBlock[]> {
  const events = await getAllCalendarEvents(accessToken, startDate, endDate);
  return mergeBusyBlocks(events);
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
