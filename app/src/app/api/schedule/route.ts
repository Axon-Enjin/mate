import { NextRequest, NextResponse } from "next/server";
import { getUserAssessments } from "@/lib/cosmos";
import { generateSchedule } from "@/lib/ai-foundry";
import { requireUserId } from "@/lib/auth-session";
import { successResponse, errorResponse, logError } from "@/lib/utils";
import type { AvailabilityInput } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = await requireUserId();
    const availability: AvailabilityInput = body.availability;

    if (!userId) {
      return NextResponse.json(
        errorResponse("Unauthorized - Please sign in"),
        { status: 401 }
      );
    }

    console.log('[Schedule] Generating schedule for user:', userId);
    console.log('[Schedule] Availability:', JSON.stringify(availability, null, 2));

    if (!availability) {
      return NextResponse.json(
        errorResponse("Availability information is required"),
        { status: 400 }
      );
    }

    // Get upcoming assessments
    const allAssessments = await getUserAssessments(userId);
    console.log('[Schedule] Found', allAssessments.length, 'total assessments');
    
    // Filter to upcoming assessments with dates
    const now = new Date();
    const upcomingAssessments = allAssessments.filter(
      (a) => a.due_at && new Date(a.due_at) > now && a.review_state === "approved"
    );

    console.log('[Schedule] Found', upcomingAssessments.length, 'upcoming assessments');

    if (upcomingAssessments.length === 0) {
      return NextResponse.json(
        successResponse({
          study_blocks: [],
          message: "No upcoming assessments found. Upload a syllabus first!",
        })
      );
    }

    console.log('[Schedule] Calling AI to generate schedule...');

    // Generate schedule using AI
    const result = await generateSchedule(upcomingAssessments, availability);

    console.log('[Schedule] AI returned', result.study_blocks.length, 'study blocks');

    return NextResponse.json(
      successResponse({
        study_blocks: result.study_blocks,
        message: result.message,
        assessments: upcomingAssessments,
      })
    );
  } catch (error) {
    logError("Schedule generation", error);
    return NextResponse.json(
      errorResponse("Failed to generate schedule", error instanceof Error ? error.message : undefined),
      { status: 500 }
    );
  }
}
