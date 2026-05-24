import { NextRequest, NextResponse } from "next/server";
import { getUserAssessments, getUserCourses } from "@/lib/cosmos";
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

    const [courses, assessments] = await Promise.all([
      getUserCourses(userId),
      getUserAssessments(userId),
    ]);

    const approvedAssessments = assessments.filter(
      (a) => a.review_state === "approved"
    );

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
      assessment_count: approvedAssessments.length,
      course_count: courses.length,
    };

    const analysis = await processNaturalLanguage(message.trim(), context, history);

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
    return NextResponse.json(
      errorResponse("Failed to process message"),
      { status: 500 }
    );
  }
}
