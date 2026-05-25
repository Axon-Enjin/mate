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

  const handleGenerateSchedule = async (body: {
    availability?: AvailabilityInput;
    use_outlook?: boolean;
    save_proposal?: boolean;
  }) => {
    try {
      const response = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
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
