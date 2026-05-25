# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Repository Shape

This is a **monorepo with two concerns**:

- `app/` — the Next.js demo SaaS (where almost all code changes happen)
- `docs/` — the formal product-document suite (BRD/PRD/SDD/RFC/QAD/CLR/GTM)
- Root-level: `KPMG.md` (competition brief), `Mate.md` (market research), `AGENTS.md` (extended contributor guide)

`AGENTS.md` is the canonical contributor doc — read it for product framing, source-of-truth precedence, and the FMD docs workflow. Do not duplicate that content here; defer to it.

> **Stale section in `AGENTS.md`:** the "Two Git Repositories" block describes `FMD/` as a nested repo, but `FMD/` has been removed from the working tree (shows as `D FMD` in git status). Ignore that section until `AGENTS.md` is reconciled.

---

## Commands (run inside `app/`)

```bash
npm install
npm run dev               # Next.js dev server on http://localhost:3000
npm run build             # Production build
npm start                 # Run built app
npm run lint              # eslint (next lint)
npm run test:connections  # Smoke-test Cosmos + AI Foundry connectivity (node test-connections.js)
```

There is **no test framework configured** — no unit/integration test runner, no `npm test`. The only automated check is `test:connections`. Verify behavior by running the app and walking the demo flow (sign in → upload → review → approve → dashboard).

Canonical syllabus fixtures live at `test/` (repo root): `CS-SOCSCI-SocSc12-TANGARA_A-F1-2022-1.pdf` and `Latest_Multimedia_OBEorOBTLP-Format.pdf`. Use these when verifying extraction or walking the demo flow — they are the same PDFs the team has been validating against.

Node `>=20`, npm `>=10` (enforced in `package.json` engines).

---

## Environment

The app will not start without Azure credentials in `app/.env`. Required keys (see `app/README.md` for the full list):

- `COSMOS_ENDPOINT`, `COSMOS_KEY`, `COSMOS_DATABASE`
- `AI_FOUNDRY_ENDPOINT`, `AI_FOUNDRY_KEY`
- `GPT5_DEPLOYMENT_NAME`, `MISTRAL_LARGE_DEPLOYMENT_NAME`, `MISTRAL_DOCUMENT_DEPLOYMENT_NAME`
- `AZURE_AD_TENANT_ID`, `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET` (NextAuth Microsoft Entra ID)
- `CONFIDENCE_THRESHOLD` (default `0.75`)

The Azure subscription is **MLSA dev/test only** — not for production. See `AGENTS.md` for the commercial-licensing migration plan.

---

## App Architecture

Next.js 16 App Router with React 19 and TypeScript. The full flow is **Upload → Extract → Review → Approve → Dashboard (Ask Mate / Conflicts / Schedule)**. Cosmos DB is the system of record; AI Foundry powers extraction and chat.

### Layers

- **`src/app/`** — App-Router pages (`upload`, `review/[id]`, `dashboard`, `auth/*`) and API routes under `src/app/api/`.
- **`src/components/`** — UI: `ExtractionReview`, `MateChat` (lateral-language chat — DSD §4), `ConflictReport`, `SchedulePlanner`, `DeadlineManager`, `NavBar`, `AuthButton`, `SessionProvider`.
- **`src/lib/`** — Integration clients:
  - `cosmos.ts` — singleton `@azure/cosmos` client; CRUD per container; lazy init from env.
  - `ai-foundry.ts` — wrapper for GPT-5, Mistral-Large-3, Mistral Document AI deployments.
  - `pdf-extractor.ts` — `pdf-parse` text extraction (scanned PDFs fail today — Azure Vision OCR fallback is planned).
  - `microsoft-graph.ts` — Outlook calendar / free-busy via Graph (used by `/api/calendar/*`).
  - `proposals-store.ts` — **in-memory** `Map` of extraction proposals keyed on `globalThis` so dev hot-reload doesn't wipe state. Proposals are ephemeral until `POST /api/proposals/[id]/approve` writes to Cosmos.
  - `auth-session.ts`, `utils.ts`.
- **`src/types/index.ts`** — Cosmos schema mirrors (`User`, `Course`, `Assessment`, `StudyBlock`, `IntegrationLink`) plus API request/response shapes. Treat these as the contract between API routes and the UI.
- **`src/auth.ts`** — NextAuth v5 (beta) with Microsoft Entra ID, JWT session strategy, manual access-token refresh against `login.microsoftonline.com`. `session.user.id` is **always the Entra `sub`**, never email — preserve that invariant.
- **`src/middleware.ts`** — Gates non-public, non-auth, non-API routes behind sign-in. API routes do their own auth.
- **`scripts/prompt-guardrails.js`** (repo root) — standalone guardrail/prompt-hardening helper used during chat-flow tuning. Not wired into the Next.js runtime; run directly with `node` when iterating on guardrails.

### The proposal lifecycle (load-bearing)

1. `POST /api/syllabi` → `pdf-extractor` → `ai-foundry` extraction → stores a `Proposal` in `proposals-store` (in-memory only).
2. `GET /api/proposals/[id]` returns the proposal; user edits via `PATCH /api/proposals/[id]`.
3. `POST /api/proposals/[id]/approve` is **locked via `approvingLocks` Set** to prevent double-submits, then writes Course + Assessments to Cosmos.
4. Once approved, deadlines surface through `/api/courses`, `/api/assessments/[id]`, `/api/conflicts`, `/api/schedule`.

If you change the proposal shape, update `src/types/index.ts`, the approve route, and `ExtractionReview` together — they are tightly coupled.

### Accuracy contract (do not weaken)

The RFC and QAD impose **< 2% date-extraction error and zero fabricated dates**. Items below `CONFIDENCE_THRESHOLD` must be flagged for human review; nothing is persisted until approval. Any change to extraction, confidence handling, or the review UI must preserve this contract.

---

## Next.js Version Note

From the top of `AGENTS.md`: *"This is NOT the Next.js you know."* The app uses Next.js 16 (App Router) and React 19. APIs and conventions may diverge from training-era knowledge — when in doubt, read `app/node_modules/next/dist/docs/` before writing routing/data-fetching code, and heed deprecation warnings.

---

## Documentation Work

When asked to edit anything under `docs/`, follow the FMD workflow described in `AGENTS.md` (template routing, suite-wide invariants, `exit fmd` rule). Source-of-truth precedence is **`KPMG.md` → `docs/prd-mate.md` → `Mate.md`**, with the "Current Product Framing" section of `AGENTS.md` overriding stale wording anywhere.

---

## Conventions

- **Don't auto-commit.** Leave changes in the working tree unless explicitly asked.
- **Don't pull commercial Should-Have features into the demo MVP scope** (see `docs/prd-mate.md` §7–§9 for the boundary).
- **Jurisdiction is Philippines-first** (Data Privacy Act / RA 10173) for any compliance, legal, or market framing.
- **Owner of record is "Axon Enjin"** across all docs — not an individual name.
