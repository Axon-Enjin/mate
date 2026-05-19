# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## What This Repository Is

This is a **documentation and strategy workspace** for **Mate — Autonomous Academic Orchestrator**, a Microsoft Copilot Studio agent built for the **KPMG Academic Innovation Challenge** (demo video due **2026-05-25**). There is no application source code here — the deliverable is a Copilot Studio agent plus a demo video, and this repo holds the research, competition brief, and the formal product documents that specify it.

There are **no build, test, lint, or deploy commands.** Do not add code-development commands to this file. The work here is reading, synthesizing, and writing Markdown documents.

---

## Two Git Repositories (Important)

This directory contains **two independent git repos** — not a submodule relationship:

| Path | Remote | Purpose |
|---|---|---|
| `.` (root) | `github.com/Axon-Enjin/mate` | The Mate project: research, brief, and `docs/` output |
| `FMD/` | `github.com/delatorrecj/fmd` | A reusable documentation-template system, separately versioned |

Consequences:
- `FMD/` is gitignored-by-separation, not tracked by the root repo. **Never `git add FMD/` from the root repo.** Commit FMD changes from inside `FMD/` against its own remote.
- The root repo's status showing `M FMD` means the nested repo's HEAD moved — handle FMD commits inside `FMD/`, not from the root.
- Each repo has its own `CLAUDE.md`. The one in `FMD/CLAUDE.md` governs how the template system itself works; this file governs the Mate project.

---

## Source-of-Truth Files

When reasoning about Mate, these are authoritative — read them before answering scope, feature, or strategy questions:

- **`KPMG.md`** — the official competition brief. The judged capabilities (syllabus ingestion, deadline-conflict reasoning, adaptive scheduling, lateral language) and the 50/50 grading split (Functionality/UX vs. Data Accuracy) come from here. This is the contract; do not contradict it.
- **`Mate.md`** — the market-research report (PH student pain points, competitive teardown, market sizing, GTM). This is the *why* and the commercial context behind the product.
- **`docs/prd-mate.md`** — the current Product Requirements Document (v0.3). This is the binding spec for what the demo MVP must do. Scope decisions live here: Must-Have = the competition demo; Should/Could/Won't = deferred commercial product.

If these conflict, precedence is: **KPMG.md (the brief) → docs/prd-mate.md (the spec) → Mate.md (the rationale).**

---

## The FMD Template System

`docs/` is filled using the templates in `FMD/`. When the user asks to write or revise a project document (PRD, BRD, SDD, RFC, QAD, CLR, DSD, GTM):

1. Read **`FMD/AGENT_ROUTING.md`** first — it maps the user's request to the correct template and the workflow to follow.
2. `FMD/Playbook.md` is the human-readable version of the same routing/scale logic.
3. Open the matching `FMD/{{TYPE}}_Template.md`, read its `> **Agent Instructions**` blockquote, and follow it.
4. Output goes to **`docs/{{type}}-mate.md`** (project slug is `mate`). RFCs are special: `docs/rfc-mate-{{feature-slug}}.md`, one per major feature.
5. Cross-link documents with relative paths (e.g., a new SDD links back to `prd-mate.md`).

Only `docs/prd-mate.md` exists today. Any document it references (e.g., `dsd-mate.md`) is "not yet written" until actually created.

### `exit fmd`

If the user types `exit fmd` (case-insensitive), per the FMD routing rules: delete the session's template-derived output file under `docs/` that you created or were editing this session. **Never** delete the canonical `FMD/*_Template.md` files. If nothing was written this session, just acknowledge.

---

## Working Conventions

- **Don't invent product facts.** Mate's models, latency budget, edge-case handling, and scope are all specified in `docs/prd-mate.md` §7–§9. Pull from there rather than guessing. If something genuinely isn't decided, mark it `TBD` rather than fabricating.
- **Respect the demo/commercial split.** The competition MVP is intentionally narrow (Copilot Studio agent, no monetization, no native apps). Don't pull deferred commercial features into demo scope when revising docs.
- **Jurisdiction is Philippines-first** for any compliance, legal, or market framing — the product and its market are PH-specific.
- **Dates are absolute and tight.** The milestone chain runs M0 2026-05-20 → Launch 2026-05-25. When editing milestones or referencing "the deadline," use the dates in `docs/prd-mate.md` §9, not relative phrasing.
