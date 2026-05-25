/**
 * Mate - Azure AI Foundry Client
 * Wrapper for GPT-5, Mistral-Large-3, and mistral-document-ai-2512
 */

import type {
  AIMessage,
  ExtractionResult,
  Assessment,
  AvailabilityInput,
  ChatAnalysis,
  ChatIntent,
  ChatTurn,
} from '@/types';

// ============================================
// Configuration
// ============================================

const AI_FOUNDRY_ENDPOINT = process.env.AI_FOUNDRY_ENDPOINT!;
const AI_FOUNDRY_KEY = process.env.AI_FOUNDRY_KEY!;

const DEPLOYMENTS = {
  GPT5: process.env.GPT5_DEPLOYMENT_NAME || 'gpt-5',
  MISTRAL_LARGE: process.env.MISTRAL_LARGE_DEPLOYMENT_NAME || 'Mistral-Large-3-deployment',
  MISTRAL_DOCUMENT: process.env.MISTRAL_DOCUMENT_DEPLOYMENT_NAME || 'mistral-document-ai-2512-deployment',
};

const CONFIDENCE_THRESHOLD = parseFloat(process.env.CONFIDENCE_THRESHOLD || '0.75');

// ============================================
// AI Foundry Client
// ============================================

interface CompletionRequest {
  deployment: string;
  messages: AIMessage[];
  temperature?: number;
  max_tokens?: number;
  max_completion_tokens?: number;
  response_format?: { type: 'json_object' | 'text' };
}

interface CompletionResponse {
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

async function callAIFoundry(request: CompletionRequest): Promise<CompletionResponse> {
  // Azure AI Foundry uses OpenAI-compatible endpoint
  // Endpoint should be: https://{resource}.services.ai.azure.com/openai/v1
  
  // Remove any trailing slashes and /api/projects/... if present
  let baseEndpoint = AI_FOUNDRY_ENDPOINT.split('/api/')[0].replace(/\/$/, '');
  
  // If endpoint doesn't include /openai/v1, add it
  if (!baseEndpoint.includes('/openai/v1')) {
    baseEndpoint = `${baseEndpoint}/openai/v1`;
  }
  
  // Construct full URL
  const url = `${baseEndpoint}/chat/completions`;
  
  console.log('[AI Foundry] 🤖 Calling:', url);
  console.log('[AI Foundry] Model:', request.deployment);
  console.log('[AI Foundry] Messages:', request.messages.length);
  console.log('[AI Foundry] Temperature:', request.temperature ?? 0.7);
  
  // Check if model is GPT-5 (uses different parameter names)
  const isGPT5 = request.deployment.toLowerCase().includes('gpt-5');
  
  // GPT-5 uses max_completion_tokens, others use max_tokens
  const maxTokensParam = isGPT5 ? 'max_completion_tokens' : 'max_tokens';
  const maxTokensValue = request.max_completion_tokens ?? request.max_tokens ?? 4000;
  
  console.log('[AI Foundry] Max tokens param:', maxTokensParam, '=', maxTokensValue);
  
  // Check if model supports JSON mode (GPT models do, Mistral may not)
  const supportsJsonMode = request.deployment.toLowerCase().includes('gpt');
  
  const requestBody: Record<string, unknown> = {
    model: request.deployment, // Model/deployment name
    messages: request.messages,
    temperature: request.temperature ?? 0.7,
    [maxTokensParam]: maxTokensValue,
    // Only add response_format for models that support it
    ...(supportsJsonMode && request.response_format && { 
      response_format: request.response_format 
    }),
  };
  
  console.log('[AI Foundry] Full request body:', JSON.stringify({
    ...requestBody,
    messages: `[${request.messages.length} messages]` // Don't log full messages
  }, null, 2));
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': AI_FOUNDRY_KEY,
      },
      body: JSON.stringify(requestBody),
    });

    console.log('[AI Foundry] Response status:', response.status);

    if (!response.ok) {
      const error = await response.text();
      console.error('[AI Foundry] ❌ Error response:', error);
      console.error('[AI Foundry] ❌ This usually means:');
      console.error('[AI Foundry]    - Model name is wrong');
      console.error('[AI Foundry]    - Model is not deployed');
      console.error('[AI Foundry]    - Check Azure AI Foundry portal for correct model name');
      throw new Error(`AI Foundry API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    console.log('[AI Foundry] ✅ Success, tokens used:', data.usage?.total_tokens || 'unknown');
    return data;
  } catch (error) {
    console.error('[AI Foundry] ❌ Request failed:', error);
    if (error instanceof Error) {
      console.error('[AI Foundry] Error message:', error.message);
      if ('cause' in error) {
        console.error('[AI Foundry] Error cause:', error.cause);
      }
    }
    throw error;
  }
}

// ============================================
// Extraction Schema & Prompt
// ============================================

const EXTRACTION_SYSTEM_PROMPT = `You are a precise document extraction assistant for academic syllabi.

Your task is to extract course information and assessment deadlines from syllabus documents.

CRITICAL RULES:
1. Return ONLY valid JSON matching the schema
2. For due_at: Use ISO-8601 format (YYYY-MM-DDTHH:mm:ssZ) or null if ambiguous
3. If a date is unclear, ambiguous, or missing: SET due_at to null (NEVER guess or infer)
4. confidence: Your confidence score (0.0-1.0) for each assessment
5. evidence: The EXACT verbatim text from the document that supports this assessment
6. is_major: true for exams, projects, papers; false for quizzes, homework
7. If you cannot find a date in the document, return null - DO NOT fabricate dates

EXAMPLES OF AMBIGUOUS DATES (return null):
- "TBA" or "TBD"
- "Week 5" without specific dates
- Date ranges without clear deadline
- Missing year or timezone
- Conflicting dates in different sections

OUTPUT FORMAT:
{
  "course": {
    "name": "Course Name from syllabus",
    "term_label": "AY 2026-2027, 1st Semester" (if found)
  },
  "assessments": [
    {
      "title": "Midterm Exam",
      "due_at": "2026-10-15T00:00:00Z" or null,
      "is_major": true,
      "confidence": 0.95,
      "evidence": "Exact text from document"
    }
  ]
}`;

// ============================================
// Utility Functions for JSON Parsing
// ============================================

/**
 * Strip markdown code blocks from AI response
 * Handles cases where models return ```json ... ``` wrapped JSON
 */
function stripMarkdownCodeBlocks(content: string): string {
  // Remove ```json and ``` markers
  let cleaned = content.trim();
  
  // Check if content starts with ```json or ```
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7); // Remove ```json
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3); // Remove ```
  }
  
  // Check if content ends with ```
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3); // Remove trailing ```
  }
  
  return cleaned.trim();
}

// ============================================
// Extraction Functions
// ============================================

export async function extractFromDocument(
  documentContent: string,
  termHint?: string
): Promise<ExtractionResult> {
  try {
    // Tier 1: Try Mistral Document AI first
    const result = await extractWithMistralDocument(documentContent, termHint);
    return result;
  } catch (error) {
    console.error('Mistral Document AI extraction failed:', error);
    
    // Tier 2: Fallback to GPT-5 with vision (if needed)
    // For now, throw error - implement fallback in next iteration
    throw new Error('Extraction failed. Please try again or use manual entry.');
  }
}

type ExtractionAssessment = ExtractionResult['assessments'][number];

interface ExtractionResponse {
  course: ExtractionResult['course'];
  assessments: Omit<ExtractionAssessment, 'review_state'>[];
}

async function extractWithMistralDocument(
  documentContent: string,
  termHint?: string
): Promise<ExtractionResult> {
  const userPrompt = termHint
    ? `Extract assessments from this syllabus. Term context: ${termHint}\n\nDocument:\n${documentContent}`
    : `Extract assessments from this syllabus.\n\nDocument:\n${documentContent}`;

  const response = await callAIFoundry({
    deployment: DEPLOYMENTS.MISTRAL_DOCUMENT,
    messages: [
      { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.1, // Low temperature for precise extraction
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from AI model');
  }

  // Strip markdown code blocks if present (Mistral often wraps JSON in ```json ... ```)
  const cleanedContent = stripMarkdownCodeBlocks(content);
  console.log('[AI Foundry] 📝 Parsing JSON response (length:', cleanedContent.length, ')');
  
  const parsed = JSON.parse(cleanedContent) as ExtractionResponse;
  
  const validatedResult = validateExtractionResult(parsed, documentContent, termHint);
  
  return {
    ...validatedResult,
    tier_used: 'mistral',
  };
}

function validateExtractionResult(
  parsed: ExtractionResponse,
  documentContent: string,
  termHint?: string
): Omit<ExtractionResult, 'tier_used'> {
  const validatedAssessments: ExtractionResult['assessments'] = [];

  // Determine term window based on termHint or course.term_label
  let termStart: Date | null = null;
  let termEnd: Date | null = null;
  
  const termString = termHint || parsed.course.term_label || "";
  const yearMatches = termString.match(/\b(20\d{2})\b/g);
  if (yearMatches && yearMatches.length > 0) {
    const years = yearMatches.map(Number);
    const startYear = Math.min(...years);
    const endYear = yearMatches.length > 1 ? Math.max(...years) : startYear + 1;
    // Academic year runs from June 1 of startYear to July 31 of endYear
    termStart = new Date(Date.UTC(startYear, 5, 1)); // June 1st
    termEnd = new Date(Date.UTC(endYear, 6, 31, 23, 59, 59)); // July 31st
  } else {
    // Fallback: +/- 1 year from current date
    const currentYear = new Date().getFullYear();
    termStart = new Date(Date.UTC(currentYear - 1, 0, 1));
    termEnd = new Date(Date.UTC(currentYear + 1, 11, 31, 23, 59, 59));
  }

  for (const assessment of parsed.assessments) {
    // 1. Evidence Guard (verbatim check)
    if (!assessment.evidence || !documentContent.toLowerCase().includes(assessment.evidence.toLowerCase())) {
      console.warn(
        `[Evidence Guard] Dropped assessment "${assessment.title}" because evidence snippet was missing or not found verbatim in syllabus.`
      );
      continue; // Drop completely
    }

    let dueAt = assessment.due_at;
    let reviewState = 'approved';

    // 2. Term Window Check
    if (dueAt) {
      const dueDate = new Date(dueAt);
      if (isNaN(dueDate.getTime()) || dueDate < termStart || dueDate > termEnd) {
        console.warn(
          `[Term Window Check] Coercing due_at to null for "${assessment.title}" because "${dueAt}" is outside term window [${termStart.toISOString()}, ${termEnd.toISOString()}].`
        );
        dueAt = null;
        reviewState = 'needs_review';
      }
    } else {
      reviewState = 'needs_review';
    }

    // Confidence threshold check
    if (assessment.confidence < CONFIDENCE_THRESHOLD) {
      reviewState = 'needs_review';
    }

    validatedAssessments.push({
      ...assessment,
      due_at: dueAt,
      review_state: reviewState as 'needs_review' | 'approved',
    });
  }

  const aggregate_confidence = validatedAssessments.length > 0
    ? validatedAssessments.reduce((sum, a) => sum + a.confidence, 0) / validatedAssessments.length
    : 0;

  return {
    course: parsed.course,
    assessments: validatedAssessments,
    aggregate_confidence,
  };
}

// ============================================
// Conflict Detection
// ============================================

interface ConflictDetectionResult {
  conflicts: {
    start_date: string;
    end_date: string;
    assessment_ids: string[];
    severity: 'high' | 'medium' | 'low';
    intervention: string;
  }[];
}

export async function detectConflicts(
  assessments: Assessment[]
): Promise<ConflictDetectionResult> {
  const systemPrompt = `You are an academic planning assistant that detects deadline conflicts.

Analyze the provided assessments and identify weeks where multiple major deliverables are due.

A conflict is when 2 or more major assessments (is_major=true) fall within a 7-day window.

For each conflict, suggest a concrete early-intervention action.

CRITICAL: You MUST respond with ONLY valid JSON. No explanations, no markdown, just pure JSON.

Return JSON format:
{
  "conflicts": [
    {
      "start_date": "2026-10-10",
      "end_date": "2026-10-16",
      "assessment_ids": ["id1", "id2"],
      "severity": "high",
      "intervention": "Start the IT 101 project 4 days early - it collides with the CS 21 exam."
    }
  ]
}`;

  const userPrompt = `Analyze these assessments for conflicts:\n\n${JSON.stringify(assessments, null, 2)}\n\nRemember: Respond with ONLY valid JSON, no other text.`;

  try {
    const response = await callAIFoundry({
      deployment: DEPLOYMENTS.MISTRAL_LARGE,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 4000,
    });

    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from AI');
    }
    
    console.log('[AI Foundry] Raw conflict response:', content.substring(0, 200));
    
    // Strip markdown code blocks if present
    let cleanedContent = stripMarkdownCodeBlocks(content);
    
    // Try to extract JSON from the response if it's wrapped in text
    const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedContent = jsonMatch[0];
    }
    
    console.log('[AI Foundry] Cleaned conflict response:', cleanedContent.substring(0, 200));
    
    const parsed = JSON.parse(cleanedContent);
    if (!validateConflictSchema(parsed)) {
      throw new Error('Invalid conflict schema received from AI model');
    }
    return parsed as ConflictDetectionResult;
  } catch (error) {
    console.error('[AI Foundry] ⚠️ Conflict detection AI failed or schema invalid. Falling back to deterministic logic.', error);
    return detectConflictsDeterministic(assessments);
  }
}

// ============================================
// Schedule Generation
// ============================================

interface ScheduleGenerationResult {
  study_blocks: {
    assessment_id: string;
    start_at: string;
    end_at: string;
    description: string;
  }[];
  message: string;
}

export async function generateSchedule(
  assessments: Assessment[],
  availability: AvailabilityInput
): Promise<ScheduleGenerationResult> {
  const systemPrompt = `You are an academic planning assistant that creates realistic study schedules.

Given upcoming assessments and student availability, propose study blocks that:
1. Don't overlap with unavailable times
2. Prioritize by deadline proximity and importance
3. Respect preferred study duration
4. Are realistic and achievable

CRITICAL: You MUST respond with ONLY valid JSON. No explanations, no markdown, just pure JSON.

Return JSON format:
{
  "study_blocks": [
    {
      "assessment_id": "id",
      "start_at": "2026-10-10T14:00:00Z",
      "end_at": "2026-10-10T16:00:00Z",
      "description": "Study for Midterm Exam"
    }
  ],
  "message": "I've scheduled 8 study blocks around your classes and work."
}`;

  const userPrompt = `Create a study schedule.

Assessments:
${JSON.stringify(assessments, null, 2)}

Availability:
${JSON.stringify(availability, null, 2)}

Remember: Respond with ONLY valid JSON, no other text.`;

  try {
    const response = await callAIFoundry({
      deployment: DEPLOYMENTS.MISTRAL_LARGE,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.5,
      max_tokens: 4000,
    });

    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from AI');
    }
    
    console.log('[AI Foundry] Raw schedule response:', content.substring(0, 200));
    
    // Strip markdown code blocks if present
    let cleanedContent = stripMarkdownCodeBlocks(content);
    
    // Try to extract JSON from the response if it's wrapped in text
    const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedContent = jsonMatch[0];
    }
    
    console.log('[AI Foundry] Cleaned schedule response:', cleanedContent.substring(0, 200));
    
    const parsed = JSON.parse(cleanedContent);
    if (!validateScheduleSchema(parsed)) {
      throw new Error('Invalid schedule schema received from AI model');
    }
    return parsed as ScheduleGenerationResult;
  } catch (error) {
    console.error('[AI Foundry] ⚠️ Schedule generation AI failed or schema invalid. Falling back to deterministic logic.', error);
    return generateScheduleDeterministic(assessments, availability);
  }
}

// ============================================
// Schema Validators & Fallback Algorithms
// ============================================

function validateConflictSchema(obj: any): obj is ConflictDetectionResult {
  if (!obj || typeof obj !== 'object') return false;
  if (!Array.isArray(obj.conflicts)) return false;
  for (const c of obj.conflicts) {
    if (typeof c.start_date !== 'string') return false;
    if (typeof c.end_date !== 'string') return false;
    if (!Array.isArray(c.assessment_ids)) return false;
    if (
      typeof c.severity !== 'string' ||
      !['high', 'medium', 'low'].includes(c.severity)
    ) return false;
    if (typeof c.intervention !== 'string') return false;
  }
  return true;
}

function validateScheduleSchema(obj: any): obj is ScheduleGenerationResult {
  if (!obj || typeof obj !== 'object') return false;
  if (typeof obj.message !== 'string') return false;
  if (!Array.isArray(obj.study_blocks)) return false;
  for (const sb of obj.study_blocks) {
    if (typeof sb.assessment_id !== 'string') return false;
    if (typeof sb.start_at !== 'string') return false;
    if (typeof sb.end_at !== 'string') return false;
    if (typeof sb.description !== 'string') return false;
  }
  return true;
}

export function detectConflictsDeterministic(
  assessments: Assessment[]
): ConflictDetectionResult {
  const sorted = [...assessments]
    .filter((a) => a.due_at)
    .sort((a, b) => new Date(a.due_at!).getTime() - new Date(b.due_at!).getTime());
    
  const conflicts: ConflictDetectionResult['conflicts'] = [];
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  
  for (let i = 0; i < sorted.length; i++) {
    const a = sorted[i];
    const aTime = new Date(a.due_at!).getTime();
    const windowAssessments = [a];
    
    for (let j = i + 1; j < sorted.length; j++) {
      const b = sorted[j];
      const bTime = new Date(b.due_at!).getTime();
      if (bTime - aTime <= sevenDaysMs) {
        windowAssessments.push(b);
      } else {
        break;
      }
    }
    
    if (windowAssessments.length >= 2) {
      const start = a.due_at!.split('T')[0];
      const endDateObj = new Date(aTime + sevenDaysMs);
      const end = endDateObj.toISOString().split('T')[0];
      const assessmentIds = windowAssessments.map((wa) => wa.id);
      
      const exists = conflicts.some(
        (c) =>
          c.assessment_ids.length === assessmentIds.length &&
          c.assessment_ids.every((id) => assessmentIds.includes(id))
      );
      
      if (!exists) {
        const severity = windowAssessments.length >= 3 ? ('high' as const) : ('medium' as const);
        const titles = windowAssessments.map((wa) => wa.title).join(' and ');
        conflicts.push({
          start_date: start,
          end_date: end,
          assessment_ids: assessmentIds,
          severity,
          intervention: `Deterministic Fallback: Overload warning for ${titles}. Consider starting early!`,
        });
      }
    }
  }
  
  return { conflicts };
}

export function generateScheduleDeterministic(
  assessments: Assessment[],
  availability: AvailabilityInput
): ScheduleGenerationResult {
  const studyBlocks: ScheduleGenerationResult['study_blocks'] = [];
  const now = new Date();
  
  const sorted = [...assessments]
    .filter((a) => a.due_at)
    .sort((a, b) => new Date(a.due_at!).getTime() - new Date(b.due_at!).getTime());
    
  const unavailableTimes = availability.unavailable_times || [];
  const durationMin = availability.preferred_study_duration || 120;
  
  for (const assessment of sorted) {
    const dueDate = new Date(assessment.due_at!);
    const blocksNeeded = assessment.is_major ? 2 : 1;
    let scheduledCount = 0;
    
    for (let daysBefore = 3; daysBefore >= 1 && scheduledCount < blocksNeeded; daysBefore--) {
      const targetDate = new Date(dueDate.getTime() - daysBefore * 24 * 60 * 60 * 1000);
      if (targetDate <= now) continue;
      
      const dayOfWeek = targetDate.toLocaleDateString('en-US', { weekday: 'long' });
      const startDate = new Date(targetDate);
      // Study slot: 15:00 local time
      startDate.setHours(15, 0, 0, 0);
      const endDate = new Date(startDate.getTime() + durationMin * 60 * 1000);
      
      const isUnavailable = unavailableTimes.some((ut) => {
        const dayMatches =
          ut.day.toLowerCase() === dayOfWeek.toLowerCase() ||
          ut.day === targetDate.toISOString().split('T')[0];
        if (!dayMatches) return false;
        
        const [uStartH, uStartM] = ut.start.split(':').map(Number);
        const [uEndH, uEndM] = ut.end.split(':').map(Number);
        
        const uStartDate = new Date(targetDate);
        uStartDate.setHours(uStartH, uStartM, 0, 0);
        const uEndDate = new Date(targetDate);
        uEndDate.setHours(uEndH, uEndM, 0, 0);
        
        return startDate < uEndDate && endDate > uStartDate;
      });
      
      if (!isUnavailable) {
        studyBlocks.push({
          assessment_id: assessment.id,
          start_at: startDate.toISOString(),
          end_at: endDate.toISOString(),
          description: `Study session for ${assessment.title} (Deterministic Fallback)`,
        });
        scheduledCount++;
      }
    }
  }
  
  return {
    study_blocks: studyBlocks,
    message: `Scheduled ${studyBlocks.length} study blocks (deterministic fallback) based on your availability.`,
  };
}

// ============================================
// Lateral Language Processing
// ============================================

const CHAT_SYSTEM_PROMPT = `You are Mate, an autonomous academic assistant for Filipino university students.

You help students plan their semester by:
- Understanding vague requests like "help me plan my week"
- Asking exactly ONE clarifying question when availability or priorities are missing
- Being warm, supportive, and non-judgmental
- Using consistent Taglish tone by default (mix English + Filipino), unless the user is fully English or fully Filipino

CRITICAL: Respond with ONLY valid JSON — no markdown, no extra text.
CRITICAL: Output ONLY the keys in the schema below. Do NOT add any extra keys, debug fields, or developer notes.

JSON schema:
{
  "intent": "clarify" | "schedule" | "conflicts" | "general",
  "reply": "user-facing message in plain language",
  "availability": null OR {
    "unavailable_times": [{ "day": "Monday", "start": "08:00", "end": "17:00" }],
    "preferred_study_duration": 120
  },
  "ready_to_schedule": false
}

Rules:
- intent "clarify": missing info for scheduling — ask ONE question in reply; ready_to_schedule=false; availability=null
- intent "schedule": user gave enough availability — set ready_to_schedule=true and populate availability
- intent "conflicts": user asks about collision weeks or overlapping deadlines
- intent "general": other academic planning questions
- Never invent deadlines not in context
- If no assessments in context, tell user to upload a syllabus first
- Default preferred_study_duration to 120 minutes when inferring availability`;

function defaultChatAnalysis(reply: string, intent: ChatIntent = 'general'): ChatAnalysis {
  return {
    intent,
    reply,
    availability: null,
    ready_to_schedule: false,
  };
}

function parseChatAnalysis(content: string): ChatAnalysis {
  try {
    const cleaned = stripMarkdownCodeBlocks(content);
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : cleaned) as Partial<ChatAnalysis>;

    if (!parsed.reply || typeof parsed.reply !== 'string') {
      return defaultChatAnalysis(content.trim() || 'Can you tell me a bit more?');
    }

    const intent = (['clarify', 'schedule', 'conflicts', 'general'].includes(parsed.intent || '')
      ? parsed.intent
      : 'general') as ChatIntent;

    return {
      intent,
      reply: parsed.reply,
      availability: parsed.availability ?? null,
      ready_to_schedule: Boolean(parsed.ready_to_schedule),
    };
  } catch {
    return defaultChatAnalysis(
      content.trim() || "I'm not sure how to help with that. Can you clarify?",
      'general'
    );
  }
}

export async function processNaturalLanguage(
  userMessage: string,
  context: Record<string, unknown>,
  history: ChatTurn[] = []
): Promise<ChatAnalysis> {
  const historyMessages: AIMessage[] = history.map((turn) => ({
    role: turn.role,
    content: turn.content,
  }));

  const response = await callAIFoundry({
    deployment: DEPLOYMENTS.MISTRAL_LARGE,
    messages: [
      { role: 'system', content: CHAT_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Student context: ${JSON.stringify(context)}\n\nConversation so far is in the message history. Respond to the latest user message.`,
      },
      ...historyMessages,
      { role: 'user', content: userMessage },
    ],
    temperature: 0.5,
    max_tokens: 700,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    return defaultChatAnalysis(
      "I'm having trouble right now. Can you try again in a moment?",
      'general'
    );
  }

  return parseChatAnalysis(content);
}

// ============================================
// Utility Functions
// ============================================

export async function testAIConnection(): Promise<boolean> {
  try {
    const response = await callAIFoundry({
      deployment: DEPLOYMENTS.MISTRAL_LARGE,
      messages: [
        { role: 'user', content: 'Respond with "OK" if you can read this.' },
      ],
      temperature: 0,
      max_tokens: 10,
    });
    
    return response.choices[0]?.message?.content?.includes('OK') || false;
  } catch (error) {
    console.error('AI Foundry connection test failed:', error);
    return false;
  }
}

export { DEPLOYMENTS, CONFIDENCE_THRESHOLD };
