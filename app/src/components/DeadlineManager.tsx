"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";
import type { Assessment, Course } from "@/types";

export interface CourseWithAssessments extends Course {
  assessments: Assessment[];
}

interface DeadlineManagerProps {
  courses: CourseWithAssessments[];
  onRefresh: () => Promise<void>;
}

export default function DeadlineManager({ courses, onRefresh }: DeadlineManagerProps) {
  const router = useRouter();
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(
    courses.length === 1 ? courses[0]?.id ?? null : null
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{
    title: string;
    due_at: string;
    is_major: boolean;
  } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null);

  const startEdit = (assessment: Assessment) => {
    setEditingId(assessment.id);
    setEditDraft({
      title: assessment.title,
      due_at: assessment.due_at
        ? new Date(assessment.due_at).toISOString().split("T")[0]
        : "",
      is_major: assessment.is_major,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft(null);
  };

  const saveEdit = async (assessmentId: string) => {
    if (!editDraft) return;

    setBusyId(assessmentId);
    try {
      const response = await fetch(`/api/assessments/${assessmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editDraft.title,
          due_at: editDraft.due_at ? new Date(editDraft.due_at).toISOString() : null,
          is_major: editDraft.is_major,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save");
      }

      cancelEdit();
      await onRefresh();
    } catch (error) {
      console.error("Save deadline error:", error);
      alert("Failed to save changes. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const removeDeadline = async (assessment: Assessment) => {
    if (
      !window.confirm(
        `Remove "${assessment.title}" from your deadlines? This cannot be undone.`
      )
    ) {
      return;
    }

    setBusyId(assessment.id);
    try {
      const response = await fetch(`/api/assessments/${assessment.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete");
      }

      await onRefresh();
    } catch (error) {
      console.error("Delete deadline error:", error);
      alert("Failed to remove deadline. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const removeCourse = async (course: CourseWithAssessments) => {
    const count = course.assessments.length;
    if (
      !window.confirm(
        `Remove "${course.name}" and all ${count} deadline${count !== 1 ? "s" : ""}? This cannot be undone.`
      )
    ) {
      return;
    }

    setDeletingCourseId(course.id);
    try {
      const response = await fetch(`/api/courses/${course.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete course");
      }

      if (expandedCourseId === course.id) {
        setExpandedCourseId(null);
      }

      await onRefresh();
    } catch (error) {
      console.error("Delete course error:", error);
      alert("Failed to remove syllabus. Please try again.");
    } finally {
      setDeletingCourseId(null);
    }
  };

  if (courses.length === 0) {
    return (
      <div className="mx-auto max-w-[720px] rounded-lg border border-border bg-surface p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-emphasis">
          <svg className="h-8 w-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 className="mb-2 text-lg font-semibold text-text">No deadlines yet</h3>
        <p className="mb-6 text-text-muted">
          Upload a syllabus and approve your deadlines to see them here, grouped by course.
        </p>
        <button
          onClick={() => router.push("/upload")}
          className="
            inline-flex min-h-[44px] items-center rounded-lg bg-primary px-5 py-2.5
            text-sm font-medium text-white transition-all duration-150 hover:bg-primary-hover
          "
        >
          Upload a syllabus
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[720px] space-y-4">
      {courses.map((course) => {
        const isExpanded = expandedCourseId === course.id;
        const isDeleting = deletingCourseId === course.id;

        return (
          <div
            key={course.id}
            className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm"
          >
            <button
              type="button"
              onClick={() =>
                setExpandedCourseId(isExpanded ? null : course.id)
              }
              className="
                flex w-full items-center justify-between gap-4 px-5 py-4 text-left
                transition-colors duration-150 hover:bg-surface-emphasis
              "
              aria-expanded={isExpanded}
            >
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-semibold text-text">{course.name}</h3>
                <p className="mt-1 text-sm text-text-muted">
                  {course.assessments.length} deadline
                  {course.assessments.length !== 1 ? "s" : ""}
                  {course.term_label ? ` · ${course.term_label}` : ""}
                </p>
                {course.source_doc_hash && (
                  <p className="mt-0.5 truncate text-xs text-text-muted">
                    From: {course.source_doc_hash}
                  </p>
                )}
              </div>
              <svg
                className={`h-5 w-5 shrink-0 text-text-muted transition-transform duration-150 ${
                  isExpanded ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isExpanded && (
              <div className="border-t border-border px-5 py-4">
                {course.assessments.length === 0 ? (
                  <p className="text-sm text-text-muted">No approved deadlines for this course.</p>
                ) : (
                  <ul className="space-y-3">
                    {course.assessments.map((assessment) => {
                      const isEditing = editingId === assessment.id;
                      const isBusy = busyId === assessment.id;

                      return (
                        <li
                          key={assessment.id}
                          className="rounded-lg border border-border bg-surface-emphasis/50 p-4"
                        >
                          {isEditing && editDraft ? (
                            <div className="space-y-3">
                              <input
                                type="text"
                                value={editDraft.title}
                                onChange={(e) =>
                                  setEditDraft({ ...editDraft, title: e.target.value })
                                }
                                className="
                                  w-full rounded-lg border border-border px-3 py-2 text-sm
                                  focus:outline-none focus:ring-2 focus:ring-primary
                                "
                              />
                              <input
                                type="date"
                                value={editDraft.due_at}
                                onChange={(e) =>
                                  setEditDraft({ ...editDraft, due_at: e.target.value })
                                }
                                className="
                                  w-full rounded-lg border border-border px-3 py-2 text-sm
                                  focus:outline-none focus:ring-2 focus:ring-primary
                                "
                              />
                              <label className="flex items-center gap-2 text-sm text-text">
                                <input
                                  type="checkbox"
                                  checked={editDraft.is_major}
                                  onChange={(e) =>
                                    setEditDraft({
                                      ...editDraft,
                                      is_major: e.target.checked,
                                    })
                                  }
                                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                                />
                                Major deliverable
                              </label>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => saveEdit(assessment.id)}
                                  disabled={isBusy || !editDraft.title.trim()}
                                  className="
                                    min-h-[36px] rounded-lg bg-primary px-4 py-2 text-sm font-medium
                                    text-white hover:bg-primary-hover disabled:opacity-40
                                  "
                                >
                                  {isBusy ? "Saving..." : "Save"}
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  disabled={isBusy}
                                  className="
                                    min-h-[36px] rounded-lg border border-border px-4 py-2
                                    text-sm font-medium text-text-muted hover:bg-surface
                                  "
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-medium text-text">{assessment.title}</p>
                                  {assessment.is_major && (
                                    <span className="rounded bg-primary px-2 py-0.5 text-xs font-medium text-white">
                                      Major
                                    </span>
                                  )}
                                </div>
                                <p className="mt-1 text-sm text-text-muted">
                                  Due:{" "}
                                  {assessment.due_at
                                    ? formatDate(assessment.due_at)
                                    : "TBA"}
                                </p>
                              </div>
                              <div className="flex shrink-0 gap-2">
                                <button
                                  onClick={() => startEdit(assessment)}
                                  disabled={isBusy}
                                  className="text-sm font-medium text-primary hover:text-primary-hover"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => removeDeadline(assessment)}
                                  disabled={isBusy}
                                  className="text-sm font-medium text-error hover:text-error/80"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}

                <div className="mt-4 border-t border-border pt-4">
                  <button
                    onClick={() => removeCourse(course)}
                    disabled={isDeleting}
                    className="
                      text-sm font-medium text-error hover:text-error/80
                      disabled:opacity-40
                    "
                  >
                    {isDeleting
                      ? "Removing syllabus..."
                      : "Remove entire syllabus"}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      <div className="pt-2 text-center">
        <button
          onClick={() => router.push("/upload")}
          className="
            inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-primary
            px-5 py-2.5 text-sm font-medium text-primary transition-all duration-150
            hover:bg-surface-emphasis
          "
        >
          Upload another syllabus
        </button>
      </div>
    </div>
  );
}
