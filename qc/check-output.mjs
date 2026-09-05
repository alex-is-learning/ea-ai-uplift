import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { assertValidProject } from '../schema/validate.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const sourceLink = 'https://github.com/alex-is-learning/ea-ai-uplift';
const addProfileLink = 'https://github.com/alex-is-learning/ea-ai-uplift/blob/main/CONTRIBUTING.md#add-a-profile';

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
    if (!ref || ref.startsWith('#') || ref.startsWith('data:') || /^[a-z][a-z0-9+.-]*:/iu.test(ref)) continue;
    const clean = ref.split('#', 1)[0].split('?', 1)[0];
    if (!clean) continue;
    const target = path.resolve(path.dirname(location), clean);
    const relative = path.relative(dist, target);
    if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error(`${location}: local link escapes dist: ${ref}`);
    const resolved = fs.existsSync(target) && fs.statSync(target).isDirectory() ? path.join(target, 'index.html') : target;
    if (!fs.existsSync(resolved)) throw new Error(`${location}: missing local link target: ${ref}`);
  }
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
  const expected = new Set(['index.html', 'og.png', ...(await expectedSectionPages(projectRoot, people))]);
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
    if (!html.includes(`href="${sourceLink}"`) || !html.includes('>Source and contributions on GitHub<')) throw new Error(`${file}: missing source footer link`);
    if (!html.includes(`href="${addProfileLink}"`) || !html.includes('>Add yourself to the directory<')) throw new Error(`${file}: missing profile footer link`);
    assertLocalLinks(file, dist);
  }
  if (people.length === 1) {
    const home = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
    const requiredCopy = [
      'lists one person who does it independently.',
      'One person who does this work independently.',
      'If you help people or organisations in this community use AI well, submit your own approved public profile through the form below, or through GitHub.',
    ];
    for (const copy of requiredCopy) if (!home.includes(copy)) throw new Error(`one-profile home copy is missing: ${copy}`);
    for (const faulty of ['lists one people', 'More people should be doing this than one']) {
      if (home.includes(faulty)) throw new Error(`one-profile home copy is grammatically or evidentially invalid: ${faulty}`);
    }
    if (/One person who do(?!es)/u.test(home)) throw new Error('one-profile home copy is grammatically invalid: One person who do');
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
