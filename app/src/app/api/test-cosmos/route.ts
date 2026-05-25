import { NextResponse } from "next/server";
import { testConnection, getUserAssessments, getUserCourses } from "@/lib/cosmos";

export async function GET() {
  try {
    console.log('[Test] Testing Cosmos DB connection...');
    
    // Test connection
    const connected = await testConnection();
    console.log('[Test] Connection test:', connected ? 'SUCCESS' : 'FAILED');
    
    if (!connected) {
      return NextResponse.json({
        success: false,
        error: "Failed to connect to Cosmos DB",
      }, { status: 500 });
    }
    
    // Try to get data
    console.log('[Test] Fetching courses for demo-user...');
    const courses = await getUserCourses("demo-user");
    console.log('[Test] Found', courses.length, 'courses');
    
    console.log('[Test] Fetching assessments for demo-user...');
    const assessments = await getUserAssessments("demo-user");
    console.log('[Test] Found', assessments.length, 'assessments');
    
    return NextResponse.json({
      success: true,
      connection: "OK",
      data: {
        courses: courses.length,
        assessments: assessments.length,
        sampleCourse: courses[0] || null,
        sampleAssessment: assessments[0] || null,
      },
    });
  } catch (error) {
    console.error('[Test] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
