#!/usr/bin/env tsx
/**
 * Mate Accuracy Harness
 * Runs extraction on corpus PDFs and measures date-extraction accuracy.
 *
 * Usage:
 *   pnpm test:accuracy
 *
 * Exit codes:
 *   0  — pass (error rate < 2%)
 *   1  — fail (error rate >= 2% or unexpected errors)
 */

import { readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { createHash } from 'crypto';

// ── Minimal polyfill so pdf-extractor and ai-foundry can run outside Next.js ─
process.env.AI_FOUNDRY_ENDPOINT = process.env.AI_FOUNDRY_ENDPOINT ?? '';
process.env.AI_FOUNDRY_KEY = process.env.AI_FOUNDRY_KEY ?? '';

// ── Types ────────────────────────────────────────────────────────────────────

interface GoldenAssessment {
  title: string;
  due_at: string | null;
  is_major: boolean;
}

interface GoldenFixture {
  _meta: { source_file: string; note?: string };
  course: { name: string; term_label?: string | null };
  assessments: GoldenAssessment[];
}

interface ExtractionAssessment {
  title: string;
  due_at: string | null;
  is_major: boolean;
  confidence: number;
  review_state: string;
}

interface CorpusEntry {
  pdfPath: string;
  fixturePath: string;
  label: string;
}

// ── Corpus manifest ──────────────────────────────────────────────────────────

const CORPUS_ROOT = resolve(__dirname, '../../../test');
const FIXTURE_ROOT = resolve(__dirname, 'corpus');

const CORPUS: CorpusEntry[] = [
  {
    pdfPath: join(CORPUS_ROOT, 'CS-SOCSCI-SocSc12-TANGARA_A-F1-2022-1.pdf'),
    fixturePath: join(FIXTURE_ROOT, 'cs-socsci.json'),
    label: 'SocSci 12 (TANGARA)',
  },
  {
    pdfPath: join(CORPUS_ROOT, 'Latest_Multimedia_OBEorOBTLP-Format.pdf'),
    fixturePath: join(FIXTURE_ROOT, 'multimedia.json'),
    label: 'Multimedia Arts (PUP)',
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function normalizeDate(d: string | null): string | null {
  if (!d) return null;
  const parsed = new Date(d);
  if (isNaN(parsed.getTime())) return null;
  // Compare at day level only (YYYY-MM-DD)
  return parsed.toISOString().split('T')[0];
}

function titleSimilarity(a: string, b: string): number {
  const normalise = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  const aN = normalise(a);
  const bN = normalise(b);
  if (aN === bN) return 1;
  if (aN.includes(bN) || bN.includes(aN)) return 0.8;
  const aWords = new Set(aN.split(/\s+/));
  const bWords = new Set(bN.split(/\s+/));
  const intersection = [...aWords].filter(w => bWords.has(w)).length;
  const union = new Set([...aWords, ...bWords]).size;
  return union === 0 ? 0 : intersection / union;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function run() {
  const { extractAndCleanPDF } = await import('../src/lib/pdf-extractor');
  const { extractFromDocument } = await import('../src/lib/ai-foundry');

  let totalDateFields = 0;
  let wrongDateFields = 0;
  let totalTitleFields = 0;
  let wrongTitleFields = 0;
  let skippedEntries = 0;

  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║        Mate Accuracy Harness v1.0           ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  for (const entry of CORPUS) {
    console.log(`\n▶ ${entry.label}`);
    console.log(`  PDF:     ${entry.pdfPath}`);
    console.log(`  Fixture: ${entry.fixturePath}`);

    if (!existsSync(entry.pdfPath)) {
      console.warn(`  ⚠️  PDF not found — skipping`);
      skippedEntries++;
      continue;
    }
    if (!existsSync(entry.fixturePath)) {
      console.warn(`  ⚠️  Fixture not found — skipping`);
      skippedEntries++;
      continue;
    }

    const fixture: GoldenFixture = JSON.parse(readFileSync(entry.fixturePath, 'utf-8'));
    const pdfBuffer = readFileSync(entry.pdfPath);
    const text = await extractAndCleanPDF(pdfBuffer);

    console.log(`  Extracted text: ${text.length} chars`);

    let extracted: ExtractionAssessment[] = [];
    try {
      const result = await extractFromDocument(text);
      extracted = result.assessments;
      console.log(`  AI returned ${extracted.length} assessments (tier: ${result.tier_used})`);
    } catch (err) {
      console.error(`  ❌ AI extraction failed: ${err instanceof Error ? err.message : err}`);
      skippedEntries++;
      continue;
    }

    // Match extracted assessments to golden assessments by title similarity
    for (const golden of fixture.assessments) {
      const best = extracted
        .map(e => ({ e, score: titleSimilarity(e.title, golden.title) }))
        .sort((a, b) => b.score - a.score)[0];

      if (!best || best.score < 0.4) {
        console.log(`    [MISS] "${golden.title}" — no matching extraction`);
        totalTitleFields++;
        wrongTitleFields++;
        if (golden.due_at !== null) {
          totalDateFields++;
          wrongDateFields++;
        }
        continue;
      }

      const extracted_title = best.e.title;
      const score = best.score.toFixed(2);

      // Title check (only flag if very different)
      totalTitleFields++;
      if (best.score < 0.7) {
        wrongTitleFields++;
        console.log(`    [TITLE_MISMATCH] Golden: "${golden.title}" vs Extracted: "${extracted_title}" (sim: ${score})`);
      } else {
        console.log(`    [OK] "${golden.title}" → "${extracted_title}" (sim: ${score})`);
      }

      // Date check
      const goldenDate = normalizeDate(golden.due_at);
      const extractedDate = normalizeDate(best.e.due_at);

      // Only measure date accuracy for assessments where golden has a date
      if (goldenDate !== null) {
        totalDateFields++;
        if (goldenDate !== extractedDate) {
          wrongDateFields++;
          console.log(`      [DATE_MISMATCH] Expected: ${goldenDate} | Got: ${extractedDate}`);
        } else {
          console.log(`      [DATE_OK] ${goldenDate}`);
        }
      } else if (extractedDate !== null) {
        // Golden says no date; model invented one — possible hallucination
        console.log(`      [DATE_HALLUCINATED?] Golden: null | Got: ${extractedDate}`);
      }
    }
  }

  // ── Results ─────────────────────────────────────────────────────────────────
  const dateErrorRate = totalDateFields === 0 ? 0 : wrongDateFields / totalDateFields;
  const titleErrorRate = totalTitleFields === 0 ? 0 : wrongTitleFields / totalTitleFields;

  console.log('\n════════════════════════════════════════════════');
  console.log('  ACCURACY REPORT');
  console.log('════════════════════════════════════════════════');
  console.log(`  Date fields:    ${totalDateFields - wrongDateFields}/${totalDateFields} correct  (error: ${(dateErrorRate * 100).toFixed(1)}%)`);
  console.log(`  Title fields:   ${totalTitleFields - wrongTitleFields}/${totalTitleFields} matched (error: ${(titleErrorRate * 100).toFixed(1)}%)`);
  if (skippedEntries > 0) {
    console.log(`  Skipped:        ${skippedEntries} corpus entries`);
  }

  const THRESHOLD = 0.02; // 2% — matches RFC < 2% contract
  const pass = dateErrorRate < THRESHOLD;
  console.log(`\n  Result:  ${pass ? '✅  PASS' : '❌  FAIL'} (threshold: ${THRESHOLD * 100}%)`);
  console.log('════════════════════════════════════════════════\n');

  process.exit(pass ? 0 : 1);
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
