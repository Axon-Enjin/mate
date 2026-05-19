# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## What This Repository Is

This is a **documentation and strategy workspace** for **Mate — Autonomous Academic Orchestrator**, an entry for the **KPMG Academic Innovation Challenge** (submission due **2026-05-25**). There is no application source code here — this repo holds the market research, the competition brief, and the formal product-document suite that specifies the product.

There are **no build, test, lint, or deploy commands.** Do not add code-development commands to this file. The work here is reading, synthesizing, and writing Markdown documents.

---

## Current Product Framing (load-bearing — easy to get wrong)

These decisions were made deliberately and override older phrasing that may still linger in research files. If any document contradicts these, the document is stale and should be reconciled, not followed:

- **Mate is an independent SaaS** — its own web/PWA app, backend, and data store — **powered by Microsoft Copilot** as the AI engine (Copilot / Azure OpenAI called via API from Mate's own backend). It is **not** a Copilot-Studio-hosted bot. The competition organizer confirmed this is acceptable: the brief's *"Primary Platform: Copilot Studio"* means Copilot is the primary AI, **not** that the product must live inside Copilot Studio.
- **The demo *is* commercial v1's foundation**, not throwaway scaffolding. The demo persists real data for a **limited, consenting pilot cohort** (disposable Cosmos instance) — it is *not* a session-only mock. This means baseline PH Data Privacy Act obligations (consent, minimization, deletability) already apply at demo stage.
- **Ecosystem-agnostic at the integration layer.** Azure is the hosting choice, but **Microsoft 365 (Teams/Outlook/Graph)** and **Google Workspace (Calendar/Classroom/Drive)** are *both* first-class Should-Have integrations. Do not reframe the product as Microsoft-exclusive.
- **MLSA licensing constraint.** The demo runs on a teammate's Microsoft Learn Student Ambassador Visual Studio Enterprise (dev/test) subscription + M365 dev tenant. This is **dev/test-licensed only** — commercial v1 requires a planned migration to a separate, org-owned, commercially-licensed subscription. Production must never depend on a personal ambassador account.
- **Owner of record is "Axon Enjin"** across all docs (not an individual name).

---

## Two Git Repositories (Important)

This directory contains **two independent git repos** — not a submodule relationship:

| Path | Remote | Purpose |
|---|---|---|
| `.` (root) | `github.com/Axon-Enjin/mate` | The Mate project: research, brief, and `docs/` output |
| `FMD/` | `github.com/delatorrecj/fmd` | A reusable documentation-template system, separately versioned |

Consequences:
- `FMD/` is tracked by its own repo, not the root. **Never `git add FMD/` from the root repo.** Commit FMD changes from inside `FMD/` against its own remote.
- The root repo's status showing `M FMD` means the nested repo's HEAD moved — handle FMD commits inside `FMD/`, not from the root.
- Each repo has its own `CLAUDE.md`. `FMD/CLAUDE.md` governs how the template system itself works; this file governs the Mate project.

---

## Source-of-Truth Files

When reasoning about Mate, read these before answering scope, feature, or strategy questions:

- **`KPMG.md`** — the official competition brief. The four judged capabilities (syllabus ingestion, deadline-conflict reasoning, adaptive scheduling, lateral language) and the 50/50 grading split (Functionality/UX vs. Data Accuracy & Relevance) come from here. This is the contract; do not contradict it. (Note the interpretation in "Current Product Framing" above re: "Primary Platform".)
- **`docs/prd-mate.md`** — the binding spec (currently **v0.5**). Scope decisions live here: Must-Have = the competition demo; Should/Could/Won't = deferred commercial product. §7–§9 hold the AI spec, dependencies, and the milestone/rollback plan.
- **`Mate.md`** — the market-research report (PH student pain, competitive teardown, market sizing, GTM rationale). This is the commercial *why*; some of its older Microsoft-stack phrasing is superseded by the framing section above.

Precedence when these conflict: **KPMG.md (brief) → docs/prd-mate.md (spec) → Mate.md (rationale)**, with the "Current Product Framing" section overriding stale wording in any of them.

---

## The Documentation Suite

The full FMD suite exists in `docs/`, cross-linked and mutually consistent. Dependency/reading order:

`brd-mate.md → prd-mate.md → dsd-mate.md → sdd-mate.md → rfc-mate-syllabus-ingestion.md → qad-mate.md → clr-mate.md → gtm-mate.md`

Load-bearing details that span documents (require reading several to understand):
- The **single accuracy contract** — `< 2%` date-extraction error and **zero fabricated dates** — is defined in the RFC and enforced as the QAD submission gate. Never weaken it.
- The **3-tier extraction cascade** (Mistral Document AI → Azure AI Vision Read OCR → guided manual entry) with confidence scoring and batch "Approve All" HITL is the core architecture; it lives in the RFC, is summarized in PRD §7 and SDD §8.
- The **demo-vs-commercial boundary** is threaded through every doc: nothing in the CLR or QAD blocks the competition submission; they gate *commercial* launch. Preserve that distinction when editing.

When asked to revise a document, keep these invariants consistent across the whole suite — a change to one usually implies edits to others.

---

## The FMD Template System

`docs/` is filled from the templates in `FMD/`. When asked to write or revise a project document:

1. Read **`FMD/AGENT_ROUTING.md`** first — it maps the request to the correct template and workflow. `FMD/Playbook.md` is the human-readable version.
2. Open the matching `FMD/{{TYPE}}_Template.md`, read its `> **Agent Instructions**` blockquote, and follow it.
3. Output goes to **`docs/{{type}}-mate.md`** (project slug is `mate`). RFCs are special: `docs/rfc-mate-{{feature-slug}}.md`, one per major feature.
4. Cross-link documents with relative paths and keep the suite-wide invariants above consistent.

### `exit fmd`

If the user types `exit fmd` (case-insensitive): per FMD routing rules, delete the session's template-derived output file under `docs/` that you created or were editing this session. **Never** delete the canonical `FMD/*_Template.md` files. If nothing was written this session, just acknowledge.

---

## Working Conventions

- **Don't invent product facts.** Models, latency budget, edge cases, and scope are specified in `docs/prd-mate.md` §7–§9, the SDD, and the RFC. Pull from there; mark genuinely-undecided things `TBD` rather than fabricating.
- **Respect the demo/commercial split.** The competition MVP is intentionally narrow (no monetization, no native apps, integrations are Should-Have). Don't pull deferred commercial features into demo scope.
- **Jurisdiction is Philippines-first** for any compliance, legal, or market framing — the product and market are PH-specific (Data Privacy Act 2012 / RA 10173).
- **Dates are absolute and tight.** The milestone chain runs M0 2026-05-20 → Launch (KPMG submission) 2026-05-25. Use the dates in `docs/prd-mate.md` §9, not relative phrasing.
- **Nothing is auto-committed.** Leave changes in the working tree for review unless explicitly asked to commit.
