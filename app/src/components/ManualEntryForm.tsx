"use client";

import { useState } from "react";

interface AssessmentRow {
  title: string;
  due_at: string;
  is_major: boolean;
}

interface ManualEntryFormProps {
  proposalId: string;
  onComplete: () => void;
}

export default function ManualEntryForm({ proposalId, onComplete }: ManualEntryFormProps) {
  const [courseName, setCourseName] = useState("");
  const [termLabel, setTermLabel] = useState("");
  const [assessments, setAssessments] = useState<AssessmentRow[]>([
    { title: "", due_at: "", is_major: false },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addRow = () => {
    setAssessments((prev) => [...prev, { title: "", due_at: "", is_major: false }]);
  };

  const removeRow = (index: number) => {
    setAssessments((prev) => prev.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, field: keyof AssessmentRow, value: string | boolean) => {
    setAssessments((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const handleSubmit = async () => {
    if (!courseName.trim()) {
      setError("Course name is required.");
      return;
    }

    const validAssessments = assessments.filter((a) => a.title.trim());
    if (validAssessments.length === 0) {
      setError("Add at least one assessment.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const syntheticAssessments = validAssessments.map((a) => ({
      id: crypto.randomUUID(),
      title: a.title.trim(),
      due_at: a.due_at || null,
      is_major: a.is_major,
      confidence: 1.0,
      review_state: "needs_review" as const,
      evidence: `Manually entered by student`,
      synced_targets: [],
    }));

    try {
      const response = await fetch(`/api/proposals/${proposalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "completed",
          tier_used: "manual",
          aggregate_confidence: 1.0,
          course: {
            name: courseName.trim(),
            term_label: termLabel.trim() || undefined,
          },
          assessments: syntheticAssessments,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save manual entries.");
      }

      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-surface border border-border rounded-lg shadow-sm p-6 mt-6">
      <h3 className="text-lg font-semibold text-text mb-1">Enter deadlines manually</h3>
      <p className="text-sm text-text-muted mb-6">
        If extraction failed, you can enter your deadlines directly. They&apos;ll go into the same
        review flow.
      </p>

      {/* Course info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-text mb-1">
            Course Name <span className="text-error">*</span>
          </label>
          <input
            type="text"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            placeholder="e.g. IT 101 – Introduction to Computing"
            className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1">
            Term / Semester <span className="text-text-muted font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={termLabel}
            onChange={(e) => setTermLabel(e.target.value)}
            placeholder="e.g. AY 2026-2027 1st Sem"
            className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Assessment rows */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-text mb-3">Assessments</label>
        <div className="space-y-3">
          {assessments.map((row, index) => (
            <div
              key={index}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-surface-emphasis rounded-lg"
            >
              <input
                type="text"
                value={row.title}
                onChange={(e) => updateRow(index, "title", e.target.value)}
                placeholder="Assessment title (e.g. Midterm Exam)"
                className="flex-1 min-w-0 px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <input
                type="date"
                value={row.due_at}
                onChange={(e) => updateRow(index, "due_at", e.target.value)}
                className="px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <label className="flex items-center gap-2 text-sm text-text whitespace-nowrap cursor-pointer">
                <input
                  type="checkbox"
                  checked={row.is_major}
                  onChange={(e) => updateRow(index, "is_major", e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                Major
              </label>
              {assessments.length > 1 && (
                <button
                  onClick={() => removeRow(index)}
                  className="text-error hover:text-error/80 p-1.5 flex-shrink-0"
                  aria-label="Remove"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={addRow}
          className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary-hover font-medium"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add another assessment
        </button>
      </div>

      {error && (
        <p className="text-sm text-error mb-4">{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="
          w-full flex items-center justify-center gap-2 px-6 py-3
          bg-primary hover:bg-primary-hover text-white font-medium rounded-lg
          transition-all duration-150 shadow-sm hover:shadow
          disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-primary
          min-h-[44px]
        "
      >
        {isSubmitting ? (
          <>
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Saving...</span>
          </>
        ) : (
          "Save & Review Deadlines"
        )}
      </button>
    </div>
  );
}
