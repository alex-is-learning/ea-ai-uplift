## What changed?

<!-- State the public change. Do not include private details. -->

## Profile submission checklist

Complete this section when adding or changing a profile or portrait.

- [ ] I am the named person, or I have their explicit approval for this exact public submission.
- [ ] The profile contains only public facts the named person has approved.
- [ ] Any public contact route is intentional and approved.
- [ ] I have the right to publish each portrait, and the named person approves its use here.
- [ ] I recorded separate listing, copy, and photo consent where the schema requires them.
- [ ] I used one file at `data/people/<slug>.json` and did not edit another person's profile.

## Quality checklist

- [ ] I ran `node qc/verify-release0.mjs` successfully, or I used the web editor and understand that CI must pass.
- [ ] I did not commit `dist/`, private notes, interview material, credentials, or unapproved images.
- [ ] I did not add URL fetching, deployment, previews, secrets, or `pull_request_target` automation.
- [ ] I read [the listing policy](../docs/LISTING-POLICY.md) and agree to follow it.
