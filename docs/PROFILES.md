# Profiles

Each person has one JSON file at `data/people/<slug>.json`. Existing profiles remain valid when the optional `links` field is absent.

Use the public Add yourself issue form for a maintainer-assisted submission, or open a public pull request. A maintainer reviews each submission. The listed person approves the final public text before publication. Replies stay in the public issue or pull-request thread. No response time is promised.

## Availability

Use `available` only when the person takes work. Use `peer-exchange` when the person offers peer exchange without offering work.

Use `limited` for limited capacity, `unavailable` when the person does not take work, and `unknown` when the person did not state availability.

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

## Publication basis

`publicationBasis` is optional for existing approved records. Omission means `person-approved`.

Use `person-approved` for a self-submitted or approved profile. Listing, copy, and applicable photo consent must be true under policy `r0-v1`.

Only the maintainer can use `public-sources-pending-review`. Listing, copy, and photo consent must remain false under policy `r0-v2`. The generated card and profile page state that the record is a public-source draft.
