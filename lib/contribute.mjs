export const id = 'contribute';
export const navLabel = null;

const REPOSITORY = 'https://github.com/alex-is-learning/ea-ai-uplift';
const GUIDE_URL = `${REPOSITORY}/blob/main/CONTRIBUTING.md#content-contributions`;
const CORRECTION_URL = `${REPOSITORY}/issues/new?template=correction.yml`;
const REMOVAL_URL = `${REPOSITORY}/issues/new?template=removal.yml`;

export const css = `
.contribute-notes{display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:14px; margin-top:28px}
.contribute-note{padding:18px 20px; border:1.5px solid var(--ink); background:var(--paper-2)}
.contribute-note h2{font-size:18px}
.contribute-note p{margin-top:8px; color:var(--ink-2)}
.contribute-grid{display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:18px; margin:36px 0 0; padding:0; list-style:none}
.contribute-card{padding:22px 24px 24px; border-top:4px solid var(--cobalt); background:rgba(18,51,204,.055)}
.contribute-card:nth-child(2n){border-top-color:var(--tang); background:rgba(232,84,31,.055)}
.contribute-card h2{font-size:21px}
.contribute-card p{margin-top:10px; color:var(--ink-2)}
.contribute-card .more{display:inline-block; margin-top:16px; font-family:var(--display); font-weight:700}
.contribute-private{margin-top:30px; max-width:68ch; padding-top:22px; border-top:1.5px dotted var(--tang); color:var(--ink-2)}
@media (max-width:700px){
  .contribute-notes,.contribute-grid{grid-template-columns:minmax(0,1fr)}
}
@media (max-width:390px){
  .contribute-card{padding:19px 18px 21px}
}
`;

export function load() {
  return { items: [], errors: [] };
}

export function section() {
  return '';
}

function card({ title, text, reply, href, label, escAttr }) {
  return `        <li class="contribute-card">
          <h2>${title}</h2>
          <p>${text}</p>
          <p><strong>Reply route:</strong> ${reply}</p>
          <a class="more" href="${escAttr(href)}" rel="noopener">${label} &rarr;</a>
        </li>`;
}

export function pages(ctx) {
  const render = ctx.renderPage ?? (() => '');
  const { site, escAttr } = ctx;
  const prefix = '../';
  const routes = [
    {
      title: 'Add your profile',
      text: 'Open a public GitHub issue with public-ready facts. A maintainer prepares the listing, and you review the final public text before publication.',
      reply: 'The maintainer replies in the public issue.',
      href: site.addYourselfFormUrl,
      label: 'Add your profile',
    },
    {
      title: 'List an offer',
      text: 'Open a public GitHub issue with the offer facts. A maintainer checks its fit and facts before a listing can become public.',
      reply: 'The maintainer replies in the public issue.',
      href: site.offerFormUrl,
      label: 'List an offer',
    },
    {
      title: 'Propose a guide',
      text: 'Open a public pull request with the guide and its sources. A maintainer reviews the text before merge and publication.',
      reply: 'The maintainer replies in the public pull-request thread.',
      href: GUIDE_URL,
      label: 'Read the guide instructions',
    },
    {
      title: 'Propose a case study',
      text: 'Open a public GitHub issue with low-risk facts. A proposal is not publication approval, and named people approve the final case.',
      reply: 'The maintainer replies in the public issue.',
      href: site.caseStudyProposalUrl,
      label: 'Propose a case study',
    },
    {
      title: 'Correct a profile',
      text: 'Open a public GitHub issue with the exact public correction and a public source. Do not include sensitive information.',
      reply: 'The maintainer replies in the public issue.',
      href: CORRECTION_URL,
      label: 'Request a correction',
    },
    {
      title: 'Remove a profile or portrait',
      text: 'Open a public GitHub issue for a public-safe removal request. The maintainer reviews the requested scope.',
      reply: 'The maintainer replies in the public issue.',
      href: REMOVAL_URL,
      label: 'Request removal',
    },
  ];
  const body = `  <section class="sub-page" aria-labelledby="contribute-h1">
    <div class="wrap">
      <a class="back-link" href="${escAttr(prefix)}">&larr; Home</a>
      <p class="legend">Public contributions</p>
      <h1 id="contribute-h1">Contribute</h1>
      <p class="lede">Choose one route. Each route states what becomes public, who reviews it, and where a reply appears.</p>
      <div class="contribute-notes">
        <div class="contribute-note">
          <h2>Issue forms</h2>
          <p>Issue forms and their replies are public. Accepted content becomes part of the public repository after review.</p>
        </div>
        <div class="contribute-note">
          <h2>GitHub contributions</h2>
          <p>Issues and pull requests are public when you submit them. Review and replies happen in their public threads.</p>
        </div>
        <div class="contribute-note">
          <h2>Reply timing</h2>
          <p>No response time is promised. Website publication always follows maintainer review.</p>
        </div>
      </div>
      <ul class="contribute-grid">
${routes.map((route) => card({ ...route, escAttr })).join('\n')}
      </ul>
      <p class="contribute-private">For a security problem or sensitive personal data, do not use a public GitHub issue. Use the <a href="${escAttr(`${REPOSITORY}/security/advisories/new`)}" rel="noopener">private security route</a>.</p>
    </div>
  </section>`;
  return [{
    path: 'contribute/index.html',
    html: render({
      title: 'Contribute — EA AI Uplift',
      description: 'Add a profile, offer, guide or case study, or request a correction or removal.',
      canonical: 'https://eaaiuplift.com/contribute/',
      prefix,
      css: ctx.sectionCss ?? '',
      body,
    }),
  }];
}
