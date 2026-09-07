## What changed?

<!-- State the public change. Do not include private details. -->

## Profile submission checklist

Complete this section when adding or changing a profile or portrait.

- [ ] I am the named person, I have their approval, or I am the maintainer adding a labelled public-source draft.
- [ ] The profile contains only approved facts or facts from the direct public sources named in the pull request.
- [ ] Any contact route is approved or comes directly from the person's public site.
- [ ] Any portrait is approved or is a public profile image on a labelled draft.
- [ ] The consent records and `publicationBasis` state the profile's real review status.
- [ ] I used one file at `data/people/<slug>.json` and did not edit another person's profile.

## Quality checklist

- [ ] I ran `node qc/verify-release0.mjs` successfully, or I used the web editor and understand that CI must pass.
- [ ] I did not commit `dist/`, private notes, interview material, credentials, or disputed images.
- [ ] I did not add URL fetching, deployment, previews, secrets, or `pull_request_target` automation.
- [ ] I read [the listing policy](https://github.com/alex-is-learning/ea-ai-uplift/blob/main/docs/LISTING-POLICY.md) and agree to follow it.
