import { NextRequest, NextResponse } from "next/server";
import { proposals } from "@/lib/proposals-store";
import { createCourse, createAssessments } from "@/lib/cosmos";
import { detectConflicts } from "@/lib/ai-foundry";
import { successResponse, errorResponse, logError } from "@/lib/utils";
import type { Assessment } from "@/types";

export async function POST(
  _request: NextRequest,
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

    if (proposal.status !== "completed") {
      return NextResponse.json(
        errorResponse("Proposal is not ready for approval"),
        { status: 400 }
      );
    }

    // Check if any assessments still need review
    const needsReview = proposal.assessments?.some(
      (a: Assessment) => a.review_state === "needs_review"
    );

    if (needsReview) {
      return NextResponse.json(
        errorResponse("Some assessments still need review"),
        { status: 400 }
      );
    }

    // 1. Create course in Cosmos DB
    const course = await createCourse({
      user_id: proposal.user_id,
      name: proposal.course?.name || "Untitled Course",
      term_label: proposal.course?.term_label,
      source_doc_hash: proposal.filename, // Use filename as simple hash
    });

    // 2. Create assessments in Cosmos DB
    const assessmentsToCreate = proposal.assessments?.map((a: Assessment) => ({
      user_id: proposal.user_id,
      course_id: course.id,
      title: a.title,
      due_at: a.due_at,
      is_major: a.is_major,
      confidence: a.confidence,
      review_state: "approved" as const,
      evidence: a.evidence,
      approved_at: new Date().toISOString(),
      synced_targets: [], // Empty initially - will sync after approval
    })) || [];

    const createdAssessments = await createAssessments(assessmentsToCreate);

    // 3. Run conflict detection (async, don't block response)
    detectConflicts(createdAssessments).catch((error) => {
      logError("Conflict detection", error);
    });

    // 4. Update proposal status
    const approvedProposal = {
      ...proposal,
      status: "approved" as const,
      course_id: course.id,
      approved_at: new Date().toISOString(),
    };

    proposals.set(id, approvedProposal);

    return NextResponse.json(
      successResponse({
        proposal: approvedProposal,
        course,
        assessments: createdAssessments,
        message: `All ${createdAssessments.length} deadline${createdAssessments.length !== 1 ? "s" : ""} approved!`,
      })
    );
  } catch (error) {
    logError("Approve proposal", error);
    return NextResponse.json(
      errorResponse("Failed to approve proposal"),
      { status: 500 }
    );
  }
}
