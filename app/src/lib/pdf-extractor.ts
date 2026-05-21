/**
 * Mate - PDF Text Extraction Utility
 * Extracts text content from PDF files for AI processing
 */

import pdf from 'pdf-parse';

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const data = await pdf(buffer);
    return data.text;
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

export function cleanExtractedText(text: string): string {
  // Remove excessive whitespace
  let cleaned = text.replace(/\s+/g, ' ');
  
  // Remove page numbers and headers/footers (common patterns)
  cleaned = cleaned.replace(/Page \d+ of \d+/gi, '');
  cleaned = cleaned.replace(/^\d+\s*$/gm, '');
  
  // Normalize line breaks
  cleaned = cleaned.replace(/\r\n/g, '\n');
  cleaned = cleaned.replace(/\r/g, '\n');
  
  return cleaned.trim();
}

export async function extractAndCleanPDF(buffer: Buffer): Promise<string> {
  const rawText = await extractTextFromPDF(buffer);
  return cleanExtractedText(rawText);
}
