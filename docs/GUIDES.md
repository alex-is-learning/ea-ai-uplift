# Guides: the index

The Guides section of eaaiuplift.com is an index, not a curriculum. Each entry names one thing a person or organisation doing AI uplift needs to know about, says what it is and why it matters, places it on the route, and points to one to three public sources. Sub-guides written on this site come later, as evidence from real work settles.

One entry is one file: `data/guides/<slug>.json`. The build reads every file in that folder, validates it, and renders the section. An invalid file stops the build.

## Fields

| Field | Meaning | Rules |
|---|---|---|
| `slug` | The file name without `.json`. | Lower-case letters, digits and single hyphens. Must equal the file name. |
| `title` | The name of the thing. | 3 to 70 characters. Plain text. |
| `what` | What it is, in one sentence. | 20 to 200 characters. |
| `why` | Why an EA organisation or practitioner cares, in one sentence. | 20 to 240 characters. |
| `stage` | Where it sits on the route. | One of `start`, `next`, `advanced`. |
| `status` | What kind of entry this is. | One of `index-only`, `guide-planned`, `external`. See below. |
| `links` | Where to read. | A list of 1 to 3 objects with exactly `label` (3 to 80 characters) and `url` (a public HTTPS address). No two links in one entry may share a URL. |
| `checked` | The date the links were last opened and read. | An ISO date (`YYYY-MM-DD`), not in the future. |

No other fields are allowed. Text fields must not contain markup, hidden characters, or an unfinished `[PLACEHOLDER` token.

`status` values:

- `index-only`: the entry is the pointer. Nothing more is planned here.
- `guide-planned`: a local sub-guide is on the roadmap. The page shows a small "Guide planned" mark.
- `external`: the linked resource is the guide. Nothing local is needed.

Example:

```json
{
  "slug": "mcp",
  "title": "MCP (Model Context Protocol)",
  "what": "An open standard that lets an AI tool connect to your calendar, files, Slack, database or other systems through one kind of plug.",
  "why": "Most useful work needs the tool to see real data. MCP is how that connection is made without a custom integration each time.",
  "stage": "next",
  "status": "index-only",
  "links": [
    { "label": "What MCP is, modelcontextprotocol.io", "url": "https://modelcontextprotocol.io/" }
  ],
  "checked": "2026-09-05"
}
```

## How the section renders

Entries are grouped by `stage` in the order start, next, advanced, and sorted by `slug` inside each group. Dates are not shown per entry; one "Links checked" line at the end of the section uses the most recent `checked` value. The section stays hidden while the folder is empty.

## Propose an entry

Open a pull request that adds one file to `data/guides/`. Keep to the rules above and to the site's copy rules in [CONTRIBUTING.md](../CONTRIBUTING.md): plain UK English, no prices, no hype, no private facts about anyone.

Links must be primary sources: the tool's own documentation, the standard's own site, a regulator, or a published report. Not a blog summary of one of those. Open every link before you submit and set `checked` to that date. The maintainer opens each link again before merging and may ask for a different source.

Run `node build.mjs` and `node qc/verify-release0.mjs` before you push. Both must pass.

There is no issue form for guide entries. A pull request is the route.

## Sub-guides written on this site

A later release may add a local page for an entry marked `guide-planned`, at `guides/<slug>/`. The module `lib/guides.mjs` exports a `pages()` function for that purpose. It returns nothing in this release, and no date is promised.
