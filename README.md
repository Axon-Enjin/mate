# Mate — Autonomous Academic Orchestrator

**Owner:** [Axon Enjin](https://github.com/Axon-Enjin)  
**Competition:** [KPMG Academic Innovation Challenge 2026](KPMG.md)  
**Submission deadline:** 2026-05-26 12:00 noon (extended from 2026-05-25) — **final polish in progress**

Mate is an autonomous academic assistant for Filipino university students. Upload a syllabus once; Mate extracts every deadline, flags weeks where major requirements collide, and proposes realistic study blocks around the student's real availability — driven by natural-language requests like *"help me plan my week."*

It is an **independent SaaS** (web/PWA, backend, data store) **powered by Microsoft Copilot / Azure OpenAI** as the AI engine — not a Copilot Studio–hosted bot. The competition demo is the foundation for commercial v1, not throwaway scaffolding.

---

## What This Repository Contains

This monorepo holds **product strategy, formal specifications, and the demo application** for Mate.

| Path | Purpose |
|------|---------|
| [`docs/`](docs/) | Full product-document suite (BRD → PRD → SDD → …) |
| [`app/`](app/) | Next.js demo application (upload, extraction, review, scheduling) |
| [`Mate.md`](Mate.md) | Market research — PH student pain, competitive teardown, GTM rationale |
| [`KPMG.md`](KPMG.md) | Official competition brief and judged capabilities |
| [`AGENTS.md`](AGENTS.md) | Agent/contributor guidance for this repo |

---

## Core Capabilities

Mate is judged on four capabilities (50% Functionality/UX, 50% Data Accuracy & Relevance):

1. **Syllabus ingestion & parsing** — Extract assessments and due dates from uploaded course documents
2. **Deadline conflict reasoning** — Proactively flag weeks where multiple major deliverables collide
3. **Adaptive study-block scheduling** — Propose realistic blocks around stated availability and goals
4. **Lateral language processing** — Interpret vague requests and ask clarifying questions when needed

**Accuracy contract:** fewer than 2% date-extraction errors and **zero fabricated dates**. Low-confidence items are flagged for human review; nothing is persisted until the student approves.

---

## Repository Structure

```
mate/
├── README.md              ← You are here
├── KPMG.md                Competition brief
├── Mate.md                Market research report
├── AGENTS.md              Contributor / agent instructions
├── docs/                  Formal product-document suite
│   ├── brd-mate.md        Business requirements
│   ├── prd-mate.md        Product requirements (binding spec, v0.5)
│   ├── dsd-mate.md        Design system document
│   ├── sdd-mate.md        System design
│   ├── rfc-mate-syllabus-ingestion.md
│   ├── qad-mate.md        Quality assurance & demo gates
│   ├── clr-mate.md        Compliance & legal readiness
│   └── gtm-mate.md        Go-to-market strategy
└── app/                   Demo SaaS (Next.js)
    ├── src/app/           Pages & API routes
    ├── src/components/    UI components
    ├── src/lib/           Cosmos, AI Foundry, PDF extraction
    └── README.md          App-specific setup & API reference
```

---

## Documentation Suite

Read in this order for full product context:

`brd-mate.md` → `prd-mate.md` → `dsd-mate.md` → `sdd-mate.md` → `rfc-mate-syllabus-ingestion.md` → `qad-mate.md` → `clr-mate.md` → `gtm-mate.md`

**Source-of-truth precedence:** `KPMG.md` (brief) → `docs/prd-mate.md` (spec) → `Mate.md` (rationale).

Key load-bearing decisions (see also [`AGENTS.md`](AGENTS.md)):

- **Independent SaaS** powered by Copilot via API — acceptable per organizer confirmation
- **Ecosystem-agnostic integrations** — Microsoft 365 and Google Workspace are both first-class (Should-Have)
- **Philippines-first** — Data Privacy Act (RA 10173) applies from demo stage
- **Demo persists real data** for a limited, consenting pilot cohort (disposable Cosmos instance)

---

## Demo Application

The [`app/`](app/) directory contains the KPMG competition demo: a Next.js web app with syllabus upload, AI extraction, human-in-the-loop review, **lateral-language chat**, conflict detection, and schedule planning.

### Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js, React, TypeScript, Tailwind CSS |
| Backend | Next.js API Routes |
| Database | Azure Cosmos DB |
| AI | Azure AI Foundry (GPT, Mistral Document AI) |
| Auth | NextAuth (Microsoft Entra ID) |

### Quick start

```bash
cd app
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). For environment variables, API endpoints, and troubleshooting, see **[`app/README.md`](app/README.md)**.

### Demo flow

1. Sign in with Microsoft  
2. Upload a syllabus PDF  
3. AI extracts assessments and due dates (with confidence scoring)  
4. Review and edit flagged items  
5. Approve all — data persists to Cosmos DB  
6. Open dashboard → **Ask Mate** for natural-language planning ("help me plan my week")  
7. View conflicts and generated study schedules  

---

## Target Users

**Primary:** Carlo — commuter undergrad with six courses, scanned-PDF syllabi, and no time for manual planner setup.

**Secondary:** Bea — neurodivergent student who abandons rigid planners after setup friction triggers shutdown.

Mate's differentiator is **zero-setup autonomy plus conflict reasoning**: it orchestrates the semester and surfaces collision weeks before the student walks into them.

---

## Competition Timeline

| Milestone | Date |
|-----------|------|
| Submission (demo video) | **2026-05-26 12:00 noon** (extended; in progress) |
| Finalists announced | 2026-05-29 |
| Final challenge | 2026-06-08 |
| Demo Day | 2026-06-15 |

---

## Contributing

This is a competition entry by Axon Enjin. Documentation changes should keep cross-document invariants consistent (accuracy contract, demo/commercial boundary, product framing). Application work lives under `app/`; product specs live under `docs/`.

---

## License

MIT (application code — see [`app/package.json`](app/package.json)). Documentation is part of the Mate project repository.
