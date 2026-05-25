import { NextRequest, NextResponse } from "next/server";
import { extractFromDocument } from "@/lib/ai-foundry";
import { successResponse, errorResponse, logError, getErrorMessage } from "@/lib/utils";
import { createProposal, updateProposal, getProposal, generateDocumentHash, getCourseByHash } from "@/lib/cosmos";
import { requireUserId } from "@/lib/auth-session";
import type { Proposal } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId();

    if (!userId) {
      return NextResponse.json(
        errorResponse("Unauthorized - Please sign in"),
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

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

    // Read file buffer early for hash + extraction
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Deduplication: check if this exact file was already uploaded
    const fileHash = generateDocumentHash(buffer);
    const existingCourse = await getCourseByHash(userId, fileHash);
    if (existingCourse) {
      return NextResponse.json(
        successResponse({
          duplicate: true,
          existingCourseId: existingCourse.id,
          message: `This syllabus has already been uploaded (${existingCourse.name}).`,
        }),
        { status: 409 }
      );
    }

    // Store initial proposal state
    const initialProposal: Proposal = {
      id: proposalId,
      user_id: userId,
      filename: file.name,
      status: "processing",
      created_at: new Date().toISOString(),
    };
    
    await createProposal(initialProposal);

    // Start async extraction (don't await - return immediately)
    // Pass pre-read buffer to avoid re-reading
    processExtraction(proposalId, file, userId, buffer).catch((error) => {
      logError("Extraction processing", error);
      updateProposal(proposalId, userId, {
        status: "failed",
        error: getErrorMessage(error),
      }).catch((dbErr) => logError("Update proposal failure in catch", dbErr));
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

async function processExtraction(proposalId: string, file: File, userId: string, preReadBuffer?: Buffer) {
  try {
    console.log('[Extraction] 🚀 Starting for proposal:', proposalId);
    console.log('[Extraction] File:', file.name, file.type, file.size, 'bytes');
    
    // Read file content (use pre-read buffer if available from dedup check)
    const buffer = preReadBuffer ?? Buffer.from(await file.arrayBuffer());
    console.log('[Extraction] ✅ Buffer ready, size:', buffer.length);
    
    // Extract text from document
    let documentContent: string;
    if (file.type === 'application/pdf') {
      console.log('[Extraction] 📄 PDF detected, extracting text...');
      const { extractAndCleanPDF } = await import('@/lib/pdf-extractor');
      documentContent = await extractAndCleanPDF(buffer);
      console.log('[Extraction] ✅ Text extracted, length:', documentContent.length);
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      console.log('[Extraction] 📝 DOCX detected, extracting via mammoth...');
      const mammoth = await import('mammoth');
      const { value } = await mammoth.extractRawText({ buffer });
      documentContent = value;
      console.log('[Extraction] ✅ DOCX text extracted, length:', documentContent.length);
    } else {
      // Legacy .doc — best-effort UTF-8 (usually unreadable; user warned in UI)
      console.log('[Extraction] ⚠️ Legacy .doc format — attempting UTF-8 fallback...');
      documentContent = buffer.toString('utf-8');
    }

    if (!documentContent.trim()) {
      throw new Error("No text could be extracted from the file. Try a text-based PDF.");
    }

    console.log('[Extraction] 🤖 Calling AI Foundry...');
    // Extract using AI Foundry
    const extractionResult = await extractFromDocument(documentContent);
    console.log('[Extraction] ✅ AI extraction complete, found', extractionResult.assessments.length, 'assessments');

    // Map extraction result to proposal format
    const completedProposal: Partial<Proposal> = {
      status: "completed",
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
 
    await updateProposal(proposalId, userId, completedProposal);
    console.log('[Extraction] ✅ Proposal completed');
  } catch (error) {
    console.error('[Extraction] ❌ Failed:', error);
    logError(`Extraction for proposal ${proposalId}`, error);
    try {
      await updateProposal(proposalId, userId, {
        status: "failed",
        error: getErrorMessage(error),
      });
    } catch (dbError) {
      logError("Failed to update proposal failure status", dbError);
    }
  }
}
