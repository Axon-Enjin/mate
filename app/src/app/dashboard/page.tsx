"use client";

import { useEffect, useState } from "react";
import NavBar from "@/components/NavBar";
import ConflictReport from "@/components/ConflictReport";
import SchedulePlanner from "@/components/SchedulePlanner";
import MateChat from "@/components/MateChat";
import DeadlineManager, {
  type CourseWithAssessments,
} from "@/components/DeadlineManager";
import type { Assessment, AvailabilityInput } from "@/types";

interface ConflictWindow {
  start_date: string;
  end_date: string;
  assessment_ids: string[];
  severity: "high" | "medium" | "low";
  intervention: string;
}

type DashboardTab = "chat" | "deadlines" | "conflicts" | "schedule";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<DashboardTab>("deadlines");
  const [courses, setCourses] = useState<CourseWithAssessments[]>([]);
  const [conflicts, setConflicts] = useState<ConflictWindow[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [allAssessments, setAllAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [coursesRes, conflictsRes] = await Promise.all([
        fetch("/api/courses"),
        fetch("/api/conflicts"),
      ]);

      if (coursesRes.ok) {
        const coursesData = await coursesRes.json();
        setCourses(coursesData.data?.courses || []);
        const flat = (coursesData.data?.courses || []).flatMap(
          (c: CourseWithAssessments) => c.assessments
        );
        setAllAssessments(flat);
      }

      if (conflictsRes.ok) {
        const conflictsData = await conflictsRes.json();
        setConflicts(conflictsData.data?.conflicts || []);
        setAssessments(conflictsData.data?.assessments || []);
        if (!coursesRes.ok) {
          setAllAssessments(
            conflictsData.data?.all_assessments ||
              conflictsData.data?.assessments ||
              []
          );
        }
      }
    } catch (error) {
      console.error("Load dashboard error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSchedule = async (availability: AvailabilityInput) => {
    const response = await fetch("/api/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ availability }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(errorData.error || "Failed to generate schedule");
    }

    const data = await response.json();
    return {
      study_blocks: data.data?.study_blocks || [],
      message: data.data?.message || "Schedule generated!",
    };
  };

  const tabs: { id: DashboardTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: "deadlines",
      label: "Deadlines",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
      badge: allAssessments.length > 0 ? allAssessments.length : undefined,
    },
    {
      id: "chat",
      label: "Ask Mate",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      ),
    },
    {
      id: "conflicts",
      label: "Conflicts",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      ),
      badge: conflicts.length,
    },
    {
      id: "schedule",
      label: "Study Schedule",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col flex-1 bg-bg">
        <NavBar />
        <div className="flex flex-1 items-center justify-center p-4">
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
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 bg-bg">
      <NavBar />

      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-text mb-2 sm:text-3xl">
              Your Academic Dashboard
            </h1>
            <p className="text-base text-text-muted sm:text-lg">
              Manage deadlines by syllabus, ask Mate for help, or plan your week.
            </p>
            <p className="mt-2 text-sm text-text-muted">
              {courses.length} syllabus{courses.length !== 1 ? "es" : ""} ·{" "}
              {allAssessments.length} approved deadline
              {allAssessments.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="mb-6">
            <div className="border-b border-border">
              <nav className="flex gap-4 overflow-x-auto sm:gap-6" aria-label="Dashboard sections">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      shrink-0 pb-3 px-1 text-sm font-medium border-b-2 transition-colors duration-150
                      ${
                        activeTab === tab.id
                          ? "border-primary text-primary"
                          : "border-transparent text-text-muted hover:text-text hover:border-border"
                      }
                    `}
                  >
                    <div className="flex items-center gap-2">
                      {tab.icon}
                      {tab.label}
                      {tab.badge !== undefined && tab.badge > 0 && (
                        <span
                          className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1 text-xs font-bold rounded-full ${
                            tab.id === "conflicts"
                              ? "bg-warning text-white"
                              : "bg-primary/15 text-primary"
                          }`}
                        >
                          {tab.badge}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {activeTab === "deadlines" && (
            <DeadlineManager courses={courses} onRefresh={loadDashboardData} />
          )}

          {activeTab === "chat" && <MateChat assessments={allAssessments} />}

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
