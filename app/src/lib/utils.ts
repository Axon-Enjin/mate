/**
 * Mate - Utility Functions
 */

import type { ApiError, ApiSuccess } from '@/types';

// ============================================
// API Response Helpers
// ============================================

export function successResponse<T>(data: T): ApiSuccess<T> {
  return {
    success: true,
    data,
  };
}

export function errorResponse(message: string, details?: unknown): ApiError {
  if (details === undefined) {
    return { error: 'Error', message };
  }

  return {
    error: 'Error',
    message,
    details,
  };
}

// ============================================
// Date Utilities
// ============================================

export function isValidISODate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ============================================
// File Utilities
// ============================================

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

export function isValidSyllabusFile(filename: string): boolean {
  const validExtensions = ['pdf', 'doc', 'docx'];
  const ext = getFileExtension(filename);
  return validExtensions.includes(ext);
}

export function generateFileHash(content: Buffer | string): string {
  // Simple hash for deduplication
  const str = typeof content === 'string' ? content : content.toString('base64');
  return Buffer.from(str).toString('base64').substring(0, 32);
}

// ============================================
// Validation Utilities
// ============================================

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// ============================================
// Confidence Scoring
// ============================================

export function getConfidenceLabel(confidence: number): string {
  if (confidence >= 0.9) return 'High';
  if (confidence >= 0.75) return 'Good';
  if (confidence >= 0.5) return 'Medium';
  return 'Low';
}

export function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.75) return 'text-green-600';
  if (confidence >= 0.5) return 'text-yellow-600';
  return 'text-red-600';
}

// ============================================
// Error Handling
// ============================================

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unknown error occurred';
}

export function logError(context: string, error: unknown): void {
  console.error(`[${context}]`, getErrorMessage(error));
  if (error instanceof Error && error.stack) {
    console.error(error.stack);
  }
}

// ============================================
// Text Processing
// ============================================

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

export function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-z0-9.-]/gi, '_').toLowerCase();
}

// ============================================
// Async Utilities
// ============================================

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxAttempts) {
        await delay(delayMs * attempt);
      }
    }
  }
  
  throw lastError || new Error('Retry failed');
}

// ============================================
// Development Utilities
// ============================================

export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';

export function devLog(...args: unknown[]): void {
  if (isDevelopment) {
    console.log('[DEV]', ...args);
  }
}
