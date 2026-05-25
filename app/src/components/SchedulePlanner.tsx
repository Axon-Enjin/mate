"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import type { AvailabilityInput } from "@/types";

interface StudyBlock {
  assessment_id: string;
  start_at: string;
  end_at: string;
  description: string;
  id?: string;
}

interface SchedulePlannerProps {
  onGenerateSchedule: (body: {
    availability?: AvailabilityInput;
    use_outlook?: boolean;
    save_proposal?: boolean;
  }) => Promise<{
    study_blocks: StudyBlock[];
    message: string;
    availability_source?: string;
  }>;
}

export default function SchedulePlanner({
  onGenerateSchedule,
}: SchedulePlannerProps) {
  const { data: session, status } = useSession();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<{
    study_blocks: StudyBlock[];
    message: string;
    availability_source?: string;
  } | null>(null);

  // Availability input state
  const [useOutlook, setUseOutlook] = useState(false);
  const [unavailableTimes, setUnavailableTimes] = useState<
    { day: string; start: string; end: string }[]
  >([
    { day: "Monday", start: "08:00", end: "17:00" },
    { day: "Tuesday", start: "08:00", end: "17:00" },
    { day: "Wednesday", start: "08:00", end: "17:00" },
    { day: "Thursday", start: "08:00", end: "17:00" },
    { day: "Friday", start: "08:00", end: "17:00" },
  ]);

  const syncOutlookCalendar = async () => {
    setIsSyncing(true);
    setError(null);
    try {
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days range

      const response = await fetch("/api/calendar/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch calendar availability. Please ensure calendar permissions are configured.");
      }

      const data = await response.json();
      const scheduleItems = data.schedule?.value?.[0]?.scheduleItems || [];

      const newUnavailable = scheduleItems
        .filter((item: any) => item.status === "busy" || item.status === "oof")
        .map((item: any) => {
          const startLocal = new Date(item.start.dateTime);
          const endLocal = new Date(item.end.dateTime);

          const year = startLocal.getFullYear();
          const month = String(startLocal.getMonth() + 1).padStart(2, "0");
          const day = String(startLocal.getDate()).padStart(2, "0");

          const startHours = String(startLocal.getHours()).padStart(2, "0");
          const startMins = String(startLocal.getMinutes()).padStart(2, "0");
          const endHours = String(endLocal.getHours()).padStart(2, "0");
          const endMins = String(endLocal.getMinutes()).padStart(2, "0");

          return {
            day: `${year}-${month}-${day}`,
            start: `${startHours}:${startMins}`,
            end: `${endHours}:${endMins}`,
          };
        });

      if (newUnavailable.length === 0) {
        alert("No busy events found in your Outlook Calendar for the next 14 days!");
        return;
      }

      setUnavailableTimes((prev) => {
        const staticWeekly = prev.filter((t) => !t.day.includes("-"));
        const merged = [...staticWeekly];
        for (const item of newUnavailable) {
          const exists = merged.some(
            (t) => t.day === item.day && t.start === item.start && t.end === item.end
          );
          if (!exists) {
            merged.push(item);
          }
        }
        return merged;
      });
      
      alert(`Successfully synced ${newUnavailable.length} busy block(s) from Outlook!`);
    } catch (err) {
      console.error("Sync calendar error:", err);
      setError(err instanceof Error ? err.message : "Failed to sync Outlook Calendar");
    } finally {
      setIsSyncing(false);
    }
  };

  const [studyDuration, setStudyDuration] = useState(120); // minutes

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const body: any = {
        use_outlook: useOutlook,
        save_proposal: false,
      };

      if (!useOutlook || unavailableTimes.length > 0) {
        body.availability = {
          unavailable_times: unavailableTimes,
          preferred_study_duration: studyDuration,
        };
      }

      const result = await onGenerateSchedule(body);
      setSchedule(result);
    } catch (error) {
      console.error("Schedule generation error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to generate schedule";
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Availability Source Toggle */}
      <div className="bg-surface border border-border rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-text mb-4">
          Where should I get your availability?
        </h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-emphasis cursor-pointer transition">
            <input
              type="radio"
              name="availability_source"
              checked={!useOutlook}
              onChange={() => setUseOutlook(false)}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium text-text">
              Manual input (I'll enter my schedule)
            </span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-emphasis cursor-pointer transition">
            <input
              type="radio"
              name="availability_source"
              checked={useOutlook}
              onChange={() => setUseOutlook(true)}
              className="w-4 h-4"
            />
            <div className="flex-1">
              <span className="text-sm font-medium text-text">
                Auto from Outlook (Get my busy times from calendar)
              </span>
              <p className="text-xs text-text-muted mt-1">
                Reads your calendar for the next 7 days
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Availability Form */}
      <div className="bg-surface border border-border rounded-lg shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold text-text">
            Tell me about your availability
          </h3>
          {status === "authenticated" && (
            <button
              onClick={syncOutlookCalendar}
              disabled={isSyncing}
              className="
                inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold
                border border-primary rounded-lg text-primary hover:bg-surface-emphasis
                transition-all duration-150 disabled:opacity-50 min-h-[36px]
              "
            >
              {isSyncing ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-primary" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Syncing Calendar...</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18" />
                  </svg>
                  <span>Sync Outlook Calendar</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Unavailable Times */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-text mb-3">
            {useOutlook ? "(Optional) Additional busy times" : "When are you busy? (Classes, work, commute)"}
          </label>
          <div className="space-y-3">
            {unavailableTimes.map((time, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-surface-emphasis rounded-lg"
              >
                <span className="text-sm font-medium text-text w-28 shrink-0">
                  {time.day.includes("-")
                    ? new Date(time.day).toLocaleDateString("en-PH", { month: "short", day: "numeric" })
                    : time.day}
                </span>
                <input
                  type="time"
                  value={time.start}
                  onChange={(e) => {
                    const updated = [...unavailableTimes];
                    updated[index].start = e.target.value;
                    setUnavailableTimes(updated);
                  }}
                  className="px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <span className="text-text-muted">to</span>
                <input
                  type="time"
                  value={time.end}
                  onChange={(e) => {
                    const updated = [...unavailableTimes];
                    updated[index].end = e.target.value;
                    setUnavailableTimes(updated);
                  }}
                  className="px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button
                  onClick={() => {
                    setUnavailableTimes(
                      unavailableTimes.filter((_, i) => i !== index)
                    );
                  }}
                  className="text-error hover:text-error/80 p-2"
                >
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Study Duration */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-text mb-3">
            How long can you study in one session?
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="30"
              max="240"
              step="30"
              value={studyDuration}
              onChange={(e) => setStudyDuration(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-sm font-medium text-text w-24">
              {studyDuration} minutes
            </span>
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="
            w-full flex items-center justify-center gap-2 px-6 py-3
            bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg
            transition-all duration-150 shadow-sm hover:shadow
            disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-primary
            min-h-[48px]
          "
        >
          {isGenerating ? (
            <>
              <svg
                className="animate-spin h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Generating your schedule...</span>
            </>
          ) : (
            <>
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
              <span>Generate My Study Schedule</span>
            </>
          )}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-error/10 border border-error rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-error flex-shrink-0 mt-0.5"
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
            <div className="flex-1">
              <p className="text-sm font-medium text-error mb-1">
                Failed to generate schedule
              </p>
              <p className="text-sm text-text-muted">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-error hover:text-error/80"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      {/* Schedule Results */}
      {schedule && (
        <div className="bg-surface border border-border rounded-lg shadow-sm p-6">
          <div className="flex items-start gap-4 mb-6">
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
                Your Study Schedule
              </h3>
              <p className="text-text-muted">{schedule.message}</p>
            </div>
          </div>

          {/* Study Blocks */}
          {schedule.study_blocks.length > 0 ? (
            <div className="space-y-3">
              {schedule.study_blocks.map((block, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 bg-surface-emphasis border border-border rounded-lg"
                >
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-primary"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-text mb-1">
                      {block.description}
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-text-muted">
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
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>
                        {new Date(block.start_at).toLocaleString("en-PH", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        -{" "}
                        {new Date(block.end_at).toLocaleTimeString("en-PH", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-text-muted py-8">
              No study blocks generated. Try adjusting your availability.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
