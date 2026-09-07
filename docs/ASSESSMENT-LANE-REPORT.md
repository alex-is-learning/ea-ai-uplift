---
title: Assessment lane repair
type: bugfix
created: 2026-09-07
status: in-progress
baseline_commit: 9e4c5fd
context:
  - EA AI Uplift product roadmap, 7 September 2026 active plan
  - EA AI Uplift visitor journey review, 7 September 2026
---

# Assessment lane report

## Intent

**Problem:** Both assessments select relative strengths and weaknesses even when all answers are low, unknown, or tied. Their result routes, email promises, team wording, save behaviour, and mobile order do not match the checked product contract.

**Approach:** Use explicit thresholds and plural tie states. Put one local, route-specific next action before a secondary analysis, preserve old score URLs, and add a portable result snapshot.

## Boundaries and constraints

**Always:** Keep `s=<seven scores>&c=<three scores>` links valid. Treat score zero as unknown, not low. Retain answer values and labels, result date, assessment version, and next action in saved and shared results. Keep optional notes local unless the visitor selects their inclusion in a saved file. Use the agreed beginner, progression, people, and help routes.

**Ask first:** No action inside this lane needs an outward message, publication, deployment, payment, deletion, or shared-file edit.

**Never:** Do not promise email delivery or automatic team collection. Do not edit `build.mjs`, shared page or section modules, `data/site.json`, `lib/data.mjs`, `public-files.txt`, shared output checks, verifier wiring, `README.md`, or `BAKE.md`.

## Input and edge-case matrix

| State | Expected result |
|---|---|
| All low | No claimed strength. Tied low areas are plural. The beginner route is primary. |
| All unknown | No inferred weakness or pain point. Exploration is explicit. |
| Mixed | Absolute strengths and lowest non-strength areas match their scores. |
| All high | Tied strengths are plural. No false growth edge appears. The progression route is primary. |
| Partial ties | Every tied strongest or lowest area appears. No source-order winner appears. |
| Old score URL | The existing `s` and `c` values still reopen the same result. |
| New shared URL | Scores, labels, date, version, and next action survive reload. |
| Saved file | The file contains the result contract. Notes appear only after explicit selection. |
| Team code | The link stays local and makes no collection claim. |
| Mobile entry | At 390×844, question one appears before the chart or spoke display. |

## Code map

- `lib/assess-client.js` — scoring, result content, share snapshots, save files, and interaction behaviour.
- `lib/assess.mjs` — assessment data contract, page structure, and assessment-specific CSS.
- `lib/assess-org.mjs` — organisation place copy and route-specific result data.
- `data/assess/` — personal assessment wording.
- `data/assess-org/` — organisation assessment wording.
- `qc/check-assess-org.mjs` — focused Chromium tests for both modes.

## Tasks and acceptance

- [ ] Add explicit strength and edge thresholds with complete tie handling.
- [ ] Add one primary next action and place full analysis behind a secondary control.
- [ ] Replace email and collection claims with copy, download, and local team-link behaviour.
- [ ] Put the first mobile question before the visual overview.
- [ ] Add low, unknown, mixed, high, tie, round-trip, download, navigation, and viewport tests.
- [ ] Save desktop and 390×844 browser evidence.

Given any supported score combination, when a visitor opens the result, then its claims follow absolute thresholds and preserve unknowns.

Given a current or historical result URL, when the browser loads it, then the original scores and assessment mode remain intact.

Given a completed result, when the visitor copies or saves it, then the portable record contains the required result contract.

Given optional notes, when the visitor saves without selecting notes, then the file excludes them.

Given a 390×844 viewport, when a visitor opens either assessment, then question one appears before the visual overview.

## Verification

- `node build.mjs` — generates both assessment pages.
- `node qc/check-assess-org.mjs` — passes focused runtime and viewport checks.
- `node qc/verify-release0.mjs` — passes the complete existing verifier without shared verifier edits.
- Browser screenshots at 1280×800 and 390×844 — show question order and result hierarchy.

## Evidence

Implementation evidence will be appended after the checks pass.
