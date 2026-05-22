import { NextRequest, NextResponse } from "next/server";
import { getUserAssessments, getUserCourses } from "@/lib/cosmos";
import { processNaturalLanguage } from "@/lib/ai-foundry";
import { requireUserId } from "@/lib/auth-session";
import { successResponse, errorResponse, logError } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = await requireUserId();
    const message: string = body.message;

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

    // Gather context for the AI
    const [courses, assessments] = await Promise.all([
      getUserCourses(userId),
      getUserAssessments(userId),
    ]);

    const context = {
      courses: courses.map((c) => ({
        id: c.id,
        name: c.name,
        term: c.term_label,
      })),
      assessments: assessments
        .filter((a) => a.review_state === "approved")
        .map((a) => ({
          id: a.id,
          title: a.title,
          due_at: a.due_at,
          is_major: a.is_major,
        })),
      assessment_count: assessments.length,
      course_count: courses.length,
    };

    // Process with AI
    const response = await processNaturalLanguage(message, context);

    return NextResponse.json(
      successResponse({
        message: response,
        context,
      })
    );
  } catch (error) {
    logError("Chat processing", error);
    return NextResponse.json(
      errorResponse("Failed to process message"),
      { status: 500 }
    );
  }
}
