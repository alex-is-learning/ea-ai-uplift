# Assess: your AI practice

`/assess/` is a ten-question self-assessment. A visitor rates ten first-person statements from 1 ("Not me") to 5 ("Very much me"), or answers "I do not know what this means". Seven of the statements each measure one **way of working** (a spoke on the chart). Three are **connective** questions that shape the result without moving the chart. The result names the strongest way and the growth edge, lists the ways not yet met, places the visitor on the home page's five-point route, picks three entries from the Guides index, and shows the People grid.

Everything runs in the browser. No account, no storage, no analytics. The result is encoded in the page URL (`?s=` seven digits for the spokes, `?c=` three digits for the connective questions, digit `0` meaning "not met"), so the link is the record. The optional "Email me this result" button opens the form in `data/site.json` `assessFormUrl` with the scores prefilled; see [TEAM-MODE.md](TEAM-MODE.md).

## Data

One file per spoke and one per question in `data/assess/`.

### Spoke file: `spoke-<key>.json`

| Field | Meaning | Rules |
|---|---|---|
| `slug` | `spoke-<key>` | Must equal the file name. |
| `kind` | `spoke` | |
| `order` | Position on the chart, clockwise from the top. | Integer 1 to 7, unique. |
| `key` | The short id used by questions. | Lower-case letters. |
| `label` | The name on the chart. | 3 to 14 characters. |
| `short` | One line saying what the way is. | 10 to 70 characters. |
| `strong` | Shown when this is the visitor's strongest way. | 20 to 200 characters. |
| `edge` | Shown when this is the growth edge: one concrete next step. | 20 to 200 characters. |
| `unmet` | Shown when the visitor has not met this way: a plain definition. | 20 to 200 characters. |
| `guide` | The slug of an entry in `data/guides/`. | Must exist. If that entry's status is `local`, the result links to the guide page; otherwise to the entry's first link. |

### Question file: `question-<nn>.json`

| Field | Meaning | Rules |
|---|---|---|
| `slug` | `question-<nn>` | Two digits, must equal the order and the file name. |
| `kind` | `question` | |
| `order` | The order asked. | Integer 1 to 10, unique. |
| `spoke` | The spoke key this question scores, or `null` for a connective question. | Each spoke has exactly one question. |
| `tag` | For a connective question: `support`, `blocked` or `shared`. `null` on a spoke question. | Exactly one question per tag. |
| `statement` | The first-person statement the visitor rates. | 30 to 220 characters. |

There must be exactly seven spokes and ten questions. All text passes the site's positioning rules at build time (no first-person plural, no prices, no hype words).

## How the result is worked out

- **Strongest way**: the highest score among the ways the visitor knows. Ties go to the earlier spoke.
- **Growth edge**: the lowest score among the ways the visitor knows. Ties go to the earlier spoke.
- **Not met yet**: every spoke answered "I do not know what this means". Drawn as a dashed spoke with a hollow dot.
- **Starting point on the route**, applied in this order: 5 if the mean of context, tools, delegation and automation is 3.5 or more; 1 if chat is 3 or more and every other way is 2 or less; 4 if the `blocked` question is 4 or more; 3 if three or more ways are not met; otherwise 2. The page calls it "a guess from ten answers, not a diagnosis".
- **Three things to read**: the growth edge's guide, the first unmet way's guide (or the second-thinnest way's), the strongest way's guide, in that order, without duplicates.
- **Two notes**: from the `support` and `shared` questions, only when the answer is clearly low (1–2) or clearly high (4–5).

`?p=<seven digits>` on the assessment URL preloads an earlier result and draws it as a dotted outline behind the new one, so a retake shows movement. `?t=<code>` carries a team code through to the form.

## Changing the questions

Edit the data files and rebuild. `qc/fixtures-sections/assess/` holds the invalid examples the build must reject. The seven ways are version 0.1, a working model from one practitioner; change them when evidence from real work says so, and say so on the page.
