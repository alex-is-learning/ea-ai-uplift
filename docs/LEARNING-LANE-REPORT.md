# Learning lane report — 7 September 2026

## Scope

This lane adds two paired Guides entries and their local pages:

- `first-useful-task`: a complete 15-minute exercise for an existing chat tool.
- `practitioner-pathway`: five stages from a personal task to a tested handover.

The pages reuse selected practice from `data/pathway/learn.json`. They do not publish `/start/`, `/learn/` or `/hire/`.

## Checks

`node qc/check-learning-guides.mjs` passed.

The check passed source requirements, route order, evidence labels and four Chromium renders:

| Route | Desktop | Mobile | Document height |
|---|---:|---:|---:|
| `/guides/first-useful-task/` | 1280×800 | 390×844 | 3322px / 4312px |
| `/guides/practitioner-pathway/` | 1280×800 | 390×844 | 3300px / 4763px |

The browser checks found no horizontal overflow, invalid images or remote requests. Visual inspection retained the paper, cobalt, tangerine and ink style. The mobile header wraps into two rows without clipping.

The following existing checks also pass after a separate build:

- `node qc/check-public-files.mjs`
- `node qc/check-output.mjs`
- `node qc/check-sections.mjs`
- `node qc/check-assess-org.mjs`
- `node qc/check-contribution-forms.mjs`

The full `node qc/verify-release0.mjs` command was not run again, on the coordinator's instruction. Two earlier attempts reached a Chromium DevTools startup timeout during the broad render suite.

## Evidence limits

Both pages show version `0.1` and state that readers have not tested them. The first page labels its output as fictional and deliberate. It does not claim client impact, certification or organisational adoption.
