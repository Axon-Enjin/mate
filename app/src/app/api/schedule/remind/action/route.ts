import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth-session";
import { successResponse, errorResponse, logError } from "@/lib/utils";
import type { ReminderActionPayload } from "@/types";

function isPowerAutomateAuthorized(request: NextRequest): boolean {
  const expectedSecret = process.env.POWER_AUTOMATE_SECRET;

  if (!expectedSecret) {
    return false;
  }

  const authorization = request.headers.get("authorization");
  return authorization === `Bearer ${expectedSecret}`;
}

/**
 * POST /api/schedule/remind/action
 * Handle reminder actions (snooze, reschedule)
 */
export async function POST(request: NextRequest) {
  try {
    const payload: ReminderActionPayload = await request.json();
    const session = await auth();
    const isPowerAutomateRequest = isPowerAutomateAuthorized(request);
    const userId = session?.user?.id || payload.user_id;

    if (!isPowerAutomateRequest && !session?.user?.id) {
      const signedInUserId = await requireUserId();

      if (!signedInUserId || signedInUserId !== payload.user_id) {
        return NextResponse.json(
          errorResponse("Unauthorized - User ID mismatch"),
          { status: 403 }
        );
      }
    }

    if (!userId || userId !== payload.user_id) {
      return NextResponse.json(
        errorResponse("Unauthorized - User ID mismatch"),
        { status: 403 }
      );
    }

    if (!payload.action || !payload.study_block_id) {
      return NextResponse.json(
        errorResponse("action and study_block_id are required"),
        { status: 400 }
      );
    }

    console.log(
      `[Reminders] Received ${payload.action} action for block ${payload.study_block_id}`
    );

    let message = "";

    if (payload.action === "snooze") {
      const snoozeMinutes = payload.snooze_minutes || 15;
      message = `Study block snoozed for ${snoozeMinutes} minutes.`;
      console.log("[Reminders]", message);
    } else if (payload.action === "reschedule") {
      if (!payload.new_start_at || !payload.new_end_at) {
        return NextResponse.json(
          errorResponse("new_start_at and new_end_at required for reschedule"),
          { status: 400 }
        );
      }

      message = `Study block rescheduled to ${new Date(payload.new_start_at).toLocaleString("en-PH")}.`;
      console.log("[Reminders]", message);
    }

    return NextResponse.json(
      successResponse({
        action: payload.action,
        study_block_id: payload.study_block_id,
        message,
      })
    );
  } catch (error) {
    logError("Reminder action", error);
    return NextResponse.json(
      errorResponse("Failed to process reminder action", error instanceof Error ? error.message : undefined),
      { status: 500 }
    );
  }
}
