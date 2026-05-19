# Go-To-Market (GTM) Strategy

**Project:** Mate — Autonomous Academic Orchestrator
**Date:** 2026-05-19
**Version:** 0.2
**Owner:** Axon Enjin
**PRD:** [prd-mate.md](prd-mate.md)

---

> **Scope:** This is the **commercial GTM** for the post-competition product. The KPMG Academic Innovation Challenge submission (2026-05-25) is not a market launch — it is the GTM's **entry wedge**: the KPMG halo is a reusable trust asset for the slow faculty-champion B2B motion. Public launch is gated by [clr-mate.md](clr-mate.md) Section 3 (open counsel flags must clear first).

## 1. Product Summary (GTM View)

**What it does (one sentence):** Upload your syllabi and Mate reads them, flags the weeks your major requirements collide, and builds your study schedule for you — zero setup.

**Who it's for:** Filipino university students who own a calendar and still miss deadlines — commuters, working students, and neurodivergent students failed by every planner because the planner demands the executive function they lack.

**Core value proposition:** From syllabus to semester plan in under a minute, with nothing to configure — priced for a Filipino student and paid with GCash.

**Category:** AI-native academic operating system (not "another planner").

---

## 2. Target Audience

**Primary ICP:**
- *Who:* PH undergrads, 18–22, Android-first, ₱300–800/day allowance, 5–6 courses, syllabi posted once as PDFs and forgotten. Carlo (commuter), Bea (neurodivergent Notion-abandoner), Jenny (working-student breadwinner) from the [BRD](brd-mate.md)/research personas.
- *Where they hang out:* TikTok/#StudyTok PH, course-specific and confession Facebook groups, campus orgs, Discord study servers.
- *What they already believe:* "Planners don't work for me — setup is more work than the work." They distrust ChatGPT's accuracy and resent Western SaaS prices.
- *What will make them try this:* a 30-second TikTok of a syllabus photo turning into a full semester plan, shared by a peer or campus ambassador — social proof, not a feature list.

**Secondary audience:**
- *Who:* HEIs (faculty champions in CS/Engineering/Business → Vice-Chancellor for Academics) buying per-student licenses.
- *Why secondary:* 6–18-month relationship sales cycle; institutional revenue is the moat but not the Year-1 acquisition engine.

---

## 3. Pricing Model

**Model:** `Freemium` (consumer) + `Paid` (institutional B2B2C)

| Tier | Price | What's Included | Limit / Gate |
|------|-------|-----------------|--------------|
| Free | ₱0 | Core schedule, syllabus parse, 3 LMS connections | 20 AI queries/day; free-tier routed to cheaper models |
| **Student Pro** | **₱99/mo or ₱699/yr** | Unlimited AI, full features, premium reasoning models | None — annual prepay carries ~40% discount to smooth post-exam churn |
| Exam Pack | ₱20–50 (microtransaction) | One-tap AI credit pack for finals crunch | Per-pack; GCash one-tap |
| University License | ₱150–300/student/year | Institutional rollout, admin features | Volume B2B2C contract |

**Pricing rationale:** ₱99/mo is deliberately anchored *below* Spotify Individual (₱169) and near Spotify Student (₱85) — the exact subscription PH students already pay cheerfully via GCash. Microtransaction Exam Packs match Mobile-Legends-era PH gaming spend behavior. The free tier is distribution; the gate (20 queries/day + premium models) hits the power user who already got value and will convert.

**Payment processor:** GCash + Maya (primary — solves the credit-card barrier no Western competitor addresses; 12–15% PH card penetration vs. 94M+ GCash users); card as secondary.

---

## 4. Positioning & Messaging

**Tagline:** `Your AI Academic Co-Pilot — From Syllabus to Diploma.`

**Primary message (hero):** Stop staring at six syllabi. Upload them once — Mate finds every deadline, warns you the week three majors collide, and builds your study plan around your real life. Zero setup. ₱99/month. Pay with GCash.

**Proof points:**
- Zero-setup autonomy: upload one syllabus, get a full semester — seconds, not the hours Motion/Notion demand.
- Trust-by-design: every AI-extracted date is confidence-scored and confirmed by you before anything is saved — no hallucinated deadlines, no silent writes.
- Filipino-priced and Filipino-paid: ₱99 via GCash, Taglish-aware, LMS-native (Canvas/Moodle/UVLê) — built for here, not ported.
- Works with what students already use: powered by Microsoft Copilot, syncs both ways with Google Workspace (Calendar/Classroom) and Microsoft 365 (Outlook/Teams) — not locked to one ecosystem.
- KPMG Academic Innovation Challenge pedigree (institutional trust signal for HEIs).

**Objection handling:**

| Objection | Response |
|-----------|----------|
| "I already use ChatGPT for school" | ChatGPT has no semester memory and fabricates ~47% of references; Mate is grounded, deadline-aware, and confirms before it commits. |
| "Planners never work for me" | That's the point — there's nothing to set up. One upload. The app does the planning, not you. |
| "Too expensive for a student" | ₱99/mo — less than Spotify Individual, paid with GCash, with a free tier and ₱20 exam packs. |
| "Will it get my deadlines wrong?" | Every date is confidence-scored; low-confidence items are flagged and you approve everything in one tap before it's saved. |

---

## 5. Launch Channels & Tactics

**Owned channels:**

| Channel | Audience | Planned Action |
|---------|----------|----------------|
| KPMG submission + result | Judges, KPMG HE network | Reuse the working SaaS demo + walkthrough + any placement as institutional credibility in faculty pitches |
| Founder/brand TikTok | Cold-start | "Syllabus → semester in 30s" format as the recurring viral hook, seeded at finals season |

**Community / earned channels:**

| Channel | Tactic | Timing |
|---------|--------|--------|
| Campus Ambassador program | 30–50 ambassadors across UP, ADMU, DLSU, UST, USC, USTP, Mapúa, FEU, AdU, San Beda, Silliman; swag + certificates + early access + small grants (₱2–5K) | Year-1 primary channel; recruit pre-semester |
| #StudyTok PH micro-influencers | Seed 20–30 creators with free Pro + affiliate codes; UGC challenges keyed to finals | Ramp at midterm/finals demand peaks |
| Course/confession Facebook groups | Quiet, partnered-admin engagement (not spam) | Continuous |
| Faculty-champion pilots | One sympathetic prof → free single-semester pilot in 1–3 courses → outcome report → VC for Academics | 6–18 mo per anchor; start early |
| Telco / e-wallet | Pursue Globe/Smart zero-rated data bundle; GCash GLife mini-app embedding (94M+ surface) | Partnership track, parallel |

**Content assets needed before launch:**

- [ ] 60–90s product demo/walkthrough video (the KPMG asset, re-cut for consumer)
- [ ] Landing page: zero-setup hero, GCash/₱99 proof, confidence/trust proof, CTA
- [ ] TikTok "syllabus → plan in 30s" template + 5–7 seed creator briefs
- [ ] Ambassador kit (deck, swag spec, certificate template, referral codes)
- [ ] Faculty-pilot one-pager + outcome-report template

---

## 6. Launch Phases

| Phase | Criteria to Enter | Target Date | Goal |
|-------|-------------------|-------------|------|
| **Competition wedge** | Independent Copilot-powered SaaS demo passes [qad-mate.md](qad-mate.md) gate (<2% error, zero fabrication) | 2026-05-25 | Submit to KPMG; secure credibility asset |
| **Alpha (private)** | Commercial core (persistence, GCash, ICS sync) complete; QA sign-off | Post-competition (TBD) | 5–10 trusted PH students; validate zero-setup value |
| **Beta (invite / campus)** | Alpha feedback addressed; no P0; ambassadors recruited | TBD | 50–200 students on 2–3 campuses; validate retention through one exam cycle |
| **Public Launch** | Beta retention target hit; pricing + GCash live; **[clr-mate.md](clr-mate.md) Section 3 counsel flags cleared (DPO designated, NPC registration, PIA, minor consent)** | TBD | First-campus density; press the KPMG halo with HEIs |
| **Post-launch / SEA** | PH unit economics proven | Year 2–3 | Malaysia first (lowest localization lift), then Vietnam; acquisition-led per Sprout playbook |

> **Hard gate:** Public Launch cannot proceed while any [clr-mate.md](clr-mate.md) Section 3 flag (children's data consent, DPO, DPIA, local entity) is open. Compliance is a launch gate, not a parallel workstream.

---

## 7. Success Metrics (30-day post-public-launch)

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Signups (first campus) | Campus-density beachhead (e.g., 2,000 on anchor campus) | Auth DB count by campus |
| Activation (zero-setup value) | > 60% upload ≥1 syllabus and approve a plan | Event: upload → Approve All within first session |
| Time-to-first-value | < 60s median upload → reviewable extraction | Instrumented timing |
| D7 retention | > 25% (validated through, not just at, signup) | Cohort analysis |
| Paid conversion | Tracking toward 2% of SAM by Year 3 (~$2.4M ARR) | GCash/Maya subscription events |
| Extraction trust | < 2% corrected deadlines post-approval; zero reported fabricated dates | Edit-rate telemetry + support flags |

---

## Self-Check

- [x] Section 2 ICP is specific enough to name real people (Carlo/Bea/Jenny — research-grounded personas)
- [x] Section 3 pricing has a clear conversion gate (20 queries/day + premium models) anchored to a real PH willingness-to-pay benchmark
- [x] Section 5 content assets listed and tied to launch
- [x] Section 6 phase transitions are binary, and Public Launch is hard-gated on CLR Section 3
- [x] Section 7 metrics are measurable and instrumented (activation, TTFV, conversion)
- [x] Drafted pre-launch as strategy, not retrospective

---

*Document suite complete. Sequence: [BRD](brd-mate.md) → [PRD](prd-mate.md) → [DSD](dsd-mate.md) → [SDD](sdd-mate.md) → [RFC: ingestion](rfc-mate-syllabus-ingestion.md) → [QAD](qad-mate.md) → [CLR](clr-mate.md) → GTM.*
