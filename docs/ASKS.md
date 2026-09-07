# Asks (Help wanted)

The Help wanted section is a board. An organisation or an individual in the effective altruism community posts a problem, and anyone listed on the page can reply. It is the demand half of the page; the People grid is the supply half. When there are no live entries, `/asks/` says exactly `No requests are live yet.` and still points people to the posting form.

An ask is a problem, not a brief. The question it answers is "what is slow or painful right now?", never "what should be built?".

## Fields

One file per ask: `data/asks/<slug>.json`. The file name must equal the `slug`. Every key below is required; no other keys are allowed.

| Key | Meaning | Rules |
|---|---|---|
| `slug` | File name and identifier | Lower-case letters, numbers and hyphens; at most 64 characters |
| `title` | The pain in one sentence | 10 to 140 characters; no markup, no hidden characters, no `[PLACEHOLDER` tokens, no currency symbols |
| `context` | Optional detail | 0 to 400 characters; an empty string is allowed |
| `postedBy` | How the card describes the poster | 2 to 120 characters. For an anonymised ask, a role and an organisation type only, never a name |
| `posterKind` | Who is asking | `organisation` or `individual` |
| `budget` | Whether the work is paid | `unstated`, `paid`, `volunteer` or `either`. Never a number |
| `contact` | Where a practitioner replies | A public HTTPS URL: a booking link, a form or a public profile. No `mailto:` |
| `posted` | Date the ask went up | ISO date (`YYYY-MM-DD`), not in the future |
| `expires` | Last day the ask shows | ISO date, after `posted` and at most 120 days after it |
| `source` | Who wrote it | `self` (the poster) or `anonymised` (Alexander Large, from a discovery call, with all identifying detail removed) |

An `anonymised` ask renders the line "Anonymised from a discovery call. Posted by Alexander Large." on its card.

The build rejects a file that breaks any rule, and `node qc/verify-release0.mjs` runs the negative fixtures in `qc/fixtures-sections/asks/`.

## Expiry

An ask whose `expires` date is before the build date is not rendered. The build prints an information line to stderr and carries on; it is not an error. The file can stay in the repository or be deleted. To keep an ask up longer, submit a change that moves `expires`, still within 120 days of `posted`.

## How to post

Two routes:

1. **The Tally form.** `data/site.json` holds `askFormUrl`, which identifies the "Post an ask (Help wanted)" form. The form requires a budget label. Choose `unstated` if you do not want to state one. The response goes to the maintainer and does not create a public GitHub issue. A maintainer writes the JSON file and asks you to approve the final text before publication.
2. **A pull request** that adds `data/asks/<slug>.json` with the fields above. Run `node build.mjs` before opening it.

The pull request is public when it opens. A published ask is public on the site and in this repository. Do not include private contact details, colleagues' names, or anything you would not put on a public page.

The page also asks for one real problem that is slow, repeated or stuck. Write the pain, not a tool or a proposed solution. The useful-ask explanation on the page gives the short format: one sentence on the pain, a little context, and a public link where someone can reach you.

A maintainer reviews each request before publication. Practitioners reply through the public `contact` URL. Publication does not guarantee a reply, and no response time is promised.

## Example

```json
{
  "slug": "monthly-report-takes-two-days",
  "title": "The monthly funder report takes two days of copying numbers between spreadsheets.",
  "context": "Four spreadsheets, one narrative document, and the same figures re-typed every month.",
  "postedBy": "A programme manager at a grant-making organisation",
  "posterKind": "organisation",
  "budget": "unstated",
  "contact": "https://example.org/talk-to-us",
  "posted": "2026-09-05",
  "expires": "2026-11-30",
  "source": "self"
}
```
