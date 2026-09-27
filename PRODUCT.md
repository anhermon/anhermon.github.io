# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Static HTML/CSS/vanilla JS, no framework, no build step, no external network requests (no CDN fonts/scripts/images — everything inline or data-URI). Deployed on GitHub Pages (`CNAME` → anhermon.dev). This is an existing codebase, not a greenfield choice — the constraint is load-bearing, not incidental: it doubles as a piece of the pitch ("built without a framework," per the footer).

## Users

Two audiences, one page:
- Freelance/contract clients deciding whether to commission Angel Hermon for agent-pipeline / observability work.
- Full-time hiring managers and recruiters evaluating him for a senior systems/backend engineering role.

Both are doing the same job when they land here: deciding, in under a minute, whether this person's claimed skill is real, then deciding whether to reach out.

## Product Purpose

A personal portfolio / landing page for Angel Hermon, a software engineer. Its job is to convert a skeptical visitor (client or recruiter) into a contact — email, GitHub, or LinkedIn — by proving hands-on engineering ability with real, inspectable evidence rather than claims.

## Positioning

He is a general senior systems/backend engineer; agentic engineering (agent harnesses, MCP tracing, evals, observability for agent runs) is his current focus and the subject of the strongest evidence on hand, not the whole of his identity. What a competing portfolio can't copy-paste: every claim on this page is backed by a real artifact he can point to (a real git history, real load-test numbers, a real Kubernetes watch log, real HTTP responses) — not slides, not a mockup, not a diagram of something that doesn't run yet.

## Operating Context

Visitors arrive cold, with no prior context on Angel Hermon, likely via a shared link, a resume, or a GitHub profile. They skim before they read. The page competes with every other tab a busy recruiter or client has open — it has to earn a few seconds before it earns a few minutes.

## Capabilities and Constraints

- Real-artifacts-only rule (binding, see Brand Commitments): nothing on the page may claim or imply a demo, mockup, or diagram is something it isn't. If a source repo is private, the page says so plainly rather than linking something that 404s.
- Zero external network requests: currently true of the whole implementation (no CDN dependencies). Not reconfirmed as a hard constraint by the user in this round — treat as a strong existing-implementation fact to preserve by default, but it is not vetoed to loosen if a chosen visual world genuinely needs a self-hosted asset added in-repo (still no third-party network calls).
- Accessibility: the current implementation has ARIA roles, keyboard focus states, `prefers-reduced-motion` handling, and `<details><table>` text-equivalent fallbacks for every chart. Not reconfirmed as an explicit hard constraint in this round, but there is no product reason to regress it — preserve unless the user says otherwise.
- Light/dark theme support via `prefers-color-scheme`, currently implemented with CSS custom properties.
- Six data-visualization panels replay sanitized real recordings (an agent DAG, an eval harness comparison, an OTel trace waterfall, a load-test chart, a Kubernetes autoscaling timeline, a multi-tenant ingestion table) — the content and every number in them is fixed; only their visual presentation is in scope for the redesign.
- Three "Work" repos (`anvil`, `mcp-trace`, `spark-ordernet-mcp`) are public; two of the six panels' backing repos (`agent-telemetry-pipeline`, `event-ingest-platform`) are currently private — the page discloses this rather than hiding it. Not changing in this pass (owner declined making them public as of 2026-07-31).

## Brand Commitments

- Name: Angel Hermon, wordmark "ANGEL HERMON // ENGINEER" — no confirmed constraint on exact styling, just that the real name stays legible and prominent.
- Real-artifacts-only rule: explicitly confirmed as a hard, non-negotiable constraint for this redesign — every claim must stay backed by a real, verifiable artifact.
- Honest private-repo disclosure: explicitly confirmed as a hard constraint — panels sourced from private repos keep saying so plainly.
- Contact channels: email (angel.hermon.mail@gmail.com), GitHub (github.com/anhermon), LinkedIn (linkedin.com/in/angel-hermon-5a163a66) — must remain present and reachable.

## Evidence on Hand

- `anhermon/anvil` (public) — Rust agent harness, pluggable LLM providers, sub-agents, skill library, episodic memory in SQLite.
- `anhermon/mcp-trace` (public) — Go transparent OTel-tracing proxy for MCP servers; `docs/img/demo.cast` is a real asciinema recording used as the trace panel's data source.
- `anhermon/spark-ordernet-mcp` (public) — read-only MCP server over a brokerage API.
- `anhermon/agent-telemetry-pipeline` (private) — Java/Spring Boot ingest → Kafka → aggregator → Postgres/Redis pipeline; real load-test numbers and a real Kubernetes/KEDA autoscaling run back two of the six panels.
- `anhermon/event-ingest-platform` (private) — Java/Spring Boot multi-tenant Slack/Gmail ingestion platform; real HTTP responses from a live local stack back the tenants panel.
- A real Claude Code agent session (57 agents, one of his own sessions) backs the agentic-workflow DAG panel.
- A real 9-run local-harness eval log (`anvil`) and a 120-run harness-comparison tool (`harness-arena`, not yet public) back the evals panel.
- No testimonials, press, customer logos, or benchmarks exist or should be invented. State absence rather than filling it.

## Product Principles

1. Show, don't tell — every claim earns its place only if a real artifact backs it; when it can't be shown, say so plainly instead of hiding the gap.
2. Skepticism is the default reader stance — the page's job is to survive a critical read, not a friendly one.
3. Breadth over niche — he is a senior generalist systems/backend engineer first; agentic engineering is the current, best-evidenced chapter, not a self-imposed specialty box.
4. Honesty about limits (private repos, unfinished captures, unverified mitigations) is part of the credibility argument, not a liability to minimize.

## Accessibility & Inclusion

No product-specific requirement beyond ordinary web accessibility best practice (see Capabilities and Constraints — keyboard, ARIA, reduced-motion, text-equivalent fallbacks already implemented).
