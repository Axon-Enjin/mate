"use client";

import { useState } from "react";
import type { Proposal, Assessment } from "@/types";

interface ExtractionReviewProps {
  proposal: Proposal;
  onApprove: () => void;
  onEdit: (assessmentId: string, updates: Partial<Assessment>) => void;
}

export default function ExtractionReview({
  proposal,
  onApprove,
  onEdit,
}: ExtractionReviewProps) {
  const [showMetrics, setShowMetrics] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  if (!proposal.assessments || proposal.assessments.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-lg shadow-sm p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface-emphasis mb-4">
          <svg className="w-8 h-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-text mb-2">No assessments found</h3>
        <p className="text-text-muted">
          We couldn&apos;t find any deadlines in this syllabus. Try uploading a different file.
        </p>
      </div>
    );
  }

  const needsReviewCount = proposal.assessments.filter(
    (a) => a.review_state === "needs_review"
  ).length;

  const approvedCount = proposal.assessments.length - needsReviewCount;

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-surface border border-border rounded-lg shadow-sm p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-text mb-2">
              Review Extracted Deadlines
            </h2>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-text-muted">
              {proposal.course?.name && (
                <span className="font-medium text-text">{proposal.course.name}</span>
              )}
              {proposal.course?.term_label && (
                <span>• {proposal.course.term_label}</span>
              )}
              <span>• {proposal.assessments.length} assessment{proposal.assessments.length !== 1 ? "s" : ""} found</span>
            </div>
          </div>
          
          <button
            onClick={() => setShowMetrics(!showMetrics)}
            className="
              flex items-center gap-2 px-3 py-2 text-sm font-medium
              text-primary hover:text-primary-hover bg-transparent hover:bg-surface-emphasis
              border border-primary rounded-lg transition-all duration-150
              min-h-[36px]
            "
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            {showMetrics ? "Hide" : "View"} Metrics
          </button>
        </div>

        {/* Status Summary */}
        {(needsReviewCount > 0 || approvedCount > 0) && (
          <div className="flex flex-wrap gap-3">
            {approvedCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-success/10 rounded-lg">
                <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium text-success">
                  {approvedCount} ready
                </span>
              </div>
            )}
            {needsReviewCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-warning/10 rounded-lg">
                <svg className="w-4 h-4 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="text-sm font-medium text-warning">
                  {needsReviewCount} need{needsReviewCount !== 1 ? "" : "s"} review
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Assessments List */}
      <div className="space-y-3">
        {proposal.assessments.map((assessment, index) => (
          <div
            key={assessment.id}
            className={`
              bg-surface border rounded-lg shadow-sm p-5 transition-all duration-150
              ${assessment.review_state === "needs_review"
                ? "border-warning bg-warning/5"
                : "border-border hover:border-primary/30"
              }
            `}
          >
            <div className="flex items-start gap-4">
              {/* Status Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {assessment.review_state === "needs_review" ? (
                  <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Title & Badge */}
                <div className="flex items-start gap-2 mb-2">
                  <h3 className="font-semibold text-text flex-1">
                    {assessment.title}
                  </h3>
                  {assessment.is_major && (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-primary text-white rounded">
                      Major
                    </span>
                  )}
                </div>

                {/* Date */}
                <div className="mb-2">
                  {editingId === assessment.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        defaultValue={
                          assessment.due_at
                            ? new Date(assessment.due_at).toISOString().split("T")[0]
                            : ""
                        }
                        onChange={(e) => {
                          if (e.target.value) {
                            onEdit(assessment.id, {
                              due_at: new Date(e.target.value).toISOString(),
                              review_state: "approved",
                            });
                          }
                        }}
                        onBlur={() => setEditingId(null)}
                        className="
                          px-3 py-2 text-sm border border-primary rounded-lg
                          focus:outline-none focus:ring-2 focus:ring-primary/20
                        "
                        autoFocus
                      />
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-sm text-text-muted hover:text-text"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-text-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-text-muted">
                        Due:{" "}
                        {assessment.due_at
                          ? new Date(assessment.due_at).toLocaleDateString("en-PH", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })
                          : "TBA"}
                      </span>
                      <button
                        onClick={() => setEditingId(assessment.id)}
                        className="text-primary hover:text-primary-hover underline text-xs font-medium"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>

                {/* Warning Message */}
                {assessment.review_state === "needs_review" && (
                  <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning/20 rounded-lg mb-3">
                    <svg className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-warning">
                      We weren&apos;t sure about this date — please confirm or edit it.
                    </p>
                  </div>
                )}

                {/* Metrics (Collapsible) */}
                {showMetrics && (
                  <div className="mt-3 pt-3 border-t border-border space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-text-muted">Confidence:</span>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-surface-emphasis rounded-full overflow-hidden max-w-[100px]">
                          <div
                            className={`h-full rounded-full ${
                              assessment.confidence >= 0.75
                                ? "bg-success"
                                : assessment.confidence >= 0.5
                                ? "bg-warning"
                                : "bg-error"
                            }`}
                            style={{ width: `${assessment.confidence * 100}%` }}
                          />
                        </div>
                        <span className="font-medium text-text">
                          {Math.round(assessment.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                    {assessment.evidence && (
                      <div className="text-xs">
                        <span className="text-text-muted">Evidence:</span>
                        <p className="mt-1 text-text-muted italic font-mono bg-surface-emphasis p-2 rounded border border-border">
                          &quot;{assessment.evidence}&quot;
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Approve Button */}
      <div className="bg-surface border border-border rounded-lg shadow-sm p-6">
        <button
          onClick={onApprove}
          disabled={needsReviewCount > 0}
          className="
            w-full flex items-center justify-center gap-2 px-6 py-3
            bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg
            transition-all duration-150 shadow-sm hover:shadow
            disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-primary
            min-h-[48px]
          "
        >
          {needsReviewCount > 0 ? (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>Review {needsReviewCount} item{needsReviewCount !== 1 ? "s" : ""} first</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Approve All {proposal.assessments.length} Deadline{proposal.assessments.length !== 1 ? "s" : ""}</span>
            </>
          )}
        </button>

        {needsReviewCount > 0 && (
          <p className="mt-3 text-sm text-center text-text-muted">
            Please review and confirm all flagged items before approving.
          </p>
        )}
      </div>
    </div>
  );
}
