# Business Requirements Document (BRD)

**Project:** Mate — Autonomous Academic Orchestrator
**Date:** 2026-05-19
**Version:** 0.2
**Owner:** Axon Enjin
**Status:** Draft

---

## 1. Executive Summary

A Filipino university student today juggles a multi-hour commute, a part-time job, six syllabi worth of unparsed deadlines, and a 1-in-5 chance of having seriously considered suicide. No tool on the market — not Motion, not Notion, not MyStudyLife, not ChatGPT — solves this stack, because every one of them demands the executive function the student lacks. Mate is an autonomous academic assistant that turns a student's static course documents into an active, adaptive study strategy: upload a syllabus, and Mate extracts every deadline, flags the weeks where major requirements collide, and proposes realistic study blocks around the student's real availability — with zero setup. The immediate business objective is to win the **KPMG Academic Innovation Challenge** (due 2026-05-25) with an **independent SaaS powered by Microsoft Copilot** (the organizer has confirmed this satisfies the "Primary Platform: Copilot Studio" brief — Copilot is the primary AI, the product need not live inside Copilot Studio); the longer-term objective is the same SaaS as a Filipino-priced, LMS-integrated academic operating system — Azure-hosted but ecosystem-agnostic, integrating Microsoft 365 and Google Workspace — addressing a confirmed market whitespace worth ₱670M–₱1.1B (~$11.9M) ARR within five years.

---

## 2. The Problem & Opportunity

**The Problem:**
Students abandon planners not because the planners lack features, but because the planners require the very executive function students lack — *setup friction exceeds the patience window*. The pain is acute and Filipino-specific: 80–95% of college students procrastinate; a PH study found 63% of students at moderate and 26% at high academic burnout; 1 in 5 Filipinos aged 15–25 (~1.5M) have considered suicide and 7.5% have attempted; 77.4% of PH working students are family breadwinners, and 56.1% sleep five hours or fewer. The proximate driver of the mental-health tail is academic overload that no productivity tool on the student's phone addresses. Concretely: students realize too late that three major requirements land in the same week, lose data and trust to buggy/paywalled incumbents (MyStudyLife's 6-task free cap), and distrust ChatGPT after a peer-reviewed study found 47% of its generated references fabricated.

**The Opportunity:**
The market gap is structural, not incremental. Below the $5/month band, almost nothing exists with AI-native scheduling; no incumbent (Motion, Sunsama, Akiflow, Reclaim, Notion) integrates with Canvas/Moodle/UVLê or accepts GCash/Maya — yet only 12–15% of Filipino adults have credit cards while GCash has 94M+ users. **No native PH academic planner of significance exists — a confirmed whitespace.** Timing is right: vision-language models (Mistral Document AI) now parse layout-aware documents below $0.01/syllabus; the PH has 5.2M HE students at 98% mobile-broadband penetration; investors are explicitly rewarding AI-native, workflow-embedded models with a profitability path (HolonIQ 2025); and the KPMG challenge provides an institutional trust halo aligned with HEI-friendly positioning.

**Target Customer / User:**
Filipino university students who own a calendar and still miss deadlines — primarily the commuter undergrad on Android with a ~₱300/day allowance whose professors post syllabi as scanned PDFs once and never again, and the neurodivergent student (16% college ADHD prevalence) for whom rigid scheduling tools trigger a shutdown response. Secondary institutional buyer: HEIs purchasing per-student licenses via faculty-champion-led pilots.

---

## 3. Strategic Alignment

This project serves two sequenced strategic goals:

1. **Immediate (by 2026-05-25):** Win the KPMG Academic Innovation Challenge. Success is judged 50% on Functionality/UX and 50% on Data Accuracy & Relevance — the BRD's commercial framing exists to make the demo's responsible-AI and social-impact narrative credible to judges, since KPMG itself sells Powered Enterprise for Higher Education and rewards responsible-AI education applications.
2. **Commercial (Year 1–5):** Capture 2–8% of a 4.94M-student PH SAM, equivalent to $2.4M ARR by Year 3 and $11.9M ARR by Year 5. The demo is built as the independent Copilot-powered SaaS itself, so competition work *is* the commercial v1 — not throwaway architecture. The product is Azure-hosted but ecosystem-agnostic at the integration layer, supporting both Microsoft 365 (Teams/Outlook/Graph) and Google Workspace.

The competition is not a side quest — it is the Go-To-Market entry wedge: the KPMG halo is a meaningful institutional trust signal for the slow faculty-champion B2B path.

---

## 4. Scope

**In Scope:**
- The KPMG demo MVP: the independent Copilot-powered Mate SaaS proving syllabus ingestion, deadline-conflict reasoning, adaptive scheduling, lateral-language processing, plus batch human-in-the-loop approval.
- The business case and market thesis that frame the demo's pitch narrative (this document).
- The commercial product direction: PH-first, ₱99/month Spotify-Student-anchored pricing, GCash/Maya rails, Canvas+Moodle ICS sync, offline-first, Taglish-aware — as the post-competition roadmap.

**Out of Scope:**
- Monetization mechanics in the demo itself — no payments, pricing tiers, or microtransactions are built or shown for the competition.
- Native iOS/Android apps and offline-first sync — deferred to commercial v1.
- Deep LMS API integrations and university B2B licensing — deferred; per-user ICS sync is the earliest commercial step.
- Mental-wellness check-ins and NCMH referral routing — deferred; regulatory caution required.
- Cebuano/Bahasa localization and SEA expansion — deferred to commercial v2+.
- Legal advice on PH data-privacy compliance — this BRD flags obligations only; the [CLR](clr-mate.md) registers them and escalates to counsel.

---

## 5. Success Metrics

| Metric | Baseline | Target | Timeline |
|--------|----------|--------|----------|
| KPMG competition submission delivered | Not submitted | Working Copilot-powered SaaS demo + walkthrough submitted to KPMG | 2026-05-25 |
| Judged criteria coverage | 0 of 4 capabilities demoed | All 4 (ingestion, conflict reasoning, adaptive scheduling, lateral language) + HITL shown working | 2026-05-25 |
| Syllabus date-extraction error rate | 5–15% (unconstrained LLM) | <2% (structured JSON schema + grounding + null-if-ambiguous + human confirm) | Demo build |
| Time-to-first-value (upload → reviewable extraction) | Hours (incumbent setup) | < 60 seconds | Demo build |
| Paid conversion of PH SAM (commercial) | 0% | 2% (~99K users, $2.4M ARR) | Year 3 post-launch |
| Paid conversion of PH SAM (stretch) | 0% | 8% (~395K users, $11.9M ARR) | Year 5 post-launch |
| Per-syllabus parse cost | n/a | < $0.01 at scale | Commercial v1 |

---

## 6. Stakeholders & Owners

| Role | Person | Responsibility |
|------|--------|----------------|
| Sponsor / Decision Maker | Axon Enjin | Final approval, competition submission, funding direction |
| Business Owner | Axon Enjin | Accountable for competition outcome and commercial thesis |
| Product / Tech Lead | Axon Enjin | Delivering the Copilot Studio demo build |

*Solo/small-team project: the owning entity wears all three hats. The split is retained to force clarity — the Sponsor hat decides "submit or revise" at the M2 checkpoint; the Tech Lead hat owns extraction accuracy; the Business Owner hat owns the pitch narrative.*

---

## Self-Check

- [x] Section 1 reads cleanly for a non-technical stakeholder and conveys business value
- [x] Section 2 quantifies the problem (burnout %, ideation rate, error rates, market size)
- [x] Section 5 has metrics with numbers and timelines
- [x] Section 4 explicitly names out-of-scope items
- [x] No section describes *how* to build the solution (architecture lives in [sdd-mate.md](sdd-mate.md))

---

*Next in sequence: [PRD](prd-mate.md) (done, v0.4) → [DSD](dsd-mate.md) → [SDD](sdd-mate.md).*
