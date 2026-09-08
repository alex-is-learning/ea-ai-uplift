# Profiles

Each person has one JSON file at `data/people/<slug>.json`. Existing profiles remain valid when the optional `links` field is absent.

Use the public Add yourself issue form for a maintainer-assisted submission, or open a public pull request. A maintainer reviews each submission. The listed person approves the final public text before publication. Replies stay in the public issue or pull-request thread. No response time is promised.

## Availability

`conversationContact` is an optional boolean for a public route to discuss AI uplift. It does not mean spare capacity, free advice, or availability for paid work. Keep `availability` unchanged unless the person states a change. The directory highlights independent conversation contacts separately from organisation affiliations.

Use `available` only when the person takes work. Use `peer-exchange` when the person offers peer exchange without offering work.

Use `limited` for limited capacity, `unavailable` when the person does not take work, and `unknown` when the person did not state availability.

Use the optional `availabilityNote` for person-approved wording that adds useful detail. Use `null` when the standard availability label is sufficient.

## Directory grouping

`causeAreas` is an optional list of one to four controlled area IDs. These are editorial navigation groups, not claims of endorsement or exclusive allegiance. Some groups describe a function, such as research or grantmaking. A person can appear in several relevant groups, while the directory counts unique people. Missing values fall into `other` so a new contribution never disappears.

The controlled labels and source rationale are in [Directory groups](DIRECTORY.md). `directorySources` records one to six direct public HTTPS sources for a classification or conversation route. Builds validate these URLs without fetching them.

`networks` optionally contains `aim-charity` for an organisation incubated by AIM's Charity Entrepreneurship programme. It does not mean every connection to AIM. Do not infer membership from someone knowing a founder or attending an event.

For an independent practitioner who also holds a current contract, use `workMode: both`, the organisation name, and `organisationRelationship: contractor`. This displays an independent contractor label rather than an employee label. The person can appear within their organisation and within cross-cause independent practice.

## Optional links

`links` is an array of up to six public links. Each item has exactly:

| Field | Rules |
|---|---|
| `label` | One to 40 characters; plain text with no markup, hidden characters or placeholder tokens |
| `url` | A public HTTPS URL from 12 to 2,048 characters; no credentials, private hostnames, unsafe characters or encoded controls |

The validator rejects duplicate URLs within `links`. The renderer keeps the existing `site` link and then adds the optional links, skipping a duplicate of the site URL. `contact` remains the separate required route for getting in touch.

Example:

```json
"links": [
  { "label": "LinkedIn", "url": "https://www.linkedin.com/in/example" },
  { "label": "Website", "url": "https://example.org" }
]
```

For a person-approved profile, add only links that the person approved. For a public-source draft, use only direct links from the person's site or an organisation's staff page. Do not add a provisional profile or links for another person unless you maintain this directory.

## Optional profile detail

Use `workLocation` for a public description of where the person works. Use `availabilityDetail` for the work that they currently accept.

Use `contactEmail` only when the person explicitly approved publication of that email address. The profile still needs a public HTTPS `contact` route.

Use `bioSections` to divide a long biography into two to four approved sections. Each section has a `heading` and `text`. Keep the complete plain-text biography in `bio` for systems that do not use the sections.

## Publication basis

`publicationBasis` is optional for existing approved records. Omission means `person-approved`.

Use `person-approved` for a self-submitted or approved profile. Listing, copy, and applicable photo consent must be true under policy `r0-v1`.

Only the maintainer can use `public-sources-pending-review`. Listing, copy, and photo consent must remain false under policy `r0-v2`. The generated card and profile page state that the record is a public-source draft.
