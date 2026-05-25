import { auth } from "@/auth";
import { getCalendarEvents, createCalendarEvent } from "@/lib/microsoft-graph";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/calendar/events
 * Fetch user's calendar events within a date range
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.accessToken) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "startDate and endDate query parameters are required" },
        { status: 400 }
      );
    }

    const events = await getCalendarEvents(
      session.accessToken,
      new Date(startDate),
      new Date(endDate)
    );

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    return NextResponse.json(
      { error: "Failed to fetch calendar events" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/calendar/events
 * Create a new calendar event
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.accessToken) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { subject, start, end, location, body: eventBody, isAllDay } = body;

    if (!subject || !start || !end) {
      return NextResponse.json(
        { error: "subject, start, and end are required" },
        { status: 400 }
      );
    }

    const event = await createCalendarEvent(session.accessToken, {
      subject,
      start,
      end,
      location,
      body: eventBody,
      isAllDay,
    });

    return NextResponse.json({ event });
  } catch (error) {
    console.error("Error creating calendar event:", error);
    return NextResponse.json(
      { error: "Failed to create calendar event" },
      { status: 500 }
    );
  }
}
