import { auth } from "@/auth";
import { getOutlookBusyBlocks } from "@/lib/microsoft-graph";
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

    const body = await request.json().catch(() => ({}));
    const { startDate, endDate } = body;

    const windowStart = startDate ? new Date(startDate) : new Date();
    const windowEnd = endDate ? new Date(endDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const busyBlocks = await getOutlookBusyBlocks(
      session.accessToken,
      windowStart,
      windowEnd
    );

    return NextResponse.json({
      busy_blocks: busyBlocks,
      window: {
        startDate: windowStart.toISOString(),
        endDate: windowEnd.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching availability:", error);
    return NextResponse.json(
      { error: "Failed to fetch availability" },
      { status: 500 }
    );
  }
}
