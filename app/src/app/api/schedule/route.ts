import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createStudyBlock, getUserAssessments } from "@/lib/cosmos";
import { generateSchedule } from "@/lib/ai-foundry";
import { requireUserId } from "@/lib/auth-session";
import { successResponse, errorResponse, logError } from "@/lib/utils";
import type { AvailabilityInput, BusyBlock } from "@/types";
import { getOutlookBusyBlocks } from "@/lib/microsoft-graph";

const TIME_ZONE = "Asia/Manila";
const DATE_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const TIME_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const DEFAULT_STUDY_DURATION = 120;

function formatDate(date: Date) {
  return DATE_FORMATTER.format(date);
}

function formatTime(date: Date) {
  return TIME_FORMATTER.format(date);
}

function toMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function mergeUnavailableTimes(
  times: { day: string; start: string; end: string }[]
) {
  const grouped = new Map<string, { start: string; end: string }[]>();

  for (const time of times) {
    if (!grouped.has(time.day)) {
      grouped.set(time.day, []);
    }
    grouped.get(time.day)?.push({ start: time.start, end: time.end });
  }

  const merged: { day: string; start: string; end: string }[] = [];

  grouped.forEach((entries, day) => {
    const sorted = entries
      .filter((entry) => entry.start && entry.end)
      .sort((a, b) => toMinutes(a.start) - toMinutes(b.start));

    if (sorted.length === 0) {
      return;
    }

    let current = { ...sorted[0] };

    for (let i = 1; i < sorted.length; i += 1) {
      const next = sorted[i];
      if (toMinutes(next.start) <= toMinutes(current.end)) {
        if (toMinutes(next.end) > toMinutes(current.end)) {
          current.end = next.end;
        }
      } else {
        merged.push({ day, start: current.start, end: current.end });
        current = { ...next };
      }
    }

    merged.push({ day, start: current.start, end: current.end });
  });

  return merged;
}

function splitBusyBlock(block: BusyBlock) {
  const start = new Date(block.start_at);
  const end = new Date(block.end_at);

  const result: { day: string; start: string; end: string }[] = [];
  let cursor = new Date(start);

  while (formatDate(cursor) <= formatDate(end)) {
    const day = formatDate(cursor);
    const isStartDay = day === formatDate(start);
    const isEndDay = day === formatDate(end);

    const startTime = isStartDay ? formatTime(start) : "00:00";
    const endTime = isEndDay ? formatTime(end) : "23:59";

    result.push({ day, start: startTime, end: endTime });

    cursor.setDate(cursor.getDate() + 1);
  }

  return result;
}

function busyBlocksToUnavailableTimes(blocks: BusyBlock[]) {
  const times = blocks.flatMap(splitBusyBlock);
  return mergeUnavailableTimes(times);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = await requireUserId();
    const availability: AvailabilityInput | undefined = body.availability;
    const useOutlook = Boolean(body.use_outlook);
    const saveProposal = Boolean(body.save_proposal);

    if (!userId) {
      return NextResponse.json(
        errorResponse("Unauthorized - Please sign in"),
        { status: 401 }
      );
    }

    console.log('[Schedule] Generating schedule for user:', userId);
    console.log('[Schedule] Availability:', JSON.stringify(availability, null, 2));

    // Get upcoming assessments
    const allAssessments = await getUserAssessments(userId);
    console.log('[Schedule] Found', allAssessments.length, 'total assessments');
    
    // Filter to upcoming assessments with dates
    const now = new Date();
    const upcomingAssessments = allAssessments.filter(
      (a) => a.due_at && new Date(a.due_at) > now && a.review_state === "approved"
    );

    console.log('[Schedule] Found', upcomingAssessments.length, 'upcoming assessments');

    if (upcomingAssessments.length === 0) {
      return NextResponse.json(
        successResponse({
          study_blocks: [],
          message: "No upcoming assessments found. Upload a syllabus first!",
        })
      );
    }

    const preferredStudyDuration =
      availability?.preferred_study_duration ?? DEFAULT_STUDY_DURATION;

    let combinedUnavailableTimes = availability?.unavailable_times || [];
    let availabilitySource: AvailabilityInput["availability_source"] = "manual";

    if (useOutlook) {
      const session = await auth();

      if (!session || !session.accessToken) {
        return NextResponse.json(
          errorResponse("Outlook availability requires sign-in"),
          { status: 401 }
        );
      }

      const windowStart = new Date();
      const windowEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const busyBlocks = await getOutlookBusyBlocks(
        session.accessToken,
        windowStart,
        windowEnd
      );

      const outlookUnavailableTimes = busyBlocksToUnavailableTimes(busyBlocks);

      combinedUnavailableTimes = mergeUnavailableTimes([
        ...combinedUnavailableTimes,
        ...outlookUnavailableTimes,
      ]);

      availabilitySource = combinedUnavailableTimes.length > 0 && (availability?.unavailable_times || []).length > 0
        ? "combined"
        : "outlook";
    }

    if (combinedUnavailableTimes.length === 0) {
      return NextResponse.json(
        errorResponse("Availability information is required"),
        { status: 400 }
      );
    }

    const finalAvailability: AvailabilityInput = {
      unavailable_times: combinedUnavailableTimes,
      preferred_study_duration: preferredStudyDuration,
      priorities: availability?.priorities,
      availability_source: availabilitySource,
    };

    console.log('[Schedule] Calling AI to generate schedule...');

    // Generate schedule using AI
    const result = await generateSchedule(upcomingAssessments, finalAvailability);

    console.log('[Schedule] AI returned', result.study_blocks.length, 'study blocks');

    let studyBlocks = result.study_blocks;

    if (saveProposal && studyBlocks.length > 0) {
      const createdBlocks = await Promise.all(
        studyBlocks.map((block) =>
          createStudyBlock({
            user_id: userId,
            assessment_id: block.assessment_id,
            start_at: block.start_at,
            end_at: block.end_at,
            state: "proposed",
          })
        )
      );

      studyBlocks = createdBlocks.map((block) => {
        // Find the matching assessment to get its title
        const assessment = upcomingAssessments.find((a) => a.id === block.assessment_id);
        const description = assessment 
          ? `Study: ${assessment.title}` 
          : result.study_blocks.find((b) => b.assessment_id === block.assessment_id)?.description || "Study session";
        
        return {
          assessment_id: block.assessment_id || "",
          start_at: block.start_at,
          end_at: block.end_at,
          description,
          id: block.id,
        };
      });
    }

    return NextResponse.json(
      successResponse({
        study_blocks: studyBlocks,
        message: result.message,
        assessments: upcomingAssessments,
        availability_source: availabilitySource,
      })
    );
  } catch (error) {
    logError("Schedule generation", error);
    return NextResponse.json(
      errorResponse("Failed to generate schedule", error instanceof Error ? error.message : undefined),
      { status: 500 }
    );
  }
}
