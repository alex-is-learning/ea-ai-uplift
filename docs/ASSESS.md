# Assess: your AI practice

`/assess/` is a ten-question self-assessment. A visitor rates seven first-person statements from 1 ("Not me") to 5 ("Very much me"), or answers "I do not know what this means". Each of those seven measures one **way of working** (a spoke on the chart). Three more are **connective** questions, answered "Yes", "Not sure" or "No" (encoded 5, 3 and 1), that shape the result without moving the chart. The result puts one next action first and keeps its chart, ties, unknowns, guide routes and detailed interpretation in a secondary section.

Everything runs in the browser. There is no account or server storage for answers. Vercel Web Analytics records anonymised page views, but it does not receive answers or context-field text. Each question has an optional context field. Its text stays in the current browser tab. Notes enter the downloaded JSON file only when the visitor selects that option.

The result URL keeps `?s=` with seven spoke digits and `?c=` with three connective digits. Digit `0` means unknown. A new `r` value also preserves the selected answer labels, result date, assessment version and next action. Old links without `r` remain valid. The visitor can copy the result link or download the JSON file. The site does not promise email delivery.

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

- **Strengths**: all tied highest scores that meet the absolute threshold of 4 or 5.
- **Growth edges**: all tied lowest known scores below the strength threshold.
- **Unknown**: every spoke answered "I do not know what this means". Unknown does not mean weak, blocked or painful.
- **Starting point on the route**, applied in this order: 5 if the mean of context, tools, delegation and automation is 3.5 or more; 1 if chat is 3 or more and every other way is 2 or less; 4 if the `blocked` question is 4 or more; 3 if three or more ways are not met; otherwise 2. The page calls it "a guess from ten answers, not a diagnosis".
- **Primary next action**: one route to the first useful task, practitioner pathway, People or Help wanted page.
- **Three things to read**: up to three distinct routes from the lowest known, unknown and strongest areas.
- **Two notes**: from the `support` and `shared` questions, only when the answer is clearly low (1–2) or clearly high (4–5).

`?p=<seven digits>` preloads an earlier result and draws it as a dotted outline behind the new one. `?t=<code>` labels a result for local comparison. The site does not collect or combine team results. See [TEAM-MODE.md](TEAM-MODE.md).

## Changing the questions

Edit the data files and rebuild. `qc/fixtures-sections/assess/` holds the invalid examples the build must reject. The seven ways are version 0.1, a working model from one practitioner; change them when evidence from real work says so, and say so on the page.
