import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth-session";
import { updateStudyBlock } from "@/lib/cosmos";
import { successResponse, errorResponse, logError } from "@/lib/utils";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ blockId: string }> }
) {
  try {
    const { blockId } = await params;
    const userId = await requireUserId();

    if (!userId) {
      return NextResponse.json(
        errorResponse("Unauthorized - Please sign in"),
        { status: 401 }
      );
    }

    const body = await request.json();
    const { state } = body;

    if (!state || !["proposed", "approved"].includes(state)) {
      return NextResponse.json(
        errorResponse("Invalid state. Must be 'proposed' or 'approved'."),
        { status: 400 }
      );
    }

    const updated = await updateStudyBlock(blockId, userId, { state });

    return NextResponse.json(successResponse({ block: updated }));
  } catch (error) {
    logError("Update study block", error);
    return NextResponse.json(
      errorResponse("Failed to update study block"),
      { status: 500 }
    );
  }
}
