// The practitioner pathway: a learning route (learn/) for someone who wants
// to do AI uplift work, and a hiring pack (hire/) for an organisation that
// wants the capability. Both are JSON block lists in data/pathway/.
import { loadCollection, exactKeys, safeText } from './data.mjs';
import { validateBlocks, renderBlocks } from './blocks.mjs';

export const id = 'pathway';
export const navLabel = 'Learn or hire';
export const published = false;

const FIELDS = ['slug', 'title', 'lede', 'blocks'];
const SLUGS = ['learn', 'hire'];
const CARD = {
  learn: { key: 'For a person', heading: 'The learning route' },
  hire: { key: 'For an organisation', heading: 'Hiring for it' },
};

export const css = `
/* ---------------- pathway ---------------- */
.pathway-cards{margin:22px 0 0; padding:0; list-style:none; display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:0 40px}
.pathway-card{padding:14px 0 16px; border-top:1.5px dotted var(--tang)}
.pathway-card .cno{font-family:var(--display); font-size:11px; font-weight:800; letter-spacing:.16em; text-transform:uppercase; color:var(--tang-ink); display:block; margin-bottom:6px}
.pathway-card h3 a{color:var(--cobalt); text-decoration:none}
.pathway-card h3 a:hover{color:var(--tang-ink)}
.pathway-card p{margin-top:6px; font-size:15px; color:var(--ink-2); line-height:1.45; max-width:44ch}
@media (max-width:620px){ .pathway-cards{grid-template-columns:minmax(0,1fr); gap:0} }
.pathway-page{padding:44px 0 74px}
.pathway-page .wrap{max-width:940px}
.pathway-page h1{font-size:clamp(28px,3.8vw,44px)}
.pathway-page .lede{margin-top:18px}
.pathway-page .prose{margin-top:38px}
@media (max-width:620px){ .pathway-page{padding:34px 0 56px} }
`;

function validateItem(item, file, errors) {
  if (!exactKeys(item, FIELDS, file, errors)) return;
  if (!SLUGS.includes(item.slug)) errors.push(`${file}: slug must be one of ${SLUGS.join(', ')}`);
  safeText(item.title, `${file}: title`, errors, { min: 3, max: 70 });
  safeText(item.lede, `${file}: lede`, errors, { min: 20, max: 240 });
  validateBlocks(item.blocks, `${file}: blocks`, errors, { min: 6, max: 60 });
}

export function load(root) {
  const loaded = loadCollection(root, id, validateItem);
  if (loaded.items.length) {
    for (const slug of SLUGS) {
      if (!loaded.items.some((item) => item.slug === slug)) loaded.errors.push(`data/pathway/${slug}.json is missing; the pathway needs both learn and hire`);
    }
  }
  return loaded;
}

function card(item, esc, escAttr, prefix) {
  const { key, heading } = CARD[item.slug];
  const href = `${prefix}${item.slug}/`;
  return `        <li class="pathway-card">
          <span class="cno">${esc(key)}</span>
          <h3><a href="${escAttr(href)}">${esc(heading)} &rarr;</a></h3>
          <p>${esc(item.lede)}</p>
        </li>`;
}

export function section({ items, esc, escAttr, prefix = '' }) {
  if (items.length < SLUGS.length) return '';
  const ordered = SLUGS.map((slug) => items.find((item) => item.slug === slug));
  return `  <!-- 09 pathway -->
  <section class="band" id="pathway" aria-labelledby="pathway-title">
    <div class="wrap">
      <div class="sec-head">
        <p class="legend">The pathway</p>
        <h2 id="pathway-title">Doing this work, or want to?</h2>
      </div>
      <ul class="pathway-cards">
${ordered.map((item) => card(item, esc, escAttr, prefix)).join('\n')}
      </ul>
    </div>
  </section>`;
}

export function pages(ctx) {
  const { items, esc, escAttr } = ctx;
  const render = ctx.renderPage ?? (() => '');
  const prefix = '../';
  return items.map((item) => {
    const body = `  <section class="pathway-page">
    <div class="wrap">
      <a class="back-link" href="${escAttr(prefix)}start/">&larr; Start here</a>
      <p class="legend">${esc(CARD[item.slug].key)}</p>
      <h1>${esc(item.title)}</h1>
      <p class="lede">${esc(item.lede)}</p>
      <div class="prose">
${renderBlocks(item.blocks, { esc, escAttr, prefix })}
      </div>
    </div>
  </section>`;
    return {
      path: `${item.slug}/index.html`,
      html: render({
        title: `${item.title} — EA AI Uplift`,
        description: item.lede,
        canonical: `https://eaaiuplift.com/${item.slug}/`,
        prefix,
        nav: ctx.nav ?? '',
        css: ctx.sectionCss ?? '',
        body,
      }),
    };
  });
}
