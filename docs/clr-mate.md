# Compliance & Legal Readiness Register (CLR)

**Project:** Mate — Autonomous Academic Orchestrator
**Date:** 2026-05-19
**Version:** 0.2
**Owner:** Axon Enjin
**PRD:** [prd-mate.md](prd-mate.md)
**SDD:** [sdd-mate.md](sdd-mate.md)

---

> ⚠️ **Structural and regulatory awareness only — NOT legal advice.** This register maps the data Mate handles and surfaces obligations. It does not draft the Privacy Policy or Terms of Use and does not replace a licensed Philippine attorney. Section 3 contains escalation flags set to **Yes** — those surfaces must be reviewed by qualified counsel before any commercial launch. *(Banner retained because Section 3 has Yes flags.)*

---

> **Demo vs. commercial boundary:** The KPMG demo is the independent Mate SaaS (Copilot-powered) run for a **limited, consenting pilot cohort**, deliberately processing only **syllabus deadline data** — not grades/transcripts. Unlike a throwaway bot, the demo **does persist real (pilot) data** in a disposable Cosmos instance, so a baseline of DPA obligations (consent, minimal data, deletability, no model-training on student data) **applies at demo stage**, not only at v1. The heavier obligations (NPC registration, DPO, full PIA/DPIA, public-scale consent UI) remain **commercial-v1 launch gates** because the demo cohort is small, consenting, and non-public. Nothing here blocks the demo submission *provided* the pilot cohort is consenting and data is deletable; the counsel-gated items block public commercial launch.

---

## 0. Target Markets

| Region | In scope? | Notes |
|--------|-----------|-------|
| European Union / UK (GDPR / UK GDPR) | No (demo); Year 4+ only (commercial) | EU is a deliberate late, niche entry; EU AI Act classes education AI used for assessment/admissions as high-risk — out of scope until a dedicated readiness audit |
| California, USA (CCPA / CPRA) | No (demo); Year 4+ niche only | "AI study buddy for international students" is a far-future layer; not modeled for v1 |
| Philippines (Data Privacy Act 2012, RA 10173) | **Yes** | Primary and only launch market for the demo and commercial v1 |
| Other: SEA (Malaysia PDPA, Vietnam, Indonesia, Thailand) | No (Year 2–3, commercial) | Per [gtm-mate.md](gtm-mate.md) sequencing; each requires its own local-counsel review at entry |

**Geo-blocking:** The demo is a recorded submission, not a publicly reachable app — effectively no audience beyond judges. Commercial v1 is PH-targeted; if the app is publicly reachable without geo-fencing it reaches everyone — treat PH DPA as the binding regime and gate other regions until their matrices are completed.

---

## 1. Data Inventory / Record of Processing

| Activity | Purpose | Data categories | Data subjects | Recipients / sub-processors | Cross-border transfer | Retention | Legal basis |
|----------|---------|-----------------|---------------|-----------------------------|-----------------------|-----------|-------------|
| Syllabus ingestion (demo + v1) | Extract assessments + due dates | Uploaded syllabus document; course names; deadlines | Students | Mistral Document AI; Azure AI Vision Read (OCR fallback); OpenAI GPT-4.1; Microsoft Copilot / Azure OpenAI | Yes — US/global model endpoints | Pilot data persisted in disposable Cosmos (SEA), deletable on request (demo); user-controlled (v1) | Consent (student uploads voluntarily for the service) |
| Schedule generation (demo + v1) | Propose study blocks | Stated availability, priorities | Students | Microsoft Copilot / Azure OpenAI; OpenAI GPT-4.1 | Yes — model endpoints | Pilot data persisted, deletable (demo); user-controlled (v1) | Consent |
| Account & profile (demo pilot + v1) | Identify the user | Name/handle, email/auth subject, locale | Students (some 17 y/o first-years) | Mate-owned auth (optional Microsoft/Google sign-in) | PH/SEA region preferred | Pilot deletable (demo); until deletion / 15-day DSR (v1) | Consent / contract |
| Persistent academic data (commercial v1) | Store courses, deadlines, plans | Course names, deadlines, study blocks | Students | Azure Cosmos DB (SEA region) | Localized (PH/SEA) | User-controlled; deletable | Consent / contract |
| Integration sync (commercial v1, Should-Have) | Two-way deadline/calendar/task sync; course import | Calendar events, tasks, Classroom/Drive content, ICS feeds; OAuth tokens (Key Vault refs) | Students | **Microsoft 365 (Graph: Outlook, Teams, Calendar); Google Workspace (Calendar, Classroom, Drive)**; Canvas/Moodle ICS | Provider-dependent (Microsoft + Google = additional cross-border sub-processors) | Until disconnected | Consent (explicit per-provider OAuth) |
| Payments (commercial v1) | Subscription / microtransactions | GCash/Maya tokens (no raw card) | Students | GCash/Maya/PSP | PH-domestic rails | Per PSP / tax law | Contract |

**Sensitivity flags:**

| Data type | Collected? | Notes |
|-----------|-----------|-------|
| Basic PII (name, email) | No (demo) / Yes (commercial v1) | Demo uses host identity only |
| Special-category / sensitive | **Education records = Sensitive Personal Information under RA 10173 §3(l)(2)** | Demo deliberately limits to *deadlines*, NOT grades/transcripts/standing, to minimize SPI exposure; commercial features must not silently expand into grades without re-review |
| Children's data (minors) | Potentially — many PH first-years are 17 | Under PH DPA, minors' processing needs parental consent; commercial onboarding must age-gate / obtain guardian consent |
| Precise location | No | Not collected |
| Photos / camera / microphone | Indirect | Users may upload a *photo* of a syllabus (image-only scan path) — image is a document, not media profiling |
| Device IDs / advertising IDs | No | No adtech |
| Analytics / telemetry | No (demo) / minimal (commercial) | Commercial: product analytics only, no behavioral ad profiling |
| Crash logs | No (demo) / Yes (commercial) | Standard Azure diagnostics |
| Payment / card data | No (demo) / tokenized only (commercial) | GCash/Maya rails; no raw card storage |

**Self-check:**

| Item | Done? | Evidence link | Counsel needed? |
|------|-------|---------------|-----------------|
| Every processing activity has a retention period | Yes | this §1 | No |
| Every sub-processor is named and has a DPA in place | Partial — named; DPAs are a commercial-v1 action | [sdd-mate.md](sdd-mate.md) §4 | Yes (v1) |
| Inventory is dated and treated as living | Yes (2026-05-19) | this doc header | No |

---

## 2. Multi-Jurisdiction Obligations Matrix

*Only the Philippines column is in scope (Section 0).*

| Dimension | Philippines DPA 2012 (RA 10173) |
|-----------|----------------------------------|
| **Consent / legal basis** | Consent or other lawful criteria; **Sensitive Personal Information (education records) requires explicit consent**; minors require parental/guardian consent |
| **Data subject rights** | Access, correct, erase/block, object, data portability, claim damages; 15-day response window |
| **Breach notification** | Notify **NPC and affected subjects within 72 hours** of knowledge where there is real risk of serious harm |
| **DPO / accountability** | **Mandatory Data Protection Officer**, Privacy Impact Assessment per high-risk feature, Privacy Management Program, NPC registration |
| **Cross-border transfer** | Controller remains accountable; comparable protection required for overseas processors (Mistral/OpenAI/Azure global endpoints) — data localization (Azure SEA) preferred to reduce friction |
| **Our status / action** | Demo: minimal-data, limited consenting pilot cohort, non-public, data deletable, no model-training on student data → NPC registration not triggered by the small non-public pilot, but consent + deletability + SPI-minimization **do apply at demo stage**. **Commercial v1 (counsel-gated):** designate DPO; NPC registration; PIA on syllabus-ingestion + any grade-touching feature; per-provider transfer assessment for Microsoft 365 + Google Workspace; 72h breach runbook; PH/SEA localization; explicit SPI + minor consent UI |

**Watch list:** Pending DPA amendments raise penalties (currently up to ₱4M/violation + imprisonment); education was the 3rd-most-breached PH sector in 2024; design for the stricter incoming regime. EU AI Act (high-risk education AI) relevant only at the deferred EU phase.

**Self-check:**

| Item | Done? | Evidence link | Counsel needed? |
|------|-------|---------------|-----------------|
| Consent model implemented (PH; SPI + minors) | No — commercial-v1 design item | — | **Yes** |
| Working data-subject-request path (access/delete) | Demo: manual deletion on pilot request (sufficient for small cohort); v1: self-serve path required | [sdd-mate.md](sdd-mate.md) §3 | Yes (v1) |
| Breach runbook with 72h NPC timeline | No — v1 | — | **Yes** |
| DPO designated | No — **mandatory before commercial launch** | — | **Yes** |

---

## 3. Escalation Flags — Counsel Required

| Flag | Present? | Why it escalates |
|------|----------|------------------|
| Children's data | **Yes** (commercial) | Many PH first-years are 17 (minors under DPA) → parental/guardian consent before processing |
| Health / medical data | No (designed out) | Deferred mental-wellness/NCMH features explicitly out of scope; do **not** add without re-review |
| Payments / card data | **Yes** (commercial) | GCash/Maya integration — keep tokenized via PSP, never store raw card; PCI scope minimization |
| Biometric data | No | None collected |
| Large-scale / systematic monitoring or profiling | **Yes** (commercial at scale) | A semester-wide academic data store across many students → PIA/DPIA-equivalent likely mandatory |
| Automated decisions with legal/significant effect | No (mitigated) | Extraction/scheduling are **proposals gated by mandatory batch human approval** — not solely-automated decisions; this is a deliberate compliance + trust design choice (keep the HITL gate) |
| Sale / share / behavioral advertising | No | No adtech; trust-by-design forbids it |
| Operating in a market with no local entity | **Yes** | PH DPA accountability + mandatory DPO; confirm local entity/representative before commercial launch |

**DPIA required?** **Yes — for commercial v1** (SPI education records + minors + large-scale academic profiling + Microsoft/Google cross-border integration sub-processors). Out of scope for this register; complete a Privacy Impact Assessment with counsel before production processing. **Not triggered by the minimal, small, consenting, non-public pilot demo** — but the demo must still honor consent, data minimization, and deletion.

---

## 4. Terms of Use / EULA Readiness

*Presence-check only; counsel drafts the text. None exist yet — all are commercial-v1 items (the recorded demo ships no ToU to end users).*

| Clause | Present? | Evidence link | Counsel needed? |
|--------|----------|---------------|-----------------|
| License grant + scope | No (v1) | — | |
| Acceptable use / prohibited conduct | No (v1) | — | |
| Limitation of liability + warranty disclaimer | No (v1) | — | Yes |
| Governing law + jurisdiction (PH) | No (v1) | — | Yes |
| Dispute resolution | No (v1) | — | Yes |
| Termination + suspension | No (v1) | — | |
| UGC license + DMCA | No (v1) | — | |
| Modification / notice mechanism | No (v1) | — | |
| Payment / refund terms (GCash/Maya) | No (v1) | — | Yes |
| Age eligibility (minor handling) | No (v1) | — | **Yes** |
| Privacy Policy incorporated by reference | No (v1) | — | |

---

## 5. IP Infringement & Protection Readiness

| Item | Status | Evidence link | Counsel needed? |
|------|--------|---------------|-----------------|
| "Mate" brand-name trademark knockout search (PH, relevant Nice classes) | Not done — **"Mate" is a common word; high collision risk; verify before public branding spend** | — | **Yes** |
| Open-source license compliance — SBOM maintained | Not yet — no codebase for demo; start SBOM at v1 | — | |
| Copyleft scan (GPL/AGPL/LGPL) | N/A demo; v1 action | — | |
| Third-party assets licensed (fonts/icons) | Demo uses host-provided UI only | [dsd-mate.md](dsd-mate.md) | |
| AI training-data provenance + model-output ownership/indemnity (Mistral, OpenAI, Azure OpenAI, Microsoft Copilot) | Not reviewed — confirm each vendor's output-ownership + indemnity terms; confirm **no student data used to train foundation models** | — | **Yes** |
| Integration data-sharing terms (Microsoft 365 / Google Workspace APIs) | Not reviewed — confirm Graph + Google API terms, OAuth scope minimization, and that Mate is the controller for synced data | — | **Yes** |
| DMCA / takedown process | N/A demo; v1 if UGC | — | |
| Written IP assignment from every contributor | Confirm for any collaborator on the Axon Enjin build | — | Yes |

---

## 6. App Store / Platform Compliance

Not applicable to the competition demo (no app-store submission; native apps are Won't-Have v1). Becomes in scope when the commercial PWA/native clients ship — complete Apple App Privacy label, Google Play Data Safety form, in-app account/data-deletion, and SDK disclosure at that time.

---

## Self-Check

- [x] Section 0 declares every market; demo-vs-commercial reachability is stated honestly
- [x] Section 1 has one row per processing activity, each with a retention period
- [x] Section 2 filled for the only in-scope region (PH); other regions correctly deferred
- [x] Every Section 3 "Yes" has a counsel action; disclaimer banner is set at the top
- [x] Section 4 ToU clauses presence-checked (drafting left to counsel)
- [x] Section 5 flags the "Mate" trademark collision risk and AI-vendor IP review
- [x] Section 6 addressed (N/A for demo, scoped for v1)
- [x] This document maps obligations and escalates — it does not give legal advice

---

*Structural and regulatory awareness only — not legal advice. Consult a licensed Philippine attorney before commercial launch. Next in sequence: [gtm-mate.md](gtm-mate.md) — CLR is a launch gate that must clear before public GTM.*
