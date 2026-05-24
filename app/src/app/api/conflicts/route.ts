import { NextRequest, NextResponse } from "next/server";
import { getUserAssessments } from "@/lib/cosmos";
import { requireUserId } from "@/lib/auth-session";
import { detectConflicts } from "@/lib/ai-foundry";
import { successResponse, errorResponse, logError } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const userId = await requireUserId();

    if (!userId) {
      return NextResponse.json(
        errorResponse("Unauthorized - Please sign in"),
        { status: 401 }
      );
    }

    console.log('[Conflicts] Loading assessments for user:', userId);

    // Get all user's assessments
    const assessments = await getUserAssessments(userId);

    console.log('[Conflicts] Found', assessments.length, 'assessments');

    if (assessments.length === 0) {
      return NextResponse.json(
        successResponse({
          conflicts: [],
          assessments: [],
          all_assessments: [],
          message: "No assessments found. Upload a syllabus first!",
        })
      );
    }

    // Filter only approved major assessments with dates
    const majorAssessments = assessments.filter(
      (a) => a.is_major && a.due_at && a.review_state === "approved"
    );

    console.log('[Conflicts] Found', majorAssessments.length, 'major assessments with dates');

    if (majorAssessments.length < 2) {
      return NextResponse.json(
        successResponse({
          conflicts: [],
          assessments: majorAssessments,
          all_assessments: assessments.filter((a) => a.review_state === "approved"),
          message: majorAssessments.length === 0 
            ? "No major assessments found yet."
            : "Not enough major assessments to detect conflicts (need at least 2).",
        })
      );
    }

    console.log('[Conflicts] Calling AI to detect conflicts...');

    // Detect conflicts using AI
    const result = await detectConflicts(majorAssessments);

    console.log('[Conflicts] AI returned', result.conflicts.length, 'conflicts');

    return NextResponse.json(
      successResponse({
        conflicts: result.conflicts,
        assessments: majorAssessments,
        all_assessments: assessments.filter((a) => a.review_state === "approved"),
        message:
          result.conflicts.length > 0
            ? `Found ${result.conflicts.length} conflict${result.conflicts.length !== 1 ? "s" : ""}`
            : "No conflicts detected — your deadlines are well-spaced!",
      })
    );
  } catch (error) {
    logError("Conflict detection", error);
    return NextResponse.json(
      errorResponse("Failed to detect conflicts", error instanceof Error ? error.message : undefined),
      { status: 500 }
    );
  }
}
