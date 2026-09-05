import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const MINIMUMS = { asks: 3, offers: 3, guides: 5, pathway: 2, assess: 17 };
const FORM_KEYS = { asks: 'askFormUrl', offers: 'offerFormUrl' };
// proper nouns that contain a banned word (an approved profile may name an employer)
const PROPER_NOUNS = /Our World in Data/gu;
const POSITIONING = [
  [/\b(?:we|our|us)\b/iu, 'first-person plural'],
  [/£|\$\s?\d|€\s?\d|\bper hour\b/iu, 'a price or currency'],
  [/\b(?:revolutionary|supercharge|10x|unlock|seamless|cutting-edge|game-changing)\b/iu, 'a hype word'],
  [/\[\s*placeholder\b/iu, 'an unfinished token'],
];

export function checkSections(projectRoot = root) {
  const home = path.join(projectRoot, 'dist', 'index.html');
  if (!fs.existsSync(home)) throw new Error('dist/index.html is missing; run node build.mjs first');
  const html = fs.readFileSync(home, 'utf8');
  const site = JSON.parse(fs.readFileSync(path.join(projectRoot, 'data', 'site.json'), 'utf8'));
  const counts = {};
  for (const [name, minimum] of Object.entries(MINIMUMS)) {
    const dir = path.join(projectRoot, 'data', name);
    const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((item) => item.endsWith('.json')) : [];
    counts[name] = files.length;
    if (files.length < minimum) throw new Error(`data/${name} has ${files.length} entries, fewer than ${minimum}`);
    if (!html.includes(`id="${name}"`)) throw new Error(`home page has no section with id="${name}"`);
    if (!html.includes(`href="#${name}"`)) throw new Error(`home page nav does not link to #${name}`);
    const formKey = FORM_KEYS[name];
    if (formKey && !html.includes(`href="${site[formKey]}"`)) throw new Error(`${name} section does not link to data/site.json ${formKey}`);
  }
  if (html.includes('id="learning"')) throw new Error('the old Further learning placeholder is still on the page');
  // positioning holds on every generated page, not only the home page
  const dist = path.join(projectRoot, 'dist');
  const pages = [];
  (function walk(location) {
    for (const name of fs.readdirSync(location).sort()) {
      const item = path.join(location, name);
      if (fs.lstatSync(item).isDirectory()) walk(item);
      else if (name.endsWith('.html')) pages.push(item);
    }
  })(dist);
  for (const page of pages) {
    const source = fs.readFileSync(page, 'utf8');
    const text = source
      .replace(/<style>[\s\S]*?<\/style>/gu, '')
      .replace(/<script>[\s\S]*?<\/script>/gu, '')
      .replace(/<[^>]+>/gu, ' ')
      .replace(PROPER_NOUNS, ' ');
    for (const [expression, label] of POSITIONING) {
      const match = text.match(expression);
      if (match) throw new Error(`${path.relative(projectRoot, page)} copy contains ${label}: "${match[0]}"`);
    }
  }
  counts.pages = pages.length;
  return counts;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const counts = checkSections();
    console.log(`check-sections: asks ${counts.asks}, offers ${counts.offers}, guides ${counts.guides}; nav, form links and positioning pass on ${counts.pages} pages`);
  } catch (error) {
    console.error(`check-sections: ${error.message}`);
    process.exitCode = 1;
  }
}
