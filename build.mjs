import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertValidProject } from './schema/validate.mjs';
import { esc, escAttr, countWord, NAME_RULE } from './lib/shared.mjs';
import { REG_CROSS, renderPage } from './lib/page.mjs';
import { blocksCss } from './lib/blocks.mjs';
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
const sectionCss = `\n${blocksCss}${Object.values(sections).map((mod) => mod.css).filter(Boolean).map((css) => `\n${css}`).join('')}`;
function ctx(name, prefix = '') {
  return { root: scriptDir, items: sectionItems[name], people, site, esc, escAttr, prefix, nav: navLinks(prefix), sectionCss, renderPage };
}
function slot(name) {
  const html = sections[name].section(ctx(name));
  return html ? `${html}\n\n` : '';
}
const NAV_LABELS = { people: 'People', map: 'Where to start', listed: 'Get listed' };
function navLinks(prefix) {
  return navOrder
    .map((name) => {
      const label = NAV_LABELS[name] ?? sections[name]?.navLabel;
      return label ? `      <a href="${escAttr(prefix)}#${name}">${esc(label)}</a>` : null;
    })
    .filter(Boolean)
    .join('\n');
}


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

function peopleSection() {
  const peopleIntro = people.length === 1
    ? 'One person, working independently. Open the profile for availability and contact.'
    : `${countWord(people.length, true)} people, each working independently on their own terms. Open a profile for availability and contact.`;
  return `  <!-- 02 people -->
  <section class="band" id="people" aria-labelledby="people-title">
    <div class="wrap">
      <div class="sec-head">
        <p class="legend">The people</p>
        <h2 id="people-title">People doing this work</h2>
        <p class="intro">${peopleIntro}</p>
      </div>
      <ul class="people-grid">
${people.map(card).join('\n')}
      </ul>
      <p class="grid-cap"><span>Listed alphabetically. Nobody is first.</span><a href="#listed">Do this work? Get listed &rarr;</a></p>
    </div>
  </section>`;
}

// ---------------------------------------------------------------- index page
const INDEX_TITLE = 'AI uplift — a field guide for people and organisations in effective altruism';
const INDEX_DESC =
  'AI can now do much of the admin that fills an EA organisation\u2019s week, but use of it is unevenly spread. A field guide to closing that gap: who helps, what organisations need, where to start.';

function indexPage() {
  const body = `
  <!-- 01 opening -->
  <section class="hero" aria-labelledby="page-title">
    <div class="wrap">
      <p class="legend">A field guide</p>
      <h1 id="page-title">AI uplift, for people and organisations in effective altruism</h1>
      <p class="lede">AI tools can now take on a lot of what fills an EA organisation&rsquo;s week: drafting documents and decks, tidying a shared drive, chasing a process through email, red-teaming a plan, keeping notes as you go, running jobs on a schedule, and increasingly working a computer directly. Use of them is very unevenly spread. One person runs half their day through these tools while the person at the next desk has only tried the chat box. <b>Helping people and organisations in this community close that gap looks like a high-impact use of a few hours:</b> it frees time for the work that matters. This page is for that. It lists the people who do the helping, the problems organisations have posted, and where to start.</p>
      <p class="soft-links">
        <a class="hot" href="#people">Find someone to talk to &darr;</a>
        <a href="#map">See where you'd start &darr;</a>
        <a href="assess/">Map your practice &rarr;</a>
      </p>
    </div>
  </section>

${peopleSection()}

${slot('asks')}${slot('assess')}  <!-- 03 the route -->
  <section id="map" aria-labelledby="map-title">
    <div class="wrap">
      <div class="sec-head">
        <p class="legend">The route</p>
        <h2 id="map-title">Where you'd start</h2>
        <p class="intro">Five starting points. What a session does at each, and how you know it worked.</p>
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
            <div class="bit"><span class="label">A session</span><p>Pick one accessible tool and finish one real task together</p></div>
            <div class="bit worked"><span class="label">Worked when</span><p>Useful work is done before the session ends</p></div>
          </li>
          <li class="station">
            <p class="pin"><span class="disc-sm" aria-hidden="true">2</span></p>
            <h3>You have one clear problem</h3>
            <div class="bit"><span class="label">A session</span><p>Twenty minutes of questions, then one clear win, built or configured live</p></div>
            <div class="bit worked"><span class="label">Worked when</span><p>A working change exists before the session ends</p></div>
          </li>
          <li class="station">
            <p class="pin"><span class="disc-sm" aria-hidden="true">3</span></p>
            <h3>You have many pain points</h3>
            <div class="bit"><span class="label">A session</span><p>Triage the list and name an intervention for each priority</p></div>
            <div class="bit worked"><span class="label">Worked when</span><p>You leave with a ranked route</p></div>
          </li>
          <li class="station">
            <p class="pin"><span class="disc-sm" aria-hidden="true">4</span></p>
            <h3>You know the task but can't start</h3>
            <div class="bit"><span class="label">A session</span><p>Someone works beside you while you do it</p></div>
            <div class="bit worked"><span class="label">Worked when</span><p>The blocked task moves or finishes</p></div>
          </li>
          <li class="station">
            <p class="pin"><span class="disc-sm" aria-hidden="true">5</span></p>
            <h3>You already use AI heavily</h3>
            <div class="bit"><span class="label">A session</span><p>Longer delegation, parallel agents, task tracking, reusable documentation</p></div>
            <div class="bit worked"><span class="label">Worked when</span><p>You delegate more without losing state</p></div>
          </li>
        </ol>
        <figcaption class="footnote">Possible interventions, not packages.</figcaption>
      </figure>
    </div>
  </section>

  <!-- 04 inside an organisation -->
  <section class="band" id="tracks" aria-labelledby="tracks-title">
    <div class="wrap">
      <div class="sec-head">
        <p class="legend">Two tracks</p>
        <h2 id="tracks-title">Inside an organisation</h2>
        <p class="intro">Think of an internal IT function for AI: someone who tests the tools, knows their limits, writes the guidance down and keeps it current. Two tracks run together.</p>
      </div>

      <div class="org-grid">
        <div class="discovery">
          <p class="d-title">Discovery before the build list</p>
          <ol class="d-steps">
            <li>Fifteen-minute calls with team leads and staff.</li>
            <li>Ask about recent work, bottlenecks and what they dislike doing. No leading questions, no tool pitched.</li>
            <li>Group the pain points. Choose the first intervention from the groups, not from the tools.</li>
          </ol>
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
      </div>
    </div>
  </section>

  <!-- 05 principles -->
  <section id="principles" aria-labelledby="principles-title">
    <div class="wrap">
      <div class="sec-head">
        <p class="legend">Field notes</p>
        <h2 id="principles-title">What good uplift looks like</h2>
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

${slot('offers')}  <!-- 07 get listed -->
  <section class="listed" id="listed" aria-labelledby="listed-title">
    <div class="wrap">
      <div class="listed-row">
        <div class="sec-head">
          <p class="legend">An empty pin on the map</p>
          <h2 id="listed-title">Doing this work yourself?</h2>
          <p class="intro">If you help people or organisations in this community use AI well, add your own public profile. Listing is free. The only test is that you do the work and are happy to be contacted.</p>
        </div>
        <div class="listed-cta">
          <p><a class="cta" href="${escAttr(site.addYourselfFormUrl)}">Get listed &rarr;</a></p>
          <p class="cta-host">${esc(new URL(site.addYourselfFormUrl).host)} &middot; or <a href="https://github.com/alex-is-learning/ea-ai-uplift/blob/main/CONTRIBUTING.md#add-a-profile">through GitHub</a></p>
        </div>
      </div>
    </div>
  </section>

${slot('guides')}${slot('pathway')}${slot('guides') ? '' : `  <!-- 08 further learning -->
  <section id="learning" aria-labelledby="learning-title">
    <div class="wrap">
      <div class="sec-head">
        <p class="legend">Further reading</p>
        <h2 id="learning-title">Further learning</h2>
      </div>
      <p class="intro">New public resources will appear here after review.</p>
    </div>
  </section>
`}`;
  return renderPage({ title: INDEX_TITLE, description: INDEX_DESC, canonical: 'https://eaaiuplift.com/', prefix: '', nav: navLinks(''), body, css: sectionCss, home: true });
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
  const body = `  <section class="person">
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
  </section>`;
  return renderPage({ title: `${p.name} — EA AI Uplift`, description: p.headline, canonical: `https://eaaiuplift.com/people/${p.slug}/`, prefix: '../../', nav: navLinks('../../'), body, css: sectionCss });
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
