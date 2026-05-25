import { NextRequest, NextResponse } from "next/server";
import { approvingLocks } from "@/lib/proposals-store";
import { createCourse, createAssessments, getProposal, updateProposal } from "@/lib/cosmos";
import { detectConflicts } from "@/lib/ai-foundry";
import { requireUserId } from "@/lib/auth-session";
import { successResponse, errorResponse, logError } from "@/lib/utils";
import type { Assessment } from "@/types";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let userId: string | null = null;

  try {
    userId = await requireUserId();
    if (!userId) {
      return NextResponse.json(
        errorResponse("Unauthorized - Please sign in"),
        { status: 401 }
      );
    }

    const proposal = await getProposal(id, userId);

    if (!proposal) {
      return NextResponse.json(
        errorResponse("Proposal not found"),
        { status: 404 }
      );
    }

    // Idempotent: already approved — do not write to Cosmos again
    if (proposal.status === "approved") {
      return NextResponse.json(
        successResponse({
          proposal,
          course_id: proposal.course_id,
          assessments: proposal.assessments ?? [],
          message: "These deadlines were already approved.",
          already_approved: true,
        })
      );
    }

    if (proposal.status === "approving" || approvingLocks.has(id)) {
      return NextResponse.json(
        errorResponse("Approval already in progress"),
        { status: 409 }
      );
    }

    if (proposal.status !== "completed") {
      return NextResponse.json(
        errorResponse("Proposal is not ready for approval"),
        { status: 400 }
      );
    }

    const needsReview = proposal.assessments?.some(
      (a: Assessment) => a.review_state === "needs_review"
    );

    if (needsReview) {
      return NextResponse.json(
        errorResponse("Some assessments still need review"),
        { status: 400 }
      );
    }

    // Lock immediately so a second click cannot slip through
    approvingLocks.add(id);
    await updateProposal(id, userId, { status: "approving" });

    const course = await createCourse({
      user_id: proposal.user_id,
      name: proposal.course?.name || "Untitled Course",
      term_label: proposal.course?.term_label,
      source_doc_hash: proposal.filename,
    });

    const assessmentsToCreate =
      proposal.assessments?.map((a: Assessment) => ({
        user_id: proposal.user_id,
        course_id: course.id,
        title: a.title,
        due_at: a.due_at,
        is_major: a.is_major,
        confidence: a.confidence,
        review_state: "approved" as const,
        evidence: a.evidence,
        approved_at: new Date().toISOString(),
        synced_targets: [],
      })) || [];

    const createdAssessments = await createAssessments(assessmentsToCreate);

    detectConflicts(createdAssessments).catch((error) => {
      logError("Conflict detection", error);
    });

    const approvedProposal = await updateProposal(id, userId, {
      status: "approved" as const,
      course_id: course.id,
      approved_at: new Date().toISOString(),
    });

    return NextResponse.json(
      successResponse({
        proposal: approvedProposal,
        course,
        assessments: createdAssessments,
        message: `All ${createdAssessments.length} deadline${createdAssessments.length !== 1 ? "s" : ""} approved!`,
        already_approved: false,
      })
    );
  } catch (error) {
    logError("Approve proposal", error);

    if (userId) {
      try {
        const failed = await getProposal(id, userId);
        if (failed?.status === "approving") {
          await updateProposal(id, userId, { status: "completed" });
        }
      } catch (dbErr) {
        logError("Failed to reset proposal status in catch", dbErr);
      }
    }

    return NextResponse.json(
      errorResponse("Failed to approve proposal"),
      { status: 500 }
    );
  } finally {
    approvingLocks.delete(id);
  }
}
