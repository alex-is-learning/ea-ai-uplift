# EA AI Uplift

EA AI Uplift lists people, requests for help, assessments and practical resources for the effective altruist ecosystem. A listing reports work that a person has approved. It is not an endorsement, certification, employer, team, or official definition of the work.

The public repository is deliberately separate from the private working repository. It contains only public-safe source, approved directory material, and the checks needed to review contributions.

## Site pages

The home page is a short navigation menu. Keep full content on its destination page.

| Page | Route |
|---|---|
| People | `/people/` |
| Request help | `/asks/` |
| Assess your skills | `/assess/`, with organisation mode at `/assess/org/` |
| Guides | `/guides/` |
| Case studies | `/case-studies/` |

The starting-point map and detailed guidance live at `/start/`. Guides links to this page and the learn pathway. People links to hiring guidance and offers. The footer links the maintainer credit to Alexander’s website and links to this GitHub repository. The home has one main menu; section pages also have header navigation. Old home bookmarks redirect to the relevant destination. Case studies remain an empty state until approved material exists.

`build.mjs` generates all pages. `lib/page.mjs` owns the shared navigation, page shell and styles. The output checks cover destination pages, same-site link fragments, profile affiliations and the compact home layout.

## Add a profile

Use one file for one person. Fork this repository, copy `data/people/_template.json` to `data/people/<your-slug>.json`, complete only your own approved public information, and open a pull request.

Before opening the pull request:

1. Read [the listing policy](docs/LISTING-POLICY.md).
2. Use only public HTTPS links.
3. Add a square portrait only when you own the rights or have explicit permission. Supply `img/<your-slug>.jpg` and `img/<your-slug>-960.jpg`.
4. Run `node qc/verify-release0.mjs` from the repository root. This validates data, builds to the untracked `dist/` directory, and runs the local render checks. It does not fetch submitted URLs.
5. Complete every consent item in the pull-request checklist.

You can also use the [Add yourself issue form](https://github.com/alex-is-learning/ea-ai-uplift/issues/new?template=add-profile.yml) if Git is not practical. Do not put private contact details, documents, or unpublished facts in an issue. A maintainer will prepare a pull request, and your approval is still required before publication.

For a correction or removal, use the [correction form](https://github.com/alex-is-learning/ea-ai-uplift/issues/new?template=correction.yml) or [removal form](https://github.com/alex-is-learning/ea-ai-uplift/issues/new?template=removal.yml). For a security concern, follow [SECURITY.md](SECURITY.md).

## Local checks

The check needs a current Node.js release, Chromium or Chrome, and `djpeg` from libjpeg-turbo. On macOS, install `jpeg-turbo` with Homebrew. On Ubuntu, install `libjpeg-turbo-progs`.

Run:

    node qc/verify-release0.mjs

Do not commit `dist/`. It is reproducible build output. The pull-request workflow, `.github/workflows/release0-quality.yml`, runs the same stable `Release 0 quality` check on Linux with Chromium, with read-only permissions and no secrets, deployment, previews, or uploaded artifacts.

## Contributing and publication

Read [CONTRIBUTING.md](CONTRIBUTING.md) before changing source or content. The detailed moderation rules are in [docs/LISTING-POLICY.md](docs/LISTING-POLICY.md). Publication is a manual maintainer action after a reviewed pull request; continuous integration never deploys the site.

## Licence

The software is available under the [MIT License](LICENSE). Original guides and case studies that are marked as licensed are available under [CC BY 4.0](LICENSE-CONTENT). Directory profiles, biographies, names, contact details, and photographs are excluded unless their contributor separately grants a licence. See [NOTICE.md](NOTICE.md).
