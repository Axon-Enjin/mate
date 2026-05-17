# Product Requirements Document (PRD)

**Project:** Mate — Autonomous Academic Orchestrator
**Date:** 2026-05-17
**Version:** 0.1
**Owner:** Carlos Jerico de la Torre
**Status:** Draft
**BRD:** N/A — no BRD written

---

## 1. Product Purpose & Value Proposition

Mate is an autonomous academic assistant that turns a student's static, scattered course documents into an active, adaptive study strategy. A student uploads their syllabi; Mate extracts every deadline, reasons about where workload collides, and proposes realistic study blocks around the student's real availability — all driven by natural-language requests like "help me plan my week." It is built for Filipino university students who juggle multiple syllabi, jobs, and long commutes, and who abandon every planner on the market because the planner demands the very executive function they lack. Mate's differentiator is **zero-setup autonomy plus conflict reasoning**: it doesn't just list tasks, it orchestrates the semester and flags the week three majors are due before the student walks into it. The immediate deliverable is a Microsoft Copilot Studio agent demonstrated for the KPMG Academic Innovation Challenge (demo video due 2026-05-25); the long-term product is a Filipino-priced, LMS-integrated, mobile-first academic operating system.

---

## 2. Target Personas

**Primary Persona — Carlo, the Commuter Undergrad**
- *Who they are:* 19, BS Computer Science at a large public university, lives 2.5 hours from campus, Android phone + hand-me-down laptop, ₱300/day allowance. Six courses; professors post syllabi as scanned PDFs in week 1 and never mention them again.
- *Their core frustration:* He owns a calendar and still misses deadlines. He realizes too late that three major requirements land in the same week. ChatGPT is his current "study assistant" and he doesn't trust its accuracy.
- *What success looks like for them:* He uploads his syllabi once, sees every deadline in one place, and gets warned about collision weeks early enough to act — with zero manual data entry.

**Secondary Persona — Bea, the Neurodivergent Notion-Abandoner**
- *Who they are:* 21, AB Communication at a private university, iPhone + MacBook, self-diagnosed ADHD, has abandoned three planner templates this year.
- *Their core frustration:* Setup friction exceeds her patience window; rigid scheduling tools trigger a shutdown response and streak-shame after a bad week makes her quit entirely.

---

## 3. Core Features & Priorities

Layered scope: **Must-Have = the KPMG competition demo MVP (Copilot Studio, due 2026-05-25).** Should/Could/Won't = the broader commercial product from the market research, intentionally deferred.

| Feature | Description | Priority |
|---------|-------------|----------|
| Syllabus ingestion & parsing | Upload a syllabus (PDF/doc); agent extracts course name, assessments, and due dates into structured data | Must-Have |
| Deadline conflict reasoning | Agent detects weeks where multiple major deliverables collide and proactively flags them with an early-intervention suggestion | Must-Have |
| Adaptive study-block scheduling | Agent proposes realistic study blocks around the student's stated availability and goals | Must-Have |
| Lateral language processing | Interprets vague NL requests ("help me plan my week") and asks clarifying questions when input is ambiguous | Must-Have |
| Human-in-the-loop approval | Student reviews and approves/edits every schedule or calendar change before it is committed | Must-Have |
| Centralized deadline dashboard | Single consolidated view of all extracted deadlines across all uploaded courses | Must-Have |
| Confidence-scored extraction | Each extracted date carries a confidence score; low-confidence items are flagged "verify with your professor" | Should-Have |
| Calendar two-way sync | Google / Microsoft calendar integration so approved blocks land on the student's real calendar | Should-Have |
| LMS integration (Canvas + Moodle) | Per-user ICS feed sync first; deep API integration as university partnerships mature | Should-Have |
| Filipino / Taglish UI & tone | Localized strings and code-switch-aware agent responses | Should-Have |
| Offline-first store + sync | Local-first task store with background sync for low-connectivity / commute use | Could-Have |
| Forgiving streaks & gentle nudges | ADHD-aware re-engagement: no shame for missed days, compassionate restart | Could-Have |
| Native iOS / Android apps + PWA | Cross-device delivery via Direct Line consumed by native apps | Won't-Have (v1) |
| Mental-wellness check-ins | Wellness-aware prompts with NCMH 1553 referral routing | Won't-Have (v1) |

---

## 4. User Stories & Acceptance Criteria

**US-01 — Upload a syllabus and get every deadline extracted**
> As a student, I want to upload my syllabus and have Mate pull out all my deadlines so that I don't have to read the document and copy dates manually.

Acceptance Criteria:
- Given a text-based syllabus PDF, when the student uploads it, then Mate returns a structured list of assessments with titles and due dates.
- Given a syllabus where a date is ambiguous or missing, when extraction runs, then Mate returns the item flagged as low-confidence rather than inventing a date.
- Given extraction completes, when results are shown, then the student can edit or correct any item before it is saved.

**US-02 — Be warned about collision weeks before they happen**
> As a student, I want Mate to tell me when several major requirements are due in the same week so that I can start early instead of finding out too late.

Acceptance Criteria:
- Given two or more major deliverables fall within the same 7-day window, when the student asks for their plan or uploads a new syllabus, then Mate explicitly names the conflict week and the colliding items.
- Given a conflict is detected, when Mate reports it, then it suggests a concrete early-intervention (e.g., start item X N days sooner).

**US-03 — Plan my week from a vague request**
> As a student, I want to say "help me plan my week" and get a realistic schedule so that I don't have to design the plan myself.

Acceptance Criteria:
- Given the student sends a lateral/ambiguous request, when required information is missing (availability, priorities), then Mate asks a clarifying question before producing a schedule.
- Given the student provides availability, when Mate generates study blocks, then blocks do not overlap stated unavailable times and map to upcoming deadlines by priority.
- Given a proposed schedule, when it is presented, then nothing is committed until the student approves it.

**US-04 — Stay in control of every change**
> As a student, I want to approve schedule changes before they take effect so that the assistant supports me without taking over.

Acceptance Criteria:
- Given Mate proposes any schedule or calendar change, when it is generated, then it is presented as a proposal requiring explicit approve / edit / reject.
- Given the student rejects or edits a proposal, when they respond, then Mate adjusts and re-proposes rather than committing the original.

---

## 5. UX & Design Intent

**Design reference:** see dsd-mate.md (not yet written)

**Key flows:**
- First-run: upload syllabus → review extracted deadlines → confirm — should take no more than 3 steps and require no account setup or template selection.
- Weekly plan: "help me plan my week" → answer at most one clarifying prompt → review proposed blocks → approve.

**Constraints:**
- Zero-setup onboarding: a usable result from a single syllabus upload, with no template configuration.
- Conversational-first: the primary interface is the Copilot Studio chat surface; no destructive action without explicit student confirmation.
- Emotional safety: no shame-based streaks, no surprise paywalls, no silently-written (unconfirmed) deadlines.

---

## 6. Out of Scope for This Release

- **Monetization is entirely out of scope for the hackathon.** No payments, pricing tiers, GCash/Maya checkout, or microtransaction exam packs are built or shown — this is not a priority and is intentionally hidden. It is only surfaced for public production, where it returns as a commercial v1 concern.
- Native iOS / Android apps and offline-first sync — deferred to commercial v1.
- Deep LMS API integrations and university B2B licensing — deferred; ICS-feed sync is the earliest commercial step.
- Mental-wellness check-ins and NCMH referral routing — deferred; regulatory caution required.
- Cebuano / Bahasa Indonesia localization and SEA expansion — deferred to commercial v2+.
- Spaced-repetition study companion and barkada body-doubling rooms — deferred to commercial v2.

*The competition demo deliberately excludes everything not needed to prove the four judged capabilities (ingestion, conflict reasoning, adaptive scheduling, lateral language) plus human-in-the-loop control.*

---

## 7. AI / Agent Feature Specifications

**AI Component:** Mate autonomous academic orchestrator agent
**Model(s) considered:** Copilot Studio default generative orchestration (GPT-class); Gemini 2.5 Flash-Lite for syllabus parsing; GPT-4o-mini as parsing fallback
**Selected model:** Copilot Studio generative orchestration for the agent layer; Gemini 2.5 Flash-Lite for document extraction — *reason: competition mandates Copilot Studio as the primary platform; Flash-Lite gives layout-aware syllabus parsing at ~$0.002 per 5-page document, the lowest-cost option that beats Azure Document Intelligence on the 2025 DSL-QA benchmark.*

**What the AI does:**
Parses uploaded syllabi into structured assessments and dates; reasons over the consolidated deadline set to detect collision weeks; interprets lateral natural-language requests; generates realistic study-block proposals against stated availability; asks clarifying questions when input is incomplete.

**Input → Output contract:**
- Input: an uploaded syllabus document plus free-text student requests and availability.
- Output: structured JSON of `{course, assessment, due_date, confidence}`; a conflict report naming collision weeks; a proposed schedule presented for approval.
- Latency expectation: syllabus parse returns within ~10–20s for a typical 5-page syllabus; conversational responses near-interactive.

**Human-in-the-loop points:**
- Student confirms or edits extracted deadlines before they are saved.
- Student approves, edits, or rejects every proposed schedule or calendar change before it is committed.

**Fallback behavior when AI fails or is unavailable:**
If parsing confidence is low or a date is ambiguous, Mate returns the item flagged "verify with your professor" rather than guessing. If document extraction fails entirely, Mate falls back to manual deadline entry through the same conversational flow. If the orchestration model is unavailable, the dashboard of already-confirmed deadlines remains readable.

**Token / cost budget per operation:**
~$0.002–$0.01 per syllabus parsed (Gemini 2.5 Flash-Lite primary). Conversational orchestration on Copilot Studio at ~5–15 Copilot Credits ($0.01/credit) per substantive interaction; demo-scale usage is well within a prepaid pack.

---

## 8. Dependencies & Assumptions

**Dependencies:**
- Microsoft Copilot Studio environment provisioned with generative orchestration enabled.
- A document-parsing model endpoint (Gemini 2.5 Flash-Lite or equivalent) reachable from the agent.
- Sample syllabi representative of real Philippine university course documents for the demo.

**Assumptions:**
- Competition judging weighs Functionality/UX and Data Accuracy/Relevance 50/50, so extraction accuracy and conflict-reasoning correctness are as important as the conversational experience.
- Demo syllabi are primarily text-based PDFs (scanned/handwritten handling is a known weaker path, mitigated by confidence flagging).
- The student retains all responsibility for attending classes and submitting work; Mate is explicitly supportive, not authoritative.

---

## 9. Milestones

| Milestone | Deliverable | Target Date |
|-----------|-------------|-------------|
| M0 | Copilot Studio agent scaffolded; syllabus upload → structured extraction working on sample docs | 2026-05-20 |
| M1 | Conflict reasoning + adaptive scheduling + lateral-language clarification working end-to-end with human approval | 2026-05-23 |
| M2 | Demo video recorded and rehearsed against the 50/50 judging criteria | 2026-05-24 |
| Launch | Competition submission sent to KPMG contacts (demo video) | 2026-05-25 |
| Post-comp v1 | Commercial Should-Haves: calendar sync, ICS LMS feeds, Taglish UI, confidence UI | TBD (pending finalist outcome 2026-05-29) |

---

## Self-Check

- [x] Every Must-Have feature in Section 3 has at least one user story in Section 4 (ingestion → US-01, conflict reasoning → US-02, adaptive scheduling + lateral language → US-03, human-in-the-loop → US-04; dashboard exercised across US-01/US-02)
- [x] Acceptance criteria are testable (Given/When/Then format)
- [x] Section 6 explicitly names things that were discussed but cut
- [x] Section 7 is filled (AI component is core to the product)
- [x] Section 9 has realistic dates (bounded by the 2026-05-25 submission deadline)
- [x] This document answers *what* to build, not *how* (architecture belongs in the SDD)
