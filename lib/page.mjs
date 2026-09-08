// The page shell: stylesheet, <head>, masthead, footer. Every generated page —
// the home page, a person's page, and any section sub-page — is rendered through
// renderPage() so the footer links, metadata and print palette stay identical.
import { esc, escAttr } from './shared.mjs';

// ---------------------------------------------------------------- shared pieces
const REG_CROSS = `<svg class="reg-cross" viewBox="0 0 22 22" aria-hidden="true" focusable="false"><path vector-effect="non-scaling-stroke" d="M11 1.4V20.6M1.4 11H20.6"/><circle vector-effect="non-scaling-stroke" cx="11" cy="11" r="6"/></svg>`;

const FOOTER_FINE = 'Curated and maintained by <a href="https://alexanderlarge.com">Alexander Large</a> · <a href="https://github.com/alex-is-learning/ea-ai-uplift">Open source on GitHub</a> · Contributions welcome';

function footer() {
  return `<footer class="site-foot">
  <div class="wrap">
    <p class="fine">${FOOTER_FINE}</p>
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
<script>window.va=window.va||function(){(window.vaq=window.vaq||[]).push(arguments)};</script>
<script defer src="/_vercel/insights/script.js"></script>
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
  font-family:var(--body); font-size:16px; line-height:1.55;
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
h1{font-size:clamp(32px,4.2vw,50px); font-weight:800; letter-spacing:-0.04em}
h2{font-size:clamp(24px,2.8vw,32px); font-weight:800; letter-spacing:-0.03em}
h3{font-size:17.5px; letter-spacing:-0.018em; line-height:1.2; font-weight:700}
p{margin:0}
a{color:var(--cobalt); text-underline-offset:3px; text-decoration-thickness:1.5px}
a:hover{color:var(--tang-ink)}
:focus-visible{outline:3px solid var(--tang); outline-offset:3px; border-radius:2px}

/* map-legend eyebrow: a printed lozenge + a label */
.legend{
  display:flex; align-items:center; gap:9px; margin:0 0 10px;
  font-family:var(--display); font-size:11.5px; font-weight:700;
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
.head-nav{display:flex; gap:18px; font-family:var(--display); font-size:13px; font-weight:600}
.head-nav a{color:var(--ink-2); text-decoration:none}
.head-nav a:hover{color:var(--cobalt); text-decoration:underline}
.head-nav a[aria-current="page"]{color:var(--cobalt); box-shadow:inset 0 -2px 0 0 var(--tang)}
.head-cta{margin-left:auto; flex:none; white-space:nowrap; text-decoration:none; color:var(--cobalt);
  font-family:var(--display); font-weight:700; font-size:14px; letter-spacing:-0.005em;
  padding:3px 0 4px; box-shadow:inset 0 -2.5px 0 0 var(--cobalt)}
.head-cta:hover{color:var(--tang-ink); box-shadow:inset 0 -2.5px 0 0 var(--tang)}
/* anchors must clear the sticky masthead */
main[id],section[id]{scroll-margin-top:66px}

/* ---------------- hero ---------------- */
.hero{padding:40px 0 34px; position:relative}
.hero h1{max-width:30ch}
.lede{font-size:clamp(17px,1.4vw,19px); line-height:1.5; margin-top:16px; max-width:64ch}
.lede b{font-weight:700; box-shadow:inset 0 -.42em 0 rgba(232,84,31,.28)}
.sub-lede{font-size:16.5px; color:var(--ink-2); margin-top:22px; max-width:54ch}
.soft-links{display:flex; flex-wrap:wrap; align-items:baseline; gap:10px 26px; margin-top:22px;
  font-family:var(--display); font-weight:700; font-size:15.5px}
.soft-links a{text-decoration:none; color:var(--ink); padding:3px 0 4px;
  box-shadow:inset 0 -3px 0 0 var(--cobalt)}
.soft-links a:hover{box-shadow:inset 0 -3px 0 0 var(--tang); color:var(--tang-ink)}
.soft-links a.hot{color:var(--cobalt)}
.home-page{min-height:100svh; display:flex; flex-direction:column}
.home-page main{flex:1}
.home-hub{padding:36px 0 40px}
.home-grid{display:grid; grid-template-columns:minmax(240px,.72fr) minmax(460px,1.28fr); gap:46px 72px; align-items:stretch}
.home-copy{display:flex; flex-direction:column; min-width:0}
.home-copy h1{max-width:14ch; flex-shrink:0}
.home-copy .lede{max-width:40ch; flex-shrink:0}
.home-robot{display:block; width:100%; max-width:390px; height:auto; min-height:80px; aspect-ratio:5/3; margin:28px auto 0; flex:0 1 auto; overflow:hidden}
.home-robot .bulb-blue{fill:var(--cobalt)}
.home-robot .bulb-orange{fill:var(--tang)}
.route-board{position:relative; margin-top:2px; align-self:start}
.route-board::before{content:""; position:absolute; inset:-7px 8px 7px -8px; border:2px solid var(--tang); transform:rotate(-.35deg); pointer-events:none; opacity:.8}
.route-list{position:relative; margin:0; padding:0; list-style:none; border:1.5px solid var(--ink); background:var(--paper)}
.route-list li+li{border-top:1.5px dotted var(--tang)}
.route-link{display:grid; grid-template-columns:minmax(0,1fr) auto; gap:8px 22px; align-items:center; min-height:78px; padding:13px 17px; color:var(--ink); text-decoration:none}
.route-link:hover{background:var(--paper-2); color:var(--cobalt-deep)}
.route-title{display:block; font-family:var(--display); font-size:clamp(18px,1.8vw,23px); font-weight:800; line-height:1.08; letter-spacing:-.025em}
.route-desc{display:block; margin-top:4px; max-width:48ch; font-size:14.5px; line-height:1.35; color:var(--ink-2)}
.route-open{font-family:var(--display); font-size:11px; font-weight:800; letter-spacing:.13em; text-transform:uppercase; color:var(--cobalt)}
.legacy-anchor{display:none}
.sec-links{display:flex; flex-wrap:wrap; gap:10px 28px; margin-top:22px;
  font-family:var(--display); font-weight:700; font-size:15.5px}
.more{text-decoration:none; color:var(--cobalt); padding:3px 0 4px; box-shadow:inset 0 -2.5px 0 0 var(--cobalt)}
.more:hover{color:var(--tang-ink); box-shadow:inset 0 -2.5px 0 0 var(--tang)}

/* ---------------- section frame ---------------- */
section{padding:40px 0; position:relative}
.sec-head{max-width:74ch}
.sec-head .intro{margin-top:12px; font-size:16.5px; color:var(--ink-2); max-width:60ch}
.sec-head .intro-2{margin-top:8px; font-size:15.5px; color:var(--ink-2); max-width:60ch}
.sub-page{padding:40px 0 64px}
.sub-page .wrap{max-width:940px}
.sub-page h1{font-size:clamp(28px,3.8vw,44px)}
.sub-page .lede{margin-top:16px; max-width:64ch; font-size:17px}
.sub-page .cards{margin-top:30px}
.sub-page .back-link{margin-bottom:22px}
.band{background:var(--paper-2); border-top:1.5px solid var(--ink); border-bottom:1.5px solid var(--ink)}

/* ---------------- the route ---------------- */
.map-figure{margin:22px 0 0}
.map-wide{display:block; width:100%; max-width:600px; margin:0 auto; height:auto}
.map-tall{display:none; width:100%; max-width:340px; margin:0 auto; height:auto}
.route-svg text{font-family:var(--display); font-weight:700}
.route-svg .num{font-family:var(--hand); font-weight:700}
.plate-t{mix-blend-mode:multiply; opacity:.74}
.plate-c{mix-blend-mode:multiply}

.stations{display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:0;
  margin:18px 0 0; padding:0; list-style:none}
.station{grid-row:span 4; display:grid; grid-template-rows:subgrid; row-gap:10px;
  padding:14px 16px 16px; border-left:1.5px dotted var(--tang)}
.station:first-child{padding-left:0; border-left:0}
.station .pin{display:flex; align-items:center; gap:10px}
.station .disc-sm{
  width:28px; height:28px; border-radius:50%; background:var(--cobalt); color:#fff;
  font-family:var(--hand); font-weight:700; font-size:16px; line-height:1;
  display:flex; align-items:center; justify-content:center; flex:none;
  box-shadow:3px -3px 0 0 var(--tang); mix-blend-mode:multiply;
}
.station h3{font-size:16px}
.station .bit p{font-size:14.5px; line-height:1.4; color:var(--ink-2)}
.station .bit.worked p{color:var(--ink); font-weight:500}
.station .bit.worked .label{color:var(--tang-ink)}
.footnote{margin-top:16px; font-size:14.5px; color:var(--ink-2); max-width:72ch}

/* ---------------- organisation ---------------- */
.org-grid{display:grid; grid-template-columns:minmax(0,1.15fr) minmax(0,1fr) minmax(0,1fr); gap:var(--gut); margin-top:24px; align-items:stretch}
.org-grid .lanes{display:contents}
.d-steps{margin:8px 0 0; padding-left:20px; font-size:15px; color:var(--ink-2)}
.d-steps li{margin-bottom:4px}
.discovery{
  padding:18px 20px; background:var(--paper);
  border:1.5px solid var(--cobalt); box-shadow:8px -7px 0 -1px rgba(232,84,31,.55);
}
.discovery .d-title{font-family:var(--display); font-weight:800; font-size:18px;
  letter-spacing:-0.02em; color:var(--cobalt-deep); margin-bottom:8px}
.discovery p{font-size:16px}
.lanes{display:grid; grid-template-columns:1fr; gap:14px}
.lane{padding:16px 18px 18px; background:var(--paper-2); border:1.5px solid var(--ink)}
.lane:nth-child(2){background:rgba(232,84,31,.09)}
.lane-key{display:inline-block; font-family:var(--display); font-size:11.5px; font-weight:800;
  letter-spacing:.15em; text-transform:uppercase; color:#fff; background:var(--cobalt);
  padding:3px 9px; margin-bottom:12px}
.lane:nth-child(2) .lane-key{background:var(--tang-ink)}
.steps{margin:10px 0 0; padding:0; list-style:none; display:flex; flex-wrap:wrap; gap:6px}
.steps li{font-family:var(--display); font-weight:600; font-size:13.5px; color:var(--ink);
  background:var(--paper); border:1.2px solid var(--rule); padding:5px 11px}

/* ---------------- principles ---------------- */
.principles{margin:20px 0 0; padding:0; list-style:none;
  display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:14px 28px}
.principles li{display:grid; grid-template-columns:auto minmax(0,1fr); gap:12px; align-items:start}
.principles .n{font-family:var(--hand); font-weight:700; font-size:26px; line-height:.9;
  color:var(--tang); mix-blend-mode:multiply}
.principles p{font-size:15.5px; line-height:1.4; font-weight:500}

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
  margin:22px 0 0; padding:0; list-style:none;
  display:grid; grid-template-columns:repeat(auto-fill,minmax(128px,1fr));
  gap:24px 14px; align-items:start;
}
.p-card{min-width:0}
.p-slot{position:relative; display:block}
.portrait-frame{
  display:block; position:relative; width:100%; aspect-ratio:1/1; overflow:hidden;
  background:var(--paper-3); border:1.5px solid var(--ink); text-decoration:none; color:inherit;
  box-shadow:5px -4px 0 -1px rgba(232,84,31,.55);
  transition:box-shadow .16s ease, transform .16s ease;
}
a.portrait-frame:hover{transform:translateY(-2px); box-shadow:6px -5px 0 -1px rgba(18,51,204,.42)}
.portrait-frame .shot{width:100%; height:100%; object-fit:cover; object-position:50% 26%;
  display:block; filter:saturate(1.05) contrast(1.03)}
/* the tangerine plate laid over the photograph, so a face prints warm like the map */
.portrait-frame .wash{position:absolute; inset:0; background:var(--tang); opacity:.10;
  mix-blend-mode:multiply; pointer-events:none; transition:opacity .16s ease}
a.portrait-frame:hover .wash{opacity:.18}
/* an unshot frame: hatched paper, a tangerine rule inset, a registration cross */
.photo-pending{
  position:absolute; inset:0; display:flex; align-items:flex-end; padding:9px;
  background-color:var(--paper-2);
  background-image:
    repeating-linear-gradient(45deg, rgba(18,51,204,.20) 0 1.5px, transparent 1.5px 9px),
    repeating-linear-gradient(45deg, rgba(232,84,31,.26) 0 1.5px, transparent 1.5px 27px);
}
.photo-pending::before{content:""; position:absolute; inset:6px;
  border:1.5px solid var(--tang); pointer-events:none}
.reg-cross{position:absolute; top:9px; right:9px; width:14px; height:14px}
.reg-cross path,.reg-cross circle{stroke:var(--cobalt); stroke-width:1.6; fill:none;
  stroke-linecap:round}
.hatch{position:relative; background:var(--paper); border:1.5px solid var(--ink);
  padding:5px 7px; box-shadow:3px -3px 0 rgba(23,24,28,.16); max-width:100%}
.hatch span{display:block; font-family:var(--display); font-weight:700; font-size:10.5px;
  line-height:1.3; color:var(--ink); overflow-wrap:break-word}
/* availability: a paper stamp pasted on the corner of the print — a cobalt
   outline plate with a tangerine ghost plate showing through, misregistered
   the same way as the frames and the recipe cards, not a solid UI badge */
.avail-tab{
  position:absolute; left:-5px; bottom:-9px; z-index:2;
  font-family:var(--display); font-weight:800; font-size:9.5px; text-transform:uppercase;
  letter-spacing:.09em; color:var(--cobalt-deep); background:var(--paper);
  border:1.5px solid var(--cobalt); padding:3px 7px;
  box-shadow:2.5px -2.5px 0 -0.5px rgba(232,84,31,.85);
  transform:rotate(-1deg);
}
.p-name{margin:14px 0 0; font-family:var(--display); font-weight:800; font-size:13.5px;
  text-transform:uppercase; letter-spacing:-0.012em; line-height:1.06; overflow-wrap:break-word}
.p-name a{color:var(--ink); text-decoration:none}
.p-name a:hover{color:var(--tang-ink)}
.name-rule{display:block; width:64px; height:8px; margin-top:5px; overflow:visible}
.name-rule path{stroke:var(--cobalt); stroke-width:3; fill:none;
  stroke-linecap:round; stroke-linejoin:round}
.p-head{margin-top:6px; font-size:12.5px; line-height:1.4; color:var(--ink-2)}
.p-head .ph{font-size:12.5px}
.people-groups{margin-top:24px; display:grid;
  grid-template-columns:repeat(auto-fit,minmax(480px,1fr)); gap:28px 34px; align-items:start}
.people-group-title{font-family:var(--display); font-weight:800; font-size:13px;
  letter-spacing:.13em; text-transform:uppercase; color:var(--cobalt-deep)}
.people-group-title span{display:inline-flex; min-width:22px; height:22px; margin-left:7px;
  align-items:center; justify-content:center; border-radius:50%; color:#fff; background:var(--tang-ink);
  font-family:var(--hand); font-size:12px; letter-spacing:0}
.people-group .people-grid{margin-top:12px}
.p-tags{display:flex; flex-wrap:wrap; gap:4px; margin-top:7px}
.p-tags span{display:inline-block; max-width:100%; padding:2px 6px; border:1px solid var(--cobalt);
  color:var(--cobalt-deep); background:var(--paper); font-family:var(--display); font-weight:700;
  font-size:9.5px; line-height:1.25; letter-spacing:.04em; text-transform:uppercase; overflow-wrap:anywhere}
.p-tags span + span{border-color:var(--tang-ink); color:var(--tang-ink)}
.draft-note{margin-top:7px; color:var(--tang-ink); font-family:var(--display); font-size:10px;
  font-weight:800; letter-spacing:.04em; line-height:1.3; text-transform:uppercase}
/* the empty pin — the last cell is always a place nobody has taken yet */
.pin-tile{display:block; text-decoration:none; color:inherit}
.pin-square{display:flex; align-items:center; justify-content:center; width:100%;
  aspect-ratio:1/1; background:rgba(232,84,31,.07); border:1.5px dashed var(--rule)}
.pin-circle{width:56%; aspect-ratio:1/1; border-radius:50%; border:2px dashed var(--cobalt);
  display:flex; align-items:center; justify-content:center; transition:border-color .16s ease}
.pin-circle svg{width:42%; height:auto}
.pin-circle svg path{stroke:var(--tang); stroke-width:11; stroke-linecap:round; fill:none}
.pin-tile:hover .pin-circle{border-color:var(--tang)}
.pin-label{display:block; margin-top:14px; font-family:var(--display); font-weight:800;
  font-size:13.5px; letter-spacing:-0.012em; line-height:1.15; color:var(--cobalt)}
.pin-tile:hover .pin-label{color:var(--tang-ink)}
.grid-cap{margin-top:20px; display:flex; flex-wrap:wrap; gap:6px 22px; font-family:var(--display); font-size:11.5px; font-weight:700;
  letter-spacing:.15em; text-transform:uppercase; color:var(--ink-2)}
.grid-cap a{color:var(--cobalt); text-decoration:none}
.grid-cap a:hover{color:var(--tang-ink)}

/* ---------------- get listed ---------------- */
.listed{background:rgba(232,84,31,.10); border-top:1.5px solid var(--ink); border-bottom:1.5px solid var(--ink)}
.band + .listed{border-top:0}
.listed-row{display:grid; grid-template-columns:minmax(0,1fr) auto; gap:var(--gut) 40px; align-items:end}
.listed-cta{text-align:right}
.listed-cta .cta{margin-top:0}
.cta{margin-top:22px; display:inline-block; font-family:var(--display); font-weight:800; font-size:16px;
  color:#fff; background:var(--cobalt); padding:11px 18px; text-decoration:none;
  box-shadow:6px -5px 0 -1px var(--tang)}
.cta:hover{background:var(--cobalt-deep); color:#fff}
.cta-host{margin-top:10px; font-size:13.5px; color:var(--ink-2)}

/* ---------------- further learning ---------------- */
.learn{margin:30px 0 0; padding:0; list-style:none; max-width:74ch}
.learn li{padding:16px 0; border-top:1.5px dotted var(--tang)}
.learn li:last-child{border-bottom:1.5px dotted var(--tang)}
.learn .what{font-size:17px; font-family:var(--display); font-weight:600}
.learn .host{display:block; margin-top:4px; font-family:var(--body); font-weight:400;
  font-size:13.5px; color:var(--ink-2)}

/* ---------------- footer ---------------- */
.site-foot{border-top:1.5px solid var(--ink); background:var(--paper-2); padding:16px 0}
.fine{margin:0; font-size:14px; color:var(--ink-2); max-width:78ch}

/* ================ a person's own page ================ */
.person{padding:40px 0 64px}
.person .wrap{max-width:940px}
.back-link{display:inline-block; font-family:var(--display); font-weight:700; font-size:14px;
  color:var(--ink-2); text-decoration:none; margin-bottom:30px}
.back-link:hover{color:var(--tang-ink)}
.person-grid{display:grid; grid-template-columns:minmax(0,240px) minmax(0,1fr);
  gap:40px; align-items:start}
.person-grid .portrait-frame{max-width:240px}
.person h1{font-size:clamp(28px,3.8vw,44px); text-transform:uppercase; letter-spacing:-0.035em}
.person .name-rule{width:140px; height:12px; margin-top:12px}
.person .p-tags{margin-top:14px; gap:7px}
.person .p-tags span{padding:4px 9px; font-size:11px}
.person-head{margin-top:22px; font-size:clamp(18px,1.6vw,21px); line-height:1.4;
  font-family:var(--display); font-weight:500; letter-spacing:-0.015em; max-width:44ch}
.profile-facts{display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:18px 30px;
  margin-top:26px; padding:18px 0; border-top:1.5px dotted var(--tang); border-bottom:1.5px dotted var(--tang); max-width:56ch}
.pmeta{font-size:16.5px}
.avail-yes{font-family:var(--display); font-weight:700; color:var(--cobalt)}
.fact-detail{display:block; margin-top:5px; font-size:15px; line-height:1.45; color:var(--ink-2)}
.person-bio{margin-top:26px; font-size:17px; line-height:1.55; max-width:56ch}
.person-bio-sections{margin-top:30px; max-width:56ch}
.person-bio-section{padding:0}
.person-bio-section + .person-bio-section{margin-top:26px}
.person-bio-section h2{font-size:16px; line-height:1.3; letter-spacing:-.01em}
.person-bio-section p{margin-top:7px; font-size:17px; line-height:1.58}
.p-block{margin-top:30px; padding-top:22px; border-top:1.5px dotted var(--tang); max-width:56ch}
.p-block .plinks a{display:inline-block; margin-right:16px}
.getintouch{margin-top:10px; font-family:var(--display); font-weight:700; font-size:17px}
.getintouch .email-first{display:block; margin-bottom:8px}
.host{display:block; margin-top:5px; font-family:var(--body); font-weight:400;
  font-size:13.5px; color:var(--ink-2)}

/* ---------------- responsive ---------------- */
@media (min-width:861px){
  .people-group .people-grid{grid-template-columns:repeat(4,minmax(0,1fr))}
  .home-copy{max-height:calc(100svh - 186px)}
}
@media (min-width:861px) and (max-height:700px){
  .home-hub{padding:24px 0}
  .home-copy{height:calc(100svh - 158px); max-height:none}
  .home-robot{max-width:316px; height:190px; margin-top:18px}
}
@media (max-width:1000px){
  .principles{grid-template-columns:repeat(2,minmax(0,1fr))}
}
@media (max-width:860px){
  .org-grid{grid-template-columns:minmax(0,1fr)}
  .org-grid .lanes{display:grid}
  .listed-row{grid-template-columns:minmax(0,1fr)}
  .listed-cta{text-align:left}
  .map-wide{display:none}
  .map-tall{display:block}
  .stations{grid-template-columns:minmax(0,1fr); row-gap:0}
  .station{grid-row:auto; display:block; padding:14px 0 16px; border-left:0;
    border-top:1.5px dotted var(--tang)}
  .station:first-child{padding-left:0; border-top:1.5px dotted var(--tang)}
  .station .bit{margin-top:8px}
  .lanes{grid-template-columns:minmax(0,1fr)}
  .cards{grid-template-columns:minmax(0,1fr)}
  .site-head .wrap{flex-wrap:wrap; padding-top:9px; padding-bottom:8px}
  .head-nav{order:3; width:100%; gap:0 10px; flex-wrap:wrap; white-space:normal}
  .head-nav a{display:inline-flex; align-items:center; min-height:44px}
  main[id],section[id]{scroll-margin-top:146px}
  .home-grid{grid-template-columns:minmax(0,1fr); gap:30px}
  .home-copy{display:block}
  .home-robot{width:min(100%,350px); height:auto; margin:24px auto 0}
  .person-grid{grid-template-columns:minmax(0,1fr); gap:32px}
  .person-grid .portrait-frame{max-width:280px}
}
@media (max-width:620px){
  section{padding:36px 0}
  .hero{padding:28px 0 24px}
  .principles{grid-template-columns:minmax(0,1fr); gap:12px}
  .soft-links{font-size:15px; gap:8px 20px}
  .home-hub{padding:28px 0 34px}
  .home-grid{gap:24px}
  .home-copy .lede{margin-top:12px; font-size:16px}
  .route-link{min-height:68px; padding:10px 12px; gap:6px 12px}
  .route-title{font-size:18px}
  .route-desc{font-size:13px; line-height:1.3}
  .route-open{font-size:9.5px}
  .fine{font-size:12.5px; line-height:1.42}
  .discovery{padding:18px 18px; box-shadow:6px -5px 0 -1px rgba(232,84,31,.55)}
  .lane{padding:20px}
  .card{padding:20px}
  .people-grid{gap:22px 12px}
  .people-groups{grid-template-columns:minmax(0,1fr)}
  .person{padding:34px 0 56px}
  .profile-facts{grid-template-columns:minmax(0,1fr)}
}
/* two equal columns below the old 1-column crossover (506px) — at ~163px
   cells the card typography needs its own scale, not the 220px-cell one */
@media (max-width:505px){
  .people-grid{ grid-template-columns:repeat(3,minmax(0,1fr)); gap:18px 10px }
  .p-name{ margin-top:10px; font-size:11.5px }
  .name-rule{ width:44px; height:6px; margin-top:4px }
  .p-head{ margin-top:5px; font-size:11px; line-height:1.35 }
  .p-tags{ margin-top:5px; gap:3px }
  .p-tags span{ padding:2px 4px; font-size:9px; letter-spacing:.02em }
  .photo-pending{ padding:6px }
  .hatch{ padding:4px 5px }
  .hatch span{ font-size:9px }
  .reg-cross{ top:6px; right:6px; width:11px; height:11px }
  .avail-tab{ left:-3px; bottom:-7px; font-size:8px; letter-spacing:.08em; padding:2px 5px }
  .pin-label{ margin-top:10px; font-size:11.5px }
  .pin-circle svg{ width:38% }
}
@media (prefers-reduced-motion:reduce){*{animation:none !important; transition:none !important}}
`;


export { CSS, REG_CROSS, FOOTER_FINE, footer, head };

const SITE_NAV = [
  ['people', 'people/', 'People'],
  ['asks', 'asks/', 'Request help'],
  ['offers', 'offers/', 'Offers'],
  ['assess', 'assess/', 'Assess'],
  ['guides', 'guides/', 'Guides'],
  ['case-studies', 'case-studies/', 'Case studies'],
];

function currentSection(canonical) {
  const parts = new URL(canonical).pathname.split('/').filter(Boolean);
  if (parts[0] === 'people') return 'people';
  if (parts[0] === 'assess') return 'assess';
  return SITE_NAV.some(([id]) => id === parts[0]) ? parts[0] : '';
}

function globalNav(prefix, canonical) {
  const current = currentSection(canonical);
  return SITE_NAV.map(([id, href, label]) =>
    `      <a href="${escAttr(prefix)}${href}"${current === id ? ' aria-current="page"' : ''}>${esc(label)}</a>`,
  ).join('\n');
}

// css: extra stylesheet text (the section modules' css, joined).
export function renderPage({ title, description, canonical, prefix = '', body, css = '', home = false, extraHead = '' }) {
  return `<!DOCTYPE html>
<html lang="en-GB">
<head>
${head({ title, description, canonical, extra: extraHead })}
<style>${CSS}${css}</style>
</head>
<body${home ? ' class="home-page"' : ''}>
<div class="grain" aria-hidden="true"></div>

<header class="site-head">
  <div class="wrap">
    <a class="mark" href="${home ? '#top' : escAttr(prefix)}"${home ? ' aria-current="page"' : ''}><span class="pin" aria-hidden="true"></span>EA AI Uplift</a>
${home ? '' : `    <nav class="head-nav" aria-label="Main navigation">
${globalNav(prefix, canonical)}
    </nav>`}
    <a class="head-cta" href="${escAttr(prefix)}contribute/">Contribute</a>
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
