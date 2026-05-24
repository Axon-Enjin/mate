import { NextRequest, NextResponse } from "next/server";
import { deleteCourseWithAssessments } from "@/lib/cosmos";
import { requireUserId } from "@/lib/auth-session";
import { successResponse, errorResponse, logError } from "@/lib/utils";

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

    const { id: courseId } = await params;

    const result = await deleteCourseWithAssessments(courseId, userId);

    return NextResponse.json(
      successResponse({
        course_id: courseId,
        deleted_assessments: result.deleted_assessments,
        message: `Removed syllabus and ${result.deleted_assessments} deadline${result.deleted_assessments !== 1 ? "s" : ""}.`,
      })
    );
  } catch (error) {
    logError("Delete course", error);
    return NextResponse.json(
      errorResponse(
        "Failed to remove syllabus",
        error instanceof Error ? error.message : undefined
      ),
      { status: 500 }
    );
  }
}
