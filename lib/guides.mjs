import { loadCollection, exactKeys, safeText, isDate, isFutureDate, validateHttpsUrl } from './data.mjs';

export const id = 'guides';
export const navLabel = 'Guides';

const FIELDS = ['slug', 'title', 'what', 'why', 'stage', 'status', 'links', 'checked'];
const STAGES = ['start', 'next', 'advanced'];
const STAGE_LABEL = { start: 'Start here', next: 'Next', advanced: 'Advanced' };
const STATUSES = ['index-only', 'guide-planned', 'external'];
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
@media (max-width:390px){
  .guide-links a{white-space:normal}
  .guide-links .sep{margin:0 6px}
}
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

export function load(root) {
  return loadCollection(root, id, validateItem);
}

function longDate(iso) {
  const [year, month, day] = iso.split('-').map(Number);
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

function row(item, esc, escAttr) {
  const links = item.links
    .map((link) => `<a href="${escAttr(link.url)}" rel="noopener">${esc(link.label)}&nbsp;&#8599;</a>`)
    .join('<span class="sep" aria-hidden="true">&middot;</span>');
  const planned = item.status === 'guide-planned' ? `\n            <span class="guide-planned">Guide planned</span>` : '';
  return `        <li class="guide-row">
          <div class="guide-key">
            <h3>${esc(item.title)}</h3>${planned}
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

// Sub-guides would be generated here as guides/<slug>/index.html. None in this release.
export function pages() {
  return [];
}
