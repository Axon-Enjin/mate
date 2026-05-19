Here is the revised PRD. The dashboard is now constrained to an Adaptive Card, batch approval is enforced to prevent notification fatigue, latency is masked by proactive messaging, the transparency toggle for ML metrics is added, and the commercial roadmap explicitly scales on the Microsoft Azure/Power Platform stack rather than pivoting away from it.

---

# Product Requirements Document (PRD)

**Project:** Mate — Autonomous Academic Orchestrator

**Date:** 2026-05-19

**Version:** 0.3

**Owner:** Carlos Jerico de la Torre

**Status:** Draft

**BRD:** N/A — no BRD written

---

## 1. Product Purpose & Value Proposition

Mate is an autonomous academic assistant that turns a student's static, scattered course documents into an active, adaptive study strategy. A student uploads their syllabi; Mate extracts every deadline, reasons about where workload collides, and proposes realistic study blocks around the student's real availability — all driven by natural-language requests like "help me plan my week." It is built for Filipino university students who juggle multiple syllabi, jobs, and long commutes, and who abandon every planner on the market because the planner demands the very executive function they lack. Mate's differentiator is **zero-setup autonomy plus conflict reasoning**: it doesn't just list tasks, it orchestrates the semester and flags the week three majors are due before the student walks into it.

The immediate deliverable is a Microsoft Copilot Studio agent demonstrated for the KPMG Academic Innovation Challenge (demo video due 2026-05-25). The long-term commercial product will scale directly on the Microsoft enterprise stack (Azure App Service, Cosmos DB, Direct Line API) to deliver a Filipino-priced, LMS-integrated, cross-device academic operating system without sacrificing the conversational AI core.

---

## 2. Target Personas

**Primary Persona — Carlo, the Commuter Undergrad**

* *Who they are:* 19, BS Computer Science at a large public university, lives 2.5 hours from campus, Android phone + hand-me-down laptop, ₱300/day allowance. Six courses; professors post syllabi as scanned PDFs in week 1 and never mention them again.
* *Their core frustration:* He owns a calendar and still misses deadlines. He realizes too late that three major requirements land in the same week. ChatGPT is his current "study assistant" and he doesn't trust its accuracy.
* *What success looks like for them:* He uploads his syllabi once, sees every deadline in one place, and gets warned about collision weeks early enough to act — with zero manual data entry.

**Secondary Persona — Bea, the Neurodivergent Notion-Abandoner**

* *Who they are:* 21, AB Communication at a private university, iPhone + MacBook, self-diagnosed ADHD, has abandoned three planner templates this year.
* *Their core frustration:* Setup friction exceeds her patience window; rigid scheduling tools trigger a shutdown response and streak-shame after a bad week makes her quit entirely.

---

## 3. Core Features & Priorities

Layered scope: **Must-Have = the KPMG competition demo MVP (Copilot Studio, due 2026-05-25).** Should/Could/Won't = the broader commercial product from the market research, intentionally deferred.

| Feature | Description | Priority |
| --- | --- | --- |
| Syllabus ingestion & parsing | Upload a syllabus (PDF/doc); agent extracts course name, assessments, and due dates into structured data | Must-Have |
| Deadline conflict reasoning | Agent detects weeks where multiple major deliverables collide and proactively flags them with an early-intervention suggestion | Must-Have |
| Adaptive study-block scheduling | Agent proposes realistic study blocks around the student's stated availability and goals | Must-Have |
| Lateral language processing | Interprets vague NL requests ("help me plan my week") and asks clarifying questions when input is ambiguous | Must-Have |
| **Batch Human-in-the-loop approval** | Student reviews, edits, and approves all extracted deadlines or schedule changes in a single bulk action to prevent alert fatigue | Must-Have |
| **Adaptive Card Dashboard** | Single consolidated, interactive view of extracted deadlines rendered cleanly within the Copilot chat stream | Must-Have |
| **Latency-masking messaging** | Proactive async chat updates while heavy AI extraction runs in the background | Must-Have |
| **Confidence-scored extraction + Transparency Toggle** | Low-confidence items are visually flagged as "needs review." Includes a UI toggle to reveal raw ML probability metrics for user transparency | Should-Have |
| Calendar two-way sync | Google / Microsoft calendar integration so approved blocks land on the student's real calendar | Should-Have |
| LMS integration (Canvas + Moodle) | Per-user ICS feed sync first; deep API integration as university partnerships mature | Should-Have |
| Filipino / Taglish UI & tone | Localized strings and code-switch-aware agent responses | Should-Have |
| Offline-first store + sync | Local-first task store with background sync for low-connectivity / commute use | Could-Have |
| Forgiving streaks & gentle nudges | ADHD-aware re-engagement: no shame for missed days, compassionate restart | Could-Have |
| Native iOS / Android apps + PWA | Cross-device delivery via Direct Line consumed by native apps scaling on Azure | Won't-Have (v1) |

---

## 4. User Stories & Acceptance Criteria

**US-01 — Upload a syllabus and get every deadline extracted (Batch Approval)**

> As a student, I want to upload my syllabus and have Mate pull out all my deadlines into a single list so I can verify them in one click.

Acceptance Criteria:

* Given a text-based syllabus PDF, when the student uploads it, then Mate returns a single Adaptive Card containing a consolidated list of all extracted assessments and dates.
* Given a syllabus where a date is ambiguous, when extraction runs, then Mate returns the item with a visual warning icon (needs review) rather than inventing a date.
* Given the Adaptive Card is presented, when the user reviews it, then they can edit individual rows and click a single "Approve All" button to commit the data.

**US-02 — Be warned about collision weeks before they happen**

> As a student, I want Mate to tell me when several major requirements are due in the same week so that I can start early instead of finding out too late.

Acceptance Criteria:

* Given two or more major deliverables fall within the same 7-day window, when the student asks for their plan or uploads a new syllabus, then Mate explicitly names the conflict week and the colliding items.
* Given a conflict is detected, when Mate reports it, then it suggests a concrete early-intervention (e.g., start item X N days sooner).

**US-03 — Plan my week from a vague request**

> As a student, I want to say "help me plan my week" and get a realistic schedule so that I don't have to design the plan myself.

Acceptance Criteria:

* Given the student sends a lateral/ambiguous request, when required information is missing (availability, priorities), then Mate asks a clarifying question before producing a schedule.
* Given the student provides availability, when Mate generates study blocks, then blocks do not overlap stated unavailable times and map to upcoming deadlines by priority.

**US-04 — Masking AI Latency**

> As a student, I need to know the bot is working when I upload a large file so I don't think the app crashed.

Acceptance Criteria:

* Given the user drops a PDF, when the file begins processing, then Mate immediately fires a proactive message (e.g., "Got it! Reading the syllabus now...") and displays a typing indicator while the payload processes.

**US-05 — Transparent AI Metrics**

> As a student, I want the option to see why the AI flagged certain dates so I can judge its reliability.

Acceptance Criteria:

* Given an extracted list of deadlines, when the user toggles "View Metrics", then the UI displays the raw ML confidence percentage (e.g., "78% match") next to each item.

---

## 5. UX & Design Intent

**Design reference:** see dsd-mate.md (not yet written)

**Key flows:**

* First-run: upload syllabus → immediate async acknowledgment (latency masking) → review single Adaptive Card of extracted deadlines → click "Confirm All".
* Weekly plan: "help me plan my week" → answer at most one clarifying prompt → review proposed blocks via Adaptive Card → batch approve.

**Constraints:**

* **Zero-setup onboarding:** a usable result from a single syllabus upload, with no template configuration.
* **Adaptive Card UI constraint:** Dashboard and schedule views MUST be rendered as concise, interactive Adaptive Cards. Do not dump massive Markdown tables into the chat that push previous context off-screen.
* **Batch Processing:** No destructive action without explicit student confirmation, and no single-item approval fatigue. All confirmations happen in bulk.
* **Emotional safety:** no shame-based streaks, no surprise paywalls, no silently-written (unconfirmed) deadlines.

---

## 6. Out of Scope for This Release

* **Monetization is entirely out of scope for the hackathon.** No payments, pricing tiers, GCash/Maya checkout, or microtransaction exam packs are built or shown.
* **Native iOS / Android apps and offline-first sync** — deferred to commercial v1. (Future architecture will utilize Direct Line API to push Copilot Studio capabilities to native clients hosted on Azure).
* **Deep LMS API integrations and university B2B licensing** — deferred; ICS-feed sync is the earliest commercial step.
* **Mental-wellness check-ins and NCMH referral routing** — deferred; regulatory caution required.
* **Cebuano / Bahasa Indonesia localization and SEA expansion** — deferred to commercial v2+.

*The competition demo deliberately excludes everything not needed to prove the four judged capabilities (ingestion, conflict reasoning, adaptive scheduling, lateral language) plus human-in-the-loop control.*

---

## 7. AI / Agent Feature Specifications

**AI Component:** Mate autonomous academic orchestrator agent
**Model(s) considered:** Copilot Studio default generative orchestration (GPT-class); Mistral Document AI for syllabus parsing; Azure AI Vision Read for OCR fallback; OpenAI GPT-4.1 for text generation.
**Selected model:** Copilot Studio generative orchestration for the agent layer; Mistral Document AI for document extraction with Azure AI Vision Read fallback for image-only or low-quality scans; OpenAI GPT-4.1 for text generation.

**Input → Output contract & Latency:**

* Input: an uploaded syllabus document plus free-text student requests.
* Output: Structured JSON mapped to an Adaptive Card, plus a conflict report naming collision weeks.
* Latency expectation: Immediate text acknowledgment ("Reading now...") triggered at 0s. Full syllabus parse payload returns within ~10–20s.

**Data Transparency & Fallbacks:**

* By default, low-confidence scores trigger a visual warning state (e.g., yellow icon, "Needs Review"). Users can activate a Transparency Toggle to view raw ML probability metrics if they wish to inspect the AI's reasoning.
* If parsing confidence is critically low or extraction fails entirely, Mate falls back to manual deadline entry via the conversational flow.

**Edge cases and handling:**

* Scanned or image-only PDFs route to Azure AI Vision Read.
* Multi-column layouts or tables with merged cells return all candidates flagged for manual review.
* Conflicting dates across sections (calendar vs. assessment table) are surfaced as conflicts and never auto-merged.
* Missing year/timezone defaults to the term header when present.

**Token / cost budget per operation:**
~$0.002–$0.01 per syllabus parsed (Mistral primary; Azure Vision Read on OCR fallback). Copilot Studio at ~5–15 Copilot Credits ($0.01/credit) per substantive interaction.

---

## 8. Dependencies & Assumptions

**Dependencies:**

* Microsoft Copilot Studio environment provisioned with generative orchestration enabled and Adaptive Card rendering supported.
* A document-parsing endpoint for Mistral Document AI and an OCR fallback via Azure AI Vision Read.
* Sample syllabi representative of real Philippine university course documents for the demo.

**Assumptions:**

* Competition judging weighs Functionality/UX and Data Accuracy/Relevance 50/50, requiring the demo to look fast (latency masking) while being accurate (batch approval + transparency toggle).
* The commercial product will scale on Microsoft Azure, meaning Copilot Studio components built for the demo provide direct foundational value for V1, rather than being throwaway architecture.

---

## 9. Milestones

| Milestone | Deliverable | Target Date |
| --- | --- | --- |
| M0 | Copilot Studio agent scaffolded; syllabus upload → structured extraction via Adaptive Cards | 2026-05-20 |
| M1 | Conflict reasoning + adaptive scheduling + batch human approval working end-to-end | 2026-05-23 |
| M2 | Demo video recorded showcasing latency masking and zero-setup flow | 2026-05-24 |
| Launch | Competition submission sent to KPMG contacts (demo video) | 2026-05-25 |
| Post-comp v1 | Commercial migration: Connect Direct Line API to custom Native/PWA clients via Azure | TBD |
