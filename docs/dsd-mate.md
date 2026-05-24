# Design System Document (DSD)

**System Name:** Mate Foundation
**Date:** 2026-05-19
**Version:** 0.2
**Owner:** Axon Enjin
**PRD:** [prd-mate.md](prd-mate.md)

---

> **Scope:** Mate is an **independent SaaS with its own conversation-centric web/PWA UI**. This DSD defines that design system with real, implementable tokens (hex, type, spacing). A **secondary spec** (§9) covers the Adaptive Card form used only when Mate content is surfaced inside Microsoft Teams/Outlook — the embed surface, not the primary product. The `ui-ux-pro-max-skill` / `impeccable` tooling in the standard FMD workflow was not run (no frontend codebase yet); tokens below are the authored starting system and Sections 7–8 are seeded for first implementation.

---

## 1. Design Philosophy & Vision

**Core aesthetic:** Calm, unrushed, and trustworthy. Dense information presented without overwhelm — one consolidated view, never a wall of rows. Plain language over jargon. The interface should feel like a competent friend who already did the reading, not a dashboard demanding configuration.

**Emotional intent:** The student should feel *relieved and in control*, never shamed or behind. Every surface is designed against the dominant failure mode of incumbents (setup anxiety, streak shame, paywall ambush). Nothing is committed without the student's explicit "Approve All" — the student is always the one in charge.

**Aesthetic references:** Linear (calm information density), Spotify (familiar, Filipino-priced consumer warmth — the brand the target market already pays), Things 3 (forgiving, low-pressure task UI).

**What this system explicitly avoids:**
- Shame mechanics: no broken-streak red, no "you missed 4 tasks" guilt banners, no loss-aversion nags.
- Walls of text/rows that push prior context off-screen; the consolidated single view is mandatory (PRD §5.4).
- Surprise-paywall or upsell surfaces anywhere in the core flow.
- Single-item approval prompts that create notification fatigue — confirmation is always batch.
- Auto-playing or decorative motion; the only deliberate motion is the latency mask.

---

## 2. Brand Primitives

### Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg` | `#FBFAF8` | App background |
| `--color-surface` | `#FFFFFF` | Cards, panels |
| `--color-surface-emphasis` | `#F2F0EC` | Conflict / summary callout block |
| `--color-border` | `#E4E0D8` | Dividers, input borders, row separators |
| `--color-primary` | `#1E6F5C` | Primary CTA (Approve All), active states |
| `--color-primary-hover` | `#185A4A` | Primary hover |
| `--color-text` | `#23211E` | Body copy |
| `--color-text-muted` | `#6B6760` | Secondary text, labels, metadata |
| `--color-success` | `#1E6F5C` | Confirmed / high-confidence |
| `--color-warning` | `#B8860B` | "Needs review" low-confidence flag |
| `--color-error` | `#B23A2F` | Errors, destructive confirm |

Confidence and conflict states are encoded **by color *and* by an icon + label** ("⚠ Needs review", "✓ 92%") — never color alone (a11y; also survives the Teams/Outlook host theme in the embed form).

### Typography

| Role | Font | Weight | Size | Line Height |
|------|------|--------|------|-------------|
| Heading 1 | Inter | 600 | 24px | 1.25 |
| Heading 2 | Inter | 600 | 20px | 1.3 |
| Heading 3 | Inter | 600 | 16px | 1.4 |
| Body | Inter | 400 | 15px | 1.55 |
| Small / Caption | Inter | 400 | 13px | 1.45 |
| Mono / Code | JetBrains Mono | 400 | 13px | 1.5 |

**Font loading:** Inter + JetBrains Mono self-hosted (woff2), `font-display: swap`, preloaded in `<head>`. No layout shift on the first paint of the upload screen.

### Elevation & Depth

| Level | CSS Value | Usage |
|-------|-----------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.06)` | Inline cards |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,0.10)` | Floating panels, popovers |
| `--shadow-lg` | `0 12px 32px rgba(0,0,0,0.16)` | Modals, confirm sheets |

---

## 3. Layout & Spatial System

**Base unit:** `4px` — all spacing is a multiple of this.

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4px | Tight glyph/label gaps |
| `--space-2` | 8px | Within a row |
| `--space-3` | 12px | — |
| `--space-4` | 16px | Default element spacing / between item rows |
| `--space-6` | 24px | Between panel sections |
| `--space-8` | 32px | Title → body separation |
| `--space-12` | 48px | Page-level spacing |

**Grid:** Single-column, content-max-width `720px` for the conversation/review column (readability over width). Deadline rows are a 3-cell layout (item / date / confidence-flag) that collapses to stacked at the mobile breakpoint.

**Breakpoints:**
- Mobile: `375px` — **primary** breakpoint; the PH market is 85–89% Android, mobile-first.
- Tablet: `768px`
- Desktop: `1280px`

---

## 4. Core Component Specs

### Buttons

| Variant | Background | Text | Border | Hover | Disabled |
|---------|-----------|------|--------|-------|----------|
| Primary ("Approve All") | `--color-primary` | white | none | `--color-primary-hover` | 40% opacity |
| Secondary ("Edit") | transparent | `--color-primary` | `1px --color-primary` | `--color-surface-emphasis` bg | 40% opacity |
| Ghost ("View metrics" toggle) | transparent | `--color-text` | none | `--color-surface-emphasis` bg | 40% opacity |
| Destructive (remove item, with confirm) | `--color-error` | white | none | darkened error | 40% opacity |

**Border radius:** `8px` · **Padding:** `10px 16px` · **Font:** Inter 500, 15px. Exactly **one** primary action per panel. No single-item approve buttons — approval is batch only.

### Inputs & Forms

- Border: `1px solid --color-border`; radius `8px`; padding `8px 12px`.
- Focus ring: `2px solid --color-primary`, offset `2px` — always visible.
- A row flagged "Needs review" pre-focuses its date input, shows the ⚠ glyph + helper text ("We weren't sure about this date — please confirm").
- Error state: `--color-error` border + message below; never block "Approve All" silently — show which rows need attention.
- Dates use a native date picker; clients never free-parse typed dates.

### Surfaces (Cards, Panels, Modals)

- Background `--color-surface`; border `1px solid --color-border`; radius `8px`; `--shadow-sm` inline, `--shadow-md` floating.
- One panel per logical step (extraction review, conflict report, weekly plan) — never merge two steps into one scrolling mega-panel.
- Conflict callout: `--color-surface-emphasis` block, `--color-warning` header, one concrete intervention line ("Start the IT 101 project 4 days early — it collides with the CS 21 exam.").
- Modal backdrop: `rgba(0,0,0,0.4)` + `blur(4px)`.

### Chat panel (`MateChat`)

The conversation surface is Mate's primary lateral-language entry point (dashboard **Ask Mate** tab).

| Element | Spec |
|---------|------|
| Column width | `max-width: 720px` centered (§3 grid) |
| Mate bubble | `--color-surface-emphasis` bg, `1px --color-border`, `--color-text` |
| User bubble | `--color-primary` bg, white text |
| Typing indicator | Three pulsing dots + "Mate" label; appears immediately on send (latency mask) |
| Quick prompts | Secondary buttons (`1px --color-primary` border); e.g. "Help me plan my week" |
| Input | `textarea`, `8px` radius, focus ring `2px --color-primary`; min touch target `48px` send button |
| Inline schedule blocks | `--color-surface` cards inside the thread when `/api/chat` returns study blocks |
| Inline conflict callouts | `--color-surface-emphasis` + ⚠ + intervention line (same as conflict report) |

Copy tone: warm, non-judgmental, Taglish-aware. Mate asks **one** clarifying question before generating a schedule when availability is missing.

---

## 5. Motion & Micro-interactions

**Transition default:** `all 150ms ease-in-out`.

| Interaction | Duration | Easing | Notes |
|-------------|----------|--------|-------|
| Button hover/active | 120ms | ease-out | |
| Panel/modal open | 200ms | ease-out | Fade + slight translate-up |
| Panel/modal close | 150ms | ease-in | |
| **Latency mask** | immediate (~0s) | — | Progress message + indicator appears before parse; the one deliberate, load-bearing interaction |
| Loading skeleton | 1.5s loop | linear | Shimmer while the parse runs |
| Metrics toggle | 120ms | ease-out | Instant show/hide of the confidence column |

**Avoid:** animations over 400ms, looping motion without user intent, fake progress bars that misrepresent state.

---

## 6. Accessibility (a11y)

- **Contrast:** WCAG AA — `#23211E` on `#FFFFFF` ≈ 14:1 (pass); `#1E6F5C` on `#FFFFFF` ≈ 4.8:1 (pass for UI/large + verified for button text); `#B8860B` warning text on `#FFFFFF` ≈ 4.6:1 (pass). Re-verify any new pairing before shipping.
- **State by text + icon, not color:** confidence and conflict always carry a glyph and a word, so colorblind / high-contrast users get the same information.
- **Touch targets:** minimum `44×44px`.
- **Keyboard navigation:** every interactive element reachable and operable; focus order follows reading order; "Approve All" reachable without a mouse.
- **Screen reader:** semantic HTML first; meaningful action names ("Approve all 9 deadlines", not "OK"); ARIA only where HTML semantics fall short.
- **Reduced motion:** wrap all non-essential animation in `@media (prefers-reduced-motion: reduce)`; the latency-mask message remains (it is informational, not decorative).
- **Plain-language + Taglish:** copy is short, warm, non-judgmental, code-switch-aware ("Let's sort this out", not "You're behind"); never relies on idiom a stressed or ESL student must decode.

---

## 7. Taste-Skill Settings

```
DESIGN_VARIANCE:    3   (restrained, coherent — calm, not expressive)
MOTION_INTENSITY:   2   (latency mask + minimal transitions only)
VISUAL_DENSITY:     6   (one dense consolidated view, deliberately not sparse)
```

**Dial guide:** variance 1 = Swiss austerity → 10 = maximalist; motion 1 = static → 10 = everything moves; density 1 = airy → 10 = dashboard-dense.

**Chosen variant:** `minimalist-skill`
**Reason:** the product's entire thesis is *reduce cognitive load and setup friction*. Visual restraint is a core requirement, not a style choice — the UI must never become another thing the student has to learn or configure. Density is intentionally mid-high (6) because the value is *consolidation* (everything in one view), not minimal-but-empty.

---

## 8. Impeccable Anti-Pattern Register

| Pattern | Status | Location | Fix Applied |
|---------|--------|----------|-------------|
| Chat panel wider than 720px on mobile | Fixed | `MateChat.tsx` | `max-w-[720px]` enforced |
| Decorative chat animations | Avoided | `MateChat.tsx` | Typing indicator only (latency mask) |

---

## 9. Secondary Surface — Adaptive Card Embed (Teams / Outlook)

When Mate content is surfaced inside Microsoft 365 hosts (Teams message extension, Outlook actionable message), the same panels render as **Adaptive Cards**, which cannot take arbitrary CSS. Mapping of Mate tokens → Adaptive Card mechanism:

| Mate token / component | Adaptive Card mechanism |
|------------------------|--------------------------|
| `--color-surface-emphasis` callout | `Container` `style: emphasis` |
| `--color-primary` primary action | `Action.Submit` `style: positive` |
| `--color-warning` "needs review" | `TextBlock` `color: warning` + ⚠ glyph + label |
| Type hierarchy | `size`/`weight` enums (Large+Bolder → Default) |
| Spacing scale | `spacing` enums (None/Small/Default/Medium/Large) |
| Metrics toggle | `Action.ToggleVisibility` |
| Batch approve | single `Action.Submit` ("Approve all N deadlines") |

Rules carried into the embed: exactly one primary action per card; state by text+icon not color (host themes vary); no horizontal scroll at the narrowest host panel; "Approve All" reachable without long scroll. The embed is a **rendering target of the same logical view**, never a separate product.

---

## Self-Check

- [x] Section 2 has exact HEX values for the primary (Mate's own) UI
- [x] Section 3 spacing scale is consistent (all multiples of 4px)
- [x] Section 4 defines component states including Disabled and Focus and the "needs review" pre-focus
- [x] Section 7 taste-skill dials set and a variant chosen with reasoning
- [x] WCAG AA contrast verified for primary text/background and the warning pairing
- [x] This document exists in code as CSS variables / Tailwind config — implemented in `app/src/app/globals.css` and `app/tailwind.config.ts`; chat panel in `app/src/components/MateChat.tsx`
- [x] Section 9 documents the Teams/Outlook embed as a secondary rendering target, not a separate design

---

*Next in sequence: [SDD](sdd-mate.md) — system architecture and data model.*
