# Offers

The Offers section is a curated board of calls, courses, tools, cohorts, products, programmes and communities that help people and organisations in this community use AI well. Each entry is one file: `data/offers/<slug>.json`. The build reads every file in that folder, checks it, and groups entries on `offers/` by the explicit `displayGroup` field: personal offers first, nonprofit discounts next, and compact courses last. Entries remain alphabetical within each group. Nobody is first.

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
| `providerType` | Whether the provider is a person or organisation. | `person`, `organisation` |
| `kind` | What sort of thing it is. | `call`, `course`, `tool`, `cohort`, `product`, `programme`, `community` |
| `summary` | One plain sentence on what it is. | 20 to 200 characters. |
| `detail` | Optional. Who it is for and how access works. | Up to 500 characters, or `""` for none. |
| `url` | Public link to the offer. | A public HTTPS URL. |
| `access` | How people get in. | `open`, `invite-only`, `application`, `discount`, `free` |
| `audience` | Who it is for. | `organisations`, `individuals`, `both` |
| `displayGroup` | Which presentation group contains the entry. | `personal`, `nonprofit-discount`, `course` |
| `listed` | The date the entry was added. | ISO date `YYYY-MM-DD`, not in the future. |
| `checked` | The date the link and the facts were last checked. | ISO date, not in the future, not before `listed`. |

All text fields must be plain text: no markup, no hidden characters, and no `[PLACEHOLDER` tokens.

## Example

```json
{
  "slug": "example-course",
  "name": "Example Course",
  "by": "Example Organisation",
  "providerType": "organisation",
  "kind": "course",
  "summary": "A short self-paced course on using AI assistants for everyday operations work.",
  "detail": "Six lessons. Aimed at operations staff with no technical background.",
  "url": "https://example.org/course",
  "access": "open",
  "audience": "both",
  "displayGroup": "course",
  "listed": "2026-09-05",
  "checked": "2026-09-05"
}
```

## How to propose an offer

Either route works.

1. **The public issue form.** Open the "List an offer" issue form. Its link is `offerFormUrl` in `data/site.json`, and the site's "List an offer" button points to it. The issue and replies are public. A maintainer reviews the proposal before an accepted listing becomes public. No response time is promised.
2. **Pull request.** Add `data/offers/<slug>.json` with the fields above, run `node build.mjs` and `node qc/verify-release0.mjs`, and open a public pull request. Review and replies happen in that thread.

## Keeping entries current

When you check that a link still works and the facts still hold, update `checked`. If an offer closes or changes beyond its entry, open a pull request to update or delete the file.
