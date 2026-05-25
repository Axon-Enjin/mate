"use client";

import type { Assessment } from "@/types";

interface ConflictWindow {
  start_date: string;
  end_date: string;
  assessment_ids: string[];
  severity: "high" | "medium" | "low";
  intervention: string;
}

interface ConflictReportProps {
  conflicts: ConflictWindow[];
  assessments: Assessment[];
}

export default function ConflictReport({
  conflicts,
  assessments,
}: ConflictReportProps) {
  if (conflicts.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-lg shadow-sm p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-success"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-text mb-2">
              No Conflicts Detected
            </h3>
            <p className="text-text-muted">
              Your major deadlines are well-spaced. You&apos;re all set!
            </p>
          </div>
        </div>
      </div>
    );
  }

  const getAssessmentById = (id: string) =>
    assessments.find((a) => a.id === id);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "border-error bg-error/5";
      case "medium":
        return "border-warning bg-warning/5";
      case "low":
        return "border-primary bg-primary/5";
      default:
        return "border-border bg-surface";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "high":
        return (
          <svg
            className="w-6 h-6 text-error"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        );
      case "medium":
        return (
          <svg
            className="w-6 h-6 text-warning"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="w-6 h-6 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-surface border border-border rounded-lg shadow-sm p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-warning/20 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-warning"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-text mb-2">
              Deadline Conflicts Detected
            </h3>
            <p className="text-text-muted">
              We found {conflicts.length} week{conflicts.length !== 1 ? "s" : ""}{" "}
              where multiple major requirements collide. Here&apos;s what you can do:
            </p>
          </div>
        </div>
      </div>

      {/* Conflicts */}
      {conflicts.map((conflict, index) => {
        const conflictingAssessments = conflict.assessment_ids
          .map(getAssessmentById)
          .filter(Boolean) as Assessment[];

        return (
          <div
            key={index}
            className={`border rounded-lg shadow-sm p-6 ${getSeverityColor(
              conflict.severity
            )}`}
          >
            {/* Conflict Header */}
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0 mt-1">
                {getSeverityIcon(conflict.severity)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="text-base font-semibold text-text">
                    Week of{" "}
                    {new Date(conflict.start_date).toLocaleDateString("en-PH", {
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    -{" "}
                    {new Date(conflict.end_date).toLocaleDateString("en-PH", {
                      month: "short",
                      day: "numeric",
                    })}
                  </h4>
                  <span
                    className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded ${
                      conflict.severity === "high"
                        ? "bg-error text-white"
                        : conflict.severity === "medium"
                        ? "bg-warning text-white"
                        : "bg-primary text-white"
                    }`}
                  >
                    {conflict.severity.toUpperCase()}
                  </span>
                </div>

                {/* Conflicting Items */}
                <div className="space-y-2 mb-4">
                  {conflictingAssessments.map((assessment) => (
                    <div
                      key={assessment.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <svg
                        className="w-4 h-4 text-text-muted flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                      <span className="font-medium text-text">
                        {assessment.title}
                      </span>
                      <span className="text-text-muted">
                        •{" "}
                        {assessment.due_at &&
                          new Date(assessment.due_at).toLocaleDateString(
                            "en-PH",
                            {
                              month: "short",
                              day: "numeric",
                            }
                          )}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Intervention */}
                <div className="bg-surface border border-border rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-primary flex-shrink-0 mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text mb-1">
                        Suggested Action:
                      </p>
                      <p className="text-sm text-text-muted">
                        {conflict.intervention}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
