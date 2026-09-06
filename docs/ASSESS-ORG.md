# Organisation assessment

The organisation assessment lives at `/assess/org/`. One operations lead, COO, chief of staff or executive director answers ten questions for the organisation. Seven answers draw the conditions chart. Three connective answers shape the result. Scores stay in the URL. The page stores nothing.

## Files

Each JSON file in `data/assess-org/` holds one spoke or one question. There must be seven spoke files and ten question files.

| Spoke field | Meaning |
|---|---|
| `slug` | `spoke-<key>` |
| `kind` | `spoke` |
| `order` | Chart order, 1 to 7 |
| `key` | Lower-case condition key |
| `label` | Chart label |
| `short` | Plain definition for the condition |
| `strong` | Result copy for the strong band |
| `middle` | Result copy for the middle band, or score-keyed copy for a document ladder |
| `edge` | Result copy for the edge band |
| `unmet` | Result copy for Not known |
| `guide` | A validated guide slug, or `null` when `route` supplies the target |
| `route` | A plain-English title and local link, or `null` when `guide` supplies the target |

| Question field | Meaning |
|---|---|
| `slug` | `question-<two-digit order>` |
| `kind` | `question` |
| `order` | Question order, 1 to 10 |
| `spoke` | A condition key, or `null` for a connective question |
| `tag` | `reuse`, `blocked` or `sight` for connective questions |
| `statement` | The complete question |
| `answers` | A named answer kind or an inline score-and-label ladder |
| `notSureFirst` | `true` on Q4 only |
| `freeText` | `Which process?` on Q9 only |
| `note` | The two-person instruction on Q7 only |

## Definitions on the page

**staff** means paid staff and long-term contractors, including the respondent, not volunteers or trustees.

**Out of date** means not touched in the last twelve months.

Access uses percentage bands: 0%, 1–33%, 34–66%, 67–99%, and 100%.

Spread asks for a rough mix of regular or power users, occasional users, and non-users. Regular or power users use AI for real work each week. Occasional users use it less often.

## Answer kinds

Spread uses four staff-mix profiles: Concentrated (2), Emerging (3), Broad (4), and Routine (5). None scores 1. Q4 shows Not sure first.

Q10 records confidence in the Spread estimate. The ladder runs from Mostly a guess (1) to Recent organisation-wide data (5). Not sure scores 0.

Document uses: Does not exist (1), Exists but out of date (3), Exists and current but not linked from where staff start work (4), Exists and current and linked from where staff start work (5), Not sure (0). Rules adds a score-2 rung for a policy that does not name an AI tool or does not say what must not go into one. Pick the lowest rung that is true.

Staged uses an inline three-step ladder at scores 1, 3 and 5, plus Not sure at 0. Pick the highest rung that is true.

Yes/no uses Yes (5), No (1), Not sure (0).

## Result bands

| Kind | Strong | Middle | Edge | Not known |
|---|---|---|---|---|
| Count | 4 or 5 | 2 or 3 | 1 | 0 |
| Staged | 5 | 3 | 1 | 0 |
| Document | 5 | 2, 3 or 4, with copy for each rung | 1 | 0 |

A hollow, dashed spoke means Not known. It does not mean that the organisation failed the condition.

## Placement rules

Apply these rules in order:

1. **Find out first.** Three or more conditions are Not sure, or there is a sight gap.
2. **Running it, keep it running.** Production is 5, Ownership is 5, and Rules is 3 or more.
3. **Accounts, no practice.** Access is 4 or 5, Rules is 3 or more, Reach and Production are each 1 or 2, and Spread is 0, 1 or 2.
4. **One process everyone names.** Blocked is Yes, and Access or Rules is 3 or more.
5. **One clear gap.** Otherwise, name Rules when Rules is 1 or 2. Else name the lowest known condition. Break ties in this order: Access, Context, Ownership, Spread, Reach, Production.

Only the seven conditions count towards the Not sure total. Q8 and Q9 do not count.

## Sight gap

Q4 must be above None. A sight gap exists when Q10 confidence is more than one rung below Q4, or when Q10 is Mostly a guess or Not sure. If Q4 is None or Not sure, there is no sight gap.

## URL fields

- `s` contains seven digits in this order: Access, Reach, Context, Spread, Production, Rules, Ownership.
- `c` contains three digits in this order: reuse, blocked, sight.
- `p` contains seven digits from an earlier result.
- `t` contains a team code with letters, digits and hyphens, up to 24 characters.

Q9's optional process text is not encoded, stored or sent.
