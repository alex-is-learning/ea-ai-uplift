import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as asks from '../lib/asks.mjs';
import * as caseStudies from '../lib/case-studies.mjs';
import * as contribute from '../lib/contribute.mjs';
import { renderPage } from '../lib/page.mjs';
import { esc, escAttr } from '../lib/shared.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const site = JSON.parse(fs.readFileSync(path.join(root, 'data', 'site.json'), 'utf8'));
const repository = 'https://github.com/alex-is-learning/ea-ai-uplift';

function render(mod, items = []) {
  const page = mod.pages({
    items,
    site,
    esc,
    escAttr,
    renderPage,
    sectionCss: `${asks.css}${caseStudies.css}${contribute.css}`,
  });
  assert.equal(page.length, 1);
  return page[0];
}

function includesAll(html, values, label) {
  for (const value of values) assert.ok(html.includes(value), `${label} is missing: ${value}`);
}

export function checkHelpContribution() {
  const help = render(asks);
  assert.equal(help.path, 'asks/index.html');
  includesAll(help.html, [
    'Contact a practitioner directly',
    'href="../people/"',
    'Assess your organisation',
    'href="../assess/org/"',
    `href="${site.askFormUrl}"`,
    'does not create a public Help wanted request',
    'maintainer reviews each request before publication',
    'reply through the public contact URL',
    'Publication does not guarantee a reply',
    'form requires a budget label',
    '&ldquo;unstated&rdquo;',
  ], 'Help wanted');
  assert.ok(!/Budget is optional/iu.test(help.html), 'Help wanted still says that the required budget selection is optional');

  const cases = render(caseStudies);
  assert.equal(cases.path, 'case-studies/index.html');
  includesAll(cases.html, [
    'No client outcome evidence is published here yet',
    'worked example shows a method with fictional input and a checked output',
    'does not show a client outcome',
    `href="${site.caseStudyProposalUrl}"`,
    `href="${site.interviewUrl}"`,
    'GitHub proposal is public',
    'maintainer reviews it and replies in the issue',
    'no response time is promised',
  ], 'Case studies');

  const contribution = render(contribute);
  assert.equal(contribution.path, 'contribute/index.html');
  const routeLinks = [
    site.addYourselfFormUrl,
    site.offerFormUrl,
    `${repository}/blob/main/CONTRIBUTING.md#content-contributions`,
    site.caseStudyProposalUrl,
    `${repository}/issues/new?template=correction.yml`,
    `${repository}/issues/new?template=removal.yml`,
  ];
  includesAll(contribution.html, routeLinks.map((url) => `href="${url}"`), 'Contribute');
  includesAll(contribution.html, [
    'Add your profile',
    'List an offer',
    'Propose a guide',
    'Propose a case study',
    'Correct a profile',
    'Remove a profile or portrait',
    'The form response goes to the maintainer',
    'Issues and pull requests are public when you submit them',
    'No response time is promised',
    '<strong>Reply route:</strong>',
  ], 'Contribute');
  assert.equal((contribution.html.match(/class="contribute-card"/gu) || []).length, 6);

  return { pages: 3, contributionRoutes: routeLinks.length };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const result = checkHelpContribution();
    console.log(`check-help-contribution: ${result.pages} pages and ${result.contributionRoutes} routes pass`);
  } catch (error) {
    console.error(`check-help-contribution: ${error.message}`);
    process.exitCode = 1;
  }
}
