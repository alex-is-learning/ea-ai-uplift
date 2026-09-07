# Directory listing policy

## Purpose and boundary

EA AI Uplift is an independent directory of people who report relevant AI uplift work in the effective altruism community. A listing is not an endorsement, certification, employment relationship, team membership, collective membership, or official definition of the work.

The directory does not use Slack membership, an interview, or a third-party claim as evidence for a profile. It does not infer a person's role, employer, availability, contact route, or capability.

## Who can be listed

The default route is self-submission. A person can submit their own profile through a pull request or the Add yourself issue form.

A maintainer can also publish a provisional profile from direct public sources. The profile must say that it is a public-source draft and has not received the person's review. The maintainer must invite corrections or removal after publication. A request to remove or correct a profile takes priority over directory completeness.

Each profile must use one file: `data/people/<slug>.json`. This makes it possible to update or remove one listing without changing another person's record.

## Information and consent

For an approved profile, publish only facts that the named person approved. For a public-source draft, publish only direct facts from the person's site or an organisation's staff page. Keep claims specific and supportable. Use the controlled work-mode, capability, and availability values defined by the schema.

The directory displays `Independent` for independent people. It displays the recorded organisation name for `in-house` and `both` profiles.

Public links must use HTTPS. Never store private email addresses, phone numbers, home addresses, private or unapproved calendar links, interview notes, or private account data.

For an approved portrait, the contributor must confirm that they own the rights or have permission to publish it. A provisional profile can use the person's public profile image while review is pending. Remove it immediately if the person or rights holder objects. The files must be square derivatives at `img/<slug>.jpg` and `img/<slug>-960.jpg`, with metadata removed.

`publicationBasis` records whether the person approved the profile or whether direct public sources support a provisional profile. Consent fields remain false for a provisional profile. They must never imply consent that the person did not give.

## Review and moderation

Before merge, a maintainer checks:

- the profile is self-submitted, person-approved, or a clearly labelled public-source draft;
- public claims, contact details, and organisation references are accurate and directly supported;
- the profile, image paths, and consent fields pass `node qc/verify-release0.mjs`;
- an approved portrait has clear rights, or a provisional portrait is a public profile image pending review; and
- the submission is relevant, non-promotional, and does not contain copied or unsafe material.

A maintainer can reject or request changes for unsupported claims, unsafe links, copied text, disputed photos, irrelevant submissions, promotional spam, or invalid data. Review is moderation of the public directory, not a statement about a contributor's professional ability.

## Corrections, removals, and disputes

Anyone can request a correction or removal of their own listing through the public issue forms. Do not include sensitive data in a public issue. Where a request identifies disputed personal data, maintainers will remove that data from the live site while they check it.

For an urgent or sensitive concern, use the private route in [SECURITY.md](../SECURITY.md). A removal request does not grant permission to retain or republish the removed material.

## Reuse

Profiles and photographs are excluded from the repository's general licences unless the contributor separately grants reuse rights. Original guides and case studies marked as such use CC BY 4.0. Software uses MIT. See [NOTICE.md](../NOTICE.md).
