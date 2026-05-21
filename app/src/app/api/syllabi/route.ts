import { NextRequest, NextResponse } from "next/server";
import { extractFromDocument } from "@/lib/ai-foundry";
import { successResponse, errorResponse, logError, getErrorMessage } from "@/lib/utils";
import { proposals } from "@/lib/proposals-store";
import type { Proposal } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string || "demo-user"; // TODO: Get from auth

    if (!file) {
      return NextResponse.json(
        errorResponse("No file provided"),
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        errorResponse("Invalid file type. Please upload PDF or DOC files."),
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        errorResponse("File too large. Maximum size is 10MB."),
        { status: 400 }
      );
    }

    // Generate proposal ID
    const proposalId = crypto.randomUUID();

    // Store initial proposal state
    const initialProposal: Proposal = {
      id: proposalId,
      user_id: userId,
      filename: file.name,
      status: "processing",
      created_at: new Date().toISOString(),
    };
    
    proposals.set(proposalId, initialProposal);

    // Start async extraction (don't await - return immediately)
    processExtraction(proposalId, file, userId).catch((error) => {
      logError("Extraction processing", error);
      const failedProposal: Proposal = {
        ...initialProposal,
        status: "failed",
        error: getErrorMessage(error),
      };
      proposals.set(proposalId, failedProposal);
    });

    // Return immediate acknowledgment (latency mask)
    return NextResponse.json(
      successResponse({
        proposalId,
        message: "Got it! Reading your syllabus now...",
      })
    );
  } catch (error) {
    logError("Syllabus upload", error);
    return NextResponse.json(
      errorResponse("Internal server error"),
      { status: 500 }
    );
  }
}

async function processExtraction(proposalId: string, file: File, userId: string) {
  try {
    // Read file content
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Extract text from PDF
    let documentContent: string;
    if (file.type === 'application/pdf') {
      const { extractAndCleanPDF } = await import('@/lib/pdf-extractor');
      documentContent = await extractAndCleanPDF(buffer);
    } else {
      // For DOC/DOCX, we'll need a different approach
      // For now, just convert to string (will need proper extraction later)
      documentContent = buffer.toString('utf-8');
    }

    if (!documentContent.trim()) {
      throw new Error("No text could be extracted from the file. Try a text-based PDF.");
    }

    // Extract using AI Foundry
    const extractionResult = await extractFromDocument(documentContent);

    // Map extraction result to proposal format
    const completedProposal: Proposal = {
      id: proposalId,
      user_id: userId,
      filename: file.name,
      status: "completed",
      created_at: proposals.get(proposalId)?.created_at || new Date().toISOString(),
      course: extractionResult.course,
      assessments: extractionResult.assessments.map((a) => ({
        id: crypto.randomUUID(),
        user_id: userId,
        course_id: "", // Will be set after course creation
        title: a.title,
        due_at: a.due_at,
        is_major: a.is_major,
        confidence: a.confidence,
        review_state: a.review_state,
        evidence: a.evidence,
        synced_targets: [], // Empty initially
      })),
      tier_used: extractionResult.tier_used,
      aggregate_confidence: extractionResult.aggregate_confidence,
    };

    proposals.set(proposalId, completedProposal);
  } catch (error) {
    logError(`Extraction for proposal ${proposalId}`, error);
    const failedProposal: Proposal = {
      id: proposalId,
      user_id: userId,
      filename: file.name,
      status: "failed",
      created_at: proposals.get(proposalId)?.created_at || new Date().toISOString(),
      error: getErrorMessage(error),
    };
    proposals.set(proposalId, failedProposal);
  }
}
