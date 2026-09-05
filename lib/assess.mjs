// Your AI practice: ten first-person statements, seven spokes, a polar chart.
// Everything the page says lives in data/assess/*.json (seven spoke-* files,
// ten question-* files). The chart, scoring and result view run in the
// browser from lib/assess-client.js; nothing is stored unless the visitor
// follows the email link, which goes to the form in data/site.json.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCollection, exactKeys, safeText } from './data.mjs';
import { load as loadGuides } from './guides.mjs';

export const id = 'assess';
export const navLabel = 'Assess';

const SPOKE_FIELDS = ['slug', 'kind', 'order', 'key', 'label', 'short', 'strong', 'edge', 'unmet', 'guide'];
const QUESTION_FIELDS = ['slug', 'kind', 'order', 'spoke', 'tag', 'statement'];
const TAGS = ['support', 'blocked', 'shared'];
const KEY = /^[a-z]+$/u;
const POSITIONING = [
  [/\b(?:we|our|us)\b/iu, 'first-person plural'],
  [/£|\$\s?\d|€\s?\d|\bper hour\b/iu, 'a price or currency'],
  [/\b(?:revolutionary|supercharge|10x|unlock|seamless|cutting-edge|game-changing)\b/iu, 'a hype word'],
];

const SCALE = [
  [1, 'Not me'],
  [2, 'Rarely me'],
  [3, 'Sometimes me'],
  [4, 'Often me'],
  [5, 'Very much me'],
  [0, 'I do not know what this means'],
];

// The five starting points on the home page's route, with the rule that
// places a result there (applied in order in the client).
const PLACES = [
  { n: 1, title: 'You only use the chat box', because: 'Chat is strong and the other ways are quiet. A session here picks one accessible tool and finishes one real task.' },
  { n: 2, title: 'You have one clear problem', because: 'Nothing is hollow and nothing is heavy yet. The useful next step is one clear problem, solved live.' },
  { n: 3, title: 'You have many pain points', because: 'Three or more ways are new to you. Triage first: name one intervention for each, then rank them.' },
  { n: 4, title: "You know the task but can't start", because: 'You said there is a task you keep meaning to start. Someone working beside you moves it.' },
  { n: 5, title: 'You already use AI heavily', because: 'Context, tools, delegation and automation are all in daily use. The next gains are longer delegation and reusable documentation.' },
];

const NOTES = {
  support: {
    low: 'You have nobody to ask when you hit a wall. The people listed below exist for exactly that.',
    high: 'You have someone to ask, and you ask. Keep that.',
  },
  shared: {
    low: 'Nothing you wrote has been reused by anyone yet. The handover guide is the fix, and it is a small one.',
    high: 'Someone has reused what you wrote. That is the handover spoke working.',
  },
};

export const css = `
/* ---------------- assess: home band ---------------- */
.assess-band{background:rgba(18,51,204,.06); border-top:1.5px solid var(--ink); border-bottom:1.5px solid var(--ink)}
.band + .assess-band,.ask-board + .assess-band{border-top:0}
.assess-grid-home{display:grid; grid-template-columns:minmax(0,1fr) minmax(0,420px); gap:36px var(--gut); align-items:center; margin-top:8px}
.assess-ways{margin:22px 0 0; padding:0; list-style:none; display:grid; grid-template-columns:repeat(7,minmax(0,1fr)); gap:6px}
.assess-ways li{border:1.5px solid var(--ink); background:var(--paper); min-height:150px; display:flex; align-items:flex-end; justify-content:center; padding:10px 0}
.assess-ways li span{writing-mode:vertical-rl; transform:rotate(180deg); font-family:var(--display); font-size:11px; font-weight:800; letter-spacing:.16em; text-transform:uppercase; color:var(--ink-2)}
.assess-ways li:nth-child(odd){background:rgba(232,84,31,.08)}
.assess-cap{margin-top:10px; font-family:var(--display); font-size:11.5px; font-weight:700; letter-spacing:.15em; text-transform:uppercase; color:var(--ink-2)}
.assess-band .cta{margin-top:22px}

/* ---------------- assess: the page ---------------- */
.assess-page{padding:44px 0 74px}
.assess-grid{display:grid; grid-template-columns:minmax(0,1fr) minmax(0,560px); gap:40px var(--gut); align-items:start}
.assess-page h1{font-size:clamp(34px,4.6vw,56px)}
.assess-lede{font-size:clamp(18px,1.5vw,20px); line-height:1.5; margin-top:18px; max-width:48ch}
.assess-fine{margin-top:16px; font-size:15.5px; color:var(--ink-2); max-width:52ch}
.spokes{margin:30px 0 0; padding:18px; border:1.5px solid var(--ink); background:var(--paper-2);
  box-shadow:8px -7px 0 -1px rgba(232,84,31,.5)}
.spoke-tiles{display:grid; grid-template-columns:repeat(7,minmax(0,1fr)); gap:6px; margin:0; padding:0; list-style:none}
.spoke-tiles li{position:relative; min-height:230px; border:1.5px solid var(--rule); background:var(--paper);
  display:flex; align-items:flex-end; justify-content:center; padding:12px 0; overflow:hidden}
.spoke-tiles li span{writing-mode:vertical-rl; transform:rotate(180deg); font-family:var(--display); font-size:11px;
  font-weight:800; letter-spacing:.16em; text-transform:uppercase; color:var(--ink-2); position:relative; z-index:1}
.spoke-tiles li i{position:absolute; left:0; right:0; bottom:0; height:0; background:rgba(18,51,204,.22); transition:height .25s ease}
.spoke-tiles li.now{border-color:var(--ink); box-shadow:3px -3px 0 -0.5px var(--tang)}
.spoke-tiles li.on{border-color:var(--cobalt)}
.spoke-tiles li.on span{color:var(--cobalt-deep)}
.spoke-tiles li.hollow{background:repeating-linear-gradient(45deg, rgba(232,84,31,.18) 0 1.5px, transparent 1.5px 9px), var(--paper); border-style:dashed; border-color:var(--tang)}
.spoke-tiles li.hollow span{color:var(--tang-ink)}
.conn{display:flex; align-items:center; gap:8px; margin-top:14px; font-family:var(--display); font-size:12.5px; font-weight:700; color:var(--ink-2)}
.conn b{display:inline-block; width:26px; height:9px; border:1.5px solid var(--ink-2); background:var(--paper)}
.conn b.on{background:var(--cobalt); border-color:var(--cobalt)}
.spokes-cap{margin-top:12px; font-family:var(--display); font-size:11.5px; font-weight:700; letter-spacing:.15em; text-transform:uppercase; color:var(--ink-2)}

.qcard{background:var(--paper); border:1.5px solid var(--ink); padding:26px 28px 30px;
  box-shadow:8px -7px 0 -1px rgba(18,51,204,.35); position:sticky; top:74px}
.qhead{display:flex; justify-content:space-between; align-items:baseline; gap:12px; padding-bottom:14px; border-bottom:1.5px dotted var(--tang)}
.qcount{font-family:var(--display); font-size:12.5px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:var(--ink-2)}
.qback{font-family:var(--display); font-size:14px; font-weight:700; color:var(--cobalt); background:none; border:0; padding:0; cursor:pointer; text-decoration:underline; text-underline-offset:3px}
.qback:disabled{visibility:hidden}
.qspoke{margin-top:22px}
.qstatement{margin-top:12px; font-family:var(--display); font-weight:700; font-size:clamp(21px,2.2vw,27px); line-height:1.25; letter-spacing:-0.025em}
.answers{margin:24px 0 0; padding:0; list-style:none; display:grid; gap:8px}
.answers button{width:100%; text-align:left; font-family:var(--display); font-weight:600; font-size:16.5px;
  background:var(--paper); color:var(--ink); border:1.5px solid var(--ink); padding:12px 16px; cursor:pointer}
.answers button:hover{background:rgba(18,51,204,.08); border-color:var(--cobalt)}
.answers button.chosen{background:var(--cobalt); color:#fff; border-color:var(--cobalt)}
.answers button .k{display:inline-block; width:1.6em; color:var(--tang-ink); font-family:var(--hand); font-weight:700; font-size:18px}
.answers button.chosen .k{color:#fff}
.answers li.dk{margin-top:8px}
.answers li.dk button{border-style:dashed; color:var(--ink-2)}
.answers li.dk button .k{visibility:hidden}
.qfoot{margin-top:18px; font-size:14px; color:var(--ink-2)}

/* result */
.chart-wrap{margin:26px 0 0}
.chart{display:block; width:100%; max-width:520px; height:auto; margin:0 auto}
.chart .ring{fill:none; stroke:var(--rule); stroke-width:1}
.chart .axis{stroke:var(--rule); stroke-width:1}
.chart .axis.hollow{stroke:var(--tang); stroke-dasharray:3 6; stroke-width:1.6}
.chart .shape{fill:rgba(18,51,204,.18); stroke:var(--cobalt); stroke-width:2.5; stroke-linejoin:round}
.chart .prev{fill:none; stroke:var(--ink-2); stroke-width:1.5; stroke-dasharray:4 5}
.chart .dot{fill:var(--cobalt)}
.chart .hollow-dot{fill:var(--paper); stroke:var(--tang); stroke-width:2}
.chart .lbl{font-family:var(--display); font-weight:800; font-size:10.5px; letter-spacing:.12em; text-transform:uppercase; fill:var(--ink-2)}
.chart .lbl.strong{fill:var(--cobalt-deep)}
.chart .lbl.edge{fill:var(--tang-ink)}
.chart-key{margin-top:14px; font-size:14px; color:var(--ink-2); text-align:center}
.result{background:var(--paper); border:1.5px solid var(--ink); padding:26px 28px 30px; box-shadow:8px -7px 0 -1px rgba(232,84,31,.5)}
.res-two{display:grid; grid-template-columns:1fr 1fr; gap:22px; margin-top:6px}
.res-two .label{margin-bottom:6px}
.res-two h2{font-size:clamp(24px,2.6vw,32px); text-transform:uppercase; letter-spacing:-0.03em}
.res-two h2.strong{color:var(--cobalt-deep)}
.res-two h2.edge{color:var(--tang-ink)}
.res-two p{margin-top:8px; font-size:16px; line-height:1.5}
.res-block{margin-top:26px; padding-top:20px; border-top:1.5px dotted var(--tang)}
.res-block .label{margin-bottom:8px}
.res-place{display:grid; grid-template-columns:auto minmax(0,1fr); gap:14px; align-items:start}
.res-place .disc-sm{margin-top:2px}
.res-place h3{font-size:20px}
.res-place p{margin-top:6px; font-size:16px; color:var(--ink-2)}
.res-place .tiny{margin-top:8px; font-size:13.5px}
.res-guides{margin:0; padding:0; list-style:none; display:grid; gap:12px}
.res-guides li{display:grid; grid-template-columns:minmax(0,1fr); gap:2px; padding:12px 14px; border:1.5px solid var(--rule); background:var(--paper-2)}
.res-guides .tag{font-family:var(--display); font-size:11px; font-weight:800; letter-spacing:.14em; text-transform:uppercase; color:var(--tang-ink)}
.res-guides a{font-family:var(--display); font-weight:700; font-size:17px; text-decoration:none; color:var(--cobalt)}
.res-guides a:hover{color:var(--tang-ink)}
.res-guides .why{font-size:15px; color:var(--ink-2)}
.res-notes{margin:0; padding:0 0 0 18px; font-size:16px; line-height:1.5}
.res-notes li{margin-bottom:6px}
.unmet{margin:0; padding:0; list-style:none; display:flex; flex-wrap:wrap; gap:8px}
.unmet li{font-family:var(--display); font-weight:700; font-size:14px; border:1.5px dashed var(--tang); color:var(--tang-ink); padding:4px 10px}
.share-row{display:grid; grid-template-columns:minmax(0,1fr) auto; gap:8px; margin-top:8px}
.share-row input{width:100%; font:15px/1.4 var(--body); padding:9px 12px; border:1.5px solid var(--ink); background:var(--paper-2); color:var(--ink); min-width:0}
.share-row button{font-family:var(--display); font-weight:800; font-size:14.5px; background:var(--cobalt); color:#fff; border:0; padding:9px 14px; cursor:pointer; white-space:nowrap}
.share-row button:hover{background:var(--cobalt-deep)}
.res-email .cta{margin-top:12px; font-size:16.5px; padding:11px 18px}
.res-email p{font-size:15.5px; color:var(--ink-2)}
.res-email p + p{margin-top:10px}
.retake{margin-top:26px; font-family:var(--display); font-weight:700; font-size:15px}
.team-line{margin-top:10px; font-family:var(--display); font-size:13px; font-weight:700; color:var(--cobalt-deep)}
.res-people{margin-top:54px; padding-top:34px; border-top:1.5px solid var(--ink)}
.res-people .people-grid{margin-top:26px}
.hidden{display:none !important}
@media (max-width:1000px){
  .assess-grid{grid-template-columns:minmax(0,1fr)}
  .qcard{position:static}
}
@media (max-width:860px){
  .assess-grid-home{grid-template-columns:minmax(0,1fr)}
}
@media (max-width:620px){
  .assess-page{padding:32px 0 56px}
  .spoke-tiles li{min-height:170px}
  .qcard,.result{padding:20px 18px 24px}
  .res-two{grid-template-columns:minmax(0,1fr)}
  .share-row{grid-template-columns:minmax(0,1fr)}
  .assess-ways li{min-height:110px}
}
`;

function positioning(value, label, errors) {
  if (typeof value !== 'string') return;
  for (const [expression, what] of POSITIONING) {
    const match = value.match(expression);
    if (match) errors.push(`${label} contains ${what}: "${match[0]}"`);
  }
}

function validateItem(item, file, errors) {
  if (item.kind === 'spoke') {
    if (!exactKeys(item, SPOKE_FIELDS, file, errors)) return;
    if (!Number.isInteger(item.order) || item.order < 1 || item.order > 7) errors.push(`${file}: order must be an integer from 1 to 7`);
    if (typeof item.key !== 'string' || !KEY.test(item.key) || item.key.length > 20) errors.push(`${file}: key must be lower-case letters`);
    else if (item.slug !== `spoke-${item.key}`) errors.push(`${file}: slug must be spoke-<key>`);
    safeText(item.label, `${file}: label`, errors, { min: 3, max: 14 });
    safeText(item.short, `${file}: short`, errors, { min: 10, max: 70 });
    safeText(item.strong, `${file}: strong`, errors, { min: 20, max: 200 });
    safeText(item.edge, `${file}: edge`, errors, { min: 20, max: 200 });
    safeText(item.unmet, `${file}: unmet`, errors, { min: 20, max: 200 });
    if (typeof item.guide !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(item.guide)) errors.push(`${file}: guide must be the slug of an entry in data/guides`);
    for (const field of ['label', 'short', 'strong', 'edge', 'unmet']) positioning(item[field], `${file}: ${field}`, errors);
    return;
  }
  if (item.kind === 'question') {
    if (!exactKeys(item, QUESTION_FIELDS, file, errors)) return;
    if (!Number.isInteger(item.order) || item.order < 1 || item.order > 10) errors.push(`${file}: order must be an integer from 1 to 10`);
    else if (item.slug !== `question-${String(item.order).padStart(2, '0')}`) errors.push(`${file}: slug must be question-<order, two digits>`);
    safeText(item.statement, `${file}: statement`, errors, { min: 30, max: 220 });
    positioning(item.statement, `${file}: statement`, errors);
    if (item.spoke === null) {
      if (!TAGS.includes(item.tag)) errors.push(`${file}: a connective question (spoke null) needs tag one of ${TAGS.join(', ')}`);
    } else {
      if (typeof item.spoke !== 'string' || !KEY.test(item.spoke)) errors.push(`${file}: spoke must be a spoke key or null`);
      if (item.tag !== null) errors.push(`${file}: tag must be null on a spoke question`);
    }
    return;
  }
  errors.push(`${file}: kind must be spoke or question`);
}

export function load(root) {
  const loaded = loadCollection(root, id, validateItem);
  const errors = loaded.errors;
  const spokes = loaded.items.filter((item) => item.kind === 'spoke').sort((a, b) => a.order - b.order);
  const questions = loaded.items.filter((item) => item.kind === 'question').sort((a, b) => a.order - b.order);
  if (!errors.length) {
    if (spokes.length !== 7) errors.push(`data/assess must hold exactly seven spoke files (found ${spokes.length})`);
    if (questions.length !== 10) errors.push(`data/assess must hold exactly ten question files (found ${questions.length})`);
    if (new Set(spokes.map((s) => s.order)).size !== spokes.length) errors.push('data/assess: spoke orders must be unique');
    if (new Set(questions.map((q) => q.order)).size !== questions.length) errors.push('data/assess: question orders must be unique');
    const keys = new Set(spokes.map((s) => s.key));
    const covered = new Set();
    for (const q of questions) {
      if (q.spoke === null) continue;
      if (!keys.has(q.spoke)) errors.push(`${q.slug}: spoke ${q.spoke} does not exist`);
      if (covered.has(q.spoke)) errors.push(`${q.slug}: spoke ${q.spoke} already has a question`);
      covered.add(q.spoke);
    }
    for (const key of keys) if (!covered.has(key)) errors.push(`data/assess: spoke ${key} has no question`);
    const tags = questions.filter((q) => q.spoke === null).map((q) => q.tag);
    if (tags.length !== 3 || new Set(tags).size !== 3) errors.push('data/assess: exactly three connective questions, one per tag (support, blocked, shared)');
    const guides = loadGuides(root);
    const guideSlugs = new Set(guides.items.map((g) => g.slug));
    for (const s of spokes) if (!guideSlugs.has(s.guide)) errors.push(`${s.slug}: guide ${s.guide} is not an entry in data/guides`);
  }
  return { items: loaded.items, errors };
}

function guideTarget(guide, prefix) {
  if (guide.status === 'local') return `${prefix}guides/${guide.slug}/`;
  return guide.links[0].url;
}

// ---------------------------------------------------------------- home band
export function section({ items, esc, escAttr }) {
  const spokes = items.filter((item) => item.kind === 'spoke').sort((a, b) => a.order - b.order);
  if (spokes.length !== 7) return '';
  return `  <!-- assess -->
  <section class="assess-band" id="assess" aria-labelledby="assess-title">
    <div class="wrap">
      <div class="assess-grid-home">
        <div>
          <div class="sec-head">
            <p class="legend">Where is your practice?</p>
            <h2 id="assess-title">Ten questions, three minutes, one chart</h2>
            <p class="intro">Seven ways of working with these tools, from the chat window to jobs that run on their own. Rate ten plain statements and see which ways are strong, which are thin, and which you have not met yet.</p>
            <p class="intro-2">No account. Nothing is stored unless you choose to send yourself the result.</p>
          </div>
          <p><a class="cta" href="assess/">Map your practice &rarr;</a></p>
        </div>
        <div>
          <ul class="assess-ways" aria-hidden="true">
${spokes.map((s) => `            <li><span>${esc(s.label)}</span></li>`).join('\n')}
          </ul>
          <p class="assess-cap">Seven ways. Each one fills as you answer.</p>
        </div>
      </div>
    </div>
  </section>`;
}

// ---------------------------------------------------------------- the page
function personCard(p, esc, escAttr, prefix) {
  const href = `${prefix}people/${p.slug}/`;
  const frame = p.photo
    ? `<img class="shot" src="${escAttr(prefix)}img/${escAttr(p.photo)}" srcset="${escAttr(prefix)}img/${escAttr(p.slug)}-960.jpg 2x" alt="${escAttr(p.name)}" width="480" height="480"><span class="wash" aria-hidden="true"></span>`
    : `<span class="photo-pending"><span class="hatch"><span>Portrait not supplied</span></span></span>`;
  return `          <li class="p-card">
            <span class="p-slot"><a class="portrait-frame" href="${escAttr(href)}" aria-label="${escAttr(p.name)} — profile">${frame}</a></span>
            <h3 class="p-name"><a href="${escAttr(href)}">${esc(p.name)}</a></h3>
            <p class="p-head">${esc(p.headline)}</p>
          </li>`;
}

export function pages(ctx) {
  const { items, people, site, esc, escAttr } = ctx;
  const render = ctx.renderPage ?? (() => '');
  const prefix = '../';
  const spokes = items.filter((item) => item.kind === 'spoke').sort((a, b) => a.order - b.order);
  const questions = items.filter((item) => item.kind === 'question').sort((a, b) => a.order - b.order);
  if (spokes.length !== 7 || questions.length !== 10) return [];
  const guides = loadGuides(ctx.root).items;
  const byGuide = Object.fromEntries(guides.map((g) => [g.slug, g]));
  const data = {
    spokes: spokes.map((s) => ({
      key: s.key, label: s.label, short: s.short, strong: s.strong, edge: s.edge, unmet: s.unmet,
      guide: { title: byGuide[s.guide].title, why: byGuide[s.guide].why, href: guideTarget(byGuide[s.guide], prefix), local: byGuide[s.guide].status === 'local' },
    })),
    questions: questions.map((q) => ({ n: q.order, spoke: q.spoke, tag: q.tag, statement: q.statement })),
    scale: SCALE,
    places: PLACES,
    notes: NOTES,
    formUrl: site.assessFormUrl,
  };
  const client = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'assess-client.js'), 'utf8');
  const sortedPeople = (people || []).slice().sort((a, b) => (a.name < b.name ? -1 : 1));
  const body = `  <section class="assess-page" aria-labelledby="assess-h1">
    <div class="wrap">
      <a class="back-link" href="${prefix}#assess">&larr; Back to the guide</a>
      <div class="assess-grid">
        <div>
          <p class="legend">Your AI practice</p>
          <h1 id="assess-h1">Which ways are strong, and which have you not met?</h1>
          <p class="assess-lede">Ten statements about how you work with these tools. Rate each one as it is today, not as you would like it to be. If a statement describes something you have never met, say so: that is the most useful answer on the page.</p>
          <p class="assess-fine">No account. Nothing leaves this page unless you choose to send yourself the result. The seven ways are a working model from one practitioner, version 0.1, and will change as evidence comes in.</p>
          <div class="spokes" id="spokes">
            <ul class="spoke-tiles" id="tiles">
${spokes.map((s) => `              <li data-key="${escAttr(s.key)}"><i></i><span>${esc(s.label)}</span></li>`).join('\n')}
            </ul>
            <p class="conn" id="conn"><b></b><b></b><b></b><span>0 of 3 connective questions</span></p>
            <p class="spokes-cap" id="spokes-cap">Seven ways, nothing mapped yet.</p>
          </div>
          <div class="chart-wrap hidden" id="chart-wrap">
            <svg class="chart" id="chart" viewBox="0 0 520 480" role="img" aria-labelledby="chart-title"><title id="chart-title">Your seven ways, drawn as a chart</title></svg>
            <p class="chart-key" id="chart-key"></p>
          </div>
        </div>
        <div>
          <div class="qcard" id="qcard">
            <div class="qhead">
              <span class="qcount" id="qcount">Question 1 of 10</span>
              <button class="qback" id="qback" type="button" disabled>Back</button>
            </div>
            <p class="legend qspoke" id="qspoke"></p>
            <p class="qstatement" id="qstatement"></p>
            <ul class="answers" id="answers"></ul>
            <p class="qfoot">One tap moves you on. Back takes you to the last question.</p>
          </div>
          <div class="result hidden" id="result"></div>
        </div>
      </div>
      <div class="res-people hidden" id="res-people">
        <div class="sec-head">
          <p class="legend">Talk to someone</p>
          <h2>People who do this work</h2>
          <p class="intro">Each person works independently and sets their own terms. Open a profile for availability and how to get in touch. Listed alphabetically. Nobody is first.</p>
        </div>
        <ul class="people-grid">
${sortedPeople.map((p) => personCard(p, esc, escAttr, prefix)).join('\n')}
        </ul>
      </div>
    </div>
  </section>
  <script type="application/json" id="assess-data">${JSON.stringify(data).replace(/</gu, '\\u003c')}</script>
  <script>${client}</script>`;
  return [{
    path: 'assess/index.html',
    html: render({
      title: 'Your AI practice — a ten-question self-assessment — EA AI Uplift',
      description: 'Ten plain statements, seven ways of working with AI tools, one chart. See which ways are strong, which are thin, and which you have not met yet.',
      canonical: 'https://eaaiuplift.com/assess/',
      prefix,
      nav: ctx.nav ?? '',
      css: ctx.sectionCss ?? '',
      body,
    }),
  }];
}
