import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth-session";
import { successResponse, errorResponse, logError } from "@/lib/utils";

/**
 * POST /api/webhooks/study-block
 * Webhook endpoint for Power Automate integration
 * 
 * This endpoint receives study block events and forwards them to
 * the user's configured Power Automate webhook URL
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId();
    
    if (!userId) {
      return NextResponse.json(
        errorResponse("Unauthorized"),
        { status: 401 }
      );
    }

    const body = await request.json();
    const { study_block, assessment, action } = body;

    // Validate required fields
    if (!study_block || !action) {
      return NextResponse.json(
        errorResponse("Missing required fields: study_block, action"),
        { status: 400 }
      );
    }

    // Get user's Power Automate webhook URL
    // For now, use environment variable (later: store per-user in database)
    const webhookUrl = process.env.POWER_AUTOMATE_WEBHOOK_URL;

    if (!webhookUrl) {
      // Silently skip if webhook not configured (optional feature)
      console.log("Power Automate webhook not configured for user:", userId);
      return NextResponse.json(
        successResponse({
          message: "Webhook not configured (optional feature)",
          skipped: true,
        })
      );
    }

    // Prepare webhook payload
    const payload = {
      action, // "study_block_created", "study_block_approved", etc.
      user_id: userId,
      study_block: {
        id: study_block.id,
        start_at: study_block.start_at,
        end_at: study_block.end_at,
        state: study_block.state,
      },
      assessment: assessment ? {
        id: assessment.id,
        title: assessment.title,
        due_at: assessment.due_at,
        is_major: assessment.is_major,
      } : null,
      timestamp: new Date().toISOString(),
    };

    console.log("Sending webhook to Power Automate:", { action, userId, webhookUrl: webhookUrl.substring(0, 50) + "..." });

    // Send to Power Automate
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Power Automate webhook failed: ${response.status} ${errorText}`);
    }

    console.log("Webhook sent successfully to Power Automate");

    return NextResponse.json(
      successResponse({
        message: "Webhook sent successfully",
        action,
      })
    );
  } catch (error) {
    logError("Power Automate webhook", error);
    
    // Don't fail the main operation if webhook fails
    // This is an optional notification feature
    return NextResponse.json(
      successResponse({
        message: "Webhook failed but operation completed",
        error: error instanceof Error ? error.message : "Unknown error",
        skipped: true,
      })
    );
  }
}
