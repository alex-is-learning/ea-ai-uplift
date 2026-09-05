# The pathway: learn and hire

The Pathway section of eaaiuplift.com holds two prose pages. `learn/` is the learning route for a person who wants to do AI uplift work. `hire/` is the hiring pack for an organisation that wants the capability. The home page carries a band with one card for each.

Each page is one file: `data/pathway/learn.json` and `data/pathway/hire.json`. Both must exist. The build reads them, validates them, renders the band and the two pages, and stops on any error.

## Fields

| Field | Meaning | Rules |
|---|---|---|
| `slug` | The page path. | Exactly `learn` or `hire`. Must equal the file name. |
| `title` | The page title. | 3 to 70 characters. Plain text. |
| `lede` | One or two sentences under the title, also the card text on the home page and the page description. | 20 to 240 characters. |
| `blocks` | The body. | A list of 6 to 60 blocks, in the block format below. |

No other fields are allowed. Text must not contain markup, hidden characters, or an unfinished `[PLACEHOLDER` token.

## Blocks

The body is a list of blocks. Each block has a `type` and the fields for that type, and nothing else.

| Type | Fields | Renders as |
|---|---|---|
| `h2` | `text` (3 to 90) | A section heading |
| `p` | `text` (10 to 700) | A paragraph |
| `ul` | `items` (1 to 12 strings, each 2 to 300) | A bulleted list |
| `ol` | `items` (as above) | A numbered list |
| `aside` | `title` (3 to 80), `text` (10 to 600) | A boxed note |
| `quote` | `text` (10 to 400), `attrib` (3 to 120) | A quotation with attribution |
| `links` | `items`: 1 to 6 of `{ label, url }` | External links. `url` must be public HTTPS |
| `related` | `items`: 1 to 6 of `{ label, path }` | Local links. `path` is a site path such as `hire/` or `guides/mcp/` |

Every `related` path must resolve to a page the build generates. The output check fails on a missing target.

## Copy rules

The same rules as the rest of the site, and they are checked on every generated page:

- Plain UK English. Warm, not sales copy.
- No "we", "our" or "us". The site is maintained by one person and lists people who work independently of each other.
- No prices, rates or currency signs.
- No hype words.
- Never describe the listed people as a team, collective, network or official body.
- No organisation named, no private facts about anyone.

## Propose a change

Open a pull request that edits one of the two files. Run `node build.mjs` and `node qc/verify-release0.mjs` before you push; both must pass. The maintainer reads the rendered page before merging.

The pages are marked as version 0.1. They are one route drawn from a few people's practice and will change as [the discovery calls](DISCOVERY-CALLS.md) and [the evidence sheet](EVIDENCE-CODING.md) settle.
