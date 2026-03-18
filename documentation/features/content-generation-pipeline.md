# Content Generation Pipeline (AUTO-GEN-DAILY)

**Version**: 1.0  
**Last Updated**: 2026-03-18  
**Feature ID**: `AUTO-GEN-DAILY` (PRD §3.1)

---

## Purpose

This document describes the production behavior of the automated content-generation pipeline that creates `Statystyki` and `Antystyki` drafts for moderator review.

It supersedes older notes that described this flow as fire-and-forget background execution without persisted run states.

---

## Architecture Flow

1. `ContentGenerationHostedService` schedules a daily run using `ContentGeneration:DailyRunLocalTime` (default `07:00` local server time).
2. Moderator/Admin manual trigger calls `POST /api/admin/content-generation/run`.
3. Both paths queue a run via `ContentGenerationRunOrchestrator`:
   - creates a row in `content_generation_runs`,
   - enforces single active run (`queued`/`running`),
   - executes with retry/backoff (`RunMaxAttempts`, `RetryBaseDelaySeconds`).
4. Orchestrator invokes `ContentGenerationService.GenerateAsync`.
5. Service validates sources, fetches candidates, enforces trust/quality gates, deduplicates, and persists only `pending` drafts.
6. Moderator reviews items in `/admin` queue:
   - statistics via `/api/admin/statistics/pending`,
   - antistics via `/api/admin/antistics/pending`.

---

## Trigger Modes

### A) Automatic Daily Run

- Scheduled by hosted service at configured local time.
- Trigger type persisted as `scheduled`.
- Uses same orchestration and validation path as manual run.

### B) Manual Moderator Trigger

- Endpoint: `POST /api/admin/content-generation/run`
- Roles: `Admin`, `Moderator`
- Returns `202 Accepted` with:
  - `runId`
  - `statusUrl` (`/api/admin/content-generation/runs/{runId}`)
- Frontend polls run status until terminal state (`succeeded` or `failed`).

---

## Trust and Validation Model

Trusted-source enforcement is enabled by default:

- `EnforceTrustedSources=true`
- `MinimumSourceReliability=4`
- optional explicit allowlist: `TrustedSourceIds`

Per-candidate validation:

- rejects stale items (`>14 days` when publish date exists),
- requires percentage/ratio signal before LLM call,
- requires verifiable source URL and HTTP `200` when `RequireSourceUrlHttp200=true`,
- rejects low-confidence extraction (`MinimumValidationConfidence`, default `0.6`),
- rejects LLM outputs lacking usable metric.

If no trusted validated data remains:

- no statistics or antistics are persisted,
- run is marked `failed`,
- actionable reason appears in run status and logs.

---

## Provenance and Persistence

Each generated statistic persists:

- `GenerationKey` (idempotency key),
- `ProvenanceData` JSON with:
  - source id/name/publisher/url,
  - fetch timestamp,
  - validation flags (`trustedSource`, `sourceUrlVerified`, `sourceStatusCode`),
  - confidence/metric metadata.

Antistics persist:

- `GenerationKey`,
- `SourceStatisticId` linking antistic to the statistic generated in the same run.

---

## Idempotency and Duplicate Protection

Default behavior (`AllowDuplicates=false`):

- run-level dedupe before persistence,
- DB-level unique index on `Statistics.GenerationKey`,
- DB-level unique index on `Antistics.GenerationKey`.

`GenerationKey` includes day + source + topic + URL to prevent duplicate pending items for same daily source/topic payload.

Manual override:

- request field `allowDuplicates=true` bypasses pre-filtering (DB constraints still protect against exact same generated key collisions).

---

## Chart Payload Rules

### Statistics (`Statistic.ChartData`)

Saved in statistics-hub schema:

- `metricValue`
- `metricUnit`
- `metricLabel`
- `chartSuggestion`:
  - `type`: `pie | bar | line`
  - `unit`
  - `dataPoints[]`

Payload is schema-validated before persistence.

### Antistics (`Antistic.ChartData`)

Saved in antistic template schema with supported templates:

- `two-column-default`
- `single-chart`
- `text-focused`
- `comparison`

Pipeline currently emits best-fit `single-chart` with `pie`, `bar`, or `line` data when numeric structure allows it.

---

## Moderation Lifecycle

All generated content is created as `ModerationStatus.Pending`.

Nothing is auto-published by the pipeline.

Publishing remains moderator-controlled through existing moderation endpoints.

---

## Failure, Retry, and Run States

Run states in `content_generation_runs`:

- `queued`
- `running`
- `succeeded`
- `failed`

Retry behavior:

- source health checks: `SourceHealthMaxAttempts`
- source fetch attempts: `SourceFetchMaxAttempts`
- source URL checks: `SourceUrlCheckMaxAttempts`
- full run attempts: `RunMaxAttempts`

Backoff:

- exponential (`2^attempt * RetryBaseDelaySeconds`).

---

## Operational Runbook

### Manual Trigger

1. Open moderator panel (`/admin`).
2. Configure desired counts and optional source CSV.
3. Click `Uruchom teraz`.
4. Note `runId` in response banner.
5. Monitor status until `succeeded` or `failed`.
6. Refresh pending queues (auto-refresh runs when terminal status is reached).

### Troubleshooting

- **Conflict: another run active**  
  Wait until active run reaches terminal state, then retry.

- **Run failed with zero validated statistics**  
  Inspect:
  - untrusted source filtering (`MinimumSourceReliability`, `TrustedSourceIds`),
  - source URL verification errors,
  - validation confidence threshold.

- **High rejection volume**  
  Check `validationIssues` in run status for rejection reason clusters.

- **No daily run output**  
  Verify:
  - `ContentGeneration:Enabled=true`,
  - `DailyRunLocalTime`,
  - server timezone,
  - run table entries in `content_generation_runs`.

---

## Outdated vs Corrected

- **Outdated**: manual trigger was treated as fire-and-forget with no durable run status.  
  **Corrected**: manual trigger now queues a persisted run and exposes polling status endpoint.

- **Outdated**: source URL failures could still pass validation in some cases.  
  **Corrected**: strict source URL verification can be enforced (`HTTP 200`) before persistence.

- **Outdated**: duplicate control depended mainly on title/URL heuristics.  
  **Corrected**: `GenerationKey` + DB unique indexes enforce stronger idempotency.

- **Outdated**: antistics were not explicitly linked to same-run statistics.  
  **Corrected**: generated antistics now persist `SourceStatisticId`.

