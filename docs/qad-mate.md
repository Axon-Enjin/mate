# QA & Test Plan (QAD)

**Project:** Mate — Autonomous Academic Orchestrator
**Date:** 2026-05-19 (last spec revision); updated 2026-05-26 11:55 (deadline extended to 12:00 noon)
**Version:** 0.2
**Owner:** Axon Enjin
**PRD:** [prd-mate.md](prd-mate.md)
**RFC(s):** [rfc-mate-syllabus-ingestion.md](rfc-mate-syllabus-ingestion.md)

---

> **Context:** "Launch" for this plan = the **KPMG demo + submission gate (2026-05-26 12:00 noon — deadline extended)**, not a public production release. This QAD is the binding spec for what must pass before submission. The deliverable is the deployed independent Mate SaaS (Copilot-powered) shown to judges + a recorded walkthrough — not a Copilot Studio bot. The competition is judged 50% Functionality/UX and 50% Data Accuracy & Relevance, so extraction accuracy is treated as a launch-blocking concern, not a nice-to-have. v1-production QA at scale (load, high concurrency, full integration matrix) is registered but out of scope for this competition gate.

## 1. Testing Strategy & Scope

**In Scope:**
- All Must-Have PRD features: syllabus ingestion, deadline-conflict reasoning, adaptive scheduling, lateral-language processing, batch HITL approval, consolidated dashboard, latency-masking.
- The extraction accuracy harness (the single highest-weighted risk).
- The Mate SaaS web/PWA flow at the mobile-first (375px) and desktop breakpoints.

**Out of Scope (this gate):**
- Multi-user / concurrency / load testing at scale — demo runs a limited pilot cohort.
- ~~Microsoft 365 / Google Workspace / LMS ICS integrations — Should-Have, deferred to commercial v1.~~ **Updated 2026-05-26:** Microsoft 365 (Outlook calendar availability + event sync, Teams reminder webhook) shipped during the submission window and is now in-scope for smoke verification; Google Workspace and LMS ICS remain deferred to commercial v1.
- Native iOS/Android/PWA clients — Won't-Have v1.
- Localization correctness beyond demo-shown Taglish strings.

**Testing levels:**

| Level | Tooling | Owner |
|-------|---------|-------|
| Extraction accuracy harness | Scripted run over a labeled PH-syllabus corpus, scored vs. gold deadlines | Axon Enjin |
| Integration (action ↔ Mistral ↔ Azure Vision) | Manual + scripted invocation of `extractSyllabus` with fixture documents | Axon Enjin |
| E2E (conversational flow) | Manual scripted run-throughs against the deployed Mate SaaS (staging slot) | Axon Enjin |
| Manual exploratory | Mate web/PWA on desktop + 375px mobile; on-camera dry run | Axon Enjin |

---

## 2. Test Environments & Data

**Staging:** Mate SaaS deployed to an Azure **staging slot** with a disposable pilot Cosmos instance; slot-swap to prod for the demo.
**Test credentials:** a small set of consenting pilot identities; data deletable on request (DPA-aware even at demo — see [clr-mate.md](clr-mate.md)).
**Data policy:** a curated corpus of **representative real PH university syllabi** (text-PDF, scanned/image-only, multi-column, merged-cell tables, "TBA" dates, year-less ranges, conflicting calendar-vs-table dates) — anonymized; **no real student PII** beyond the syllabus documents and pilot accounts. Each fixture has a hand-labeled gold set of `{title, due_at, is_major}`.

**Test data setup (updated 2026-05-26 — harness has landed):** the accuracy harness now lives at `app/qa/run-accuracy.ts`; gold-labeled corpus fixtures live at `app/qa/corpus/*.json` (initial set: `cs-socsci.json`, `multimedia.json` — paired with the source PDFs at `test/CS-SOCSCI-SocSc12-TANGARA_A-F1-2022-1.pdf` and `test/Latest_Multimedia_OBEorOBTLP-Format.pdf`). The harness reads gold labels and diffs extraction output. The original `qa/syllabi/` + `qa/gold/` placeholder layout was superseded; the `app/qa/` location is canonical.

---

## 3. Core Test Scenarios

### Happy Paths (must all pass before the demo is submitted)

| ID | Scenario | Steps | Expected Result | US-ID |
|----|----------|-------|-----------------|-------|
| H-01 | Upload text PDF → batch-approve all deadlines | Upload a clean text syllabus; review the consolidated panel; click "Approve All" | One consolidated view lists every assessment + date; rows editable; one "Approve All" commits | US-01 |
| H-02 | Collision week is named before it happens | Upload syllabi where ≥2 major deliverables fall in one 7-day window; ask for the plan | Mate explicitly names the conflict week + the colliding items + one concrete early-intervention | US-02 |
| H-03 | Plan my week from a vague request | Send "help me plan my week" with availability provided | Study blocks generated; none overlap stated unavailable time; mapped to deadlines by priority | US-03 |
| H-04 | Latency mask on large upload | Drop a large PDF | Proactive "Reading now…" message + typing indicator appears < 1s, before parse completes | US-04 |
| H-05 | Transparency toggle | On an extraction card, toggle "View Metrics" | Raw ML confidence % shows next to each item; toggle hides it again | US-05 |
| H-06 | Clarify before guessing | Send a lateral request with availability missing | Mate asks exactly one clarifying question before producing a schedule | US-03 |

### Sad Paths (edge cases and error handling)

| ID | Scenario | Input / Trigger | Expected Behavior |
|----|----------|-----------------|-------------------|
| S-01 | Ambiguous / missing date | Syllabus item with "TBA" or a year-less range | Item returned with `due_at = null`, ⚠ "needs review" flag, **no fabricated date** |
| S-02 | Scanned / image-only PDF | Upload an image-only scan | Tier-1 detects, routes to Azure AI Vision Read OCR; result still schema-bound + flagged where uncertain |
| S-03 | Extraction fails entirely | Corrupt/unparseable file or OCR failure | Graceful switch to conversational manual-entry; clear message; never a crash or dead end |
| S-04 | Conflicting dates across sections | Calendar date ≠ assessment-table date for same item | Surfaced as a conflict for the user to resolve; never silently auto-merged |
| S-05 | Multi-column / merged-cell table | Complex layout syllabus | All candidates returned flagged for manual review rather than silently dropping/guessing |
| S-06 | Unsupported file type / oversized file | Upload .exe or an over-limit file | Rejected before dispatch with a clear message; no processing attempted |
| S-07 | Hallucinated item (no source evidence) | Model emits an assessment with no verbatim `evidence` substring | Item dropped + logged, never shown on the card |
| S-08 | User edits a row then approves | Change a date in the card, then "Approve All" | Edited value persists; only edited+confirmed data is committed |

---

## 4. Automation vs. Manual Testing

### Automated

```yaml
# Extraction accuracy harness (run before recording, and after any prompt/schema change):
- Run extractSyllabus over the labeled PH-syllabus corpus
- Diff predicted {title, due_at, is_major} vs gold labels
- Compute: date-extraction error rate, fabricated-date count, needs_review precision/recall
- GATE: date-extraction error rate < 2% AND fabricated-date count == 0
```

**Gate:** the demo is not submitted if the accuracy harness fails (error rate ≥ 2% or any fabricated date).

### Manual / Exploratory

- Full scripted demo run-through on the Mate web/PWA at 375px and desktop (no horizontal scroll; "Approve All" reachable without long scroll); spot-check the Teams/Outlook Adaptive Card embed form if shown.
- On-camera dry run timing the latency mask — confirm the 0s ack genuinely precedes the parse wait and the flow does not feel slow.
- Taglish tone spot-check: copy is warm, non-judgmental, no shame language, code-switch reads naturally.
- 20-minute free-form session with off-script lateral requests to probe clarifying-question behavior.

---

## 5. Bug Triage Protocol

| Severity | Definition | Action |
|----------|------------|--------|
| **P0 — Blocker** | Fabricated/wrong date committed; crash on the demo flow; "Approve All" doesn't gate writes; extraction error rate ≥ 2% | Cannot record/submit. Fix immediately. |
| **P1 — High** | A judged capability (ingestion/conflict/scheduling/lateral) visibly fails with no workaround; latency mask absent | Cannot record/submit. Fix before recording. |
| **P2 — Medium** | Capability works but degraded; awkward but acceptable on camera | Can record. Note in submission; fix for commercial v1. |
| **P3 — Low** | Minor copy/visual issue not visible on camera | Can record. Backlog. |

**Bug tracking:** GitHub Issues on `Axon-Enjin/mate` with `bug/P0`–`bug/P3` labels.

---

## 6. Release Criteria (Definition of Done — demo gate)

Recording + submission is approved when all are true:

- [ ] All P0 bugs resolved
- [ ] All P1 bugs resolved
- [ ] Happy paths H-01 through H-06 pass on the deployed Mate SaaS staging slot
- [ ] Sad paths S-01, S-02, S-03, S-04, S-07 verified (no fabricated dates; graceful fallbacks)
- [ ] Extraction accuracy harness passes: **date-extraction error rate < 2% and zero fabricated dates** on the PH-syllabus corpus
- [ ] Latency mask verified < 1s ack before parse on a large file
- [ ] Manual exploratory session completed with no new P0/P1
- [ ] All four KPMG-judged capabilities demonstrably shown working in one end-to-end SaaS flow + batch HITL

---

## 7. AI / LLM Evaluation

**What makes an AI response "correct" in this product?**
An extraction is correct when every surfaced assessment maps to a real syllabus item, every `due_at` either equals the gold calendar date or is `null` when the source is genuinely ambiguous (a confident wrong date is worse than an honest `null`), every item carries verbatim source `evidence`, and nothing is committed without explicit batch approval. A conversation response is correct when it asks a clarifying question rather than guessing on ambiguous input, and never invents deadlines.

### Eval Suite

| Eval ID | Input | Expected Behavior | Pass Criterion |
|---------|-------|-------------------|----------------|
| AI-01 | Syllabus with one genuinely ambiguous date | Returns that item `due_at=null`, `needs_review`; other dates correct | `null` on the ambiguous item; **no guess**; others match gold |
| AI-02 | "Approve All"-gated proposal | No state/calendar write occurs until approval | Zero writes pre-approval; write only post-approval |
| AI-03 | Lateral request, availability missing | Asks exactly one clarifying question | Output contains a question; no schedule produced yet |
| AI-04 | Out-of-domain request ("write my essay") | Declines gracefully; redirects to academic-planning support | No essay produced; tutor-not-doer framing |
| AI-05 | Two majors in one 7-day window | Names the conflict week + items + a concrete intervention | Conflict + named items + actionable suggestion present |
| AI-06 | Item with no source evidence in document | Item is dropped, not surfaced | Item absent from card; logged |
| AI-07 | Image-only scan | Routes to Azure Vision; still schema-bound + flagged | OCR path taken; no fabricated dates |

**Regression evals:** re-run the full suite + accuracy harness before any system-prompt, schema, or model change. Any regression > 5% on any eval, or any new fabricated date, **blocks** the change.

**Model upgrade protocol:** run suite vs. last-known-good baseline; compare; >5% regression on any eval = block + investigate (e.g., Mistral Document AI version bump, GPT-4.1 → successor).

**Observability:** capture per-parse `tier_used`, `aggregate_confidence`, error rate, and per-syllabus cost. Key metric: **date-extraction error rate** (target < 2%). Alert: any fabricated date in any run, or cost/parse > 2× the $0.01 baseline.

---

## Self-Check

- [x] Every Must-Have PRD feature has ≥1 Happy Path (H-01..H-06 ↔ US-01..US-05)
- [x] Every Happy Path has a corresponding Sad Path (S-01..S-08)
- [x] Automated checks defined (accuracy harness is the CI-equivalent gate)
- [x] Section 7 filled (AI is core); correctness is defined and binary-gated
- [x] Release criteria are binary pass/fail, anchored to the < 2% error / zero-fabrication threshold
- [x] Test data setup documented (PH-syllabus corpus + gold labels)

---

*Next in sequence: [clr-mate.md](clr-mate.md) — compliance launch gate for any data collection / production.*
