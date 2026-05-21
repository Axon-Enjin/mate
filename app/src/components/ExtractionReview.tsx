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
      <div className="card p-6 text-center">
        <p style={{ color: "var(--color-text-muted)" }}>
          No assessments found in this syllabus.
        </p>
      </div>
    );
  }

  const needsReviewCount = proposal.assessments.filter(
    (a) => a.review_state === "needs_review"
  ).length;

  return (
    <div className="card p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Review Extracted Deadlines</h2>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          {proposal.course?.name && `${proposal.course.name} • `}
          {proposal.assessments.length} assessment{proposal.assessments.length !== 1 ? "s" : ""} found
          {needsReviewCount > 0 && ` • ${needsReviewCount} need${needsReviewCount !== 1 ? "" : "s"} review`}
        </p>
      </div>

      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setShowMetrics(!showMetrics)}
          className="btn btn-secondary text-sm"
          style={{ padding: "6px 12px", minHeight: "36px" }}
        >
          {showMetrics ? "Hide" : "View"} Metrics
        </button>
      </div>

      <div className="space-y-3 mb-6">
        {proposal.assessments.map((assessment) => (
          <div
            key={assessment.id}
            className="p-4 rounded-lg border"
            style={{
              borderColor:
                assessment.review_state === "needs_review"
                  ? "var(--color-warning)"
                  : "var(--color-border)",
              backgroundColor:
                assessment.review_state === "needs_review"
                  ? "var(--color-surface-emphasis)"
                  : "var(--color-surface)",
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {assessment.review_state === "needs_review" && (
                    <span className="text-lg">⚠️</span>
                  )}
                  {assessment.review_state === "approved" && (
                    <span className="text-lg">✓</span>
                  )}
                  <h3 className="font-medium">{assessment.title}</h3>
                  {assessment.is_major && (
                    <span
                      className="text-xs px-2 py-1 rounded"
                      style={{
                        backgroundColor: "var(--color-primary)",
                        color: "white",
                      }}
                    >
                      Major
                    </span>
                  )}
                </div>

                <div className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                  {editingId === assessment.id ? (
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
                      className="input"
                      autoFocus
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>
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
                        className="text-xs underline"
                        style={{ color: "var(--color-primary)" }}
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>

                {showMetrics && (
                  <div className="mt-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
                    Confidence: {Math.round(assessment.confidence * 100)}%
                    {assessment.evidence && ` • "${assessment.evidence}"`}
                  </div>
                )}

                {assessment.review_state === "needs_review" && (
                  <p className="mt-2 text-sm" style={{ color: "var(--color-warning)" }}>
                    We weren&apos;t sure about this date — please confirm.
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onApprove}
        disabled={needsReviewCount > 0}
        className="btn btn-primary w-full"
      >
        {needsReviewCount > 0
          ? `Review ${needsReviewCount} item${needsReviewCount !== 1 ? "s" : ""} first`
          : `Approve All ${proposal.assessments.length} Deadline${proposal.assessments.length !== 1 ? "s" : ""}`}
      </button>

      {needsReviewCount > 0 && (
        <p className="mt-3 text-sm text-center" style={{ color: "var(--color-text-muted)" }}>
          Please review flagged items before approving.
        </p>
      )}
    </div>
  );
}
