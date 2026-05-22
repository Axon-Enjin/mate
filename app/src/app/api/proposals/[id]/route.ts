import { NextRequest, NextResponse } from "next/server";
import { proposals } from "@/lib/proposals-store";
import { errorResponse, logError } from "@/lib/utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const proposal = proposals.get(id);

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
    const { id } = await params;
    const proposal = proposals.get(id);

    if (!proposal) {
      return NextResponse.json(
        errorResponse("Proposal not found"),
        { status: 404 }
      );
    }

    const updates = await request.json();
    
    // Update proposal
    const updatedProposal = {
      ...proposal,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    proposals.set(id, updatedProposal);

    return NextResponse.json(updatedProposal);
  } catch (error) {
    logError("Update proposal", error);
    return NextResponse.json(
      errorResponse("Internal server error"),
      { status: 500 }
    );
  }
}
