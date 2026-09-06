# Profiles

Each person has one JSON file at `data/people/<slug>.json`. Existing profiles remain valid when the optional `links` field is absent.

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

Add a link only when the named person approves that exact public URL and label. Do not add links for another person.
