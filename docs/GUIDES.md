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
| `status` | What kind of entry this is. | One of `index-only`, `guide-planned`, `external`, `local`. See below. |
| `links` | Where to read. | A list of 1 to 3 objects with exactly `label` (3 to 80 characters) and `url` (a public HTTPS address). No two links in one entry may share a URL. |
| `checked` | The date the links were last opened and read. | An ISO date (`YYYY-MM-DD`), not in the future. |

No other fields are allowed. Text fields must not contain markup, hidden characters, or an unfinished `[PLACEHOLDER` token.

`status` values:

- `index-only`: the entry is the pointer. Nothing more is planned here.
- `guide-planned`: a local sub-guide is on the roadmap. The page shows a small "Guide planned" mark.
- `external`: the linked resource is the guide. Nothing local is needed.
- `local`: a guide page exists on this site at `guides/<slug>/`, written from `data/guide-pages/<slug>.json`. The index row links to it. Every `local` entry must have a page file, and every page file must have a `local` entry.

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

## Guide pages written on this site

A guide page is one file: `data/guide-pages/<slug>.json`. Its `slug` must match an index entry in `data/guides/` whose `status` is `local`. The build renders it at `guides/<slug>/` with the index entry's title, `what` line and links (shown as Sources), a version mark, and the page's own body.

| Field | Meaning | Rules |
|---|---|---|
| `slug` | The file name without `.json`. | Must equal the slug of a `local` index entry. |
| `summary` | The page description for search and link previews. | 20 to 200 characters. Plain text. |
| `version` | The evidence mark. | Exactly `0.1` in this release. It means: written from one practitioner's work, not yet tested with readers. |
| `written` | The date the text was written. | An ISO date, not in the future. Shown at the foot of the page. |
| `blocks` | The body. | A list of 6 to 60 blocks, in reading order. See below. |

No other fields are allowed.

### Block types

| `type` | Fields | Renders as |
|---|---|---|
| `h2` | `text` (3 to 90 characters) | A section heading. |
| `p` | `text` (10 to 700 characters) | A paragraph. |
| `ul` | `items` (1 to 12 strings, 2 to 300 characters each) | A bulleted list. |
| `ol` | `items` (same rules) | A numbered list. |
| `aside` | `title` (3 to 80), `text` (10 to 600) | A boxed note. |
| `quote` | `text` (10 to 400), `attrib` (3 to 120) | A quotation with its attribution. |
| `links` | `items`: 1 to 6 of `{ "label", "url" }` | External links. Every `url` must be a public HTTPS address. |
| `related` | `items`: 1 to 6 of `{ "label", "path" }` | Links to other pages on this site. `path` is a site path such as `guides/mcp/`. The build fails if the target page does not exist. |

Text must not contain markup, hidden characters, or an unfinished `[PLACEHOLDER` token. The copy rules in [CONTRIBUTING.md](../CONTRIBUTING.md) apply to every block: plain UK English, no first-person plural, no prices, no hype, no private facts about anyone.

A useful shape for a guide, and the one the first five follow: what it is, why it matters for an organisation in this community, the three to five moves that give most of the value, a numbered how-to for this afternoon, what good looks like, common mistakes, when not to bother, then a `related` block.

### Propose a guide page

1. Open a pull request that sets the index entry's `status` to `local` and adds `data/guide-pages/<slug>.json`. If there is no index entry yet, add one in the same pull request.
2. State the source of each claim in the pull request. Do not copy text from a vendor's documentation; link to it in the index entry instead.
3. Run `node build.mjs` and `node qc/verify-release0.mjs` before you push. `qc/fixtures-sections/guide-pages/` holds the invalid examples the build must reject.

The maintainer reads the whole page before merging and may ask for changes. Version `0.1` stays on the page until the guide has been tested with its intended readers; a later release defines what that test is.
