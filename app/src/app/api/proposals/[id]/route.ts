import { NextRequest, NextResponse } from "next/server";
import { getProposal, updateProposal } from "@/lib/cosmos";
import { requireUserId } from "@/lib/auth-session";
import { errorResponse, logError } from "@/lib/utils";

export async function GET(
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

    const { id } = await params;
    const proposal = await getProposal(id, userId);

    if (!proposal) {
      return NextResponse.json(
        errorResponse("Proposal not found"),
        { status: 404 }
      );
    }

    return NextResponse.json(proposal);
  } catch (error) {
    logError("Get proposal", error);
    return NextResponse.json(
      errorResponse("Internal server error"),
      { status: 500 }
    );
  }
}

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

    const { id } = await params;
    const proposal = await getProposal(id, userId);

    if (!proposal) {
      return NextResponse.json(
        errorResponse("Proposal not found"),
        { status: 404 }
      );
    }

    const updates = await request.json();
    const updatedProposal = await updateProposal(id, userId, updates);

    return NextResponse.json(updatedProposal);
  } catch (error) {
    logError("Update proposal", error);
    return NextResponse.json(
      errorResponse("Internal server error"),
      { status: 500 }
    );
  }
}
