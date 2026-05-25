"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import type { AvailabilityInput } from "@/types";

interface StudyBlock {
  assessment_id: string;
  start_at: string;
  end_at: string;
  description: string;
  id?: string;
}

interface Assessment {
  id: string;
  title: string;
  due_at: string | null;
  is_major: boolean;
  course_id: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  start_at: string;
  end_at: string;
  calendar_name?: string;
  location?: string;
}

// Calendar color palette for different calendars
const CALENDAR_COLORS = [
  { bg: "bg-primary/10", border: "border-primary/30", text: "text-primary", tag: "bg-primary" },
  { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", tag: "bg-blue-500" },
  { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", tag: "bg-purple-500" },
  { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", tag: "bg-amber-500" },
  { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700", tag: "bg-rose-500" },
  { bg: "bg-teal-50", border: "border-teal-200", text: "text-teal-700", tag: "bg-teal-500" },
];

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
  const defaultWeeklyAvailability = [
    { day: "Monday", start: "08:00", end: "17:00" },
    { day: "Tuesday", start: "08:00", end: "17:00" },
    { day: "Wednesday", start: "08:00", end: "17:00" },
    { day: "Thursday", start: "08:00", end: "17:00" },
    { day: "Friday", start: "08:00", end: "17:00" },
  ];
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [approvedBlockIds, setApprovedBlockIds] = useState<Set<string>>(new Set());
  const [pendingEvents, setPendingEvents] = useState<CalendarEvent[]>([]);
  const [calendarColorMap, setCalendarColorMap] = useState<Map<string, typeof CALENDAR_COLORS[0]>>(new Map());
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set());
  const [showOutlookConfirm, setShowOutlookConfirm] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [hasAutoSynced, setHasAutoSynced] = useState(false);
  const [calendarCursor, setCalendarCursor] = useState(() => new Date());
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<{
    study_blocks: StudyBlock[];
    message: string;
    availability_source?: string;
    assessments?: Assessment[];
  } | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [isSyncingToOutlook, setIsSyncingToOutlook] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null);
  const [sendingTeamsReminder, setSendingTeamsReminder] = useState<Set<string>>(new Set());

  // Availability input state
  const [useOutlook, setUseOutlook] = useState(true);
  const [unavailableTimes, setUnavailableTimes] = useState<
    { day: string; start: string; end: string }[]
  >([]);

  const formatDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Assign colors to calendars
  const getCalendarColor = (calendarName?: string) => {
    if (!calendarName) return CALENDAR_COLORS[0];
    
    if (!calendarColorMap.has(calendarName)) {
      const colorIndex = calendarColorMap.size % CALENDAR_COLORS.length;
      const newMap = new Map(calendarColorMap);
      newMap.set(calendarName, CALENDAR_COLORS[colorIndex]);
      setCalendarColorMap(newMap);
      return CALENDAR_COLORS[colorIndex];
    }
    
    return calendarColorMap.get(calendarName)!;
  };

  // Get assessment details for a study block
  const getAssessmentForBlock = (block: StudyBlock) => {
    return schedule?.assessments?.find((a) => a.id === block.assessment_id);
  };

  // Get smart description for study block
  const getBlockDescription = (block: StudyBlock) => {
    // If the block already has a description from the API, use it
    if (block.description && block.description !== "Study session" && block.description !== "Study block") {
      return block.description;
    }
    
    // Otherwise, look up the assessment
    const assessment = getAssessmentForBlock(block);
    if (assessment) {
      return `Study: ${assessment.title}`;
    }
    
    return block.description || "Study session";
  };

  const eventsByDate = pendingEvents.reduce<Record<string, typeof pendingEvents>>(
    (acc, event) => {
      const key = formatDateKey(new Date(event.start_at));
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(event);
      return acc;
    },
    {}
  );

  // Group study blocks by date
  const studyBlocksByDate = (schedule?.study_blocks || []).reduce<Record<string, StudyBlock[]>>(
    (acc, block) => {
      const key = formatDateKey(new Date(block.start_at));
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(block);
      return acc;
    },
    {}
  );

  const monthStart = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth(), 1);
  const monthEnd = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() + 1, 0);
  const startWeekday = monthStart.getDay();
  const daysInMonth = monthEnd.getDate();
  const calendarCells = Array.from({ length: startWeekday + daysInMonth }, (_, index) => {
    if (index < startWeekday) {
      return null;
    }
    const day = index - startWeekday + 1;
    return new Date(calendarCursor.getFullYear(), calendarCursor.getMonth(), day);
  });

  const selectedDateEvents = selectedDateKey ? (eventsByDate[selectedDateKey] || []) : [];

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
      const events = data.events || [];

      if (events.length === 0) {
        setError("No busy events found in your Outlook Calendar for the next 14 days.");
        return;
      }

      setPendingEvents(events);
      setSelectedEventIds(new Set(events.map((event: any) => event.id)));
      setShowOutlookConfirm(true);
      setHasAutoSynced(true);
    } catch (err) {
      console.error("Sync calendar error:", err);
      setError(err instanceof Error ? err.message : "Failed to sync Outlook Calendar");
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (!useOutlook) {
      return;
    }

    if (status === "authenticated" && !hasAutoSynced) {
      syncOutlookCalendar();
    }
  }, [status, useOutlook, hasAutoSynced]);

  const applyOutlookEvents = () => {
    const selected = pendingEvents.filter((event) => selectedEventIds.has(event.id));

    if (selected.length === 0) {
      setError("Select at least one calendar event to block.");
      return;
    }

    const newUnavailable = selected.map((event) => {
      const startLocal = new Date(event.start_at);
      const endLocal = new Date(event.end_at);

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

    setShowOutlookConfirm(false);
  };

  const [studyDuration, setStudyDuration] = useState(120); // minutes

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const body: any = {
        use_outlook: useOutlook,
        save_proposal: true,
      };

      if (!useOutlook || unavailableTimes.length > 0) {
        body.availability = {
          unavailable_times: unavailableTimes,
          preferred_study_duration: studyDuration,
        };
      }

      const result = await onGenerateSchedule(body);
      setSchedule(result);
      setApprovedBlockIds(new Set());
      setShowScheduleModal(true); // Show modal with results
    } catch (error) {
      console.error("Schedule generation error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to generate schedule";
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const approveBlock = async (blockId: string) => {
    try {
      const response = await fetch(`/api/schedule/${blockId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: "approved" }),
      });
      if (!response.ok) throw new Error("Failed to approve block");
      setApprovedBlockIds((prev) => new Set([...prev, blockId]));

      // Trigger Power Automate webhook (optional, won't fail if not configured)
      const block = schedule?.study_blocks.find((b) => b.id === blockId);
      if (block) {
        const assessment = getAssessmentForBlock(block);
        fetch("/api/webhooks/study-block", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "study_block_approved",
            study_block: block,
            assessment,
          }),
        }).catch((err) => console.log("Webhook notification skipped:", err.message));
      }
    } catch (err) {
      console.error("Approve block error:", err);
      setError(err instanceof Error ? err.message : "Failed to approve study block");
    }
  };

  const syncToOutlook = async () => {
    if (!schedule?.study_blocks || schedule.study_blocks.length === 0) {
      setError("No study blocks to sync");
      return;
    }

    setIsSyncingToOutlook(true);
    setError(null);
    setSyncSuccess(null);

    try {
      // Only sync approved blocks
      const approvedBlocks = schedule.study_blocks.filter(
        (block) => block.id && approvedBlockIds.has(block.id)
      );

      if (approvedBlocks.length === 0) {
        setError("Please approve at least one study block before syncing to Outlook");
        return;
      }

      const response = await fetch("/api/calendar/events/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          study_block_ids: approvedBlocks.map((block) => block.id),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to sync to Outlook");
      }

      const data = await response.json();
      setSyncSuccess(data.data.message);
    } catch (err) {
      console.error("Outlook sync error:", err);
      setError(err instanceof Error ? err.message : "Failed to sync to Outlook calendar");
    } finally {
      setIsSyncingToOutlook(false);
    }
  };

  const sendTeamsReminder = async (blockId: string) => {
    setSendingTeamsReminder((prev) => new Set([...prev, blockId]));
    setError(null);

    try {
      const response = await fetch("/api/teams/reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ study_block_id: blockId }),
      });

      const data = await response.json();
      
      // Log the full response for debugging
      console.log("Teams reminder response:", { status: response.status, data });

      if (!response.ok) {
        const errorMsg = data.error || data.message || `Failed to send Teams reminder (${response.status})`;
        console.error("Teams reminder failed:", errorMsg, data);
        throw new Error(errorMsg);
      }

      // Show brief success feedback
      setSyncSuccess(data.data?.message || "Reminder sent to Microsoft Teams!");
      setTimeout(() => setSyncSuccess(null), 5000);
    } catch (err) {
      console.error("Teams reminder error:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to send Teams reminder";
      setError(errorMessage);
      
      // Auto-clear error after 10 seconds
      setTimeout(() => setError(null), 10000);
    } finally {
      setSendingTeamsReminder((prev) => {
        const next = new Set(prev);
        next.delete(blockId);
        return next;
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-surface border border-border rounded-xl shadow-sm p-6">
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Study Schedule</p>
            <h3 className="text-2xl font-semibold text-text mt-2">
              Outlook-first schedule preview
            </h3>
            <p className="text-sm text-text-muted mt-2">
              We start with your Outlook calendar and block the busy windows automatically.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            {status === "authenticated" && (
              <button
                onClick={syncOutlookCalendar}
                disabled={isSyncing}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-surface-emphasis transition-colors"
              >
                {isSyncing ? "Syncing..." : "Sync Outlook now"}
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowManualModal(true)}
              className="text-sm font-semibold text-text-muted hover:text-text transition-colors text-center"
            >
              Not your schedule? Input it manually here...
            </button>
          </div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl shadow-sm p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="text-lg font-semibold text-text">Calendar view</h4>
            <p className="text-xs text-text-muted">
              Busy events show directly on the date tiles.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || isSyncing}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
            >
              {isGenerating ? "Planning..." : "Auto-plan study blocks"}
            </button>
            <button
              type="button"
              onClick={() => setCalendarCursor(new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() - 1, 1))}
              className="inline-flex items-center justify-center rounded-lg border border-border px-2 py-1 text-xs font-semibold text-text-muted hover:text-text"
            >
              Prev
            </button>
            <span className="text-sm font-semibold text-text">
              {calendarCursor.toLocaleDateString("en-PH", { month: "long", year: "numeric" })}
            </span>
            <button
              type="button"
              onClick={() => setCalendarCursor(new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() + 1, 1))}
              className="inline-flex items-center justify-center rounded-lg border border-border px-2 py-1 text-xs font-semibold text-text-muted hover:text-text"
            >
              Next
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-7 gap-2 text-xs text-text-muted">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-center font-semibold">
              {day}
            </div>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-7 gap-2">
          {calendarCells.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="min-h-[120px] rounded-lg border border-dashed border-border/40" />;
            }

            const key = formatDateKey(date);
            const dayEvents = eventsByDate[key] || [];
            const dayStudyBlocks = studyBlocksByDate[key] || [];
            const isToday = key === formatDateKey(new Date());
            const isSelected = key === selectedDateKey;

            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedDateKey(key)}
                className={`min-h-[120px] rounded-lg border p-2 transition-all ${
                  isToday 
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
                    : "border-border/60 bg-surface-emphasis hover:border-primary/40"
                } ${isSelected ? "ring-2 ring-primary/40 shadow-md" : ""}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-bold ${isToday ? "text-primary" : "text-text"}`}>
                    {date.getDate()}
                  </span>
                  {(dayEvents.length > 0 || dayStudyBlocks.length > 0) && (
                    <span className="flex items-center gap-0.5">
                      {dayEvents.length > 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" title={`${dayEvents.length} events`} />
                      )}
                      {dayStudyBlocks.length > 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-success" title={`${dayStudyBlocks.length} study blocks`} />
                      )}
                    </span>
                  )}
                </div>
                
                <div className="space-y-1 text-left">
                  {/* Study blocks - shown first with prominent styling */}
                  {dayStudyBlocks.slice(0, 2).map((block, idx) => {
                    const startTime = new Date(block.start_at).toLocaleTimeString("en-PH", {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    });
                    const smartTitle = getBlockDescription(block);
                    // Extract just the assessment name without "Study: " prefix for compact display
                    const compactTitle = smartTitle.startsWith("Study: ") 
                      ? smartTitle.substring(7) 
                      : smartTitle;
                    
                    return (
                      <div
                        key={`study-${idx}`}
                        className="group relative rounded border-l-2 border-success bg-success/10 px-1.5 py-1 hover:bg-success/20 transition-colors"
                        title={`${smartTitle} at ${startTime}`}
                      >
                        <div className="flex items-center gap-1">
                          <svg className="w-3 h-3 text-success flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                          <span className="text-[10px] font-semibold text-success truncate">
                            {startTime}
                          </span>
                        </div>
                        <p className="text-[10px] font-medium text-success/90 truncate mt-0.5">
                          {compactTitle}
                        </p>
                      </div>
                    );
                  })}
                  
                  {/* Calendar events - with colored tags */}
                  {dayEvents.slice(0, 3 - dayStudyBlocks.slice(0, 2).length).map((event) => {
                    const colors = getCalendarColor(event.calendar_name);
                    const startTime = new Date(event.start_at).toLocaleTimeString("en-PH", {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    });
                    
                    return (
                      <div
                        key={event.id}
                        className={`group relative rounded border-l-2 ${colors.border} ${colors.bg} px-1.5 py-1 hover:shadow-sm transition-all`}
                        title={`${event.title || "Busy"} at ${startTime}${event.calendar_name ? ` (${event.calendar_name})` : ""}`}
                      >
                        <div className="flex items-center gap-1 mb-0.5">
                          <span className={`w-1 h-1 rounded-full ${colors.tag} flex-shrink-0`} />
                          <span className={`text-[10px] font-semibold ${colors.text} truncate`}>
                            {startTime}
                          </span>
                        </div>
                        <p className={`text-[10px] font-medium ${colors.text} truncate`}>
                          {event.title || "Busy"}
                        </p>
                        {event.calendar_name && (
                          <span className={`inline-block mt-0.5 px-1 py-0.5 rounded text-[8px] font-semibold ${colors.tag} text-white`}>
                            {event.calendar_name}
                          </span>
                        )}
                      </div>
                    );
                  })}
                  
                  {/* Show count if more items exist */}
                  {(dayEvents.length + dayStudyBlocks.length) > 3 && (
                    <div className="text-[10px] font-semibold text-primary px-1.5 py-1">
                      +{dayEvents.length + dayStudyBlocks.length - 3} more
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {pendingEvents.length === 0 && (
          <div className="mt-4 rounded-lg border border-dashed border-border/60 bg-surface-emphasis p-4 text-xs text-text-muted">
            No Outlook events loaded yet. Sync your calendar to populate this view.
          </div>
        )}
      </div>

      {/* Manual Input Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h4 className="text-base font-semibold text-text">Manual Schedule Input</h4>
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="text-text-muted hover:text-text"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-4">
              <p className="text-sm text-text-muted mb-4">
                If you prefer not to use Outlook calendar sync, you can manually input your busy times and study preferences.
              </p>
              <button
                type="button"
                onClick={() => {
                  setUseOutlook(false);
                  setShowManualForm(true);
                  setShowManualModal(false);
                  setUnavailableTimes(defaultWeeklyAvailability);
                }}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary-hover transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Switch to Manual Input
              </button>
            </div>
          </div>
        </div>
      )}

      {showManualForm && (
        <div className="bg-surface border border-border rounded-xl shadow-sm p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
            <h3 className="text-lg font-semibold text-text">
              Manual availability
            </h3>
            <button
              type="button"
              onClick={() => {
                setUseOutlook(true);
                setShowManualForm(false);
                setUnavailableTimes([]);
                setHasAutoSynced(false);
              }}
              className="text-xs font-semibold text-primary hover:text-primary-hover"
            >
              Use Outlook calendar instead
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-text mb-3">
                When are you busy? (Classes, work, commute)
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

            <div>
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
        </div>
      )}

      {selectedDateKey && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/30 p-4 md:items-center">
          <div className="w-full max-w-xl rounded-xl border border-border bg-surface shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <h4 className="text-base font-semibold text-text">Day details</h4>
                <p className="text-xs text-text-muted">
                  {new Date(selectedDateKey).toLocaleDateString("en-PH", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDateKey(null)}
                className="text-text-muted hover:text-text"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
              {selectedDateEvents.length === 0 && (studyBlocksByDate[selectedDateKey] || []).length === 0 ? (
                <p className="text-sm text-text-muted">No events or study blocks for this day.</p>
              ) : (
                <div className="space-y-4">
                  {/* Study Blocks Section */}
                  {(studyBlocksByDate[selectedDateKey] || []).length > 0 && (
                    <div>
                      <h5 className="text-sm font-semibold text-success mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        Study Blocks
                      </h5>
                      <div className="space-y-2">
                        {(studyBlocksByDate[selectedDateKey] || []).map((block, idx) => {
                          const assessment = getAssessmentForBlock(block);
                          return (
                            <div key={idx} className="rounded-lg border-l-4 border-success bg-success/10 p-3">
                              <p className="text-sm font-semibold text-success mb-1">
                                {getBlockDescription(block)}
                              </p>
                              <p className="text-xs text-success/80">
                                {new Date(block.start_at).toLocaleTimeString("en-PH", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                                {" "}-{" "}
                                {new Date(block.end_at).toLocaleTimeString("en-PH", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                              {assessment?.due_at && (
                                <p className="text-xs text-success/70 mt-1">
                                  Due: {new Date(assessment.due_at).toLocaleDateString("en-PH", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </p>
                              )}
                              {block.id && approvedBlockIds.has(block.id) && (
                                <span className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-success">
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Approved
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Calendar Events Section */}
                  {selectedDateEvents.length > 0 && (
                    <div>
                      <h5 className="text-sm font-semibold text-text mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Calendar Events
                      </h5>
                      <div className="space-y-2">
                        {selectedDateEvents.map((event) => {
                          const colors = getCalendarColor(event.calendar_name);
                          return (
                            <div key={event.id} className={`rounded-lg border-l-4 ${colors.border} ${colors.bg} p-3`}>
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <p className={`text-sm font-semibold ${colors.text} flex-1`}>
                                  {event.title || "Busy"}
                                </p>
                                {event.calendar_name && (
                                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${colors.tag} text-white`}>
                                    {event.calendar_name}
                                  </span>
                                )}
                              </div>
                              <p className={`text-xs ${colors.text} opacity-80`}>
                                {new Date(event.start_at).toLocaleTimeString("en-PH", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                                {" "}-{" "}
                                {new Date(event.end_at).toLocaleTimeString("en-PH", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                                {event.location ? ` · ${event.location}` : ""}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showOutlookConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-border bg-surface shadow-xl">
            <div className="flex items-start justify-between border-b border-border px-6 py-4">
              <div>
                <h4 className="text-base font-semibold text-text">
                  Confirm Outlook busy times
                </h4>
                <p className="text-xs text-text-muted">
                  According to your Teams/Outlook calendar, you are busy at these times.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowOutlookConfirm(false)}
                className="text-text-muted hover:text-text"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-4">
              <div className="flex items-center justify-between text-xs">
                <div className="text-text-muted">Select the events to block.</div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedEventIds(new Set(pendingEvents.map((event) => event.id)))}
                    className="font-semibold text-primary hover:text-primary-hover"
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedEventIds(new Set())}
                    className="font-semibold text-text-muted hover:text-text"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="mt-4 max-h-[50vh] space-y-3 overflow-y-auto pr-2">
                {pendingEvents.map((event) => (
                  <label
                    key={event.id}
                    className="flex items-start gap-3 rounded-lg border border-border bg-surface-emphasis p-3"
                  >
                    <input
                      type="checkbox"
                      checked={selectedEventIds.has(event.id)}
                      onChange={() => {
                        const next = new Set(selectedEventIds);
                        if (next.has(event.id)) {
                          next.delete(event.id);
                        } else {
                          next.add(event.id);
                        }
                        setSelectedEventIds(next);
                      }}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-text">
                        {event.title || "Busy"}
                      </p>
                      <p className="text-xs text-text-muted">
                        {new Date(event.start_at).toLocaleString("en-PH", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {" "}-{" "}
                        {new Date(event.end_at).toLocaleTimeString("en-PH", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {event.calendar_name ? ` · ${event.calendar_name}` : ""}
                      </p>
                      {event.location && (
                        <p className="text-xs text-text-muted">{event.location}</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border px-6 py-4">
              <button
                type="button"
                onClick={() => setShowOutlookConfirm(false)}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-text-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={applyOutlookEvents}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white"
              >
                Use selected busy times
              </button>
            </div>
          </div>
        </div>
      )}

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
      
      {/* Schedule Results Modal */}
      {showScheduleModal && schedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
          <div className="w-full max-w-3xl rounded-xl border border-border bg-surface shadow-2xl my-8">
            <div className="flex items-start justify-between border-b border-border px-6 py-4 bg-success/5">
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
                  <h3 className="text-lg font-semibold text-text mb-1">
                    Your Study Schedule is Ready!
                  </h3>
                  <p className="text-sm text-text-muted">{schedule.message}</p>
                  {schedule.availability_source && (
                    <p className="text-xs text-text-muted mt-1">
                      Based on {schedule.availability_source === "outlook" ? "Outlook calendar" : schedule.availability_source === "combined" ? "Outlook + manual input" : "manual input"}
                    </p>
                  )}
                  {status === "authenticated" && (
                    <p className="text-xs text-primary mt-2 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Approve blocks, then click "Add to Outlook" to sync
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowScheduleModal(false);
                  setSyncSuccess(null);
                }}
                className="text-text-muted hover:text-text transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
              {/* Success message for Outlook sync */}
              {syncSuccess && (
                <div className="mb-4 rounded-lg border border-success bg-success/10 p-3">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-success flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-success">{syncSuccess}</p>
                  </div>
                </div>
              )}

              {/* Study Blocks */}
              {schedule.study_blocks.length > 0 ? (
                <div className="space-y-3">
                  {schedule.study_blocks.map((block, index) => {
                    const assessment = getAssessmentForBlock(block);
                    const isApproved = block.id && approvedBlockIds.has(block.id);
                    
                    return (
                      <div
                        key={index}
                        className="flex items-start gap-4 p-4 bg-surface-emphasis border-l-4 border-success rounded-lg hover:shadow-sm transition-shadow"
                      >
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
                            <svg
                              className="w-5 h-5 text-success"
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
                            {getBlockDescription(block)}
                          </h4>
                          {assessment?.due_at && (
                            <p className="text-xs text-text-muted mb-2">
                              Deadline: {new Date(assessment.due_at).toLocaleDateString("en-PH", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                              {assessment.is_major && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-warning/20 text-warning">
                                  Major
                                </span>
                              )}
                            </p>
                          )}
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
                        {/* Per-block approve controls */}
                        <div className="flex-shrink-0 flex flex-col items-end gap-2">
                          {block.id && (
                            <>
                              {isApproved ? (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-success bg-success/10 border border-success/20 rounded-full px-2.5 py-1">
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Approved
                                </span>
                              ) : (
                                <button
                                  onClick={() => approveBlock(block.id!)}
                                  className="inline-flex items-center gap-1 text-xs font-semibold text-success border border-success/40 rounded-full px-2.5 py-1 hover:bg-success/5 transition-colors"
                                >
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Approve
                                </button>
                              )}
                              {status === "authenticated" && isApproved && (
                                <button
                                  onClick={() => sendTeamsReminder(block.id!)}
                                  disabled={true}
                                  className="inline-flex items-center gap-1 text-xs font-semibold text-text-muted border border-border rounded-full px-2.5 py-1 cursor-not-allowed opacity-50"
                                  title="Teams reminders coming soon! Use Outlook Calendar sync for now."
                                >
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                  </svg>
                                  Teams (Soon)
                                </button>
                              )}
                            </>
                          )}
                          {!block.id && (
                            <span className="text-xs text-text-muted italic">Saving...</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-text-muted mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-text-muted">
                    No study blocks generated. Try adjusting your availability.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-border px-6 py-4 bg-surface-emphasis">
              <p className="text-xs text-text-muted">
                {schedule.study_blocks.length} study {schedule.study_blocks.length === 1 ? "block" : "blocks"} scheduled
                {approvedBlockIds.size > 0 && (
                  <span className="ml-2 text-success">
                    · {approvedBlockIds.size} approved
                  </span>
                )}
              </p>
              <div className="flex items-center gap-2">
                {status === "authenticated" && approvedBlockIds.size > 0 && (
                  <button
                    type="button"
                    onClick={syncToOutlook}
                    disabled={isSyncingToOutlook}
                    className="inline-flex items-center gap-2 rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSyncingToOutlook ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Syncing...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Add to Outlook
                      </>
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover transition-colors"
                >
                  View on Calendar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
