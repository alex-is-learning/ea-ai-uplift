# Case study template

A case study on this site is a short, evidence-marked account of one piece of AI uplift work: where an organisation or a person started, what was done, what changed, and what did not work. It is written from discovery-call rows whose outcome is known, and it is published only with the named people's approval of the exact text.

Three approved case studies are the Release 2 gate on the roadmap. This template is how they are written.

## Structure

Use these headings in this order. Keep the whole piece under 900 words. A reader should be able to find their own situation in the first section.

### 1. Situation

Two or three sentences. Who the organisation or person is, in the terms they approved (anonymised if they chose that), the size of the group involved, and the pain in their words.

### 2. Starting point on the map

Name the starting point from the five on the home page: only the chat box, one clear problem, many pain points, knows the task but cannot start, already uses AI heavily. Say why that one, in one sentence.

### 3. What was done

The intervention, as a short numbered list. Which of the two tracks it ran on (staff adoption, operations improvement, or both). How long it took, in sessions or weeks. Which tool was used and why that one was the most accessible tool that met the need.

### 4. What changed

What is different now. A finished task, a working change, a written instruction that is still in use, a process that runs on its own. Each claim carries an evidence mark (below).

### 5. Evidence

The rows that support the account, by count, not by name. For example: three discovery-call rows, one follow-up call at four weeks, one instruction file still in use at eight weeks.

### 6. What did not work

At least one thing. A case study with nothing in this section is not believed.

### 7. What they would do differently

In the organisation's or the person's own words, approved.

### 8. Written by

The practitioner's name and the date, and the sentence: a working account from one piece of work, not a standard.

## Evidence marks

Every claim in sections 4 and 5 carries one of three marks in brackets after it.

| Mark | Meaning |
|---|---|
| `[measured]` | Counted or timed by someone, and the count is available on request |
| `[reported]` | Stated by the organisation or the person, not measured |
| `[inferred]` | The practitioner's reading of the situation |

An `[inferred]` claim is allowed. An unmarked claim is not.

## Approval checklist

Before a case study enters a pull request:

- [ ] Every named person has approved the exact text, and the date of that approval is recorded on the private call note.
- [ ] The organisation has chosen to be named or anonymised, and the text follows that choice everywhere, including the URL slug.
- [ ] No private fact appears: no internal document names, no individual's performance, no figures the organisation did not approve.
- [ ] No price, rate or currency sign appears.
- [ ] Nothing describes the listed people as a team, collective or official body.
- [ ] Every claim in sections 4 and 5 carries an evidence mark.
- [ ] Section 6 has at least one entry.
- [ ] The evidence sheet rows the case draws on are listed by count in section 5.

A maintainer checks the list before merge and may ask for a different wording or a further approval.

## Licence

Case studies published here are original content under the Creative Commons Attribution 4.0 International licence, as set out in [LICENSE-CONTENT](../LICENSE-CONTENT). The licence covers the account. It does not cover names, portraits, quoted words or anything the named people did not separately release. Say this in the pull request, and confirm that every named person knows the licence before approving.

## Where it lives

A case study will be one file in a folder that does not exist yet, rendered as a page under a path that is decided when the first one is ready. Until then, write it as Markdown in the pull request description so the review and approvals happen in the open, and the maintainer will move it into the data folder when the module lands.
