import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sendAdaptiveCard, buildStudyReminderCard, sendChatMessage } from "@/lib/microsoft-teams";
import { getUserStudyBlocks, getUserAssessments } from "@/lib/cosmos";
import { requireUserId } from "@/lib/auth-session";
import { successResponse, errorResponse, logError } from "@/lib/utils";

/**
 * POST /api/teams/reminder
 * Send a Teams reminder for an upcoming study session
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = await requireUserId();

    if (!session || !session.accessToken) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in with Microsoft" },
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
    const { study_block_id } = body;

    if (!study_block_id) {
      return NextResponse.json(
        errorResponse("study_block_id is required"),
        { status: 400 }
      );
    }

    // Get the study block
    const studyBlocks = await getUserStudyBlocks(userId);
    const studyBlock = studyBlocks.find((block) => block.id === study_block_id);

    if (!studyBlock) {
      return NextResponse.json(
        errorResponse("Study block not found"),
        { status: 404 }
      );
    }

    // Get assessment details
    const assessments = await getUserAssessments(userId);
    const assessment = studyBlock.assessment_id
      ? assessments.find((a) => a.id === studyBlock.assessment_id)
      : null;

    const assessmentTitle = assessment
      ? `Study: ${assessment.title}`
      : "Study Session";

    const startDate = new Date(studyBlock.start_at);
    const endDate = new Date(studyBlock.end_at);
    
    const timeString = `${startDate.toLocaleTimeString("en-PH", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })} - ${endDate.toLocaleTimeString("en-PH", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })}`;

    const dateString = startDate.toLocaleDateString("en-PH", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });

    // Try to send as Adaptive Card first, fall back to simple message
    let message;
    try {
      const card = buildStudyReminderCard(
        assessmentTitle,
        studyBlock.start_at,
        studyBlock.end_at,
        assessment?.due_at || undefined
      );
      message = await sendAdaptiveCard(session.accessToken, card);
    } catch (cardError) {
      console.log("Adaptive card failed, trying simple message:", cardError);
      
      // Fall back to simple text message
      const simpleMessage = `📚 Study Session Reminder\n\n${assessmentTitle}\n📅 ${dateString}\n⏰ ${timeString}${
        assessment?.due_at
          ? `\n📌 Due: ${new Date(assessment.due_at).toLocaleDateString("en-PH", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}`
          : ""
      }\n\nYour study session is coming up soon. Good luck! 🎓`;
      
      message = await sendChatMessage(session.accessToken, simpleMessage, "text");
    }

    return NextResponse.json(
      successResponse({
        message_id: message.id,
        message: "Reminder sent to Microsoft Teams!",
      })
    );
  } catch (error) {
    logError("Teams reminder", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    // Check if it's a permissions error
    if (errorMessage.includes("403") || errorMessage.includes("Forbidden")) {
      return NextResponse.json(
        errorResponse(
          "Teams permissions not granted. Please sign out and sign in again to grant Teams access."
        ),
        { status: 403 }
      );
    }

    // Check if it's a chat-related error
    if (errorMessage.includes("chat") || errorMessage.includes("Chat")) {
      return NextResponse.json(
        errorResponse(
          "Unable to send Teams message. This feature requires additional Microsoft Teams permissions that may not be available in your organization."
        ),
        { status: 400 }
      );
    }

    return NextResponse.json(
      errorResponse(`Failed to send Teams reminder: ${errorMessage}`),
      { status: 500 }
    );
  }
}
