export const id = 'case-studies';
export const navLabel = 'Case studies';

export const css = `
.case-empty{margin-top:30px; max-width:64ch; padding:22px 24px 24px; border:1.5px solid var(--ink); background:var(--paper-2); box-shadow:7px -6px 0 -1px rgba(232,84,31,.35)}
.case-empty h2{font-size:21px}
.case-empty p{margin-top:9px; color:var(--ink-2)}
.case-actions{display:flex; flex-wrap:wrap; gap:14px; align-items:center; margin-top:24px}
.case-actions .cta{margin-top:0}
.case-method-note{margin-top:24px; max-width:64ch; padding:18px 20px; border-left:4px solid var(--cobalt); background:rgba(18,51,204,.06)}
.case-method-note h2{font-size:19px}
.case-method-note p{margin-top:8px; color:var(--ink-2)}
.case-process{margin-top:24px; max-width:64ch; color:var(--ink-2)}
`;

export function load() {
  return { items: [], errors: [] };
}

export function section() {
  return '';
}

export function pages(ctx) {
  const render = ctx.renderPage ?? (() => '');
  const site = ctx.site;
  const prefix = '../';
  const body = `  <section class="sub-page" aria-labelledby="case-studies-h1">
    <div class="wrap">
      <a class="back-link" href="../">&larr; Home</a>
      <p class="legend">Work and evidence</p>
      <h1 id="case-studies-h1">Case studies</h1>
      <p class="lede">Accounts of completed work will appear here when the situation, work, evidence and limits can be published with approval.</p>
      <div class="case-empty">
        <h2>No case studies published yet</h2>
        <p>No client outcome evidence is published here yet. Future entries will state what changed, what supports it, and what the work did not establish.</p>
      </div>
      <div class="case-method-note">
        <h2>Worked examples are different</h2>
        <p>A worked example shows a method with fictional input and a checked output. It does not show a client outcome.</p>
      </div>
      <div class="case-actions">
        <a class="cta" href="${ctx.escAttr(site.caseStudyProposalUrl)}" rel="noopener">Propose a case study &rarr;</a>
        <a class="more" href="${ctx.escAttr(site.interviewUrl)}" rel="noopener">Talk to Alexander about an interview &rarr;</a>
      </div>
      <p class="case-process">The GitHub proposal is public. A maintainer reviews it and replies in the issue. A proposal is not publication approval, and no response time is promised.</p>
    </div>
  </section>`;
  return [{
    path: 'case-studies/index.html',
    html: render({
      title: 'Case studies — EA AI Uplift',
      description: 'Evidence status and contribution routes for future accounts of completed AI uplift work.',
      canonical: 'https://eaaiuplift.com/case-studies/',
      prefix,
      css: ctx.sectionCss ?? '',
      body,
    }),
  }];
}
