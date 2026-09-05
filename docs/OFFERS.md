# Offers

The Offers section of the home page is a curated board of courses, tools, cohorts, products, programmes and communities that help people and organisations in this community use AI well. Each entry is one file: `data/offers/<slug>.json`. The build reads every file in that folder, checks it, and renders the cards in alphabetical order by name. Nobody is first.

## Rules

- Anything listed must be useful to people or organisations in this community using AI. It can be free or paid.
- No prices and no currency signs anywhere in an entry. The build rejects `£`, `$`, `€` and `¥` in `name`, `by`, `summary` and `detail`. Cost is only ever the `access` word.
- A listing is not an endorsement.
- The maintainer decides what is listed and can remove an entry at any time.
- Only propose an offer you provide yourself, or one whose provider has given you permission.
- Link only to public HTTPS pages. No `mailto:` links, no private documents.

## Fields

| Field | Meaning | Allowed values |
|---|---|---|
| `slug` | File name without `.json`. | Lower-case letters, digits and hyphens. Must match the file name. |
| `name` | The public name of the offer. | 2 to 80 characters. |
| `by` | Who offers it: the public name of a person or organisation. | 2 to 100 characters. |
| `kind` | What sort of thing it is. | `course`, `tool`, `cohort`, `product`, `programme`, `community` |
| `summary` | One plain sentence on what it is. | 20 to 200 characters. |
| `detail` | Optional. Who it is for and how access works. | Up to 500 characters, or `""` for none. |
| `url` | Public link to the offer. | A public HTTPS URL. |
| `access` | How people get in. | `open`, `invite-only`, `application`, `discount`, `free` |
| `audience` | Who it is for. | `organisations`, `individuals`, `both` |
| `listed` | The date the entry was added. | ISO date `YYYY-MM-DD`, not in the future. |
| `checked` | The date the link and the facts were last checked. | ISO date, not in the future, not before `listed`. |

All text fields must be plain text: no markup, no hidden characters, and no `[PLACEHOLDER` tokens.

## Example

```json
{
  "slug": "example-course",
  "name": "Example Course",
  "by": "Example Organisation",
  "kind": "course",
  "summary": "A short self-paced course on using AI assistants for everyday operations work.",
  "detail": "Six lessons. Aimed at operations staff with no technical background.",
  "url": "https://example.org/course",
  "access": "open",
  "audience": "both",
  "listed": "2026-09-05",
  "checked": "2026-09-05"
}
```

## How to propose an offer

Either route works.

1. **Issue form.** Open the "List an offer" form. Its link is `offerFormUrl` in `data/site.json`, and the site's "List an offer" button points to it. A maintainer turns an accepted proposal into a file and a pull request.
2. **Pull request.** Add `data/offers/<slug>.json` with the fields above, run `node build.mjs` and `node qc/verify-release0.mjs`, and open a pull request.

## Keeping entries current

When you check that a link still works and the facts still hold, update `checked`. If an offer closes or changes beyond its entry, open a pull request to update or delete the file.
