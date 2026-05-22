import { auth } from "@/auth";
import { getFreeBusySchedule } from "@/lib/microsoft-graph";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/calendar/availability
 * Get free/busy schedule for availability checking
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
    const { startDate, endDate, emails } = body;

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "startDate and endDate are required" },
        { status: 400 }
      );
    }

    // Default to current user's email if no emails provided
    const emailList = emails || [session.user?.email];

    const schedule = await getFreeBusySchedule(
      session.accessToken,
      new Date(startDate),
      new Date(endDate),
      emailList
    );

    return NextResponse.json({ schedule });
  } catch (error) {
    console.error("Error fetching availability:", error);
    return NextResponse.json(
      { error: "Failed to fetch availability" },
      { status: 500 }
    );
  }
}
