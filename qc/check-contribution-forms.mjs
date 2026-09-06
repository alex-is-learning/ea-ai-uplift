import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const EXPECTED_CASE_STUDY_URL = 'https://github.com/alex-is-learning/ea-ai-uplift/issues/new?template=case-study.yml';
const FORM_TYPES = new Set(['markdown', 'input', 'textarea', 'dropdown', 'checkboxes']);
const CASE_STUDY_IDS = ['title', 'situation', 'starting_point', 'work', 'change', 'evidence', 'did_not_work', 'differently', 'written_by'];

function fail(message) {
  throw new Error(message);
}

function parseYaml(location) {
  const script = 'require "yaml"; require "json"; puts JSON.generate(YAML.safe_load(File.read(ARGV[0]), [], [], false))';
  const result = spawnSync('ruby', ['-e', script, location], { encoding: 'utf8' });
  if (result.error || result.status !== 0) fail(`${path.relative(root, location)} is not valid YAML: ${(result.stderr || result.error?.message || '').trim()}`);
  try {
    return JSON.parse(result.stdout);
  } catch {
    fail(`${path.relative(root, location)} did not parse as a YAML object`);
  }
}

function requiredString(value, label) {
  if (typeof value !== 'string' || !value.trim()) fail(`${label} must be a non-empty string`);
}

function checkBodyItem(item, location, ids) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) fail(`${location} body item must be an object`);
  if (typeof item.type !== 'string' || !FORM_TYPES.has(item.type)) fail(`${location} has an unsupported GitHub form type`);
  if (!item.attributes || typeof item.attributes !== 'object' || Array.isArray(item.attributes)) fail(`${location} ${item.type} needs attributes`);
  if (item.type === 'markdown') {
    requiredString(item.attributes.value, `${location} markdown.value`);
    return;
  }
  requiredString(item.id, `${location} ${item.type}.id`);
  if (!/^[a-z][a-z0-9_-]*$/u.test(item.id)) fail(`${location} has an unsafe field id: ${item.id}`);
  if (ids.has(item.id)) fail(`${location} repeats field id: ${item.id}`);
  ids.add(item.id);
  requiredString(item.attributes.label, `${location} ${item.id}.label`);
  if (item.validations !== undefined && (!item.validations || typeof item.validations !== 'object' || typeof item.validations.required !== 'boolean')) {
    fail(`${location} ${item.id}.validations must use GitHub's required boolean`);
  }
  if (item.type === 'dropdown') {
    if (!Array.isArray(item.attributes.options) || item.attributes.options.length === 0 || item.attributes.options.some((option) => typeof option !== 'string' || !option.trim())) fail(`${location} ${item.id} dropdown needs string options`);
  }
  if (item.type === 'checkboxes' && (!Array.isArray(item.attributes.options) || item.attributes.options.length === 0)) fail(`${location} ${item.id} checkboxes need options`);
}

function checkForm(location, form) {
  const label = path.relative(root, location);
  if (!form || typeof form !== 'object' || Array.isArray(form)) fail(`${label} must be a GitHub issue form object`);
  for (const key of ['name', 'description', 'title']) requiredString(form[key], `${label} ${key}`);
  if (!Array.isArray(form.labels) || form.labels.some((item) => typeof item !== 'string')) fail(`${label} labels must be an array of strings`);
  if (!Array.isArray(form.body) || form.body.length === 0) fail(`${label} body must be a non-empty array`);
  const ids = new Set();
  form.body.forEach((item, index) => checkBodyItem(item, `${label} body[${index}]`, ids));
  return ids;
}

function checkCaseStudyForm(location, form, ids) {
  const label = path.relative(root, location);
  const actual = [...ids];
  if (actual.length !== CASE_STUDY_IDS.length || CASE_STUDY_IDS.some((id) => !ids.has(id))) fail(`${label} does not contain the roadmap case-study field ids`);
  const markdown = form.body.filter((item) => item.type === 'markdown').map((item) => item.attributes.value).join('\n').toLowerCase();
  if (!markdown.includes('public') || !markdown.includes('private') || !markdown.includes('security.md')) fail(`${label} must warn about public and private information`);
  if (/(?:approve|approval|consent|permission)/u.test(JSON.stringify(form).toLowerCase())) fail(`${label} must not request publication approval`);
}

export function checkContributionForms(projectRoot = root) {
  const formsDir = path.join(projectRoot, '.github', 'ISSUE_TEMPLATE');
  const names = fs.readdirSync(formsDir).filter((name) => name.endsWith('.yml') && name !== 'config.yml').sort();
  if (!names.includes('case-study.yml')) fail('case-study.yml is missing');
  for (const name of names) {
    const location = path.join(formsDir, name);
    const form = parseYaml(location);
    const ids = checkForm(location, form);
    if (name === 'case-study.yml') checkCaseStudyForm(location, form, ids);
  }
  const site = JSON.parse(fs.readFileSync(path.join(projectRoot, 'data', 'site.json'), 'utf8'));
  if (site.caseStudyProposalUrl !== EXPECTED_CASE_STUDY_URL) fail(`data/site.json caseStudyProposalUrl must be ${EXPECTED_CASE_STUDY_URL}`);
  if (typeof site.interviewUrl !== 'string' || !site.interviewUrl.startsWith('https://')) fail('data/site.json interviewUrl must be an HTTPS URL');
  const page = path.join(projectRoot, 'dist', 'case-studies', 'index.html');
  if (!fs.existsSync(page)) fail('dist/case-studies/index.html is missing; run node build.mjs first');
  const html = fs.readFileSync(page, 'utf8');
  for (const url of [site.caseStudyProposalUrl, site.interviewUrl]) if (!html.includes(`href="${url}"`)) fail(`case-studies page does not link to ${url}`);
  return { forms: names.length, caseStudyFields: CASE_STUDY_IDS.length };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const result = checkContributionForms();
    console.log(`check-contribution-forms: ${result.forms} GitHub issue forms and ${result.caseStudyFields} case-study fields pass`);
  } catch (error) {
    console.error(`check-contribution-forms: ${error.message}`);
    process.exitCode = 1;
  }
}
