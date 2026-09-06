import { loadCollection, exactKeys, safeText, isDate, isFutureDate, validateHttpsUrl } from './data.mjs';

export const id = 'offers';
export const navLabel = 'Offers';

export const FIELDS = ['slug', 'name', 'by', 'providerType', 'kind', 'summary', 'detail', 'url', 'access', 'audience', 'displayGroup', 'listed', 'checked'];
export const KINDS = ['course', 'tool', 'cohort', 'product', 'programme', 'community', 'call'];
export const ACCESS = ['open', 'invite-only', 'application', 'discount', 'free'];
export const AUDIENCE = ['organisations', 'individuals', 'both'];
export const PROVIDER_TYPES = ['person', 'organisation'];
export const DISPLAY_GROUPS = ['personal', 'nonprofit-discount', 'course'];
const CURRENCY = /[£$€¥]/u;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const css = `
/* ---------------- offers ---------------- */
.offer-group{margin-top:38px}
.offer-group + .offer-group{padding-top:34px; border-top:1.5px dotted var(--tang)}
.offer-group-head{display:flex; align-items:baseline; justify-content:space-between; gap:18px; max-width:74ch}
.offer-group-head h2{font-size:clamp(22px,2.6vw,29px)}
.offer-group-head p{font-size:14.5px; color:var(--ink-2); text-align:right}
.offer-cards{grid-template-columns:repeat(2,minmax(0,1fr)); margin-top:20px}
.offer-group-personal .offer-cards{grid-template-columns:minmax(0,1fr); max-width:620px}
.offer-card h3 a{color:var(--ink); text-decoration:none; box-shadow:inset 0 -2px 0 0 var(--cobalt)}
.offer-card h3 a:hover{color:var(--tang-ink); box-shadow:inset 0 -2px 0 0 var(--tang)}
.offer-card .offer-by{font-family:var(--display); font-weight:600; font-size:15px; color:var(--ink); margin-bottom:10px}
.offer-card .offer-detail{margin-top:8px}
.offer-card .offer-checked{margin-top:16px; font-family:var(--display); font-size:11.5px; font-weight:700;
  letter-spacing:.12em; text-transform:uppercase; color:var(--ink-2)}
.offer-rules{margin-top:22px; font-size:16px; color:var(--ink-2); max-width:64ch}
.offer-rows{margin:22px 0 0; padding:0; list-style:none; display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:0 40px}
.offer-row{display:flex; flex-direction:column; gap:2px; padding:9px 0; border-top:1.5px dotted var(--tang)}
.offer-row-name{font-family:var(--display); font-weight:700; font-size:16px; color:var(--ink); text-decoration:none;
  box-shadow:inset 0 -2px 0 0 rgba(18,51,204,.35); align-self:flex-start}
.offer-row-name:hover{color:var(--tang-ink); box-shadow:inset 0 -2px 0 0 var(--tang)}
.offer-row-meta{font-size:13.5px; color:var(--ink-2)}
.offer-discount-table{width:100%; margin-top:18px; border-collapse:collapse; border-top:1.5px solid var(--ink); font-size:14px}
.offer-discount-table th,.offer-discount-table td{padding:12px 14px 13px 0; border-bottom:1.5px dotted var(--tang); text-align:left; vertical-align:top}
.offer-discount-table thead th{padding-top:0; font-family:var(--display); font-size:10.5px; font-weight:800; letter-spacing:.12em; text-transform:uppercase; color:var(--ink-2)}
.offer-discount-table tbody th{font-family:var(--display); font-size:15px}
.offer-discount-table a{color:var(--cobalt); font-family:var(--display); font-weight:700; text-decoration:none; box-shadow:inset 0 -2px 0 0 rgba(18,51,204,.35)}
.offer-discount-table a:hover{color:var(--tang-ink); box-shadow:inset 0 -2px 0 0 var(--tang)}
.offer-discount-checked{white-space:nowrap; color:var(--ink-2)}
.offer-courses{margin:18px 0 0; padding:0; list-style:none; border-top:1.5px solid var(--ink)}
.offer-course{display:grid; grid-template-columns:minmax(170px,220px) minmax(0,1fr) auto; gap:12px 24px;
  align-items:baseline; padding:14px 0; border-bottom:1.5px dotted var(--tang)}
.offer-course h3{font-size:17px}
.offer-course h3 a{color:var(--ink); text-decoration:none; box-shadow:inset 0 -2px 0 0 var(--cobalt)}
.offer-course h3 a:hover{color:var(--tang-ink); box-shadow:inset 0 -2px 0 0 var(--tang)}
.offer-course .offer-by{margin:3px 0 0; font-size:13.5px; color:var(--ink-2)}
.offer-course .offer-summary{font-size:14.5px; line-height:1.45; color:var(--ink-2)}
.offer-course-meta{font-family:var(--display); font-size:11px; font-weight:700; letter-spacing:.08em;
  text-transform:uppercase; color:var(--ink-2); white-space:nowrap}
@media (max-width:620px){ .offer-rows{grid-template-columns:minmax(0,1fr)} }
@media (max-width:860px){
  .offer-cards{grid-template-columns:minmax(0,1fr)}
  .offer-course{grid-template-columns:minmax(0,1fr); gap:4px}
  .offer-course-meta{margin-top:5px; white-space:normal}
}
@media (max-width:620px){
  .offer-group{margin-top:30px}
  .offer-group + .offer-group{padding-top:28px}
  .offer-group-head{display:block}
  .offer-group-head p{margin-top:5px; text-align:left}
  .offer-discount-table{display:block; border-top:0}
  .offer-discount-table thead{position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap}
  .offer-discount-table tbody,.offer-discount-table tr{display:block}
  .offer-discount-table tr{padding:12px 0 3px; border-top:1.5px dotted var(--tang)}
  .offer-discount-table tr:last-child{border-bottom:1.5px dotted var(--tang)}
  .offer-discount-table th,.offer-discount-table td{display:grid; grid-template-columns:5.3rem minmax(0,1fr); gap:10px; padding:0 0 9px; border:0}
  .offer-discount-table th::before,.offer-discount-table td::before{content:attr(data-label); font-family:var(--display); font-size:10px; font-weight:800; letter-spacing:.12em; text-transform:uppercase; color:var(--ink-2)}
  .offer-discount-checked{white-space:normal}
}
`;

function validateItem(item, file, errors) {
  if (!exactKeys(item, FIELDS, file, errors)) return;
  safeText(item.name, `${file}: name`, errors, { min: 2, max: 80 });
  safeText(item.by, `${file}: by`, errors, { min: 2, max: 100 });
  if (!PROVIDER_TYPES.includes(item.providerType)) errors.push(`${file}: providerType is invalid (${PROVIDER_TYPES.join(', ')})`);
  if (!DISPLAY_GROUPS.includes(item.displayGroup)) errors.push(`${file}: displayGroup is invalid (${DISPLAY_GROUPS.join(', ')})`);
  safeText(item.summary, `${file}: summary`, errors, { min: 20, max: 200 });
  if (typeof item.detail !== 'string') errors.push(`${file}: detail must be a string (empty when there is none)`);
  else if (item.detail !== '') safeText(item.detail, `${file}: detail`, errors, { min: 1, max: 500 });
  for (const field of ['name', 'by', 'summary', 'detail']) {
    if (typeof item[field] === 'string' && CURRENCY.test(item[field])) errors.push(`${file}: ${field} must not contain a currency sign`);
  }
  if (!KINDS.includes(item.kind)) errors.push(`${file}: kind is invalid (${KINDS.join(', ')})`);
  if (!ACCESS.includes(item.access)) errors.push(`${file}: access is invalid (${ACCESS.join(', ')})`);
  if (!AUDIENCE.includes(item.audience)) errors.push(`${file}: audience is invalid (${AUDIENCE.join(', ')})`);
  validateHttpsUrl(item.url, `${file}: url`, errors);
  for (const field of ['listed', 'checked']) {
    if (!isDate(item[field])) errors.push(`${file}: ${field} must be an ISO date (YYYY-MM-DD)`);
    else if (isFutureDate(item[field])) errors.push(`${file}: ${field} must not be in the future`);
  }
  if (isDate(item.listed) && isDate(item.checked) && item.checked < item.listed) errors.push(`${file}: checked must not be before listed`);
}

export function load(root) {
  const loaded = loadCollection(root, id, validateItem);
  // alphabetical by name, then slug — locale-independent, so nobody is first
  loaded.items.sort((a, b) => {
    const na = String(a.name).toLowerCase();
    const nb = String(b.name).toLowerCase();
    if (na !== nb) return na < nb ? -1 : 1;
    if (a.name !== b.name) return a.name < b.name ? -1 : 1;
    return a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0;
  });
  return loaded;
}

const word = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const AUDIENCE_WORD = { organisations: 'Organisations', individuals: 'Individuals', both: 'Anyone' };
const ACCESS_WORD = { open: 'Open', 'invite-only': 'Invite only', application: 'Application', discount: 'Discount', free: 'Free' };

function longDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./u, '');
  } catch {
    return '';
  }
}

function card(o, esc, escAttr) {
  const detail = o.detail ? `\n          <p class="offer-detail">${esc(o.detail)}</p>` : '';
  const access = o.kind === 'call' ? 'Book a call' : ACCESS_WORD[o.access];
  return `        <li class="card offer-card" data-offer="${escAttr(o.slug)}">
          <span class="cno offer-tags">${esc(word(o.kind))} &middot; ${esc(access)} &middot; ${esc(AUDIENCE_WORD[o.audience])}</span>
          <h3><a href="${escAttr(o.url)}" rel="noopener">${esc(o.name)}</a></h3>
          <p class="offer-by">by ${esc(o.by)}</p>
          <p class="offer-summary">${esc(o.summary)}</p>${detail}
          <p class="offer-checked">Checked ${esc(longDate(o.checked))}</p>
        </li>`;
}

function courseRow(o, esc, escAttr) {
  return `        <li class="offer-course" data-offer="${escAttr(o.slug)}">
          <div>
            <h3><a href="${escAttr(o.url)}" rel="noopener">${esc(o.name)}</a></h3>
            <p class="offer-by">by ${esc(o.by)}</p>
          </div>
          <p class="offer-summary">${esc(o.summary)}</p>
          <p class="offer-course-meta">${esc(ACCESS_WORD[o.access])} &middot; ${esc(AUDIENCE_WORD[o.audience])} &middot; Checked ${esc(longDate(o.checked))}</p>
        </li>`;
}

function cardGroup({ className, title, description, items, esc, escAttr }) {
  if (!items.length) return '';
  return `      <section class="offer-group ${className}" aria-labelledby="${className}-title">
        <div class="offer-group-head">
          <h2 id="${className}-title">${esc(title)}</h2>
          <p>${esc(description)}</p>
        </div>
        <ul class="cards offer-cards">
${items.map((o) => card(o, esc, escAttr)).join('\n')}
        </ul>
      </section>`;
}

function teaser(o, esc, escAttr) {
  return `        <li class="offer-row">
          <a class="offer-row-name" href="${escAttr(o.url)}" rel="noopener">${esc(o.name)}</a>
          <span class="offer-row-meta">${esc(o.by)} &middot; ${esc(word(o.kind))} &middot; ${esc(AUDIENCE_WORD[o.audience])}</span>
        </li>`;
}

function nonprofitRow(o, esc, escAttr) {
  return `          <tr data-offer="${escAttr(o.slug)}">
            <th scope="row" data-label="Provider">${esc(o.by)}</th>
            <td data-label="Offer">${esc(o.name)}</td>
            <td data-label="Benefit">${esc(o.summary)}</td>
            <td data-label="Access"><a href="${escAttr(o.url)}" rel="noopener">${esc(ACCESS_WORD[o.access])}&nbsp;&#8599;</a></td>
            <td class="offer-discount-checked" data-label="Checked"><time datetime="${escAttr(o.checked)}">${esc(longDate(o.checked))}</time></td>
          </tr>`;
}

function nonprofitGroup({ items, esc, escAttr }) {
  if (!items.length) return '';
  return `      <section class="offer-group offer-group-nonprofit-discount" aria-labelledby="offer-group-nonprofit-discount-title">
        <div class="offer-group-head">
          <h2 id="offer-group-nonprofit-discount-title">Nonprofit discounts</h2>
          <p>Eligible nonprofits can receive free or reduced-cost access; products and eligibility vary.</p>
        </div>
        <table class="offer-discount-table">
          <thead>
            <tr><th scope="col">Provider</th><th scope="col">Offer</th><th scope="col">Benefit</th><th scope="col">Access</th><th scope="col">Checked</th></tr>
          </thead>
          <tbody>
${items.map((o) => nonprofitRow(o, esc, escAttr)).join('\n')}
          </tbody>
        </table>
      </section>`;
}

// The home page carries a name-per-line list; the cards, the form and the
// rules live at offers/.
export function section({ items, site, esc, escAttr }) {
  const list = items.length
    ? `
      <ul class="offer-rows">
${items.map((o) => teaser(o, esc, escAttr)).join('\n')}
      </ul>`
    : `
      <p class="cards-note">Nothing is listed yet.</p>`;
  return `  <!-- 06b offers -->
  <section id="offers" aria-labelledby="offers-title">
    <div class="wrap">
      <div class="sec-head">
        <p class="legend">Things on offer</p>
        <h2 id="offers-title">Offers</h2>
        <p class="intro">Calls, courses, tools and programmes that help this community use AI well. Hand-picked, not endorsed.</p>
      </div>${list}
      <p class="sec-links"><a class="more" href="offers/">All offers &rarr;</a><a class="more" href="${escAttr(site.offerFormUrl)}">List an offer &rarr;</a></p>
    </div>
  </section>`;
}

export function pages(ctx) {
  const { items, site, esc, escAttr } = ctx;
  const render = ctx.renderPage ?? (() => '');
  const prefix = '../';
  const grouped = Object.fromEntries(DISPLAY_GROUPS.map((group) => [group, items.filter((item) => item.displayGroup === group)]));
  const personal = grouped.personal;
  const nonprofitDiscounts = grouped['nonprofit-discount'];
  const courses = grouped.course;
  const grid = items.length
    ? `${cardGroup({ className: 'offer-group-personal', title: 'Personal offers', description: 'Made and run by individual practitioners.', items: personal, esc, escAttr })}
${nonprofitGroup({ items: nonprofitDiscounts, esc, escAttr })}
${courses.length ? `      <section class="offer-group offer-group-courses" aria-labelledby="offer-group-courses-title">
        <div class="offer-group-head">
          <h2 id="offer-group-courses-title">Courses</h2>
          <p>Short learning offers for people and teams.</p>
        </div>
        <ul class="offer-courses">
${courses.map((o) => courseRow(o, esc, escAttr)).join('\n')}
        </ul>
      </section>` : ''}
      <p class="cards-note">Listed alphabetically within each group. Nobody is first.</p>
`
    : `      <p class="cards-note">Nothing is listed yet. The first offers will appear here after review.</p>
`;
  const body = `  <section class="sub-page" aria-labelledby="offers-h1">
    <div class="wrap">
      <a class="back-link" href="${escAttr(prefix)}">&larr; Home</a>
      <p class="legend">Things on offer</p>
      <h1 id="offers-h1">Offers</h1>
      <p class="lede">Calls, courses, tools, cohorts, products, programmes and communities that help people and organisations in this community use AI well. Hand-picked because they are useful here. A listing is not an endorsement. Anyone can propose one.</p>
${grid}      <p><a class="cta" href="${escAttr(site.offerFormUrl)}">List an offer &rarr;</a></p>
      <p class="cta-host">${esc(hostOf(site.offerFormUrl))}</p>
      <p class="offer-rules">What qualifies: something that helps people or organisations in this community use AI, free or paid. Alexander decides what goes on the board. A listing is not an endorsement.</p>
    </div>
  </section>`;
  return [{
    path: 'offers/index.html',
    html: render({ title: 'Offers — EA AI Uplift', description: 'Calls, courses, tools, cohorts, products, programmes and communities that help people and organisations in the effective-altruism community use AI well.', canonical: 'https://eaaiuplift.com/offers/', prefix, nav: ctx.nav ?? '', css: ctx.sectionCss ?? '', body }),
  }];
}
