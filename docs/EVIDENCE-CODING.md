# Evidence coding

Every discovery call becomes one row on one sheet. The sheet is where repeated needs, methods and blockers become visible, and it is the source for the guides, the case studies and the assessment questions on this site. This document defines the sheet and the codes.

The sheet itself is private working material and lives outside this repository. What enters the repository is what the sheet supports: a guide, a case study, an assessment question, and a count.

## The sheet

One row per call. Eight columns.

| Column | What goes in it | Rule |
|---|---|---|
| `date` | The day of the call | ISO date |
| `role` | The kind of person | one of `lead`, `staff`, `leadership` |
| `need` | The pain, coded | one code from the need list |
| `method` | What they already do, or tried, coded | one or more codes from the method list, or `none` |
| `tool` | The tool they named, if any | free text, the tool's own name, or `none` |
| `blocker` | What stopped them going further, coded | one code from the blocker list |
| `outcome` | What happened after the grouped map, once known | free text, one line, or `pending` |
| `quote` | A sentence in their words, with permission | free text, or empty. Permission recorded on the call note |

Add a ninth column, `org`, only in the private sheet, never in anything derived from it.

## The need codes

The codes start from the seven spokes of the assessment on this site. They name what the person is trying to do, not what tool would do it.

| Code | The need |
|---|---|
| `chat` | Get useful drafts, summaries or answers from a chat tool |
| `context` | Stop re-explaining the situation to the tool every time |
| `tools` | Let the tool reach a real system: files, calendar, email, a database |
| `delegation` | Hand over a task with several steps and check the result, not each step |
| `automation` | Have something run on its own, every day or every week |
| `judgement` | Know when to trust an output and when not to |
| `handover` | Leave instructions that someone else can reuse |
| `other` | None of the above. Write the need in `quote` or `outcome` |

If `other` is used more than three times for the same thing, it becomes a new code and this table changes.

## The method codes

What the person already does. More than one may apply.

| Code | The method |
|---|---|
| `manual` | Does it by hand |
| `chat-only` | Uses a chat tool with copy and paste |
| `template` | Has a prompt or template they reuse |
| `connected` | Has a tool connected to a real system |
| `automated` | Has something that runs without them |
| `asked-someone` | Asked a colleague or a practitioner |
| `abandoned` | Set something up and stopped using it |
| `none` | Has not tried anything |

## The blocker codes

What stopped them. One code, the largest one.

| Code | The blocker |
|---|---|
| `access` | No paid seat, no permission, or policy unclear |
| `unknown-unknown` | Did not know the capability existed |
| `trust` | Tried it, did not trust the output |
| `time` | Knows what to do, has no protected time |
| `start` | Knows the task, cannot start it |
| `upkeep` | Built something, nobody owns it when it breaks |
| `none` | Nothing stopped them; the need is new |

## From rows to guides

A code that repeats is a candidate for a guide. The rule of thumb:

- A `need` code with five or more rows across at least two organisations earns a written guide for that need, if the index does not already have one.
- A `blocker` code with five or more rows earns a section in the relevant guide on that blocker.
- An `unknown-unknown` blocker on a need is the strongest signal of all. It means people cannot ask for the thing because they have not met it. That is what the "I do not know what this means" answer in the assessment measures.

Every guide states which need code it serves and how many rows supported it when it was written. That count is the guide's evidence mark.

## From rows to assessment questions

The assessment asks ten questions across seven spokes. A spoke stays because rows keep landing on its need code. A spoke changes when:

- a need code has fewer than three rows after twenty calls, or
- `other` has been used for the same new need more than three times.

Record the change in `docs/ASSESS.md` and in the pull request that changes the question data.

## The gate

The roadmap's Release 2 gate is twelve discovery calls producing three approved case studies and a coded list of repeated needs and methods. In terms of this sheet:

1. Twelve rows, from at least three organisations, with `role` covering both `lead` and `staff`.
2. A count per `need` code and per `blocker` code, published as a table in the relevant guide.
3. Three rows whose `outcome` is known, written up with [the case study template](CASE-STUDY-TEMPLATE.md) and approved by the named people.

The numbers are working targets. Change them when real response rates give a better baseline. Do not change a gate only to declare progress.
