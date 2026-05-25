import { NextRequest, NextResponse } from "next/server";
import { getUserAssessments, getUserCourses, getUserStudyBlocks } from "@/lib/cosmos";
import { processNaturalLanguage, detectConflicts, generateSchedule } from "@/lib/ai-foundry";
import { requireUserId } from "@/lib/auth-session";
import { successResponse, errorResponse, logError } from "@/lib/utils";
import type { Assessment, ChatResponseData, ChatTurn } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = await requireUserId();
    const message: string = body.message;
    const history: ChatTurn[] = Array.isArray(body.history) ? body.history : [];

    if (!userId) {
      return NextResponse.json(
        errorResponse("Unauthorized - Please sign in"),
        { status: 401 }
      );
    }

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        errorResponse("Message is required"),
        { status: 400 }
      );
    }

    const trimmedMessage = message.trim();
    const isPromptInjection =
      /\bignore (all|any|previous|prior) instructions\b/i.test(trimmedMessage) ||
      /\b(system|developer) prompt\b/i.test(trimmedMessage) ||
      /\bdeveloper message\b/i.test(trimmedMessage) ||
      /\bjailbreak\b/i.test(trimmedMessage) ||
      /\bprompt injection\b/i.test(trimmedMessage) ||
      /\breveal (the )?(prompt|instructions)\b/i.test(trimmedMessage) ||
      /\bbypass (the )?rules\b/i.test(trimmedMessage);

    const isLikelyAcademic =
      /\b(deadline|due|syllabus|schedule|exam|quiz|project|assignment|assessment|conflict|study|plan|week|semester|class|course)\b/i.test(
        trimmedMessage
      );

    const isGreetingOrPolite =
      /\b(hi|hello|hey|yo|greetings|good\s+morning|good\s+afternoon|good\s+evening|whats\s+up|what's\s+up|howdy|whats\s+good|what's\s+good|kamusta|kumusta|salamat|thanks|thank\s+you|who\s+are\s+you|what\s+can\s+you\s+do|help)\b/i.test(
        trimmedMessage
      ) || trimmedMessage.length <= 15;

    if (isPromptInjection || (!isLikelyAcademic && !isGreetingOrPolite)) {
      return NextResponse.json(
        successResponse({
          message:
            "I can only help with deadlines, conflicts, and study plans. Ask about what's due, conflicts, or your weekly schedule.",
          intent: "general",
        }),
        { status: 200 }
      );
    }

    const [courses, assessments, studyBlocks] = await Promise.all([
      getUserCourses(userId),
      getUserAssessments(userId),
      getUserStudyBlocks(userId),
    ]);

    const approvedAssessments = assessments.filter(
      (a) => a.review_state === "approved"
    );

    // Get upcoming study blocks (approved or proposed)
    const now = new Date();
    const upcomingStudyBlocks = studyBlocks
      .filter((block) => new Date(block.start_at) > now)
      .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())
      .slice(0, 10); // Limit to next 10 blocks

    // Detect conflicts
    const majorAssessments = approvedAssessments.filter(
      (a) => a.is_major && a.due_at
    );
    let conflictWindows: any[] = [];
    if (majorAssessments.length >= 2) {
      const conflictResult = await detectConflicts(majorAssessments);
      conflictWindows = conflictResult.conflicts;
    }

    const context = {
      courses: courses.map((c) => ({
        id: c.id,
        name: c.name,
        term: c.term_label,
      })),
      assessments: approvedAssessments.map((a) => ({
        id: a.id,
        title: a.title,
        due_at: a.due_at,
        is_major: a.is_major,
      })),
      study_blocks: upcomingStudyBlocks.map((block) => {
        const assessment = approvedAssessments.find((a) => a.id === block.assessment_id);
        return {
          id: block.id,
          assessment_title: assessment?.title || "Study session",
          start_at: block.start_at,
          end_at: block.end_at,
          state: block.state,
        };
      }),
      conflicts: conflictWindows.map((conflict) => ({
        start_date: conflict.start_date,
        end_date: conflict.end_date,
        assessment_count: conflict.assessment_ids?.length || 0,
        severity: conflict.severity,
      })),
      assessment_count: approvedAssessments.length,
      course_count: courses.length,
      study_block_count: upcomingStudyBlocks.length,
      conflict_count: conflictWindows.length,
    };

    let analysis;
    try {
      analysis = await processNaturalLanguage(trimmedMessage, context, history);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("content_filter") || msg.includes("content management policy")) {
        return NextResponse.json(
          successResponse({
            message:
              "I can only help with deadlines, conflicts, and study plans. Ask about what's due, conflicts, or your weekly schedule.",
            intent: "general",
          }),
          { status: 200 }
        );
      }
      throw err;
    }

    const responseData: ChatResponseData = {
      message: analysis.reply,
      intent: analysis.intent,
    };

    const shouldCheckConflicts =
      analysis.intent === "conflicts" ||
      /conflict|collision|same week|overlap/i.test(message);

    if (shouldCheckConflicts && approvedAssessments.length >= 2) {
      const majorAssessments = approvedAssessments.filter(
        (a) => a.is_major && a.due_at
      );

      if (majorAssessments.length >= 2) {
        const conflictResult = await detectConflicts(majorAssessments);
        responseData.conflicts = conflictResult.conflicts;

        if (conflictResult.conflicts.length === 0 && analysis.intent === "conflicts") {
          responseData.message =
            "Good news — your major deadlines look well-spaced right now. No collision weeks detected.";
        }
      } else if (analysis.intent === "conflicts") {
        responseData.message =
          "I need at least two major deadlines with dates to check for conflicts. Upload and approve more syllabi first.";
      }
    }

    const shouldGenerateSchedule =
      (analysis.ready_to_schedule && analysis.availability) ||
      (analysis.intent === "schedule" && analysis.availability);

    if (shouldGenerateSchedule && analysis.availability) {
      const now = new Date();
      const upcomingAssessments = approvedAssessments.filter(
        (a) => a.due_at && new Date(a.due_at) > now
      ) as Assessment[];

      if (upcomingAssessments.length === 0) {
        responseData.message =
          "I don't see any upcoming approved deadlines yet. Upload a syllabus and approve your dates first.";
      } else {
        const scheduleResult = await generateSchedule(
          upcomingAssessments,
          analysis.availability
        );
        responseData.study_blocks = scheduleResult.study_blocks;
        responseData.schedule_message = scheduleResult.message;
        responseData.message = `${analysis.reply}\n\n${scheduleResult.message}`;
      }
    }

    return NextResponse.json(successResponse(responseData));
  } catch (error) {
    logError("Chat processing", error);
    if (error instanceof Error) {
      const message = error.message || "";
      if (
        message.includes("fetch failed") ||
        message.includes("Connect Timeout") ||
        message.includes("UND_ERR_CONNECT_TIMEOUT")
      ) {
        return NextResponse.json(
          successResponse({
            message:
              "I'm having trouble reaching the AI service right now. Please try again in a minute.",
            intent: "general",
          }),
          { status: 200 }
        );
      }
    }
    return NextResponse.json(
      errorResponse("Failed to process message"),
      { status: 500 }
    );
  }
}
