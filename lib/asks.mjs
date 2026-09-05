// Help wanted: a board where an organisation or an individual in the community
// states a problem (never a solution) and anyone listed on the page can reply.
import { loadCollection, exactKeys, safeText, isDate, isFutureDate, validateHttpsUrl } from './data.mjs';
import { countWord } from './shared.mjs';

export const id = 'asks';
export const navLabel = 'Help wanted';

const FIELDS = ['slug', 'title', 'context', 'postedBy', 'posterKind', 'budget', 'contact', 'posted', 'expires', 'source'];
const POSTER_KINDS = ['organisation', 'individual'];
const BUDGETS = ['unstated', 'paid', 'volunteer', 'either'];
const SOURCES = ['self', 'anonymised'];
const MAX_OPEN_DAYS = 120;
const DAY = 24 * 60 * 60 * 1000;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const currency = /[£$€]/u;

const POSTER_WORD = { organisation: 'Organisation', individual: 'Individual' };
const BUDGET_WORD = { unstated: 'Budget not stated', paid: 'Paid', volunteer: 'Volunteer', either: 'Paid or volunteer' };

export const css = `
/* ---------------- help wanted ---------------- */
.ask-board{background:rgba(232,84,31,.07); border-top:1.5px solid var(--ink); border-bottom:1.5px solid var(--ink)}
.band + .ask-board{border-top:0}
.ask-board + .band{border-top:0}
.ask-card{box-shadow:7px -6px 0 -1px rgba(232,84,31,.5)}
.ask-card .cno{color:var(--cobalt-deep)}
.ask-card h3{max-width:34ch}
.ask-card .ask-by{font-family:var(--display); font-weight:600; font-size:15px; color:var(--ink); margin-bottom:10px}
.ask-card .ask-meta{margin-top:14px; font-family:var(--display); font-size:12px; font-weight:700; letter-spacing:.1em;
  text-transform:uppercase; color:var(--ink-2)}
.ask-card .ask-anon{margin-top:8px; font-size:14.5px; font-style:italic}
.ask-card .ask-reply{margin-top:16px; font-family:var(--display); font-weight:700; font-size:17px}
.ask-card .ask-reply a{text-decoration:none; padding:3px 0 4px; box-shadow:inset 0 -2.5px 0 0 var(--cobalt)}
.ask-card .ask-reply a:hover{box-shadow:inset 0 -2.5px 0 0 var(--tang)}
.ask-post{margin-top:40px; padding-top:28px; border-top:1.5px dotted var(--tang); max-width:60ch}
.ask-post .cta{margin-top:0}
.ask-post .ask-how{margin-top:18px; font-size:16.5px; color:var(--ink-2)}
@media (max-width:390px){
  .ask-card h3{font-size:18px}
  .ask-card .ask-meta{letter-spacing:.06em}
}
`;

function today() {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(from, to) {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY);
}

function longDate(iso) {
  const [year, month, day] = iso.split('-').map(Number);
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

function noCurrency(value, label, errors) {
  if (typeof value === 'string' && currency.test(value)) errors.push(`${label} must not contain a currency amount; budget is only ever one of ${BUDGETS.join(', ')}`);
}

function validateAsk(item, fileName, errors) {
  if (!exactKeys(item, FIELDS, fileName, errors)) return;
  safeText(item.title, `${fileName}: title`, errors, { min: 10, max: 140 });
  if (typeof item.context !== 'string') errors.push(`${fileName}: context must be a string (empty is allowed)`);
  else if (item.context !== '') safeText(item.context, `${fileName}: context`, errors, { min: 1, max: 400 });
  safeText(item.postedBy, `${fileName}: postedBy`, errors, { min: 2, max: 120 });
  for (const field of ['title', 'context', 'postedBy']) noCurrency(item[field], `${fileName}: ${field}`, errors);
  if (!POSTER_KINDS.includes(item.posterKind)) errors.push(`${fileName}: posterKind must be one of ${POSTER_KINDS.join(', ')}`);
  if (!BUDGETS.includes(item.budget)) errors.push(`${fileName}: budget must be one of ${BUDGETS.join(', ')}`);
  if (!SOURCES.includes(item.source)) errors.push(`${fileName}: source must be one of ${SOURCES.join(', ')}`);
  validateHttpsUrl(item.contact, `${fileName}: contact`, errors);
  if (!isDate(item.posted)) errors.push(`${fileName}: posted must be an ISO date`);
  else if (isFutureDate(item.posted)) errors.push(`${fileName}: posted must not be in the future`);
  if (!isDate(item.expires)) errors.push(`${fileName}: expires must be an ISO date`);
  else if (isDate(item.posted)) {
    const open = daysBetween(item.posted, item.expires);
    if (open <= 0) errors.push(`${fileName}: expires must be after posted`);
    else if (open > MAX_OPEN_DAYS) errors.push(`${fileName}: expires must be at most ${MAX_OPEN_DAYS} days after posted`);
  }
}

export function load(root) {
  const { items, errors } = loadCollection(root, id, validateAsk);
  if (errors.length) return { items: [], errors };
  const now = today();
  const live = [];
  for (const item of items) {
    if (item.expires < now) {
      console.error(`asks: info — data/asks/${item.slug}.json expired on ${item.expires}; not rendered`);
      continue;
    }
    live.push(item);
  }
  live.sort((a, b) => (a.posted > b.posted ? -1 : a.posted < b.posted ? 1 : a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0));
  return { items: live, errors };
}

function card(item, esc, escAttr) {
  const context = item.context ? `\n          <p>${esc(item.context)}</p>` : '';
  const anon = item.source === 'anonymised'
    ? `\n          <p class="ask-anon">Anonymised from a discovery call. Posted by Alexander Large.</p>`
    : '';
  return `        <li class="card ask-card">
          <span class="cno">${POSTER_WORD[item.posterKind]} &middot; ${BUDGET_WORD[item.budget]}</span>
          <h3>${esc(item.title)}</h3>
          <p class="ask-by">${esc(item.postedBy)}</p>${context}
          <p class="ask-meta">Posted ${longDate(item.posted)} &middot; open until ${longDate(item.expires)}</p>${anon}
          <p class="ask-reply"><a href="${escAttr(item.contact)}" rel="noopener">Reply &rarr;</a></p>
        </li>`;
}

export function section({ items, site, esc, escAttr }) {
  const formHost = new URL(site.askFormUrl).host;
  const count = items.length;
  const intro = count === 0
    ? 'Nothing is posted right now. When an organisation or an individual in this community has something slow or painful, it appears here, and anyone listed above can reply.'
    : `${countWord(count, true)} open ${count === 1 ? 'ask' : 'asks'} from organisations and individuals in this community. Each one is a problem, not a brief. Anyone listed above can reply.`;
  const board = count === 0
    ? ''
    : `
      <ul class="cards ask-cards">
${items.map((item) => card(item, esc, escAttr)).join('\n')}
      </ul>
      <p class="cards-note">Newest first. An ask leaves the board after its open-until date.</p>`;
  return `  <!-- 02b help wanted -->
  <section class="ask-board" id="asks" aria-labelledby="asks-title">
    <div class="wrap">
      <div class="sec-head">
        <p class="legend">The asks</p>
        <h2 id="asks-title">Help wanted</h2>
        <p class="intro">${intro}</p>
        <p class="intro-2">The question to answer is &ldquo;what is slow or painful right now?&rdquo;, not &ldquo;what should be built?&rdquo;.</p>
      </div>${board}
      <div class="ask-post">
        <p><a class="cta" href="${escAttr(site.askFormUrl)}">Post an ask &rarr;</a></p>
        <p class="cta-host">${esc(formHost)}</p>
        <p class="ask-how">Write the pain, not the tool: one sentence on what is slow, repeated or dropped, a little context, and a public link where someone can reach you. Budget is optional and only ever a word, never a number. Anyone listed on this page can reply.</p>
      </div>
    </div>
  </section>`;
}

export function pages() {
  return [];
}
