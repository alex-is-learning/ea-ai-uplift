# Directory listing policy

## Purpose and boundary

EA AI Uplift is an independent directory of people who report relevant AI uplift work in the effective altruism community. A listing is not an endorsement, certification, employment relationship, team membership, collective membership, or official definition of the work.

The directory does not use Slack membership, a website, an interview, or a third-party claim as permission to publish a profile. It does not infer a person's role, employer, availability, contact route, or capability.

## Who can be listed

The default route is self-submission. A person can submit their own profile through a pull request or the Add yourself issue form. A maintainer can draft a profile after an interview or another conversation, but the named person must approve the final public text, contact route, and photo before publication.

Each profile must use one file: `data/people/<slug>.json`. This makes it possible to update or remove one listing without changing another person's record.

## Information and consent

Publish only facts that the named person has approved as public. Keep claims specific and supportable. Use the controlled work-mode, capability, and availability values defined by the schema.

Public links must use HTTPS. Never store private email addresses, phone numbers, home addresses, private or unapproved calendar links, interview notes, or private account data.

For a portrait, the contributor must confirm that they own the rights or have explicit permission to publish it. The submitted files must be square derivatives at `img/<slug>.jpg` and `img/<slug>-960.jpg`, with metadata removed. Profile consent, copy approval, and photo approval are separate records; all applicable records need a consent date and current policy version.

## Review and moderation

Before merge, a maintainer checks:

- the profile is self-submitted or has the named person's recorded approval;
- public claims, contact details, and organisation references are accurate and approved;
- the profile, image paths, and consent fields pass `node qc/verify-release0.mjs`;
- the portrait rights and consent are clear; and
- the submission is relevant, non-promotional, and does not contain copied or unsafe material.

A maintainer can reject or request changes for unsupported claims, unsafe links, copied text, unapproved photos, irrelevant submissions, promotional spam, invalid data, or missing consent. Review is moderation of the public directory, not a statement about a contributor's professional ability.

## Corrections, removals, and disputes

Anyone can request a correction or removal of their own listing through the public issue forms. Do not include sensitive data in a public issue. Where a request identifies disputed personal data, maintainers will remove that data from the live site while they check it.

For an urgent or sensitive concern, use the private route in [SECURITY.md](../SECURITY.md). A removal request does not grant permission to retain or republish the removed material.

## Reuse

Profiles and photographs are excluded from the repository's general licences unless the contributor separately grants reuse rights. Original guides and case studies marked as such use CC BY 4.0. Software uses MIT. See [NOTICE.md](../NOTICE.md).
