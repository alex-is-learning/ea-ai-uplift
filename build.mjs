import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertValidProject } from './schema/validate.mjs';
import { esc, escAttr, countWord, NAME_RULE } from './lib/shared.mjs';
import { loadSiteConfig } from './lib/data.mjs';
import { sections, navOrder } from './lib/sections.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(scriptDir, 'dist');
const imgDir = path.join(scriptDir, 'img');

function die(msg) {
  console.error(`build.mjs: ${msg}`);
  process.exit(1);
}


// ---------------------------------------------------------------- load + validate
let people = [];
try {
  people = assertValidProject();
} catch (e) {
  die(e.message);
}

// stable, locale-independent: first name, then full name, then slug
const byFirstName = (a, b) => {
  const fa = a.name.split(' ')[0];
  const fb = b.name.split(' ')[0];
  if (fa !== fb) return fa < fb ? -1 : 1;
  if (a.name !== b.name) return a.name < b.name ? -1 : 1;
  return a.slug < b.slug ? -1 : 1;
};
people = people.slice().sort(byFirstName);

const siteLoad = loadSiteConfig(scriptDir);
if (siteLoad.errors.length) die(siteLoad.errors.join('\n'));
const site = siteLoad.config;
const sectionItems = {};
for (const [name, mod] of Object.entries(sections)) {
  const loaded = mod.load(scriptDir);
  if (loaded.errors.length) die(loaded.errors.join('\n'));
  sectionItems[name] = loaded.items;
}
const sectionCss = Object.values(sections).map((mod) => mod.css).filter(Boolean).map((css) => `\n${css}`).join('');
function ctx(name, prefix = '') {
  return { root: scriptDir, items: sectionItems[name], people, site, esc, escAttr, prefix };
}
function slot(name) {
  const html = sections[name].section(ctx(name));
  return html ? `${html}\n\n` : '';
}
const NAV_LABELS = { people: 'People', map: "Where you'd start", recipes: 'Recipes', listed: 'Get listed' };
function navLinks(prefix) {
  return navOrder
    .map((name) => {
      const label = NAV_LABELS[name] ?? sections[name]?.navLabel;
      return label ? `      <a href="${escAttr(prefix)}#${name}">${esc(label)}</a>` : null;
    })
    .filter(Boolean)
    .join('\n');
}


// ---------------------------------------------------------------- shared pieces
const REG_CROSS = `<svg class="reg-cross" viewBox="0 0 22 22" aria-hidden="true" focusable="false"><path vector-effect="non-scaling-stroke" d="M11 1.4V20.6M1.4 11H20.6"/><circle vector-effect="non-scaling-stroke" cx="11" cy="11" r="6"/></svg>`;

const FOOTER_FINE =
  'Maintained by Alexander Large. The people listed work independently and are not a team, and nothing here is affiliated with, or endorsed by, any effective-altruism organisation or employer. &ldquo;EA&rdquo; names the community this guide is written for. This page sets no cookies, runs no analytics and collects no personal data.';

function footer() {
  return `<footer class="site-foot">
  <div class="wrap">
    <p class="mark-f">EA AI Uplift</p>
    <p class="fine">${FOOTER_FINE}</p>
    <p class="fine"><a href="https://github.com/alex-is-learning/ea-ai-uplift">Source and contributions on GitHub</a> · <a href="https://github.com/alex-is-learning/ea-ai-uplift/blob/main/CONTRIBUTING.md#add-a-profile">Add yourself to the directory</a></p>
  </div>
</footer>`;
}

function head({ title, description, canonical, extra = '' }) {
  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${escAttr(description)}">
<link rel="canonical" href="${escAttr(canonical)}">
<meta property="og:title" content="${escAttr(title)}">
<meta property="og:description" content="${escAttr(description)}">
<meta property="og:url" content="${escAttr(canonical)}">
<meta property="og:image" content="https://eaaiuplift.com/og.png">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escAttr(title)}">
<meta name="twitter:description" content="${escAttr(description)}">
<meta name="twitter:image" content="https://eaaiuplift.com/og.png">
<link rel="icon" href="data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%2032%2032%22%3E%3Crect%20width%3D%2232%22%20height%3D%2232%22%20rx%3D%227%22%20fill%3D%22%23F6F3EB%22/%3E%3Cpath%20d%3D%22M6%2024%20C%2012%2020%2018%2014%2026%208%22%20fill%3D%22none%22%20stroke%3D%22%231233CC%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22/%3E%3Ccircle%20cx%3D%226%22%20cy%3D%2224%22%20r%3D%223%22%20fill%3D%22%23E8541F%22/%3E%3C/svg%3E">
${extra}`;
}

// ---------------------------------------------------------------- stylesheet
// B3 "illustrated map": two spot colours printed slightly out of register on
// paper. Cobalt is the route; tangerine is the terrain and the ghost of the
// second plate. The people grid is B4's pasted prints, re-inked in that palette.
const CSS = `
:root{
  --paper:#F6F3EB;
  --paper-2:#EFEBE0;
  --paper-3:#E6E1D3;
  --ink:#17181C;
  --ink-2:#4C5059;
  --cobalt:#1233CC;
  --cobalt-deep:#0A1F8F;
  --tang:#E8541F;
  --tang-ink:#B83C10;
  --rule:#D6D1C2;
  --display:'Bricolage Grotesque','Helvetica Neue',system-ui,sans-serif;
  --body:'Karla',system-ui,-apple-system,Segoe UI,sans-serif;
  --hand:'Fraunces',Georgia,serif;
  --gut:24px;
  --maxw:1180px;
}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%; overflow-x:clip}
body{
  margin:0; background:var(--paper); color:var(--ink);
  font-family:var(--body); font-size:17px; line-height:1.6;
  overflow-x:clip; -webkit-font-smoothing:antialiased;
}

/* paper grain — a fine printed dot screen over everything */
.grain{
  position:fixed; inset:0; z-index:60; pointer-events:none;
  background-image:radial-gradient(rgba(23,24,28,.075) .5px, transparent .6px);
  background-size:3px 3px; opacity:.6;
}
.grain::after{
  content:""; position:absolute; inset:0;
  background:radial-gradient(120% 90% at 50% 8%, transparent 55%, rgba(120,104,74,.10) 100%);
}

.wrap{max-width:var(--maxw); margin:0 auto; padding:0 var(--gut)}

h1,h2,h3{font-family:var(--display); margin:0; line-height:1.06; letter-spacing:-0.028em; font-weight:700}
h1{font-size:clamp(35px,5.4vw,66px); font-weight:800; letter-spacing:-0.04em}
h2{font-size:clamp(29px,3.6vw,44px); font-weight:800; letter-spacing:-0.035em}
h3{font-size:20px; letter-spacing:-0.018em; line-height:1.2; font-weight:700}
p{margin:0}
a{color:var(--cobalt); text-underline-offset:3px; text-decoration-thickness:1.5px}
a:hover{color:var(--tang-ink)}
:focus-visible{outline:3px solid var(--tang); outline-offset:3px; border-radius:2px}

/* map-legend eyebrow: a printed lozenge + a label */
.legend{
  display:flex; align-items:center; gap:9px; margin:0 0 14px;
  font-family:var(--display); font-size:12px; font-weight:700;
  letter-spacing:0.17em; text-transform:uppercase; color:var(--tang-ink);
}
.legend::before{
  content:""; width:9px; height:9px; background:var(--tang);
  transform:rotate(45deg); flex:none; mix-blend-mode:multiply;
}
.label{
  font-family:var(--display); font-size:11px; font-weight:700;
  letter-spacing:0.15em; text-transform:uppercase; color:var(--ink-2);
  display:block; margin-bottom:4px;
}

/* ---------------- header — a printed masthead rule that stays put ---------------- */
.site-head{position:sticky; top:0; z-index:40; background:var(--paper);
  border-bottom:1.5px solid var(--ink)}
.site-head .wrap{display:flex; align-items:center; justify-content:space-between; gap:14px;
  min-height:54px; flex-wrap:nowrap}
.mark{display:inline-flex; align-items:baseline; gap:9px; text-decoration:none; color:var(--ink);
  font-family:var(--display); font-weight:800; font-size:15.5px; letter-spacing:-0.01em; white-space:nowrap}
.mark .pin{width:12px; height:12px; border-radius:50%; background:var(--cobalt); flex:none;
  box-shadow:3px -3px 0 0 var(--tang); mix-blend-mode:multiply; align-self:center}
.head-nav{display:flex; gap:22px; font-family:var(--display); font-size:13.5px; font-weight:600}
.head-nav a{color:var(--ink-2); text-decoration:none}
.head-nav a:hover{color:var(--cobalt); text-decoration:underline}
.head-cta{margin-left:auto; flex:none; white-space:nowrap; text-decoration:none; color:var(--cobalt);
  font-family:var(--display); font-weight:700; font-size:14px; letter-spacing:-0.005em;
  padding:3px 0 4px; box-shadow:inset 0 -2.5px 0 0 var(--cobalt)}
.head-cta:hover{color:var(--tang-ink); box-shadow:inset 0 -2.5px 0 0 var(--tang)}
/* anchors must clear the sticky masthead */
main[id],section[id]{scroll-margin-top:66px}

/* ---------------- hero ---------------- */
.hero{padding:46px 0 40px; position:relative}
.hero-grid{display:grid; grid-template-columns:minmax(0,1fr) minmax(0,420px); gap:40px var(--gut); align-items:start}
.lede{font-size:clamp(18px,1.5vw,21px); line-height:1.5; margin-top:22px; max-width:56ch}
.lede b{font-weight:700; box-shadow:inset 0 -.42em 0 rgba(232,84,31,.28)}
.sub-lede{font-size:16.5px; color:var(--ink-2); margin-top:22px; max-width:54ch}
.soft-links{display:flex; flex-direction:column; align-items:flex-start; gap:11px; margin-top:26px;
  font-family:var(--display); font-weight:700; font-size:17px}
.soft-links a{text-decoration:none; color:var(--ink); padding:3px 0 4px;
  box-shadow:inset 0 -3px 0 0 var(--cobalt)}
.soft-links a:hover{box-shadow:inset 0 -3px 0 0 var(--tang); color:var(--tang-ink)}
.soft-links a.hot{color:var(--cobalt)}
.glimpse{display:block; width:100%; height:auto}
.glimpse-cap{font-family:var(--display); font-size:11.5px; font-weight:700; letter-spacing:.15em;
  text-transform:uppercase; color:var(--ink-2); margin-top:10px}

/* ---------------- section frame ---------------- */
section{padding:66px 0; position:relative}
.sec-head{max-width:74ch}
.sec-head .intro{margin-top:16px; font-size:18px; color:var(--ink-2); max-width:58ch}
.sec-head .intro-2{margin-top:10px; font-size:16.5px; color:var(--ink-2); max-width:58ch}
.band{background:var(--paper-2); border-top:1.5px solid var(--ink); border-bottom:1.5px solid var(--ink)}

/* ---------------- the route ---------------- */
.map-figure{margin:34px 0 0}
.map-wide{display:block; width:100%; height:auto}
.map-tall{display:none; width:100%; max-width:340px; margin:0 auto; height:auto}
.route-svg text{font-family:var(--display); font-weight:700}
.route-svg .num{font-family:var(--hand); font-weight:700}
.plate-t{mix-blend-mode:multiply; opacity:.74}
.plate-c{mix-blend-mode:multiply}

.stations{display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:0;
  margin:26px 0 0; padding:0; list-style:none}
.station{grid-row:span 4; display:grid; grid-template-rows:subgrid; row-gap:14px;
  padding:22px 20px 24px; border-left:1.5px dotted var(--tang)}
.station:first-child{padding-left:0; border-left:0}
.station .pin{display:flex; align-items:center; gap:10px}
.station .disc-sm{
  width:34px; height:34px; border-radius:50%; background:var(--cobalt); color:#fff;
  font-family:var(--hand); font-weight:700; font-size:19px; line-height:1;
  display:flex; align-items:center; justify-content:center; flex:none;
  box-shadow:3px -3px 0 0 var(--tang); mix-blend-mode:multiply;
}
.station .bit p{font-size:16px; line-height:1.45; color:var(--ink-2)}
.station .bit.worked p{color:var(--ink); font-weight:500}
.station .bit.worked .label{color:var(--tang-ink)}
.footnote{margin-top:30px; font-size:16px; color:var(--ink-2); max-width:72ch}

/* ---------------- organisation ---------------- */
.discovery{
  margin-top:34px; padding:22px 24px; background:var(--paper);
  border:1.5px solid var(--cobalt); box-shadow:8px -7px 0 -1px rgba(232,84,31,.55);
}
.discovery .d-title{font-family:var(--display); font-weight:800; font-size:18px;
  letter-spacing:-0.02em; color:var(--cobalt-deep); margin-bottom:8px}
.discovery p{font-size:16.5px}
.lanes{display:grid; grid-template-columns:1fr 1fr; gap:var(--gut); margin-top:26px}
.lane{padding:24px 24px 26px; background:var(--paper-2); border:1.5px solid var(--ink)}
.lane:nth-child(2){background:rgba(232,84,31,.09)}
.lane-key{display:inline-block; font-family:var(--display); font-size:11.5px; font-weight:800;
  letter-spacing:.15em; text-transform:uppercase; color:#fff; background:var(--cobalt);
  padding:3px 9px; margin-bottom:12px}
.lane:nth-child(2) .lane-key{background:var(--tang-ink)}
.steps{margin:16px 0 0; padding:0; list-style:none; display:flex; flex-wrap:wrap; gap:8px}
.steps li{font-family:var(--display); font-weight:600; font-size:14.5px; color:var(--ink);
  background:var(--paper); border:1.2px solid var(--rule); padding:5px 11px}
.analogy{margin-top:30px; display:grid; grid-template-columns:auto minmax(0,1fr); gap:20px; align-items:start}
.analogy .quotemark{font-family:var(--hand); font-weight:700; font-size:74px; line-height:.7;
  color:var(--tang); mix-blend-mode:multiply}
.analogy p{font-size:clamp(18px,1.7vw,22px); line-height:1.4; max-width:52ch; font-family:var(--display); font-weight:500; letter-spacing:-0.015em}
.analogy .attrib{font-family:var(--body); font-size:14.5px; color:var(--ink-2); margin-top:12px; font-weight:400; letter-spacing:0}

/* ---------------- principles ---------------- */
.principles{margin:32px 0 0; padding:0; list-style:none;
  display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:26px 30px}
.principles li{display:grid; grid-template-columns:auto minmax(0,1fr); gap:14px; align-items:start}
.principles .n{font-family:var(--hand); font-weight:700; font-size:34px; line-height:.9;
  color:var(--tang); mix-blend-mode:multiply}
.principles p{font-size:17px; line-height:1.4; font-weight:500}

/* ---------------- recipes ---------------- */
.cards{margin:32px 0 0; padding:0; list-style:none;
  display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:var(--gut); align-items:start}
.card{background:var(--paper); border:1.5px solid var(--ink); padding:24px 24px 26px;
  box-shadow:7px -6px 0 -1px rgba(18,51,204,.28)}
.card .cno{font-family:var(--display); font-size:11.5px; font-weight:800; letter-spacing:.16em;
  text-transform:uppercase; color:var(--tang-ink); display:block; margin-bottom:9px}
.card h3{margin-bottom:10px}
.card p{font-size:16px; color:var(--ink-2)}
.card ol{margin:12px 0 0; padding-left:20px; font-size:16px; color:var(--ink-2)}
.card ol li{margin-bottom:5px}
.card .attrib{margin-top:14px; font-size:15px; color:var(--ink-2); font-style:italic}
.card.pending{background:repeating-linear-gradient(45deg,rgba(232,84,31,.07) 0 8px,transparent 8px 16px),var(--paper);
  box-shadow:7px -6px 0 -1px rgba(232,84,31,.3)}
.cards-note{margin-top:22px; font-size:16px; color:var(--ink-2)}

/* ================ the people grid ================
   B4's pasted rectangular prints, re-inked in B3's two plates: an ink rule
   with the tangerine plate showing through up and to the right, exactly the
   misregister the discovery box and the recipe cards already print with.
   Built for auto-fill, so thirty people are the same object repeated. */
.people-grid{
  margin:34px 0 0; padding:0; list-style:none;
  display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr));
  gap:44px 20px; align-items:start;
}
.p-card{min-width:0}
.p-slot{position:relative; display:block}
.portrait-frame{
  display:block; position:relative; width:100%; aspect-ratio:1/1; overflow:hidden;
  background:var(--paper-3); border:2px solid var(--ink); text-decoration:none; color:inherit;
  box-shadow:7px -6px 0 -1px rgba(232,84,31,.55);
  transition:box-shadow .16s ease, transform .16s ease;
}
a.portrait-frame:hover{transform:translateY(-3px); box-shadow:9px -8px 0 -1px rgba(18,51,204,.42)}
.portrait-frame .shot{width:100%; height:100%; object-fit:cover; object-position:50% 26%;
  display:block; filter:saturate(1.05) contrast(1.03)}
/* the tangerine plate laid over the photograph, so a face prints warm like the map */
.portrait-frame .wash{position:absolute; inset:0; background:var(--tang); opacity:.10;
  mix-blend-mode:multiply; pointer-events:none; transition:opacity .16s ease}
a.portrait-frame:hover .wash{opacity:.18}
/* an unshot frame: hatched paper, a tangerine rule inset, a registration cross */
.photo-pending{
  position:absolute; inset:0; display:flex; align-items:flex-end; padding:14px;
  background-color:var(--paper-2);
  background-image:
    repeating-linear-gradient(45deg, rgba(18,51,204,.20) 0 1.5px, transparent 1.5px 9px),
    repeating-linear-gradient(45deg, rgba(232,84,31,.26) 0 1.5px, transparent 1.5px 27px);
}
.photo-pending::before{content:""; position:absolute; inset:9px;
  border:1.5px solid var(--tang); pointer-events:none}
.reg-cross{position:absolute; top:13px; right:13px; width:20px; height:20px}
.reg-cross path,.reg-cross circle{stroke:var(--cobalt); stroke-width:1.6; fill:none;
  stroke-linecap:round}
.hatch{position:relative; background:var(--paper); border:1.5px solid var(--ink);
  padding:8px 10px; box-shadow:3px -3px 0 rgba(23,24,28,.16); max-width:100%}
.hatch span{display:block; font-family:var(--display); font-weight:700; font-size:12.5px;
  line-height:1.3; color:var(--ink); overflow-wrap:break-word}
/* availability: a paper stamp pasted on the corner of the print — a cobalt
   outline plate with a tangerine ghost plate showing through, misregistered
   the same way as the frames and the recipe cards, not a solid UI badge */
.avail-tab{
  position:absolute; left:-6px; bottom:-11px; z-index:2;
  font-family:var(--display); font-weight:800; font-size:11.5px; text-transform:uppercase;
  letter-spacing:.09em; color:var(--cobalt-deep); background:var(--paper);
  border:1.5px solid var(--cobalt); padding:4px 9px;
  box-shadow:2.5px -2.5px 0 -0.5px rgba(232,84,31,.85);
  transform:rotate(-1deg);
}
.p-name{margin:28px 0 0; font-family:var(--display); font-weight:800; font-size:18px;
  text-transform:uppercase; letter-spacing:-0.012em; line-height:1.06; overflow-wrap:break-word}
.p-name a{color:var(--ink); text-decoration:none}
.p-name a:hover{color:var(--tang-ink)}
.name-rule{display:block; width:96px; height:10px; margin-top:8px; overflow:visible}
.name-rule path{stroke:var(--cobalt); stroke-width:3; fill:none;
  stroke-linecap:round; stroke-linejoin:round}
.p-head{margin-top:11px; font-size:15.5px; line-height:1.45; color:var(--ink-2)}
.p-head .ph{font-size:12.5px}
/* the empty pin — the last cell is always a place nobody has taken yet */
.pin-tile{display:block; text-decoration:none; color:inherit}
.pin-square{display:flex; align-items:center; justify-content:center; width:100%;
  aspect-ratio:1/1; background:rgba(232,84,31,.07); border:1.5px dashed var(--rule)}
.pin-circle{width:62%; aspect-ratio:1/1; border-radius:50%; border:2.5px dashed var(--cobalt);
  display:flex; align-items:center; justify-content:center; transition:border-color .16s ease}
.pin-circle svg{width:42%; height:auto}
.pin-circle svg path{stroke:var(--tang); stroke-width:11; stroke-linecap:round; fill:none}
.pin-tile:hover .pin-circle{border-color:var(--tang)}
.pin-label{display:block; margin-top:28px; font-family:var(--display); font-weight:800;
  font-size:16px; letter-spacing:-0.012em; line-height:1.15; color:var(--cobalt)}
.pin-tile:hover .pin-label{color:var(--tang-ink)}
.grid-cap{margin-top:34px; font-family:var(--display); font-size:11.5px; font-weight:700;
  letter-spacing:.15em; text-transform:uppercase; color:var(--ink-2)}

/* ---------------- get listed ---------------- */
.listed{background:rgba(232,84,31,.10); border-top:1.5px solid var(--ink); border-bottom:1.5px solid var(--ink)}
.band + .listed{border-top:0}
.listed-grid{display:grid; grid-template-columns:minmax(0,260px) minmax(0,1fr); gap:44px; align-items:start; margin-top:34px}
.empty-pin{position:relative; width:100%; max-width:230px; aspect-ratio:1/1; border-radius:50%;
  border:2.5px dashed var(--cobalt); display:flex; align-items:center; justify-content:center;
  mix-blend-mode:multiply}
.empty-pin svg{width:46%; height:auto; mix-blend-mode:multiply}
.pin-cap{margin-top:16px; font-family:var(--display); font-size:11.5px; font-weight:700;
  letter-spacing:.15em; text-transform:uppercase; color:var(--tang-ink); text-align:center; max-width:230px}
.listed p{font-size:17px; max-width:60ch}
.listed p + p{margin-top:18px}
.cta{margin-top:26px; display:inline-block; font-family:var(--display); font-weight:800; font-size:18px;
  color:#fff; background:var(--cobalt); padding:13px 22px; text-decoration:none;
  box-shadow:8px -7px 0 -1px var(--tang)}
.cta:hover{background:var(--cobalt-deep); color:#fff}
.cta-host{margin-top:12px; font-size:14px; color:var(--ink-2)}

/* ---------------- further learning ---------------- */
.learn{margin:30px 0 0; padding:0; list-style:none; max-width:74ch}
.learn li{padding:16px 0; border-top:1.5px dotted var(--tang)}
.learn li:last-child{border-bottom:1.5px dotted var(--tang)}
.learn .what{font-size:17px; font-family:var(--display); font-weight:600}
.learn .host{display:block; margin-top:4px; font-family:var(--body); font-weight:400;
  font-size:13.5px; color:var(--ink-2)}

/* ---------------- footer ---------------- */
.site-foot{border-top:1.5px solid var(--ink); background:var(--paper-2); padding:40px 0 56px}
.mark-f{font-family:var(--display); font-weight:800; font-size:15.5px; letter-spacing:-0.01em}
.fine{margin-top:14px; font-size:15.5px; color:var(--ink-2); max-width:78ch}

/* ================ a person's own page ================ */
.person{padding:44px 0 74px}
.person .wrap{max-width:940px}
.back-link{display:inline-block; font-family:var(--display); font-weight:700; font-size:14px;
  color:var(--ink-2); text-decoration:none; margin-bottom:30px}
.back-link:hover{color:var(--tang-ink)}
.person-grid{display:grid; grid-template-columns:minmax(0,300px) minmax(0,1fr);
  gap:52px; align-items:start}
.person-grid .portrait-frame{max-width:300px}
.person h1{font-size:clamp(32px,4.4vw,52px); text-transform:uppercase; letter-spacing:-0.035em}
.person .name-rule{width:140px; height:12px; margin-top:12px}
.person-head{margin-top:22px; font-size:clamp(18px,1.6vw,21px); line-height:1.4;
  font-family:var(--display); font-weight:500; letter-spacing:-0.015em; max-width:44ch}
.pmeta{margin-top:26px; font-size:16.5px}
.avail-yes{font-family:var(--display); font-weight:700; color:var(--cobalt)}
.person-bio{margin-top:26px; font-size:17px; line-height:1.55; max-width:56ch}
.p-block{margin-top:30px; padding-top:22px; border-top:1.5px dotted var(--tang); max-width:56ch}
.p-block .plinks a{display:inline-block; margin-right:16px}
.getintouch{margin-top:10px; font-family:var(--display); font-weight:700; font-size:17px}
.host{display:block; margin-top:5px; font-family:var(--body); font-weight:400;
  font-size:13.5px; color:var(--ink-2)}

/* ---------------- responsive ---------------- */
@media (max-width:1000px){
  .principles{grid-template-columns:repeat(2,minmax(0,1fr))}
}
@media (max-width:860px){
  .hero-grid{grid-template-columns:minmax(0,1fr); gap:30px}
  .map-wide{display:none}
  .map-tall{display:block}
  .stations{grid-template-columns:minmax(0,1fr); row-gap:0}
  .station{grid-row:auto; display:block; padding:22px 0 24px; border-left:0;
    border-top:1.5px dotted var(--tang)}
  .station:first-child{padding-left:0; border-top:1.5px dotted var(--tang)}
  .station .bit{margin-top:14px}
  .lanes{grid-template-columns:minmax(0,1fr)}
  .cards{grid-template-columns:minmax(0,1fr)}
  .listed-grid{grid-template-columns:minmax(0,1fr); gap:28px}
  .head-nav{display:none}
  .person-grid{grid-template-columns:minmax(0,1fr); gap:32px}
  .person-grid .portrait-frame{max-width:280px}
}
@media (max-width:620px){
  section{padding:52px 0}
  .hero{padding:34px 0 30px}
  .principles{grid-template-columns:minmax(0,1fr); gap:20px}
  .analogy{grid-template-columns:minmax(0,1fr); gap:2px}
  .analogy .quotemark{font-size:54px}
  .soft-links{font-size:16.5px}
  .discovery{padding:18px 18px; box-shadow:6px -5px 0 -1px rgba(232,84,31,.55)}
  .lane{padding:20px}
  .card{padding:20px}
  .people-grid{gap:40px 18px}
  .person{padding:34px 0 56px}
}
/* two equal columns below the old 1-column crossover (506px) — at ~163px
   cells the card typography needs its own scale, not the 220px-cell one */
@media (max-width:505px){
  .people-grid{ grid-template-columns:repeat(2,minmax(0,1fr)); gap:26px 14px }
  .p-name{ margin-top:18px; font-size:15px }
  .p-head{ margin-top:9px; font-size:13.5px; line-height:1.35 }
  .photo-pending{ padding:9px }
  .hatch{ padding:6px 7px }
  .hatch span{ font-size:10.5px }
  .avail-tab{ left:-4px; bottom:-9px; font-size:9px; letter-spacing:.11em; padding:3px 7px }
  .pin-label{ margin-top:18px; font-size:13px }
  .pin-circle svg{ width:38% }
}
@media (prefers-reduced-motion:reduce){*{animation:none !important; transition:none !important}}
`;

// ---------------------------------------------------------------- people grid
function frameInner(p, prefix) {
  if (p.photo) {
    const retina = `${p.slug}-960.jpg`;
    return (
      `<img class="shot" src="${escAttr(prefix)}img/${escAttr(p.photo)}" srcset="${escAttr(prefix)}img/${escAttr(retina)} 2x" ` +
      `alt="${escAttr(p.name)}" width="480" height="480" loading="lazy">` +
      `<span class="wash" aria-hidden="true"></span>`
    );
  }
  return (
    `<span class="photo-pending">${REG_CROSS}` +
    `<span class="hatch"><span>Portrait not supplied</span></span>` +
    `</span>`
  );
}

function card(p) {
  const href = `people/${p.slug}/`;
  const tab =
    p.availability === 'taking work now'
      ? `\n          <span class="avail-tab">Taking work now</span>`
      : '';
  return `        <li class="p-card">
          <span class="p-slot">
            <a class="portrait-frame" href="${escAttr(href)}" aria-label="${escAttr(p.name)} — profile">${frameInner(p, '')}</a>${tab}
          </span>
          <h3 class="p-name"><a href="${escAttr(href)}">${esc(p.name)}</a></h3>
          ${NAME_RULE}
          <p class="p-head">${esc(p.headline)}</p>
        </li>`;
}

const PIN_TILE = `        <li class="p-card">
          <a class="pin-tile" href="#listed">
            <span class="pin-square"><span class="pin-circle"><svg viewBox="0 0 100 100" aria-hidden="true" focusable="false"><path d="M50 16 V84"/><path d="M16 50 H84"/></svg></span></span>
            <span class="pin-label">Do this work? Get listed &rarr;</span>
          </a>
        </li>`;

function peopleSection() {
  const peopleIntro = people.length === 1
    ? 'One person who does this work independently. This person sets their own terms and availability. Contact them if they fit.'
    : `${countWord(people.length, true)} people do this work independently of each other. Each sets their own terms and availability. Contact whoever fits.`;
  return `  <!-- 02 people -->
  <section class="band" id="people" aria-labelledby="people-title">
    <div class="wrap">
      <div class="sec-head">
        <p class="legend">The people</p>
        <h2 id="people-title">People doing this work</h2>
        <p class="intro">${peopleIntro}</p>
        <p class="intro-2">Open a profile for availability, links and how to get in touch.</p>
      </div>
      <ul class="people-grid">
${people.map(card).join('\n')}
${PIN_TILE}
      </ul>
      <p class="grid-cap">Listed alphabetically. Nobody is first.</p>
    </div>
  </section>`;
}

// ---------------------------------------------------------------- index page
const INDEX_TITLE = 'AI uplift — a field guide for people and organisations in effective altruism';
const INDEX_DESC =
  'A field guide to AI uplift for people and organisations in effective altruism: where to start, what a session looks like, and who does the work.';

function indexPage() {
  return `<!DOCTYPE html>
<html lang="en-GB">
<head>
${head({ title: INDEX_TITLE, description: INDEX_DESC, canonical: 'https://eaaiuplift.com/' })}
<style>${CSS}${sectionCss}</style>
</head>
<body>
<div class="grain" aria-hidden="true"></div>

<header class="site-head">
  <div class="wrap">
    <a class="mark" href="#top"><span class="pin" aria-hidden="true"></span>EA AI Uplift</a>
    <nav class="head-nav" aria-label="Page sections">
${navLinks('')}
    </nav>
    <a class="head-cta" href="#people">Find a practitioner &rarr;</a>
  </div>
</header>

<main id="top">

  <!-- 01 opening -->
  <section class="hero" aria-labelledby="page-title">
    <div class="wrap">
      <div class="hero-grid">
        <div>
          <p class="legend">A field guide</p>
          <h1 id="page-title">AI uplift, for people and organisations in effective altruism</h1>
          <p class="lede">&ldquo;AI uplift&rdquo; is a working name for one kind of help: <b>someone who has tested the tools sits with you, or your organisation, and gets real work moving with them.</b> Not a course. Not a licence. Usually one session, sometimes a few weeks.</p>
          <p class="soft-links">
            <a class="hot" href="#people">Find someone to talk to &darr;</a>
            <a href="#map">See where you'd start &darr;</a>
            <a href="#listed">Do this work? Get listed &darr;</a>
          </p>
        </div>
        <div>
          <svg class="glimpse route-svg" viewBox="0 0 420 320" aria-hidden="true" focusable="false">
            <g class="plate-t" transform="translate(5,-4) rotate(0.35 210 160)">
              <g fill="none" stroke="#E8541F" stroke-width="1.6">
                <path d="M6 240 C 78 228 132 250 202 240 C 272 230 320 248 380 239 C 396 236 404 238 410 237"/>
                <path d="M6 272 C 82 262 138 282 208 272 C 280 262 326 280 384 271 C 398 269 404 272 410 271"/>
                <path d="M6 300 C 86 292 142 310 214 300"/>
              </g>
              <g stroke="#E8541F" stroke-width="1.8" stroke-linecap="round">
                <path d="M262 296 l 14 -22 M288 302 l 14 -22 M314 296 l 14 -22 M340 302 l 14 -22"/>
              </g>
              <path d="M14 286 C 74 268 108 250 158 226 C 216 198 246 190 288 176 C 322 164 350 152 380 140"
                fill="none" stroke="#E8541F" stroke-width="4" stroke-linecap="round"/>
              <path d="M92 40 L 103 81 L 144 92 L 103 103 L 92 144 L 81 103 L 40 92 L 81 81 Z" fill="#E8541F" opacity=".55"/>
              <g fill="#E8541F">
                <circle cx="14" cy="286" r="9"/><circle cx="158" cy="226" r="9"/><circle cx="288" cy="176" r="9"/>
              </g>
            </g>
            <g class="plate-c">
              <path d="M14 286 C 74 268 108 250 158 226 C 216 198 246 190 288 176 C 322 164 350 152 380 140"
                fill="none" stroke="#1233CC" stroke-width="4" stroke-linecap="round"/>
              <path d="M158 226 C 178 196 196 182 220 168" fill="none" stroke="#1233CC" stroke-width="2"
                stroke-dasharray="2 9" stroke-linecap="round"/>
              <circle cx="224" cy="165" r="6.5" fill="none" stroke="#1233CC" stroke-width="2"/>
              <g fill="#1233CC">
                <circle cx="14" cy="286" r="9"/><circle cx="158" cy="226" r="9"/><circle cx="288" cy="176" r="9"/>
              </g>
              <g transform="translate(92 92)">
                <path d="M0 -52 L 11 -11 L 52 0 L 11 11 L 0 52 L -11 11 L -52 0 L -11 -11 Z"
                  fill="none" stroke="#1233CC" stroke-width="2.2"/>
                <circle cx="0" cy="0" r="63" fill="none" stroke="#1233CC" stroke-width="1.5" stroke-dasharray="5 8"/>
                <circle cx="0" cy="0" r="4.4" fill="#1233CC"/>
              </g>
            </g>
            <text x="92" y="17" text-anchor="middle" font-size="12.5" letter-spacing="2" fill="#1233CC">N</text>
          </svg>
          <p class="glimpse-cap">Fig. 1 &mdash; the route, detail</p>
          <p class="sub-lede">This page explains what that help can look like, and lists ${countWord(people.length)} ${people.length === 1 ? 'person who does' : 'people who do'} it independently.</p>
        </div>
      </div>
    </div>
  </section>

${peopleSection()}

${slot('asks')}  <!-- 03 the route -->
  <section id="map" aria-labelledby="map-title">
    <div class="wrap">
      <div class="sec-head">
        <p class="legend">The route</p>
        <h2 id="map-title">Where you'd start</h2>
        <p class="intro">The useful intervention depends on where you are now. Five common starting points:</p>
      </div>

      <figure class="map-figure">
        <svg class="map-wide route-svg" viewBox="0 0 1200 430" aria-hidden="true" focusable="false">
          <!-- tangerine plate, printed slightly off register -->
          <g class="plate-t" transform="translate(5,-4) rotate(0.3 600 215)">
            <g fill="none" stroke="#E8541F" stroke-width="1.6" opacity=".85">
              <path d="M0 388 C 160 368 300 398 460 382 C 620 366 740 394 900 378 C 1040 364 1130 382 1200 372"/>
              <path d="M0 414 C 170 396 312 424 472 408 C 632 392 752 420 912 404 C 1050 390 1136 406 1200 398"/>
              <path d="M560 44 C 690 30 800 56 924 42 C 1046 28 1140 50 1200 40"/>
              <path d="M508 70 C 632 58 736 82 856 70"/>
            </g>
            <g stroke="#E8541F" stroke-width="1.8" opacity=".8" stroke-linecap="round">
              <path d="M40 348 l 18 -26 M70 356 l 18 -26 M100 350 l 18 -26 M130 358 l 18 -26 M160 352 l 18 -26"/>
              <path d="M960 300 l 18 -26 M990 308 l 18 -26 M1020 302 l 18 -26"/>
            </g>
            <path d="M36 356 C 64 350 88 340 110 330 C 190 296 268 302 300 300 C 336 298 352 294 370 288 C 452 260 508 300 560 312 C 582 317 596 317 610 316 C 700 312 760 276 812 246 C 832 234 846 230 860 226 C 946 202 986 186 1030 160 C 1054 146 1074 138 1090 132 C 1122 120 1146 112 1168 104"
              fill="none" stroke="#E8541F" stroke-width="4" stroke-linecap="round" opacity=".95"/>
            <g fill="#E8541F" opacity=".62">
              <circle cx="110" cy="330" r="26"/><circle cx="370" cy="288" r="26"/><circle cx="610" cy="316" r="26"/>
              <circle cx="860" cy="226" r="26"/><circle cx="1090" cy="132" r="26"/>
            </g>
            <path d="M140 96 L 152 148 L 204 160 L 152 172 L 140 224 L 128 172 L 76 160 L 128 148 Z" fill="#E8541F" opacity=".5"/>
          </g>

          <!-- cobalt plate -->
          <g class="plate-c">
            <path d="M36 356 C 64 350 88 340 110 330 C 190 296 268 302 300 300 C 336 298 352 294 370 288 C 452 260 508 300 560 312 C 582 317 596 317 610 316 C 700 312 760 276 812 246 C 832 234 846 230 860 226 C 946 202 986 186 1030 160 C 1054 146 1074 138 1090 132 C 1122 120 1146 112 1168 104"
              fill="none" stroke="#1233CC" stroke-width="4" stroke-linecap="round"/>
            <path d="M370 288 C 396 246 430 214 468 190" fill="none" stroke="#1233CC" stroke-width="2.2"
              stroke-dasharray="2 10" stroke-linecap="round" opacity=".85"/>
            <circle cx="472" cy="184" r="7" fill="none" stroke="#1233CC" stroke-width="2.2" opacity=".85"/>
            <path d="M610 316 C 646 352 690 366 736 372" fill="none" stroke="#1233CC" stroke-width="2.2"
              stroke-dasharray="2 10" stroke-linecap="round" opacity=".85"/>
            <circle cx="742" cy="373" r="7" fill="none" stroke="#1233CC" stroke-width="2.2" opacity=".85"/>
            <g fill="#1233CC">
              <circle cx="110" cy="330" r="26"/><circle cx="370" cy="288" r="26"/><circle cx="610" cy="316" r="26"/>
              <circle cx="860" cy="226" r="26"/><circle cx="1090" cy="132" r="26"/>
            </g>
            <!-- compass rose -->
            <g transform="translate(140 160)">
              <path d="M0 -64 L 12 -12 L 64 0 L 12 12 L 0 64 L -12 12 L -64 0 L -12 -12 Z"
                fill="none" stroke="#1233CC" stroke-width="2.2"/>
              <circle cx="0" cy="0" r="76" fill="none" stroke="#1233CC" stroke-width="1.5" stroke-dasharray="5 8" opacity=".8"/>
              <circle cx="0" cy="0" r="5" fill="#1233CC"/>
            </g>
          </g>
          <!-- knocked-out plate: numerals and labels print solid -->
          <g class="num" fill="#F6F3EB" font-size="27" text-anchor="middle">
            <text x="110" y="340">1</text><text x="370" y="298">2</text><text x="610" y="326">3</text>
            <text x="860" y="236">4</text><text x="1090" y="142">5</text>
          </g>
          <text x="140" y="76" text-anchor="middle" font-size="13" letter-spacing="2" fill="#1233CC">N</text>
          <g fill="#4C5059" font-size="12.5" letter-spacing="2.4">
            <text x="34" y="300">JUST THE CHAT BOX</text>
            <text x="1176" y="60" text-anchor="end">HEAVY DAILY USE</text>
          </g>
        </svg>

        <svg class="map-tall route-svg" viewBox="0 0 320 640" aria-hidden="true" focusable="false">
          <g class="plate-t" transform="translate(5,-4) rotate(0.3 160 320)">
            <g fill="none" stroke="#E8541F" stroke-width="1.5" opacity=".85">
              <path d="M6 240 C60 232 100 250 156 242 C212 234 260 250 310 240"/>
              <path d="M6 478 C62 470 102 488 158 480 C214 472 262 488 310 478"/>
            </g>
            <g stroke="#E8541F" stroke-width="1.7" opacity=".8" stroke-linecap="round">
              <path d="M206 328 l 13 -21 M232 334 l 13 -21 M258 328 l 13 -21"/>
            </g>
            <path d="M44 44 C54 66 62 84 70 100 C88 134 128 150 168 164 C196 174 220 180 232 194 C250 214 244 240 214 258 C184 276 120 288 80 312 C44 334 52 372 104 394 C152 414 214 404 240 430 C264 454 250 486 200 508 C160 526 112 518 96 546 C84 568 88 588 96 604" fill="none" stroke="#E8541F" stroke-width="3.6" stroke-linecap="round"/>
            <g fill="#E8541F" opacity=".62">
              <circle cx="70" cy="100" r="22"/><circle cx="232" cy="194" r="22"/><circle cx="80" cy="312" r="22"/>
              <circle cx="240" cy="430" r="22"/><circle cx="96" cy="546" r="22"/>
            </g>
          </g>
          <g class="plate-c">
            <path d="M44 44 C54 66 62 84 70 100 C88 134 128 150 168 164 C196 174 220 180 232 194 C250 214 244 240 214 258 C184 276 120 288 80 312 C44 334 52 372 104 394 C152 414 214 404 240 430 C264 454 250 486 200 508 C160 526 112 518 96 546 C84 568 88 588 96 604" fill="none" stroke="#1233CC" stroke-width="3.6" stroke-linecap="round"/>
            <path d="M232 194 C254 182 268 168 276 152" fill="none" stroke="#1233CC" stroke-width="2"
              stroke-dasharray="2 9" stroke-linecap="round" opacity=".85"/>
            <circle cx="279" cy="145" r="6" fill="none" stroke="#1233CC" stroke-width="2" opacity=".85"/>
            <g fill="#1233CC">
              <circle cx="70" cy="100" r="22"/><circle cx="232" cy="194" r="22"/><circle cx="80" cy="312" r="22"/>
              <circle cx="240" cy="430" r="22"/><circle cx="96" cy="546" r="22"/>
            </g>
            <g transform="translate(254 76)">
              <path d="M0 -36 L 7 -7 L 36 0 L 7 7 L 0 36 L -7 7 L -36 0 L -7 -7 Z" fill="none" stroke="#1233CC" stroke-width="2"/>
              <circle cx="0" cy="0" r="46" fill="none" stroke="#1233CC" stroke-width="1.4" stroke-dasharray="4 7" opacity=".8"/>
              <circle cx="0" cy="0" r="3.6" fill="#1233CC"/>
            </g>
          </g>
          <g class="num" fill="#F6F3EB" font-size="23" text-anchor="middle">
            <text x="70" y="108">1</text><text x="232" y="202">2</text><text x="80" y="320">3</text>
            <text x="240" y="438">4</text><text x="96" y="554">5</text>
          </g>
          <text x="254" y="22" text-anchor="middle" font-size="11" letter-spacing="2" fill="#1233CC">N</text>
          <g fill="#4C5059" font-size="11" letter-spacing="2">
            <text x="6" y="18">JUST THE CHAT BOX</text>
            <text x="314" y="626" text-anchor="end">HEAVY DAILY USE</text>
          </g>
        </svg>

        <ol class="stations">
          <li class="station">
            <p class="pin"><span class="disc-sm" aria-hidden="true">1</span></p>
            <h3>You only use the chat box</h3>
            <div class="bit"><span class="label">What a session does</span><p>Pick one accessible tool and finish one real task together</p></div>
            <div class="bit worked"><span class="label">You know it worked when</span><p>Useful work is done before the session ends</p></div>
          </li>
          <li class="station">
            <p class="pin"><span class="disc-sm" aria-hidden="true">2</span></p>
            <h3>You have one clear problem</h3>
            <div class="bit"><span class="label">What a session does</span><p>Twenty minutes of questions, then one clear win, built or configured live</p></div>
            <div class="bit worked"><span class="label">You know it worked when</span><p>A working change exists before the session ends</p></div>
          </li>
          <li class="station">
            <p class="pin"><span class="disc-sm" aria-hidden="true">3</span></p>
            <h3>You have many pain points</h3>
            <div class="bit"><span class="label">What a session does</span><p>Triage the list and name an intervention for each priority</p></div>
            <div class="bit worked"><span class="label">You know it worked when</span><p>You leave with a ranked route</p></div>
          </li>
          <li class="station">
            <p class="pin"><span class="disc-sm" aria-hidden="true">4</span></p>
            <h3>You know the task but can't start</h3>
            <div class="bit"><span class="label">What a session does</span><p>Someone works beside you while you do it</p></div>
            <div class="bit worked"><span class="label">You know it worked when</span><p>The blocked task moves or finishes</p></div>
          </li>
          <li class="station">
            <p class="pin"><span class="disc-sm" aria-hidden="true">5</span></p>
            <h3>You already use AI heavily</h3>
            <div class="bit"><span class="label">What a session does</span><p>Longer delegation, parallel agents, task tracking, reusable documentation</p></div>
            <div class="bit worked"><span class="label">You know it worked when</span><p>You delegate more without losing state</p></div>
          </li>
        </ol>
        <figcaption class="footnote">These are possible interventions, not packages. Any practitioner will shape a session to the person in front of them.</figcaption>
      </figure>
    </div>
  </section>

  <!-- 04 inside an organisation -->
  <section class="band" id="tracks" aria-labelledby="tracks-title">
    <div class="wrap">
      <div class="sec-head">
        <p class="legend">Two tracks</p>
        <h2 id="tracks-title">Inside an organisation</h2>
        <p class="intro">For a whole organisation, two things run together.</p>
      </div>

      <div class="discovery">
        <p class="d-title">Discovery before the build list</p>
        <p>Fifteen-minute calls with team leads and staff about recent work, bottlenecks and what they dislike &mdash; no leading questions, no tool pitched. Group the pain points, then choose.</p>
      </div>

      <div class="lanes">
        <div class="lane">
          <span class="lane-key">Track A</span>
          <h3>Staff adoption</h3>
          <ol class="steps">
            <li>Intake</li><li>Open discovery</li><li>One-to-one sessions</li>
            <li>Practical wins</li><li>Tool configuration</li><li>Advanced-workflow coaching</li>
          </ol>
        </div>
        <div class="lane">
          <span class="lane-key">Track B</span>
          <h3>Operations improvement</h3>
          <ol class="steps">
            <li>Short interviews</li><li>Pain-point map</li><li>Then tools, automations and system fixes</li>
          </ol>
        </div>
      </div>

      <div class="analogy">
        <p class="quotemark" aria-hidden="true">&ldquo;</p>
        <div>
          <p>Think of an internal IT function for AI &mdash; someone who tests the main tools, knows their real limits, answers capability questions, writes the guidance down where people can find it, and keeps it current as tools change.</p>
          <p class="attrib">A working model from one practitioner, not an official definition.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- 05 principles -->
  <section id="principles" aria-labelledby="principles-title">
    <div class="wrap">
      <div class="sec-head">
        <p class="legend">Field notes</p>
        <h2 id="principles-title">What good uplift looks like</h2>
        <p class="intro">Six principles.</p>
      </div>
      <ol class="principles">
        <li><span class="n" aria-hidden="true">1</span><p>Work on a real task, not links or theory.</p></li>
        <li><span class="n" aria-hidden="true">2</span><p>Use the most accessible tool that meets the need.</p></li>
        <li><span class="n" aria-hidden="true">3</span><p>Test integrations; don't trust the model's claims.</p></li>
        <li><span class="n" aria-hidden="true">4</span><p>Leave reusable instructions or Markdown behind.</p></li>
        <li><span class="n" aria-hidden="true">5</span><p>Start from demand and adoption, not infrastructure.</p></li>
        <li><span class="n" aria-hidden="true">6</span><p>Small wins where they fit, then deeper work.</p></li>
      </ol>
    </div>
  </section>

  <!-- 06 recipes -->
  <section class="band" id="recipes" aria-labelledby="recipes-title">
    <div class="wrap">
      <div class="sec-head">
        <p class="legend">How this work is done</p>
        <h2 id="recipes-title">Recipes</h2>
        <p class="intro">The methods behind the sessions, written down so anyone can use them. Published here as they settle, each attributed to whoever wrote it.</p>
      </div>
      <ul class="cards">
        <li class="card">
          <span class="cno">Recipe card 1</span>
          <h3>The starting-point map</h3>
          <p>Five starting points and what a session does at each. <a href="#map">See above &uarr;</a></p>
        </li>
        <li class="card">
          <span class="cno">Recipe card 2</span>
          <h3>Discovery interviews</h3>
          <ol>
            <li>Fifteen-minute calls with team leads and staff.</li>
            <li>Ask about recent work, bottlenecks and what they dislike doing.</li>
            <li>No leading questions. No tool pitched.</li>
            <li>Group the pain points.</li>
            <li>Choose the first intervention from the groups, not from the tools.</li>
          </ol>
          <p class="attrib">A working method from one practitioner, not a standard.</p>
        </li>
      </ul>
      <p class="cards-note">More methods will be published after contributor review.</p>
    </div>
  </section>

${slot('offers')}  <!-- 07 get listed -->
  <section class="listed" id="listed" aria-labelledby="listed-title">
    <div class="wrap">
      <div class="sec-head">
        <p class="legend">An empty pin on the map</p>
        <h2 id="listed-title">Doing this work yourself?</h2>
      </div>
      <div class="listed-grid">
        <div>
          <div class="empty-pin" aria-hidden="true">
            <svg viewBox="0 0 100 100" focusable="false"><g stroke="#E8541F" stroke-width="11" stroke-linecap="round"><path d="M50 16 V84"/><path d="M16 50 H84"/></g></svg>
          </div>
          <p class="pin-cap">A place on the map</p>
        </div>
        <div>
          <p>If you help people or organisations in this community use AI well, submit your own approved public profile through the form below, or through GitHub.</p>
          <p><a class="cta" href="${escAttr(site.addYourselfFormUrl)}">Get listed &rarr; add yourself to the directory</a></p>
          <p class="cta-host">${esc(new URL(site.addYourselfFormUrl).host)}</p>
          <p>Listing is free. The only test is that you do this work with people or organisations in this community and are happy to be contacted.</p>
          <p>Shared recipes &mdash; the starting-point map and discovery interviews &mdash; are published as contributors approve them.</p>
        </div>
      </div>
    </div>
  </section>

${slot('guides') || `  <!-- 08 further learning -->
  <section id="learning" aria-labelledby="learning-title">
    <div class="wrap">
      <div class="sec-head">
        <p class="legend">Further reading</p>
        <h2 id="learning-title">Further learning</h2>
      </div>
      <p class="intro">New public resources will appear here after review.</p>
    </div>
  </section>
`}
</main>

${footer()}

</body>
</html>
`;
}

// ---------------------------------------------------------------- person page
function personFrame(p) {
  if (p.photo) {
    return `<div class="portrait-frame"><img class="shot" src="../../img/${escAttr(p.photo)}" srcset="../../img/${escAttr(p.slug)}-960.jpg 2x" alt="${escAttr(
      p.name,
    )}" width="480" height="480"><span class="wash" aria-hidden="true"></span></div>`;
  }
  return `<div class="portrait-frame"><span class="photo-pending">${REG_CROSS}<span class="hatch"><span>Portrait not supplied</span></span></span></div>`;
}

function availabilityLine(p) {
  const labels = {
    available: 'Available for work',
    limited: 'Limited availability',
    unavailable: 'Not taking work',
    unknown: 'Availability not stated',
  };
  const text = labels[p.availability];
  return p.availability === 'available' ? `<span class="avail-yes">${text}</span>` : text;
}

function linksBlock(p) {
  const bits = [];
  if (typeof p.site === 'string' && p.site) bits.push(`<a href="${escAttr(p.site)}" rel="noopener">${esc(p.site)}</a>`);
  if (!bits.length) return '';
  return `        <div class="p-block">
          <span class="label">Links</span>
          <p class="plinks">${bits.join('\n            ')}</p>
        </div>`;
}

function contactBlock(p) {
  const host = new URL(p.contact).host;
  return `        <div class="p-block">
          <span class="label">Get in touch</span>
          <p class="getintouch"><a href="${escAttr(p.contact)}" rel="noopener">Get in touch &rarr;</a>${host ? `<span class="host">${esc(host)}</span>` : ''}</p>
        </div>`;
}

function personPage(p) {
  const headline = esc(p.headline);
  const bio = esc(p.bio);
  return `<!DOCTYPE html>
<html lang="en-GB">
<head>
${head({
  title: `${p.name} — EA AI Uplift`,
  description: p.headline,
  canonical: `https://eaaiuplift.com/people/${p.slug}/`,
})}
<style>${CSS}${sectionCss}</style>
</head>
<body>
<div class="grain" aria-hidden="true"></div>

<header class="site-head">
  <div class="wrap">
    <a class="mark" href="../../"><span class="pin" aria-hidden="true"></span>EA AI Uplift</a>
    <nav class="head-nav" aria-label="Page sections">
${navLinks('../../')}
    </nav>
    <a class="head-cta" href="../../#people">Find a practitioner &rarr;</a>
  </div>
</header>

<main>
  <section class="person">
    <div class="wrap">
      <a class="back-link" href="../../#people">&larr; All people</a>
      <div class="person-grid">
        <div>
          ${personFrame(p)}
        </div>
        <div>
          <p class="legend">Listed on the map</p>
          <h1>${esc(p.name)}</h1>
          ${NAME_RULE}
          <p class="person-head">${headline}</p>
          <p class="pmeta"><span class="label">Availability</span>${availabilityLine(p)}</p>${
            p.bio === p.headline ? '' : `
          <p class="person-bio">${bio}</p>`
          }
${linksBlock(p)}
${contactBlock(p)}
        </div>
      </div>
    </div>
  </section>
</main>

${footer()}

</body>
</html>
`;
}

// ---------------------------------------------------------------- write
if (fs.existsSync(outDir) && fs.lstatSync(outDir).isSymbolicLink()) die('dist must not be a symlink');
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'index.html'), indexPage());
for (const p of people) {
  const dir = path.join(outDir, 'people', p.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), personPage(p));
}
for (const [name, mod] of Object.entries(sections)) {
  for (const page of mod.pages(ctx(name))) {
    if (!/^[a-z0-9]+(?:[-/][a-z0-9]+)*\/index\.html$/u.test(page.path)) die(`${name} page path is unsafe: ${page.path}`);
    const target = path.join(outDir, page.path);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, page.html);
  }
}
fs.mkdirSync(path.join(outDir, 'img'));
for (const p of people) {
  if (!p.photo) continue;
  fs.copyFileSync(path.join(imgDir, p.photo), path.join(outDir, 'img', p.photo));
  fs.copyFileSync(path.join(imgDir, `${p.slug}-960.jpg`), path.join(outDir, 'img', `${p.slug}-960.jpg`));
}
fs.copyFileSync(path.join(scriptDir, 'og.png'), path.join(outDir, 'og.png'));
console.log(
  `build.mjs: wrote index.html and ${people.length} person page${people.length === 1 ? '' : 's'} to ${outDir}`,
);
