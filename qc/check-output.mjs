import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { assertValidProject } from '../schema/validate.mjs';
import { affiliationTags, escAttr } from '../lib/shared.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function walk(location, results = []) {
  const stat = fs.lstatSync(location);
  if (stat.isSymbolicLink()) throw new Error(`generated output must not contain a symlink: ${location}`);
  if (stat.isFile()) {
    results.push(location);
    return results;
  }
  if (!stat.isDirectory()) throw new Error(`generated output has an unsafe entry: ${location}`);
  for (const name of fs.readdirSync(location).sort()) walk(path.join(location, name), results);
  return results;
}

function localReferences(html) {
  const refs = [];
  const expression = /\b(?:href|src)="([^"]+)"/gu;
  for (const match of html.matchAll(expression)) refs.push(match[1]);
  return refs;
}

function assertLocalLinks(location, dist) {
  // inline scripts build their own links at run time from validated data
  const html = fs.readFileSync(location, 'utf8').replace(/<script[\s\S]*?<\/script>/gu, '');
  for (const ref of localReferences(html)) {
    if (!ref || ref.startsWith('data:')) continue;
    const base = new URL(`https://eaaiuplift.com/${path.relative(dist, location)}`);
    const url = new URL(ref.replaceAll('&amp;', '&'), base);
    if (url.origin !== base.origin) continue;
    const target = path.resolve(dist, `.${decodeURIComponent(url.pathname)}`);
    const relative = path.relative(dist, target);
    if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error(`${location}: local link escapes dist: ${ref}`);
    const resolved = fs.existsSync(target) && fs.statSync(target).isDirectory() ? path.join(target, 'index.html') : target;
    if (!fs.existsSync(resolved)) throw new Error(`${location}: missing local link target: ${ref}`);
    if (url.hash && resolved.endsWith('.html')) {
      const destination = fs.readFileSync(resolved, 'utf8');
      const fragment = decodeURIComponent(url.hash.slice(1));
      if (!destination.includes(`id="${fragment}"`)) throw new Error(`${location}: missing local fragment: ${ref}`);
    }
  }
}

function cardFor(html, slug) {
  const marker = `people/${slug}/`;
  const link = html.indexOf(marker);
  const start = html.lastIndexOf('<li class="p-card">', link);
  const end = html.indexOf('</li>', link);
  if (link < 0 || start < 0 || end < 0) throw new Error(`${slug}: generated page is missing its person card`);
  return html.slice(start, end + 5);
}

async function expectedSectionPages(projectRoot, people) {
  const registry = await import(pathToFileURL(path.join(projectRoot, 'lib', 'sections.mjs')).href);
  const { loadSiteConfig } = await import(pathToFileURL(path.join(projectRoot, 'lib', 'data.mjs')).href);
  const { esc, escAttr } = await import(pathToFileURL(path.join(projectRoot, 'lib', 'shared.mjs')).href);
  const site = loadSiteConfig(projectRoot);
  if (site.errors.length) throw new Error(site.errors.join('\n'));
  const paths = [];
  for (const [name, mod] of Object.entries(registry.sections)) {
    const loaded = mod.load(projectRoot);
    if (loaded.errors.length) throw new Error(loaded.errors.join('\n'));
    if (mod.published === false) continue;
    for (const page of mod.pages({ root: projectRoot, items: loaded.items, people, site: site.config, esc, escAttr, prefix: '' })) {
      if (!/^[a-z0-9]+(?:[-/][a-z0-9]+)*\/index\.html$/u.test(page.path)) throw new Error(`${name} page path is unsafe: ${page.path}`);
      paths.push(page.path);
    }
  }
  return paths;
}

export async function checkOutput(projectRoot = root) {
  const people = assertValidProject({ root: projectRoot });
  const dist = path.join(projectRoot, 'dist');
  if (!fs.existsSync(dist) || fs.lstatSync(dist).isSymbolicLink() || !fs.lstatSync(dist).isDirectory()) throw new Error('dist must be a real generated directory');
  const expected = new Set(['index.html', 'people/index.html', 'case-studies/index.html', 'og.png', ...(await expectedSectionPages(projectRoot, people))]);
  for (const person of people) {
    expected.add(`people/${person.slug}/index.html`);
    if (person.photo) {
      expected.add(`img/${person.photo}`);
      expected.add(`img/${person.slug}-960.jpg`);
    }
  }
  const files = walk(dist);
  const actual = new Set(files.map((file) => path.relative(dist, file)));
  for (const entry of actual) if (!expected.has(entry)) throw new Error(`dist has stale or unexpected output: ${entry}`);
  for (const entry of expected) if (!actual.has(entry)) throw new Error(`dist is missing generated output: ${entry}`);

  for (const file of files.filter((item) => item.endsWith('.html'))) {
    const html = fs.readFileSync(file, 'utf8');
    if (/\[\s*placeholder\b/iu.test(html)) throw new Error(`${file}: generated output contains an unfinished token`);
    const footer = html.match(/<footer\b[^>]*>([\s\S]*?)<\/footer>/u)?.[1] || '';
    const footerText = footer.replace(/<[^>]+>/gu, ' ').replace(/\s+/gu, ' ').trim();
    if (footerText !== 'Maintained by Alexander Large · GitHub' || /<nav\b/u.test(footer)) throw new Error(`${file}: footer must contain the maintainer credit and GitHub link`);
    const footerLinks = [...footer.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/gu)].map((match) => [match[1], match[2]]);
    if (JSON.stringify(footerLinks) !== JSON.stringify([
      ['https://alexanderlarge.com', 'Alexander Large'],
      ['https://github.com/alex-is-learning/ea-ai-uplift', 'GitHub'],
    ])) throw new Error(`${file}: footer links do not match the maintainer website and site repository`);
    if (file !== path.join(dist, 'index.html')) {
      const header = html.match(/<header\b[^>]*>([\s\S]*?)<\/header>/u)?.[1] || '';
      const menu = header.match(/<nav\b[^>]*class="head-nav"[^>]*>([\s\S]*?)<\/nav>/u)?.[1] || '';
      if ([...menu.matchAll(/<a\b/gu)].length !== 6) throw new Error(`${file}: subpage needs six header destinations`);
      if (!/href="[^"]*offers\/"(?: aria-current="page")?>Offers<\/a>/u.test(menu)) throw new Error(`${file}: subpage navigation is missing Offers`);
    }
    assertLocalLinks(file, dist);
  }
  const home = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
  const header = home.match(/<header\b[^>]*>([\s\S]*?)<\/header>/u)?.[1] || '';
  if (/<nav\b/u.test(header)) throw new Error('home repeats its main navigation in the header');
  if (/field guide/iu.test(home)) throw new Error('home still claims to be a field guide');
  if (!home.includes('<h1 id="page-title">AI uplift in the effective altruist ecosystem</h1>')) throw new Error('home heading does not match the ecosystem wording');
  const guides = fs.readFileSync(path.join(dist, 'guides', 'index.html'), 'utf8');
  const directory = fs.readFileSync(path.join(dist, 'people', 'index.html'), 'utf8');
  if (!directory.includes('href="../offers/"') || directory.indexOf('href="../offers/"') > directory.indexOf('<div class="people-groups">')) throw new Error('people no longer exposes Offers');
  for (const route of ['start', 'learn', 'hire']) {
    if (fs.existsSync(path.join(dist, route))) throw new Error(`${route} must stay outside generated output`);
  }
  for (const [page, source] of [['guides', guides], ['people', directory]]) {
    for (const route of ['start/', 'learn/', 'hire/']) if (source.includes(`href="../${route}"`)) throw new Error(`${page} still links to hidden route ${route}`);
  }
  const individualAssessment = fs.readFileSync(path.join(dist, 'assess', 'index.html'), 'utf8');
  if (!individualAssessment.includes('href="org/"') || !individualAssessment.includes('Do you run an organisation?')) throw new Error('individual result is missing the organisation assessment entry link');
  for (const person of people) {
    const page = fs.readFileSync(path.join(dist, 'people', person.slug, 'index.html'), 'utf8');
    for (const url of [person.site, person.contact, ...(person.links || []).map((link) => link.url)].filter(Boolean)) {
      if (!page.includes(`href="${escAttr(url)}"`)) throw new Error(`${person.slug}: profile is missing its approved link ${url}`);
    }
    const cards = [cardFor(directory, person.slug), cardFor(individualAssessment, person.slug)];
    for (const expected of affiliationTags(person)) {
      if (cards.some((card) => !card.includes(`>${expected}<`)) || !page.includes(`>${expected}<`)) {
        throw new Error(`${person.slug}: affiliation label is missing from its generated card or profile page`);
      }
    }
  }
  const groupLabels = { 'in-house': 'In-house at organisations', both: 'In-house + independent', independent: 'Independent practitioners' };
  for (const mode of new Set(people.map((person) => person.workMode))) {
    if (!directory.includes(groupLabels[mode])) throw new Error(`people page does not show the ${mode} work-mode group`);
  }
  if (people.length === 1) {
    const requiredCopy = [
      'One person doing this work.',
    ];
    for (const copy of requiredCopy) if (!directory.includes(copy)) throw new Error(`one-profile directory copy is missing: ${copy}`);
    for (const faulty of ['lists one people', 'More people should be doing this than one']) {
      if (directory.includes(faulty)) throw new Error(`one-profile home copy is grammatically or evidentially invalid: ${faulty}`);
    }
    if (/One person who do(?!es)/u.test(directory)) throw new Error('one-profile home copy is grammatically invalid: One person who do');
  }
  return { dist, htmlFiles: files.filter((item) => item.endsWith('.html')).length, fileUrl: pathToFileURL(path.join(dist, 'index.html')).href };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const result = await checkOutput();
    console.log(`check-output: ${result.htmlFiles} generated HTML files pass local-only validation`);
  } catch (error) {
    console.error(`check-output: ${error.message}`);
    process.exitCode = 1;
  }
}
