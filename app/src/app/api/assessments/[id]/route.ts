import { NextRequest, NextResponse } from "next/server";
import { getAssessment, updateAssessment, deleteAssessment } from "@/lib/cosmos";
import { requireUserId } from "@/lib/auth-session";
import { successResponse, errorResponse, logError, isValidISODate } from "@/lib/utils";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId();

    if (!userId) {
      return NextResponse.json(
        errorResponse("Unauthorized - Please sign in"),
        { status: 401 }
      );
    }

    const { id: assessmentId } = await params;
    const body = await request.json();

    const existing = await getAssessment(assessmentId, userId);
    if (!existing) {
      return NextResponse.json(
        errorResponse("Deadline not found"),
        { status: 404 }
      );
    }

    const updates: {
      title?: string;
      due_at?: string | null;
      is_major?: boolean;
    } = {};

    if (typeof body.title === "string" && body.title.trim()) {
      updates.title = body.title.trim();
    }

    if (body.due_at === null) {
      updates.due_at = null;
    } else if (typeof body.due_at === "string") {
      if (!isValidISODate(body.due_at)) {
        return NextResponse.json(
          errorResponse("Invalid date format"),
          { status: 400 }
        );
      }
      updates.due_at = body.due_at;
    }

    if (typeof body.is_major === "boolean") {
      updates.is_major = body.is_major;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        errorResponse("No valid fields to update"),
        { status: 400 }
      );
    }

    const updated = await updateAssessment(assessmentId, userId, updates);

    return NextResponse.json(
      successResponse({
        assessment: updated,
        message: "Deadline updated.",
      })
    );
  } catch (error) {
    logError("Update assessment", error);
    return NextResponse.json(
      errorResponse("Failed to update deadline"),
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId();

    if (!userId) {
      return NextResponse.json(
        errorResponse("Unauthorized - Please sign in"),
        { status: 401 }
      );
    }

    const { id: assessmentId } = await params;

    const existing = await getAssessment(assessmentId, userId);
    if (!existing) {
      return NextResponse.json(
        errorResponse("Deadline not found"),
        { status: 404 }
      );
    }

    await deleteAssessment(assessmentId, userId);

    return NextResponse.json(
      successResponse({
        assessment_id: assessmentId,
        message: "Deadline removed.",
      })
    );
  } catch (error) {
    logError("Delete assessment", error);
    return NextResponse.json(
      errorResponse("Failed to remove deadline"),
      { status: 500 }
    );
  }
}
