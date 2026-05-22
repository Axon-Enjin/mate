"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NavBar from "@/components/NavBar";
import ConflictReport from "@/components/ConflictReport";
import SchedulePlanner from "@/components/SchedulePlanner";
import type { Assessment, AvailabilityInput } from "@/types";

interface ConflictWindow {
  start_date: string;
  end_date: string;
  assessment_ids: string[];
  severity: "high" | "medium" | "low";
  intervention: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"conflicts" | "schedule">("conflicts");
  const [conflicts, setConflicts] = useState<ConflictWindow[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConflicts();
  }, []);

  const loadConflicts = async () => {
    try {
      const response = await fetch("/api/conflicts");
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Conflict API error:", response.status, errorText);
        throw new Error(`Failed to load conflicts: ${response.status}`);
      }

      const data = await response.json();
      console.log("Conflicts loaded:", data);
      setConflicts(data.data?.conflicts || []);
      setAssessments(data.data?.assessments || []);
    } catch (error) {
      console.error("Load conflicts error:", error);
      // Don't throw - just show empty state
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSchedule = async (availability: AvailabilityInput) => {
    try {
      const response = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availability }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        console.error("Schedule API error:", response.status, errorData);
        throw new Error(errorData.error || "Failed to generate schedule");
      }

      const data = await response.json();
      console.log("Schedule generated:", data);
      
      return {
        study_blocks: data.data?.study_blocks || [],
        message: data.data?.message || "Schedule generated!",
      };
    } catch (error) {
      console.error("Generate schedule error:", error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <div className="bg-surface border border-border rounded-lg shadow-sm p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="loading-skeleton h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-3">
                <div className="loading-skeleton h-5 w-3/4 rounded" />
                <div className="loading-skeleton h-4 w-1/2 rounded" />
              </div>
            </div>
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="loading-skeleton h-32 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 bg-bg">
      <NavBar />
      {/* Header */}
      <div className="border-b border-border bg-surface">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push("/")}
              className="
                inline-flex items-center gap-2 text-sm font-medium
                text-text-muted hover:text-text transition-colors duration-150
              "
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Home
            </button>

            <div className="flex items-center gap-2">
              <span className="text-sm text-text-muted">
                {assessments.length} assessment{assessments.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-text mb-3">
              Your Academic Dashboard
            </h1>
            <p className="text-lg text-text-muted">
              Manage your deadlines, detect conflicts, and plan your study schedule.
            </p>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="border-b border-border">
              <nav className="flex gap-6">
                <button
                  onClick={() => setActiveTab("conflicts")}
                  className={`
                    pb-3 px-1 text-sm font-medium border-b-2 transition-colors duration-150
                    ${
                      activeTab === "conflicts"
                        ? "border-primary text-primary"
                        : "border-transparent text-text-muted hover:text-text hover:border-border"
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5"
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
                    Conflict Detection
                    {conflicts.length > 0 && (
                      <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-warning rounded-full">
                        {conflicts.length}
                      </span>
                    )}
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab("schedule")}
                  className={`
                    pb-3 px-1 text-sm font-medium border-b-2 transition-colors duration-150
                    ${
                      activeTab === "schedule"
                        ? "border-primary text-primary"
                        : "border-transparent text-text-muted hover:text-text hover:border-border"
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    Study Schedule
                  </div>
                </button>
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === "conflicts" && (
            <ConflictReport conflicts={conflicts} assessments={assessments} />
          )}

          {activeTab === "schedule" && (
            <SchedulePlanner onGenerateSchedule={handleGenerateSchedule} />
          )}
        </div>
      </div>
    </div>
  );
}
