# Antystyki Lint Remediation Plan

**Version**: 0.1  
**Author**: GPT-5 Codex (Product Strategist & Documentation Guardian)  
**Date**: November 5, 2025  
**Related Control Docs**: `ANTYSTYKI_PRD.md` (§3.1.4 Production Deployment Readiness), `ANTYSTYKI_LAUNCH_GUIDE.md` (Week 1 › GL-C05 / GL-C06)

---

## 1. Objectives

- Restore a passing `npm run lint` signal ahead of Phase 1 launch hardening so automated CI gates stay green.  
- Reduce `@typescript-eslint/no-explicit-any` debt across shared models, API clients, and pages to preserve type safety during community feature work.  
- Resolve React Fast Refresh and Hooks rule violations so local DX remains stable for rapid iteration.  
- Deliver incremental improvements without blocking active feature delivery by sequencing work into small, reviewable batches.

## 2. Baseline (Captured 2025-11-05)

- Command: `npm run lint` (logged to `lint-baseline.log`).
- Totals: 52 findings (51 errors, 1 warning).
- Key buckets:
  - `@typescript-eslint/no-explicit-any`: **43 instances**.
  - `react-refresh/only-export-components`: **3 instances** (`ChartGenerator.tsx`, `AuthContext.tsx`).
  - `react-hooks/rules-of-hooks`: **2 errors** (`CreateStatistic.tsx`).
  - `react-hooks/exhaustive-deps`: **1 warning** (`CommentsSection.tsx`).
  - Misc: `@typescript-eslint/ban-ts-comment` (1), `prefer-const` (1), `@typescript-eslint/no-unused-vars` (1).

See `lint-baseline.log` for a full file-by-file listing.

## 3. Remediation Milestones

| Milestone | Scope | Owner | Target Date | Notes |
|-----------|-------|-------|-------------|-------|
| **LINT-01: Type Hygiene Pass** | Replace shared model `any` usage (`src/types`, `api`, `pages` auth flows) with concrete interfaces or generics. | Frontend Dev | Nov 8, 2025 | Start with `Statistic`, `Antistic`, and auth forms to unlock downstream fixes. |
| **LINT-02: Hook Contract Cleanup** | Refactor conditional hooks in `CreateStatistic.tsx`; align `CommentsSection` deps; add regression tests. | Frontend Dev + QA | Nov 10, 2025 | Coordinate with content moderation work to avoid merge clashes. |
| **LINT-03: Fast Refresh Compliance** | Extract chart constants/context helpers into utility modules; ensure component files only export components. | Frontend Dev | Nov 11, 2025 | Minimal functional change; impacts `charts/ChartGenerator.tsx`, `context/AuthContext.tsx`. |
| **LINT-04: QA & CI Gate** | Re-run lint + unit tests; update GitHub Actions to fail on lint regressions; capture sign-off. | DevOps | Nov 12, 2025 | Align with `ANTYSTYKI_LAUNCH_GUIDE.md` Week 1 testing tasks. |

## 4. Execution Guidelines

1. **Small Batches** – Limit each PR to one bucket (types, hooks, refresh) to simplify review.  
2. **Shared Types First** – Update `src/types/index.ts` before touching consuming components to minimize churn.  
3. **Testing** – Run `npm run lint` and `npm run test` locally for each batch; attach logs to PR description.  
4. **Docs & Tracking** – Update this plan and `GO_LIVE_PROGRESS_TRACKER.md` after each milestone.  
5. **Analytics Hooks** – Ensure analytics helpers keep strict typings to preserve GA4 data integrity during refactors.

## 5. Risks & Mitigations

- **Scope Creep**: Large file refactors may surface unrelated legacy debt. → Keep PRs tightly scoped; open follow-up tickets for unrelated findings.  
- **Timeline Pressure**: Lint fixes compete with feature delivery. → Schedule work during “stabilization” windows defined in `ANTYSTYKI_LAUNCH_GUIDE.md`.  
- **Type Regressions**: Aggressive typing may break runtime behavior. → Pair lint updates with unit/regression tests; rely on TypeScript compiler in strict mode.

## 6. Changelog

- **2025-11-05**: Initial plan drafted; baseline captured into `lint-baseline.log`; milestones aligned with PRD §3.1.4.

---

> Maintain this document as lint debt is burned down. Attach milestone completion notes and link merged PRs for future audits.

