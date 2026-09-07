import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { findChromium, renderFile } from './check-render.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const viewports = [
  { width: 1280, height: 800 },
  { width: 390, height: 844 },
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function readJson(relative) {
  return JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
}

function blockText(page) {
  return page.blocks.flatMap((block) => [block.text, block.title, ...(block.items || []).map((item) => typeof item === 'string' ? item : `${item.label} ${item.path || item.url}`)]).filter(Boolean).join('\n');
}

function checkSource() {
  const first = readJson('data/guide-pages/first-useful-task.json');
  const pathway = readJson('data/guide-pages/practitioner-pathway.json');
  const firstText = blockText(first);
  const pathwayText = blockText(pathway);
  for (const text of ['fictional input', 'request to paste', 'Worked output with one deliberate error', 'The error check', 'Exact success criteria']) {
    assert(firstText.includes(text), `first-useful-task is missing: ${text}`);
  }
  for (const text of ['Thursday 17 September', 'eight checklists', 'ten checklists', 'under 120 words', 'exactly three bullet points']) {
    assert(firstText.includes(text), `first-useful-task does not exercise: ${text}`);
  }
  for (const text of ['Stage 1: complete and check your own task', 'Stage 2: help one colleague', 'Stage 3: leave reusable instructions', 'Stage 4: verify the instructions', 'Stage 5: run a test handover']) {
    assert(pathwayText.includes(text), `practitioner-pathway is missing: ${text}`);
  }
  for (const text of ['Evidence:', 'Pass:', 'seeded wrong detail', 'without live help', 'not a standard, endorsement or certificate']) {
    assert(pathwayText.includes(text), `practitioner-pathway does not state: ${text}`);
  }
  for (const page of [first, pathway]) {
    const related = page.blocks.filter((block) => block.type === 'related').flatMap((block) => block.items.map((item) => item.path));
    assert(related.every((item) => !['start/', 'learn/', 'hire/'].includes(item)), `${page.slug} links to a hidden pathway route`);
  }
}

function build() {
  const result = spawnSync(process.execPath, ['build.mjs'], { cwd: root, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`build failed: ${(result.stderr || result.stdout).trim()}`);
}

function checkBuiltPages() {
  const index = fs.readFileSync(path.join(root, 'dist', 'guides', 'index.html'), 'utf8');
  const first = index.indexOf('href="../guides/first-useful-task/"');
  const pathway = index.indexOf('href="../guides/practitioner-pathway/"');
  const otherStart = index.indexOf('href="../guides/context-layer-in-github/"');
  assert(first >= 0 && pathway > first && otherStart > pathway, 'the Guides index does not lead with the two learning routes');
  for (const slug of ['first-useful-task', 'practitioner-pathway']) {
    const html = fs.readFileSync(path.join(root, 'dist', 'guides', slug, 'index.html'), 'utf8');
    assert(html.includes("Written from one practitioner's work, not yet tested with readers."), `${slug} is missing the guide evidence label`);
    assert(!/href="(?:\.\.\/\.\.\/)?(?:start|learn|hire)\//u.test(html), `${slug} links to a hidden pathway route`);
  }
}

async function checkBrowser() {
  const browser = findChromium();
  const screenshotDir = process.env.LEARNING_SCREENSHOT_DIR;
  if (screenshotDir) fs.mkdirSync(screenshotDir, { recursive: true });
  const routes = [
    { slug: 'first-useful-task', title: 'Your first useful task in 15 minutes', marker: 'Exact success criteria' },
    { slug: 'practitioner-pathway', title: 'The practitioner pathway', marker: 'Stage 5: run a test handover' },
  ];
  const results = [];
  for (const route of routes) {
    const pagePath = path.join(root, 'dist', 'guides', route.slug, 'index.html');
    for (const viewport of viewports) {
      const result = await renderFile(browser, pagePath, viewport, {
        screenshotPath: screenshotDir ? path.join(screenshotDir, `${route.slug}-${viewport.width}x${viewport.height}.png`) : undefined,
        expression: `(() => ({
          title: document.querySelector('h1')?.textContent.trim(),
          text: document.querySelector('main')?.innerText,
          scrollHeight: document.documentElement.scrollHeight,
          evidenceLabel: document.querySelector('.aside')?.innerText,
          backLinkVisible: document.querySelector('.back-link')?.getBoundingClientRect().height > 0,
          bodyColour: getComputedStyle(document.body).backgroundColor
        }))()`,
      });
      assert(result.value.title === route.title, `${route.slug} has the wrong browser title at ${viewport.width}x${viewport.height}`);
      assert(result.value.text.includes(route.marker), `${route.slug} is missing ${route.marker} in Chromium`);
      assert(result.value.evidenceLabel.includes('not yet tested with readers'), `${route.slug} hides its evidence limit`);
      assert(result.value.backLinkVisible, `${route.slug} hides its Guides back link`);
      results.push({ route: `/guides/${route.slug}/`, viewport: `${viewport.width}x${viewport.height}`, scrollHeight: result.value.scrollHeight, bodyColour: result.value.bodyColour });
    }
  }
  return { browser, results };
}

export async function checkLearningGuides() {
  checkSource();
  build();
  checkBuiltPages();
  return checkBrowser();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const browser = await checkLearningGuides();
    console.log(`check-learning-guides: source, route order, evidence labels and ${browser.results.length} Chromium renders pass`);
    for (const result of browser.results) console.log(`${result.route} ${result.viewport}, document height ${result.scrollHeight}px, background ${result.bodyColour}`);
  } catch (error) {
    console.error(`check-learning-guides: ${error.message}`);
    process.exitCode = 1;
  }
}
