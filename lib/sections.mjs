// Section registry. Each module exports:
//   id        — the section's element id and nav anchor
//   navLabel  — text for the header nav, or null to stay out of the nav
//   css       — extra stylesheet text appended to the shared CSS
//   load(root) → { items, errors }        (validates data/<id>/*.json)
//   section(ctx) → HTML string or ''      (ctx: { root, items, people, site, esc, escAttr })
//   pages(ctx) → [{ path, html }]         (extra pages under dist/, relative paths)
// The index page inserts each section at its slot (see build.mjs). A module
// whose section() returns '' leaves the page unchanged, so a stub is safe.
import * as asks from './asks.mjs';
import * as offers from './offers.mjs';
import * as guides from './guides.mjs';
import * as assess from './assess.mjs';
import * as pathway from './pathway.mjs';

export const sections = { asks, offers, guides, assess, pathway };
export const navOrder = ['people', 'asks', 'assess', 'map', 'recipes', 'offers', 'guides', 'pathway', 'listed'];
