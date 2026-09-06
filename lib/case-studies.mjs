export const id = 'case-studies';
export const navLabel = 'Case studies';

export const css = `
.case-empty{margin-top:30px; max-width:64ch; padding:22px 24px 24px; border:1.5px solid var(--ink); background:var(--paper-2); box-shadow:7px -6px 0 -1px rgba(232,84,31,.35)}
.case-empty h2{font-size:21px}
.case-empty p{margin-top:9px; color:var(--ink-2)}
.case-actions{display:flex; flex-wrap:wrap; gap:14px; align-items:center; margin-top:24px}
.case-actions .cta{margin-top:0}
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
      <p class="lede">Accounts of completed work will appear here when the situation, work, evidence and limits can be published.</p>
      <div class="case-empty">
        <h2>No case studies published yet</h2>
        <p>Future entries will state what changed, what evidence supports it, and what cannot be attributed to the work.</p>
      </div>
      <div class="case-actions">
        <a class="cta" href="${ctx.escAttr(site.caseStudyProposalUrl)}">Propose a case study &rarr;</a>
        <a class="more" href="${ctx.escAttr(site.interviewUrl)}">Talk to Alexander about an interview &rarr;</a>
      </div>
    </div>
  </section>`;
  return [{
    path: 'case-studies/index.html',
    html: render({
      title: 'Case studies — EA AI Uplift',
      description: 'Documented AI uplift work, with the situation, work, evidence and limits stated clearly.',
      canonical: 'https://eaaiuplift.com/case-studies/',
      prefix,
      css: ctx.sectionCss ?? '',
      body,
    }),
  }];
}
