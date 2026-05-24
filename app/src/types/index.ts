/**
 * Mate - Core TypeScript Types
 * Matches SDD Cosmos DB schema
 */

// ============================================
// Database Models (Cosmos DB)
// ============================================

export interface User {
  id: string;
  auth_subject: string;
  locale: 'fil-PH' | 'en-PH';
  created_at: string; // ISO-8601
}

export interface Course {
  id: string;
  user_id: string;
  name: string;
  term_label?: string;
  source_doc_hash: string;
  created_at?: string;
}

export interface Assessment {
  id: string;
  user_id: string;
  course_id: string;
  title: string;
  due_at: string | null; // ISO-8601 or null if ambiguous
  is_major: boolean;
  confidence: number; // 0.0-1.0
  review_state: 'needs_review' | 'approved';
  approved_at?: string | null;
  synced_targets: string[]; // ['m365', 'google', 'lms']
  evidence?: string; // Verbatim source snippet
}

export interface StudyBlock {
  id: string;
  user_id: string;
  assessment_id?: string;
  start_at: string; // ISO-8601
  end_at: string; // ISO-8601
  state: 'proposed' | 'approved';
  created_at?: string;
}

export interface IntegrationLink {
  id: string;
  user_id: string;
  provider: 'microsoft365' | 'google_workspace' | 'lms_ics';
  scope: string[];
  token_ref: string; // Key Vault reference (or encrypted token)
  created_at?: string;
}

// ============================================
// API Request/Response Types
// ============================================

export interface UploadSyllabusRequest {
  file: File | Buffer;
  filename: string;
  term_hint?: string;
}

export interface UploadSyllabusResponse {
  proposal_id: string;
  message: string;
}

export interface ExtractionProposal {
  id: string;
  user_id: string;
  filename: string;
  course?: {
    name: string;
    term_label?: string;
  };
  assessments?: Assessment[];
  tier_used?: 'mistral' | 'azure_vision' | 'manual';
  aggregate_confidence?: number;
  status: 'processing' | 'completed' | 'approving' | 'approved' | 'failed';
  created_at: string;
  updated_at?: string;
  approved_at?: string;
  course_id?: string;
  error?: string;
}

// Alias for convenience
export type Proposal = ExtractionProposal;

export interface GetProposalResponse {
  proposal: ExtractionProposal;
}

export interface UpdateAssessmentRequest {
  title?: string;
  due_at?: string | null;
  is_major?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ApproveProposalRequest {
  // No body needed - just POST to approve
}

export interface ApproveProposalResponse {
  success: boolean;
  course_id: string;
  assessment_ids: string[];
  message: string;
}

// ============================================
// AI/Extraction Types
// ============================================

export interface ExtractionResult {
  course: {
    name: string;
    term_label?: string;
  };
  assessments: {
    title: string;
    due_at: string | null;
    is_major: boolean;
    confidence: number;
    review_state: 'needs_review' | 'approved';
    evidence: string;
  }[];
  tier_used: 'mistral' | 'azure_vision' | 'manual';
  aggregate_confidence: number;
}

export interface AIModelConfig {
  endpoint: string;
  key: string;
  deployment: string;
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | MessageContent[];
}

export interface MessageContent {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: string;
}

// ============================================
// Conflict Detection Types
// ============================================

export interface ConflictWindow {
  start_date: string;
  end_date: string;
  assessments: Assessment[];
  severity: 'high' | 'medium' | 'low';
  intervention: string; // Suggested action
}

export interface ConflictReport {
  user_id: string;
  conflicts: ConflictWindow[];
  generated_at: string;
}

// ============================================
// Scheduling Types
// ============================================

export interface AvailabilityInput {
  unavailable_times: {
    day: string; // ISO date or day of week
    start: string; // HH:mm
    end: string; // HH:mm
  }[];
  preferred_study_duration: number; // minutes
  priorities?: string[]; // assessment IDs in priority order
}

export interface ScheduleRequest {
  user_id: string;
  availability: AvailabilityInput;
  upcoming_assessments: Assessment[];
}

export interface ScheduleResponse {
  study_blocks: StudyBlock[];
  message: string;
}

// ============================================
// Chat / Lateral Language Types
// ============================================

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export type ChatIntent = 'clarify' | 'schedule' | 'conflicts' | 'general';

export interface ChatAnalysis {
  intent: ChatIntent;
  reply: string;
  availability: AvailabilityInput | null;
  ready_to_schedule: boolean;
}

export interface ChatStudyBlock {
  assessment_id: string;
  start_at: string;
  end_at: string;
  description: string;
}

export interface ChatConflictWindow {
  start_date: string;
  end_date: string;
  assessment_ids: string[];
  severity: 'high' | 'medium' | 'low';
  intervention: string;
}

export interface ChatResponseData {
  message: string;
  intent: ChatIntent;
  study_blocks?: ChatStudyBlock[];
  schedule_message?: string;
  conflicts?: ChatConflictWindow[];
}

// ============================================
// UI Component Props
// ============================================

export interface UploadFormProps {
  onUploadStart: () => void;
  onUploadComplete: (proposalId: string) => void;
  onUploadError: (error: string) => void;
}

export interface ExtractionReviewProps {
  proposal: ExtractionProposal;
  onEdit: (assessmentId: string, updates: UpdateAssessmentRequest) => Promise<void>;
  onApprove: () => Promise<void>;
  showMetrics?: boolean;
}

export interface LoadingMaskProps {
  message: string;
  show: boolean;
}

export interface ApproveButtonProps {
  itemCount: number;
  onApprove: () => Promise<void>;
  disabled?: boolean;
  loading?: boolean;
}

// ============================================
// Utility Types
// ============================================

export interface ApiError {
  error: string;
  message: string;
  details?: unknown;
}

export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

// ============================================
// Configuration Types
// ============================================

export interface AppConfig {
  cosmos: {
    endpoint: string;
    key: string;
    database: string;
  };
  aiFoundry: {
    endpoint: string;
    key: string;
    deployments: {
      gpt5: string;
      mistralLarge: string;
      mistralDocument: string;
    };
  };
  features: {
    enableMetricsToggle: boolean;
    enableManualEntry: boolean;
    confidenceThreshold: number;
  };
}

// ============================================
// Type Guards
// ============================================

export function isApiError(response: unknown): response is ApiError {
  return (
    typeof response === 'object' &&
    response !== null &&
    'error' in response &&
    typeof (response as { error?: unknown }).error === 'string'
  );
}

export function isAssessment(obj: unknown): obj is Assessment {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as Assessment).id === 'string' &&
    typeof (obj as Assessment).title === 'string' &&
    typeof (obj as Assessment).confidence === 'number'
  );
}

// ============================================
// Constants
// ============================================

export const REVIEW_STATES = {
  NEEDS_REVIEW: 'needs_review' as const,
  APPROVED: 'approved' as const,
};

export const EXTRACTION_TIERS = {
  MISTRAL: 'mistral' as const,
  AZURE_VISION: 'azure_vision' as const,
  MANUAL: 'manual' as const,
};

export const PROVIDERS = {
  MICROSOFT365: 'microsoft365' as const,
  GOOGLE_WORKSPACE: 'google_workspace' as const,
  LMS_ICS: 'lms_ics' as const,
};
