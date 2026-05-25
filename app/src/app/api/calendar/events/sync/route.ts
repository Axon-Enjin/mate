import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createCalendarEvent } from "@/lib/microsoft-graph";
import { getUserStudyBlocks, getUserAssessments } from "@/lib/cosmos";
import { requireUserId } from "@/lib/auth-session";
import { successResponse, errorResponse, logError } from "@/lib/utils";

/**
 * POST /api/calendar/events/sync
 * Sync approved study blocks to Outlook calendar
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = await requireUserId();

    if (!session || !session.accessToken) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "User ID not found" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { study_block_ids } = body;

    // Get all study blocks for the user
    const allStudyBlocks = await getUserStudyBlocks(userId);
    
    // Filter to only the requested blocks (or all approved blocks if none specified)
    const blocksToSync = study_block_ids && Array.isArray(study_block_ids)
      ? allStudyBlocks.filter((block) => 
          study_block_ids.includes(block.id) && block.state === "approved"
        )
      : allStudyBlocks.filter((block) => block.state === "approved");

    if (blocksToSync.length === 0) {
      return NextResponse.json(
        errorResponse("No approved study blocks to sync"),
        { status: 400 }
      );
    }

    // Get assessments to enrich event titles
    const assessments = await getUserAssessments(userId);
    const assessmentMap = new Map(assessments.map((a) => [a.id, a]));

    // Create calendar events for each study block
    const results = await Promise.allSettled(
      blocksToSync.map(async (block) => {
        const assessment = block.assessment_id 
          ? assessmentMap.get(block.assessment_id)
          : null;
        
        const title = assessment 
          ? `Study: ${assessment.title}`
          : "Study Session";
        
        const description = assessment
          ? `Study session for ${assessment.title}${assessment.due_at ? ` (Due: ${new Date(assessment.due_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })})` : ""}`
          : "Study session scheduled by Mate";

        const event = await createCalendarEvent(session.accessToken, {
          subject: title,
          start: block.start_at,
          end: block.end_at,
          body: description,
          location: "Study Time",
        });

        return {
          study_block_id: block.id,
          calendar_event_id: event.id,
          title,
        };
      })
    );

    const successful = results.filter((r) => r.status === "fulfilled");
    const failed = results.filter((r) => r.status === "rejected");

    return NextResponse.json(
      successResponse({
        synced_count: successful.length,
        failed_count: failed.length,
        events: successful.map((r) => (r as PromiseFulfilledResult<any>).value),
        message: `Successfully synced ${successful.length} study block${successful.length === 1 ? "" : "s"} to your Outlook calendar!`,
      })
    );
  } catch (error) {
    logError("Calendar sync", error);
    return NextResponse.json(
      errorResponse("Failed to sync to Outlook calendar"),
      { status: 500 }
    );
  }
}
