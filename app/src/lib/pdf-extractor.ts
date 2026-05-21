/**
 * Mate - PDF Text Extraction Utility
 * Extracts text content from PDF files for AI processing
 */

import pdfParse from 'pdf-parse';

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    console.log('[PDF] Starting extraction, buffer size:', buffer.length);
    console.log('[PDF] Buffer is valid:', Buffer.isBuffer(buffer));
    console.log('[PDF] PDF header:', buffer.slice(0, 5).toString('ascii'));
    
    // Check if file is suspiciously small
    if (buffer.length < 1000) {
      throw new Error(
        `PDF file is too small (${buffer.length} bytes). ` +
        `This may be a corrupted or incomplete file. ` +
        `A typical syllabus PDF should be at least 50KB. ` +
        `Please try a different PDF.`
      );
    }
    
    // Check PDF header
    const header = buffer.slice(0, 5).toString('ascii');
    if (header !== '%PDF-') {
      throw new Error(
        `Not a valid PDF file (header: ${header}). ` +
        `Please upload a PDF document.`
      );
    }
    
    const data = await pdfParse(buffer);
    
    console.log('[PDF] Extraction successful!');
    console.log('[PDF] Pages:', data.numpages);
    console.log('[PDF] Text length:', data.text.length);
    console.log('[PDF] First 200 chars:', data.text.substring(0, 200));
    
    if (data.text.length === 0) {
      throw new Error(
        'No text found in PDF. ' +
        'This PDF may be image-based (scanned) and requires OCR. ' +
        'Please try a text-based PDF or use manual entry.'
      );
    }
    
    return data.text;
  } catch (error) {
    console.error('[PDF] ❌ Extraction error:', error);
    console.error('[PDF] Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('[PDF] Error message:', error instanceof Error ? error.message : String(error));
    
    // Re-throw with helpful message
    if (error instanceof Error) {
      // If it's already our custom error, just re-throw
      if (error.message.includes('too small') || 
          error.message.includes('Not a valid PDF') ||
          error.message.includes('No text found')) {
        throw error;
      }
      
      // Handle specific pdf-parse errors
      if (error.message.includes('XRef') || error.message.includes('bad')) {
        throw new Error(
          `PDF has corrupted internal structure (${error.message}). ` +
          `This usually means the file is damaged or incomplete. ` +
          `Please try re-downloading the PDF or use a different file.`
        );
      }
      
      if (error.message.includes('encrypt')) {
        throw new Error(
          'PDF is password-protected or encrypted. ' +
          'Please remove the password and try again.'
        );
      }
      
      // Generic error
      throw new Error(
        `Failed to extract text from PDF: ${error.message}. ` +
        `The PDF may be corrupted, encrypted, or image-based. ` +
        `Try a different file or use manual entry.`
      );
    }
    
    throw error;
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
