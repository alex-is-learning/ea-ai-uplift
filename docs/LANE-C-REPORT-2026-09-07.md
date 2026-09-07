# Lane C: help, contribution and evidence

Checked on 7 September 2026. No live form was submitted or edited. No page was deployed or published.

## Implemented routes

- `/asks/` separates direct practitioner contact, the organisation assessment, and a public Help wanted request.
- `/asks/` states that maintainers review requests and that practitioners reply through the poster's public contact URL.
- `/contribute/` groups profile, offer, guide, case study, correction, and removal routes.
- `/contribute/` separates Tally proposals from public GitHub issues and pull requests.
- `/case-studies/` states that worked examples show a method with fictional input, not client outcomes.

No route promises a response time. Each contribution route states its public visibility, review step, and reply route.

## Browser evidence

Chrome rendered all three routes at 1280×800 and 390×844. The browser checks found no horizontal overflow.

| Route | Desktop | Mobile | Browser result |
|---|---|---|---|
| Help | [1280×800](evidence/lane-c-asks-1280x800.png) | [390×844](evidence/lane-c-asks-390x844.png) | Three help choices, five main links, no horizontal overflow |
| Case studies | [1280×800](evidence/lane-c-case-studies-1280x800.png) | [390×844](evidence/lane-c-case-studies-390x844.png) | Evidence boundary and both proposal routes render, no horizontal overflow |
| Contribute | [1280×800](evidence/lane-c-contribute-1280x800.png) | [390×844](evidence/lane-c-contribute-390x844.png) | Six route cards and eight main links render, no horizontal overflow |

Focused checks:

```text
node qc/check-help-contribution.mjs
check-help-contribution: 3 pages and 6 routes pass

node qc/check-contribution-forms.mjs
check-contribution-forms: 7 GitHub issue forms and 6 case-study fields pass
```

## Live Tally form mismatches for the lead

The checks read the public form definitions from the configured Tally URLs. They did not submit data.

### Post an ask — `https://tally.so/r/68lLzY`

1. Budget is required. The form offers `unstated`, `paid`, `volunteer`, and `either`. The site now explains the required `unstated` choice.
2. The consent text covers publication on `eaaiuplift.com`, but accepted asks also enter the public GitHub repository. Add repository visibility to the consent text.
3. The final message says that nothing is published without the "named person's" approval. The form tells posters that no name is needed. Replace this with the poster's approval.
4. The form asks for a public contact link but does not say that listed practitioners use it to reply. Add that reply method.

### Add yourself — `https://tally.so/r/jaRZX4`

1. The form limits headlines to 70 characters. The accepted profile schema permits 160 characters. Change the form limit to 160.
2. The form offers `available`, `limited`, and `unavailable`. The schema also accepts `peer-exchange` and `unknown`. Add both values.
3. The form requires a capability selection. The schema permits an empty capability list. Make the question optional or add an explicit no-selection route.

### List an offer — `https://tally.so/r/obPEYO`

1. The form's Kind choices omit `call`. The accepted offer data includes `call`. Add that choice.
2. The form does not collect the required `providerType` or `displayGroup` fields. Add both fields or document the maintainer's fixed mapping.
3. The form does not explain public visibility, non-endorsement, or the reply route before submission. Add those statements.
4. The final message refers to the "named person's" approval, but the provider can be an organisation. Replace this with the provider's approval.

## Lead-owned integration

The lane did not edit shared lead-owned files. Integration requires these changes:

1. Register `lib/contribute.mjs` in `lib/sections.mjs` so the build writes `/contribute/`.
2. Add the compact Contribute utility link outside the five home destinations in the shared shell.
3. Add the new source, check, report, and evidence files to `public-files.txt`.
4. Wire `qc/check-help-contribution.mjs` into `qc/verify-release0.mjs` and update shared output checks for `/contribute/`.

The full verifier currently stops at the expected integration boundary:

```text
verify-release0: unlisted public file: docs/evidence/lane-c-asks-1280x800.png
```
