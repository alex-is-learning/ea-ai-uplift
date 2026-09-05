import { loadCollection, exactKeys, safeText, isDate, isFutureDate, validateHttpsUrl } from './data.mjs';

export const id = 'offers';
export const navLabel = 'Offers';

export const FIELDS = ['slug', 'name', 'by', 'kind', 'summary', 'detail', 'url', 'access', 'audience', 'listed', 'checked'];
export const KINDS = ['course', 'tool', 'cohort', 'product', 'programme', 'community'];
export const ACCESS = ['open', 'invite-only', 'application', 'discount', 'free'];
export const AUDIENCE = ['organisations', 'individuals', 'both'];
const CURRENCY = /[£$€¥]/u;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const css = `
/* ---------------- offers ---------------- */
.offer-cards{grid-template-columns:repeat(3,minmax(0,1fr))}
.offer-card h3 a{color:var(--ink); text-decoration:none; box-shadow:inset 0 -2px 0 0 var(--cobalt)}
.offer-card h3 a:hover{color:var(--tang-ink); box-shadow:inset 0 -2px 0 0 var(--tang)}
.offer-card .offer-by{font-family:var(--display); font-weight:600; font-size:15px; color:var(--ink); margin-bottom:10px}
.offer-card .offer-detail{margin-top:8px}
.offer-card .offer-checked{margin-top:16px; font-family:var(--display); font-size:11.5px; font-weight:700;
  letter-spacing:.12em; text-transform:uppercase; color:var(--ink-2)}
.offer-rules{margin-top:22px; font-size:16px; color:var(--ink-2); max-width:64ch}
@media (max-width:1000px){ .offer-cards{grid-template-columns:repeat(2,minmax(0,1fr))} }
@media (max-width:860px){ .offer-cards{grid-template-columns:minmax(0,1fr)} }
`;

function validateItem(item, file, errors) {
  if (!exactKeys(item, FIELDS, file, errors)) return;
  safeText(item.name, `${file}: name`, errors, { min: 2, max: 80 });
  safeText(item.by, `${file}: by`, errors, { min: 2, max: 100 });
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
  return `        <li class="card offer-card">
          <span class="cno offer-tags">${esc(word(o.kind))} &middot; ${esc(word(o.access))} &middot; ${esc(AUDIENCE_WORD[o.audience])}</span>
          <h3><a href="${escAttr(o.url)}" rel="noopener">${esc(o.name)}</a></h3>
          <p class="offer-by">by ${esc(o.by)}</p>
          <p class="offer-summary">${esc(o.summary)}</p>${detail}
          <p class="offer-checked">Checked ${esc(longDate(o.checked))}</p>
        </li>`;
}

export function section({ items, site, esc, escAttr }) {
  const grid = items.length
    ? `      <ul class="cards offer-cards">
${items.map((o) => card(o, esc, escAttr)).join('\n')}
      </ul>
      <p class="cards-note">Listed alphabetically. Nobody is first.</p>
`
    : `      <p class="cards-note">Nothing is listed yet. The first offers will appear here after review.</p>
`;
  return `  <!-- 06b offers -->
  <section id="offers" aria-labelledby="offers-title">
    <div class="wrap">
      <div class="sec-head">
        <p class="legend">Things on offer</p>
        <h2 id="offers-title">Offers</h2>
        <p class="intro">Courses, tools, cohorts, products, programmes and communities that help people and organisations in this community use AI well. Hand-picked because they are useful here. A listing is not an endorsement. Anyone can propose one.</p>
      </div>
${grid}      <p><a class="cta" href="${escAttr(site.offerFormUrl)}">List an offer &rarr;</a></p>
      <p class="cta-host">${esc(hostOf(site.offerFormUrl))}</p>
      <p class="offer-rules">What qualifies: something that helps people or organisations in this community use AI, free or paid. Alexander decides what goes on the board. A listing is not an endorsement.</p>
    </div>
  </section>`;
}

export function pages() {
  return [];
}
