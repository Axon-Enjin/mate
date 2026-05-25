import { auth } from "@/auth";
import { getUserStudyBlocks } from "@/lib/cosmos";
import { errorResponse, successResponse, logError } from "@/lib/utils";
import type { ReminderCandidate, ReminderListResponse, StudyBlock } from "@/types";
import { NextRequest, NextResponse } from "next/server";

const DEFAULT_REMINDER_WINDOW_MINUTES = 30;

function buildReminderKey(block: StudyBlock, windowMinutes: number) {
  return `${block.id}:${block.start_at}:${windowMinutes}`;
}

function isDueWithinWindow(startAt: string, windowStart: Date, windowEnd: Date) {
  const startTime = new Date(startAt).getTime();
  return startTime >= windowStart.getTime() && startTime <= windowEnd.getTime();
}

function isPowerAutomateAuthorized(request: NextRequest): boolean {
  const expectedSecret = process.env.POWER_AUTOMATE_SECRET;

  if (!expectedSecret) {
    return false;
  }

  const authorization = request.headers.get("authorization");
  return authorization === `Bearer ${expectedSecret}`;
}

/**
 * GET /api/schedule/reminders
 * Returns study blocks that are due for reminder soon.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const isPowerAutomateRequest = isPowerAutomateAuthorized(request);
    const userId = session?.user?.id || request.nextUrl.searchParams.get("userId");

    if (!isPowerAutomateRequest && !session?.user?.id) {
      return NextResponse.json(
        errorResponse("Unauthorized - Please sign in"),
        { status: 401 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        errorResponse("userId is required when using Power Automate auth"),
        { status: 400 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const minutesBeforeStart = Number(
      searchParams.get("minutesBeforeStart") || DEFAULT_REMINDER_WINDOW_MINUTES
    );
    const lookaheadMinutes = Number(
      searchParams.get("lookaheadMinutes") || DEFAULT_REMINDER_WINDOW_MINUTES
    );

    const now = new Date();
    const windowStart = new Date(now.getTime());
    const windowEnd = new Date(now.getTime() + lookaheadMinutes * 60 * 1000);

    const studyBlocks = await getUserStudyBlocks(userId);
    const reminders: ReminderCandidate[] = studyBlocks
      .filter((block) => block.state === "approved" || block.state === "proposed")
      .filter((block) => isDueWithinWindow(block.start_at, windowStart, windowEnd))
      .map((block) => ({
        reminder_key: buildReminderKey(block, minutesBeforeStart),
        study_block_id: block.id,
        user_id: block.user_id,
        assessment_id: block.assessment_id,
        start_at: block.start_at,
        end_at: block.end_at,
        description: `Study block starting at ${new Date(block.start_at).toLocaleTimeString("en-PH", {
          hour: "2-digit",
          minute: "2-digit",
        })}`,
        reminder_window_minutes: minutesBeforeStart,
      }));

    const response: ReminderListResponse = {
      reminder_window: {
        start_at: windowStart.toISOString(),
        end_at: windowEnd.toISOString(),
        minutes_before_start: minutesBeforeStart,
      },
      reminders,
    };

    return NextResponse.json(successResponse(response));
  } catch (error) {
    logError("Reminder list", error);
    return NextResponse.json(
      errorResponse("Failed to fetch reminders", error instanceof Error ? error.message : undefined),
      { status: 500 }
    );
  }
}