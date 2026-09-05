import { loadCollection, exactKeys, safeText, isDate, isFutureDate, validateHttpsUrl } from './data.mjs';
import { validateBlocks, renderBlocks } from './blocks.mjs';

export const id = 'guides';
export const navLabel = 'Guides';

const FIELDS = ['slug', 'title', 'what', 'why', 'stage', 'status', 'links', 'checked'];
const STAGES = ['start', 'next', 'advanced'];
const STAGE_LABEL = { start: 'Start here', next: 'Next', advanced: 'Advanced' };
const STATUSES = ['index-only', 'guide-planned', 'external', 'local'];
const PAGE_FIELDS = ['slug', 'summary', 'version', 'written', 'blocks'];
const CONTRIBUTING_URL = 'https://github.com/alex-is-learning/ea-ai-uplift/blob/main/CONTRIBUTING.md';
// guide pages joined to their index entries by slug; filled by load()
let pagesBySlug = new Map();
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const PROPOSE_URL = 'https://github.com/alex-is-learning/ea-ai-uplift/blob/main/docs/GUIDES.md';

export const css = `
/* ---------------- guides: the index ---------------- */
.guide-groups{margin:34px 0 0; max-width:74ch}
.guide-stage{display:flex; align-items:baseline; gap:12px; margin:40px 0 0;
  font-family:var(--display); font-size:12px; font-weight:700; letter-spacing:.17em;
  text-transform:uppercase; color:var(--tang-ink)}
.guide-stage:first-child{margin-top:0}
.guide-stage .n{font-family:var(--hand); font-weight:700; font-size:30px; line-height:.8;
  letter-spacing:0; color:var(--tang); mix-blend-mode:multiply}
.guide-list{margin:12px 0 0; padding:0; list-style:none}
.guide-row{display:grid; grid-template-columns:minmax(0,240px) minmax(0,1fr); gap:8px 32px;
  align-items:start; padding:20px 0 22px; border-top:1.5px dotted var(--tang)}
.guide-list li:last-child{border-bottom:1.5px dotted var(--tang)}
.guide-row h3{font-size:19px}
.guide-planned{display:inline-block; margin-top:9px; font-family:var(--display); font-size:11px;
  font-weight:800; letter-spacing:.14em; text-transform:uppercase; color:var(--cobalt-deep);
  border:1.5px solid var(--cobalt); padding:2px 7px;
  box-shadow:2px -2px 0 -0.5px rgba(232,84,31,.85)}
.guide-what{font-size:16.5px; line-height:1.5}
.guide-why{margin-top:6px; font-size:15.5px; line-height:1.5; color:var(--ink-2)}
.guide-links{margin-top:10px; font-family:var(--display); font-weight:600; font-size:14.5px;
  line-height:1.7}
.guide-links a{text-decoration:none; color:var(--cobalt);
  box-shadow:inset 0 -2px 0 0 rgba(18,51,204,.35); white-space:nowrap}
.guide-links a:hover{color:var(--tang-ink); box-shadow:inset 0 -2px 0 0 var(--tang)}
.guide-links .sep{color:var(--ink-2); margin:0 8px; font-weight:400}
.guide-foot{margin-top:28px; font-size:15.5px; color:var(--ink-2); max-width:74ch}
.guide-foot + .guide-foot{margin-top:6px}
@media (max-width:860px){
  .guide-row{grid-template-columns:minmax(0,1fr); gap:6px 0}
  .guide-what{margin-top:4px}
}
.guide-key h3 a{color:var(--ink); text-decoration:none; box-shadow:inset 0 -2px 0 0 var(--cobalt)}
.guide-key h3 a:hover{color:var(--tang-ink); box-shadow:inset 0 -2px 0 0 var(--tang)}
.guide-read{display:inline-block; margin-top:9px; font-family:var(--display); font-size:14.5px; font-weight:700;
  color:var(--cobalt); text-decoration:none; box-shadow:inset 0 -2.5px 0 0 var(--cobalt)}
.guide-read:hover{color:var(--tang-ink); box-shadow:inset 0 -2.5px 0 0 var(--tang)}
@media (max-width:390px){
  .guide-links a{white-space:normal}
  .guide-links .sep{margin:0 6px}
}

/* ---------------- a guide's own page ---------------- */
.guide-page{padding:44px 0 74px}
.guide-page .wrap{max-width:900px}
.guide-page h1{font-size:clamp(32px,4.4vw,52px); max-width:20ch}
.guide-lede{margin-top:22px; font-size:clamp(18px,1.6vw,21px); line-height:1.45;
  font-family:var(--display); font-weight:500; letter-spacing:-0.015em; max-width:50ch}
.guide-page .prose{margin-top:34px}
.guide-sources{margin-top:40px; padding-top:24px; border-top:1.5px dotted var(--tang); max-width:66ch}
.guide-sources .label{margin-bottom:8px}
.guide-written{margin-top:26px; font-family:var(--display); font-size:11.5px; font-weight:700;
  letter-spacing:.15em; text-transform:uppercase; color:var(--ink-2)}
@media (max-width:620px){ .guide-page{padding:34px 0 56px} }
`;

function validateItem(item, fileName, errors) {
  exactKeys(item, FIELDS, fileName, errors);
  safeText(item.title, `${fileName}: title`, errors, { min: 3, max: 70 });
  safeText(item.what, `${fileName}: what`, errors, { min: 20, max: 200 });
  safeText(item.why, `${fileName}: why`, errors, { min: 20, max: 240 });
  if (!STAGES.includes(item.stage)) errors.push(`${fileName}: stage must be one of ${STAGES.join(', ')}`);
  if (!STATUSES.includes(item.status)) errors.push(`${fileName}: status must be one of ${STATUSES.join(', ')}`);
  if (!Array.isArray(item.links) || item.links.length < 1 || item.links.length > 3) {
    errors.push(`${fileName}: links must be a list of 1 to 3 entries`);
  } else {
    const seen = new Set();
    item.links.forEach((link, index) => {
      const label = `${fileName}: links[${index}]`;
      if (!exactKeys(link, ['label', 'url'], label, errors)) return;
      safeText(link.label, `${label}.label`, errors, { min: 3, max: 80 });
      validateHttpsUrl(link.url, `${label}.url`, errors);
      if (typeof link.url === 'string') {
        if (seen.has(link.url)) errors.push(`${fileName}: duplicate link URL ${link.url}`);
        seen.add(link.url);
      }
    });
  }
  if (!isDate(item.checked)) errors.push(`${fileName}: checked must be an ISO date`);
  else if (isFutureDate(item.checked)) errors.push(`${fileName}: checked must not be in the future`);
}

function validatePage(item, fileName, errors) {
  exactKeys(item, PAGE_FIELDS, fileName, errors);
  safeText(item.summary, `${fileName}: summary`, errors, { min: 20, max: 200 });
  if (item.version !== '0.1') errors.push(`${fileName}: version must be exactly 0.1`);
  if (!isDate(item.written)) errors.push(`${fileName}: written must be an ISO date`);
  else if (isFutureDate(item.written)) errors.push(`${fileName}: written must not be in the future`);
  validateBlocks(item.blocks, `${fileName}: blocks`, errors, { min: 6, max: 60 });
}

export function load(root) {
  const entries = loadCollection(root, id, validateItem);
  const pages = loadCollection(root, 'guide-pages', validatePage);
  const errors = [...entries.errors, ...pages.errors];
  const bySlug = new Map(entries.items.map((item) => [item.slug, item]));
  pagesBySlug = new Map();
  for (const page of pages.items) {
    const entry = bySlug.get(page.slug);
    if (!entry) errors.push(`data/guide-pages/${page.slug}.json has no index entry in data/guides with status local`);
    else if (entry.status !== 'local') errors.push(`data/guide-pages/${page.slug}.json: data/guides/${page.slug}.json must have status local`);
    pagesBySlug.set(page.slug, page);
  }
  for (const entry of entries.items) {
    if (entry.status === 'local' && !pagesBySlug.has(entry.slug)) errors.push(`data/guides/${entry.slug}.json has status local but data/guide-pages/${entry.slug}.json is missing`);
  }
  return { items: entries.items, errors };
}

function longDate(iso) {
  const [year, month, day] = iso.split('-').map(Number);
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

function row(item, esc, escAttr) {
  const links = item.links
    .map((link) => `<a href="${escAttr(link.url)}" rel="noopener">${esc(link.label)}&nbsp;&#8599;</a>`)
    .join('<span class="sep" aria-hidden="true">&middot;</span>');
  const local = item.status === 'local';
  const mark = item.status === 'guide-planned'
    ? `\n            <span class="guide-planned">Guide planned</span>`
    : local ? `\n            <a class="guide-read" href="guides/${escAttr(item.slug)}/">Read the guide &rarr;</a>` : '';
  const title = local ? `<a href="guides/${escAttr(item.slug)}/">${esc(item.title)}</a>` : esc(item.title);
  return `        <li class="guide-row">
          <div class="guide-key">
            <h3>${title}</h3>${mark}
          </div>
          <div class="guide-body">
            <p class="guide-what">${esc(item.what)}</p>
            <p class="guide-why">${esc(item.why)}</p>
            <p class="guide-links">${links}</p>
          </div>
        </li>`;
}

export function section({ items, esc, escAttr }) {
  if (!items.length) return '';
  const groups = STAGES.map((stage, index) => {
    const rows = items.filter((item) => item.stage === stage);
    if (!rows.length) return '';
    return `      <p class="guide-stage"><span class="n" aria-hidden="true">${index + 1}</span>${STAGE_LABEL[stage]}</p>
      <ul class="guide-list">
${rows.map((item) => row(item, esc, escAttr)).join('\n')}
      </ul>`;
  }).filter(Boolean).join('\n');
  const checked = items.map((item) => item.checked).sort().at(-1);
  return `  <!-- 08 guides -->
  <section id="guides" aria-labelledby="guides-title">
    <div class="wrap">
      <div class="sec-head">
        <p class="legend">Everything in one place</p>
        <h2 id="guides-title">Guides</h2>
        <p class="intro">An index, not a curriculum: what each thing is, why it matters, and where it sits on the route. The sub-guides get written as evidence from real work settles. Every link goes to a primary source.</p>
      </div>
      <div class="guide-groups">
${groups}
      </div>
      <p class="guide-foot">Links checked ${esc(longDate(checked))}.</p>
      <p class="guide-foot">Missing something? <a href="${escAttr(PROPOSE_URL)}" rel="noopener">Propose an entry through GitHub</a>.</p>
    </div>
  </section>`;
}

function guidePage(entry, page, ctx) {
  const { esc, escAttr } = ctx;
  const prefix = '../../';
  const sources = entry.links
    .map((link) => `  <li><a href="${escAttr(link.url)}" rel="noopener">${esc(link.label)}&nbsp;&#8599;</a></li>`)
    .join('\n');
  const body = `  <section class="guide-page">
    <div class="wrap">
      <a class="back-link" href="${prefix}#guides">&larr; All guides</a>
      <p class="legend">Guide &middot; version ${esc(page.version)}</p>
      <h1>${esc(entry.title)}</h1>
      <p class="guide-lede">${esc(entry.what)}</p>
      <div class="prose">
        <div class="aside"><p class="a-title">Version ${esc(page.version)}</p><p>Written from one practitioner's work, not yet tested with readers. Corrections and additions go through <a href="${CONTRIBUTING_URL}" rel="noopener">GitHub</a>.</p></div>
${renderBlocks(page.blocks, { esc, escAttr, prefix })}
      </div>
      <div class="guide-sources">
        <span class="label">Sources</span>
        <ul class="p-links">
${sources}
        </ul>
      </div>
      <p class="guide-written">Written ${esc(longDate(page.written))}</p>
    </div>
  </section>`;
  return ctx.renderPage({
    title: `${entry.title} — EA AI Uplift`,
    description: page.summary,
    canonical: `https://eaaiuplift.com/guides/${entry.slug}/`,
    prefix,
    nav: ctx.nav ?? '',
    css: ctx.sectionCss ?? '',
    body,
  });
}

// A guide page is generated at guides/<slug>/index.html for every index entry
// whose status is local. qc/check-output.mjs calls this without renderPage and
// only reads the paths.
export function pages(ctx) {
  const render = ctx.renderPage ? (entry, page) => guidePage(entry, page, ctx) : () => '';
  return ctx.items
    .filter((entry) => entry.status === 'local' && pagesBySlug.has(entry.slug))
    .map((entry) => ({ path: `guides/${entry.slug}/index.html`, html: render(entry, pagesBySlug.get(entry.slug)) }));
}
