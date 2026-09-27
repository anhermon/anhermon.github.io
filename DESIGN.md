---
name: Angel Hermon — portfolio
description: Incident-postmortem / status-page timeline. Monitor -> Identify -> Mitigate, with honest verification-tier badges, replacing the old one-accent product-changelog panel list.
colors:
  bg-dark: "#0b0e13"
  bg-light: "#eef1f5"
  ink-dark: "#e9edf2"
  ink-light: "#12161c"
  dim-dark: "#8b96a6"
  dim-light: "#55606f"
  status-monitoring-dark: "#4fa8ff"
  status-monitoring-light: "#1463c9"
  status-identified: "#f5b94a"
  status-identified-light: "#a3760e"
  status-mitigated-dark: "#4ade80"
  status-mitigated-light: "#1c8a4f"
  status-partial: "#f5b94a"
  status-open-dark: "#ff6b5c"
  status-open-light: "#c23d2b"
typography:
  display:
    fontFamily: "\"Inter var\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif"
    fontSize: "clamp(2.1rem, 5vw, 3.4rem)"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "-0.03em"
  heading:
    fontSize: "clamp(1.5rem, 2.6vw, 2rem)"
    fontWeight: 700
    letterSpacing: "-0.02em"
  body:
    fontSize: "0.88rem-0.92rem"
    fontWeight: 400
    lineHeight: 1.6
  mono:
    fontFamily: "ui-monospace, SF Mono, Menlo, Consolas, monospace"
rounded:
  all: "0px"
components:
  status-badge:
    shape: square, 1px currentColor border, mono uppercase, small solid dot prefix
    variants: monitoring | identified | mitigated | partial | open
---

# Design System: Angel Hermon — portfolio (incident-timeline direction)

## Overview

**Creative North Star: "The Incident Postmortem"**

The page reads as a real incident/status-page timeline, not a repeated panel-list product
page (that was the prior direction, superseded 2026-08-01). A persistent vertical spine runs
the full page height; every artifact — a monitored agent run, an extracted finding, a shipped
fix — is a timestamped event attached to that spine with a severity-style status badge. The
badge vocabulary IS the page's honesty mechanism: `MONITORING` (blue, being watched),
`IDENTIFIED` (amber, a real finding surfaced), `MITIGATED` (green, fix shipped and
independently verified), `PARTIAL` (amber, fix applied but verification stopped short — said
plainly, never rounded up to green), `OPEN` (red, explicitly not fixed yet).

Three phases, top to bottom: **Monitoring** (agents watched live/in-replay — DAG replay, OTel
trace spans) → **Identified** (insight extracted from that monitoring — eval-harness lying
about its own success, a fleet-audit finding a stale routing number *while the page was being
built*, a multi-tenant leak test) → **Mitigated** (7 real fixes, each stamped with its actual
verification tier, including 2 honestly marked partial and 1 explicitly still open).

**Key characteristics:**
- Near-black canvas dark / near-white light, `prefers-color-scheme`-driven, no toggle.
- Status-semaphore palette (5 named roles) replaces the old one-accent-blue system — color now
  carries real verification-state information, not just brand accent.
- Zero border-radius throughout, matching the flat "ops instrument" register.
- Monospace elevated to a co-equal display role for numbers/timestamps/status codes (status-
  page convention), not just reserved for code as in the prior direction.
- Self-hosted variable font (Inter var), zero external requests — unchanged constraint.

## Layout

`.wrap` container, max-width 1180px. `.tl-spine` (1px vertical line, fixed left offset) runs
the height of each phase's `.tl` wrapper; every `.tl-entry` attaches a `.tl-marker` (colored
dot) to it, mirroring `git log --graph` / a real incident timeline. Phase headers
(`.phase-header`) are a single recurring pattern — do not let an individual entry re-introduce
its own duplicate phase title (a real bug from the 2026-08-01 build: two subagent-authored
fragments each added their own inline "PHASE N" header on top of the page-level one; removed).

## Components

### Status badge (signature component, see frontmatter)
The single most load-bearing visual element on the page. Never upgrade a badge's tier beyond
what the underlying evidence file supports — this is a hard content rule, not just a style
rule.

### Timeline entry (`.tl-entry` / `.tl-marker` / `.tl-time`)
One real timestamped event: a `.tl-time` (mono, real UTC timestamp where available), an `h3`
title, a `.tl-lede`, then either a `.panel` (reused chart/table component from the prior
direction, re-skinned) or a `.case-study`/`ol` sequence for multi-step investigations.

### Reused from the prior direction, re-skinned only
`dl.meta`, `.panel`/`.panel-scroll`/`.controls`, `.matrix`/`.cell`, `ul.runs`/`.chip`,
`ol.case-study`, `.finding-table` — same markup/JS contracts (the chart-drawing and data-
binding logic is unchanged and still real), new color/typography treatment only.

## Do's and Don'ts

### Do:
- Keep the timeline spine as the one recurring structural motif across all three phases.
- Keep every status badge's tier traceable to a specific, named piece of evidence.
- Keep monospace for timestamps, data, ids, AND headline numbers (expanded from prior direction).

### Don't:
- Don't add a second phase header inside a phase's content — one header per phase, at the
  page-shell level.
- Don't define page-global tokens (`:root { ... }`) inside a section-scoped fragment's own
  `<style>` block — it leaks unconditionally past any `prefers-color-scheme` media override
  declared earlier in the document and silently breaks light mode for everything after it in
  source order. Scope token definitions to that section's own id instead (e.g.
  `#phase-mitigated { --ink: ...; }`), never `:root`.
- Don't declare a `@media (prefers-color-scheme: light)` override block before the unconditional
  base rule it's meant to override — same-specificity rules resolve by source order, so the
  override must come after, or it silently loses.
- Don't round `PARTIAL`/`OPEN` up to `MITIGATED` for narrative neatness.

## Known follow-ups (not blocking, disclosed rather than hidden)
- The impeccable skill's interactive comp-picker step (three visual directions rendered for
  user approval before build) was skipped per explicit user instruction to proceed without
  pausing; the assigned direction was built directly and disclosed in chat.
- The full `impeccable-finish-reviewer`/`impeccable-documenter` subagent handoff was
  substituted with an in-thread verification pass (computed-style checks, Playwright screenshots
  in both themes + mobile, JS syntax/error checks, interactivity checks) plus this manual
  DESIGN.md rewrite, disclosed here rather than run silently.
- `fleetview-workflow.jpg` (real fleetview dashboard screenshot) is no longer embedded on the
  page — the underlying real numbers it illustrated are still present as text/tables in the
  Identified phase, but the screenshot itself was dropped in this rebuild and could be added
  back to the fleet-observability timeline entry if wanted.
