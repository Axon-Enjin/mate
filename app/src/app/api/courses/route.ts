import { NextResponse } from "next/server";
import { getUserCourses, getCourseAssessments } from "@/lib/cosmos";
import { requireUserId } from "@/lib/auth-session";
import { successResponse, errorResponse, logError } from "@/lib/utils";
import type { Assessment, Course } from "@/types";

export interface CourseWithAssessments extends Course {
  assessments: Assessment[];
}

export async function GET() {
  try {
    const userId = await requireUserId();

    if (!userId) {
      return NextResponse.json(
        errorResponse("Unauthorized - Please sign in"),
        { status: 401 }
      );
    }

    const courses = await getUserCourses(userId);

    const coursesWithAssessments: CourseWithAssessments[] = await Promise.all(
      courses.map(async (course) => {
        const assessments = await getCourseAssessments(course.id, userId);
        return {
          ...course,
          assessments: assessments.filter((a) => a.review_state === "approved"),
        };
      })
    );

    coursesWithAssessments.sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bTime - aTime;
    });

    const totalDeadlines = coursesWithAssessments.reduce(
      (sum, course) => sum + course.assessments.length,
      0
    );

    return NextResponse.json(
      successResponse({
        courses: coursesWithAssessments,
        total_deadlines: totalDeadlines,
      })
    );
  } catch (error) {
    logError("List courses", error);
    return NextResponse.json(
      errorResponse("Failed to load courses"),
      { status: 500 }
    );
  }
}
