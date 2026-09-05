// The page shell: stylesheet, <head>, masthead, footer. Every generated page —
// the home page, a person's page, and any section sub-page — is rendered through
// renderPage() so the footer links, metadata and print palette stay identical.
import { esc, escAttr } from './shared.mjs';

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


export { CSS, REG_CROSS, FOOTER_FINE, footer, head };

// nav: the masthead links as HTML (build.mjs derives them from the section
// registry); css: extra stylesheet text (the section modules' css, joined).
export function renderPage({ title, description, canonical, prefix = '', nav = '', body, css = '', home = false, extraHead = '' }) {
  return `<!DOCTYPE html>
<html lang="en-GB">
<head>
${head({ title, description, canonical, extra: extraHead })}
<style>${CSS}${css}</style>
</head>
<body>
<div class="grain" aria-hidden="true"></div>

<header class="site-head">
  <div class="wrap">
    <a class="mark" href="${home ? '#top' : escAttr(prefix)}"><span class="pin" aria-hidden="true"></span>EA AI Uplift</a>
    <nav class="head-nav" aria-label="Page sections">
${nav}
    </nav>
    <a class="head-cta" href="${escAttr(prefix)}#people">Find a practitioner &rarr;</a>
  </div>
</header>

<main${home ? ' id="top"' : ''}>
${body}
</main>

${footer()}

</body>
</html>
`;
}
