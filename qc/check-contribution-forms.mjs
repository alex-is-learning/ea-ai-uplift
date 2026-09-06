import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const CASE_STUDY_URL = 'https://github.com/alex-is-learning/ea-ai-uplift/issues/new?template=case-study.yml';
const SKILL_REPOSITORY_URL = 'https://github.com/alex-is-learning/ea-ai-uplift/issues/new?template=skill-repository.yml';
const FORM_TYPES = new Set(['markdown', 'input', 'textarea', 'dropdown', 'checkboxes']);
const TOP_LEVEL_KEYS = new Set(['name', 'description', 'title', 'labels', 'assignees', 'body']);
const BODY_KEYS = new Set(['type', 'id', 'attributes', 'validations']);
const ATTRIBUTE_KEYS = {
  markdown: new Set(['value']),
  input: new Set(['label', 'description', 'placeholder', 'value']),
  textarea: new Set(['label', 'description', 'placeholder', 'value', 'render']),
  dropdown: new Set(['label', 'description', 'multiple', 'options', 'default']),
  checkboxes: new Set(['label', 'description', 'options']),
};
const CASE_STUDY_FIELDS = {
  submission_type: { type: 'dropdown', required: true },
  public_name: { type: 'input', required: false },
  organisation: { type: 'input', required: false },
  contact_url: { type: 'input', required: true },
  work_summary: { type: 'textarea', required: true },
  public_safety: { type: 'checkboxes', required: false },
};

function fail(message) {
  throw new Error(message);
}

function exactKeys(value, allowed, label) {
  for (const key of Object.keys(value)) if (!allowed.has(key)) fail(`${label} has an unsupported key: ${key}`);
}

function parseYaml(location, projectRoot) {
  const script = 'require "yaml"; require "json"; puts JSON.generate(YAML.safe_load(File.read(ARGV[0]), [], [], false))';
  const result = spawnSync('ruby', ['-e', script, location], { encoding: 'utf8' });
  const label = path.relative(projectRoot, location);
  if (result.error || result.status !== 0) fail(`${label} is not valid YAML: ${(result.stderr || result.error?.message || '').trim()}`);
  try {
    return JSON.parse(result.stdout);
  } catch {
    fail(`${label} did not parse as a YAML object`);
  }
}

function requiredString(value, label) {
  if (typeof value !== 'string' || !value.trim()) fail(`${label} must be a non-empty string`);
}

function optionalString(value, label) {
  if (value !== undefined && typeof value !== 'string') fail(`${label} must be a string`);
}

function checkCheckboxOptions(options, label) {
  if (!Array.isArray(options) || options.length === 0) fail(`${label} needs options`);
  for (const [index, option] of options.entries()) {
    if (!option || typeof option !== 'object' || Array.isArray(option)) fail(`${label}[${index}] must be an object`);
    exactKeys(option, new Set(['label', 'required']), `${label}[${index}]`);
    requiredString(option.label, `${label}[${index}].label`);
    if (option.required !== undefined && typeof option.required !== 'boolean') fail(`${label}[${index}].required must be a boolean`);
  }
}

function checkBodyItem(item, label, ids) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) fail(`${label} must be an object`);
  exactKeys(item, BODY_KEYS, label);
  if (typeof item.type !== 'string' || !FORM_TYPES.has(item.type)) fail(`${label} has an unsupported GitHub form type`);
  if (!item.attributes || typeof item.attributes !== 'object' || Array.isArray(item.attributes)) fail(`${label} ${item.type} needs attributes`);
  exactKeys(item.attributes, ATTRIBUTE_KEYS[item.type], `${label}.attributes`);
  if (item.type === 'markdown') {
    if (item.id !== undefined || item.validations !== undefined) fail(`${label} markdown must not have an id or validations`);
    requiredString(item.attributes.value, `${label}.attributes.value`);
    return;
  }
  requiredString(item.id, `${label}.id`);
  if (!/^[a-z][a-z0-9_-]*$/u.test(item.id)) fail(`${label} has an unsafe field id: ${item.id}`);
  if (ids.has(item.id)) fail(`${label} repeats field id: ${item.id}`);
  ids.set(item.id, item);
  requiredString(item.attributes.label, `${label}.${item.id}.label`);
  for (const key of ['description', 'placeholder', 'value', 'render']) optionalString(item.attributes[key], `${label}.${item.id}.${key}`);
  if (item.attributes.multiple !== undefined && typeof item.attributes.multiple !== 'boolean') fail(`${label}.${item.id}.multiple must be a boolean`);
  if (item.validations !== undefined) {
    if (!item.validations || typeof item.validations !== 'object' || Array.isArray(item.validations)) fail(`${label}.${item.id}.validations must be an object`);
    exactKeys(item.validations, new Set(['required']), `${label}.${item.id}.validations`);
    if (typeof item.validations.required !== 'boolean') fail(`${label}.${item.id}.validations.required must be a boolean`);
  }
  if (item.type === 'dropdown') {
    const options = item.attributes.options;
    if (!Array.isArray(options) || options.length === 0 || options.some((option) => typeof option !== 'string' || !option.trim())) fail(`${label}.${item.id} dropdown needs string options`);
    if (item.attributes.default !== undefined && (!Number.isInteger(item.attributes.default) || item.attributes.default < 0 || item.attributes.default >= options.length)) fail(`${label}.${item.id}.default must select an option`);
  }
  if (item.type === 'checkboxes') checkCheckboxOptions(item.attributes.options, `${label}.${item.id}.options`);
}

function checkForm(location, form, projectRoot) {
  const label = path.relative(projectRoot, location);
  if (!form || typeof form !== 'object' || Array.isArray(form)) fail(`${label} must be a GitHub issue form object`);
  exactKeys(form, TOP_LEVEL_KEYS, label);
  for (const key of ['name', 'description']) requiredString(form[key], `${label}.${key}`);
  optionalString(form.title, `${label}.title`);
  for (const key of ['labels', 'assignees']) {
    if (form[key] !== undefined && (!Array.isArray(form[key]) || form[key].some((item) => typeof item !== 'string'))) fail(`${label}.${key} must be an array of strings`);
  }
  if (!Array.isArray(form.body) || form.body.length === 0) fail(`${label}.body must be a non-empty array`);
  const ids = new Map();
  form.body.forEach((item, index) => checkBodyItem(item, `${label}.body[${index}]`, ids));
  return ids;
}

function requiredValue(item) {
  return item.validations?.required === true;
}

function checkCaseStudyForm(location, form, ids, projectRoot, site) {
  const label = path.relative(projectRoot, location);
  if (ids.size !== Object.keys(CASE_STUDY_FIELDS).length) fail(`${label} contains fields outside the low-risk intake set`);
  for (const [id, expected] of Object.entries(CASE_STUDY_FIELDS)) {
    const item = ids.get(id);
    if (!item || item.type !== expected.type || requiredValue(item) !== expected.required) fail(`${label}.${id} does not match the required intake field`);
  }
  const safety = ids.get('public_safety').attributes.options;
  if (safety.length !== 1 || safety[0].required !== true) fail(`${label}.public_safety must require one confirmation`);
  const markdown = form.body.filter((item) => item.type === 'markdown').map((item) => item.attributes.value).join('\n');
  const lower = markdown.toLowerCase();
  if (!lower.includes('github issues are public') || !lower.includes('private or unapproved facts')) fail(`${label} must warn about public and private information`);
  if (!lower.includes('not publication approval')) fail(`${label} must state that a proposal is not publication approval`);
  if (!markdown.includes(site.interviewUrl)) fail(`${label} must send private material to the configured interview route`);
}

function requireFields(name, ids, fields) {
  for (const field of fields) if (!ids.has(field)) fail(`${path.join('.github', 'ISSUE_TEMPLATE', name)} is missing field: ${field}`);
}

export function checkContributionForms(projectRoot = root) {
  const formsDir = path.join(projectRoot, '.github', 'ISSUE_TEMPLATE');
  const names = fs.readdirSync(formsDir).filter((name) => name.endsWith('.yml') && name !== 'config.yml').sort();
  for (const required of ['case-study.yml', 'offer.yml', 'skill-repository.yml']) if (!names.includes(required)) fail(`${required} is missing`);
  const site = JSON.parse(fs.readFileSync(path.join(projectRoot, 'data', 'site.json'), 'utf8'));
  if (site.caseStudyProposalUrl !== CASE_STUDY_URL) fail(`data/site.json caseStudyProposalUrl must be ${CASE_STUDY_URL}`);
  const forms = new Map();
  for (const name of names) {
    const location = path.join(formsDir, name);
    const form = parseYaml(location, projectRoot);
    const ids = checkForm(location, form, projectRoot);
    forms.set(name, { form, ids, location });
  }
  checkCaseStudyForm(forms.get('case-study.yml').location, forms.get('case-study.yml').form, forms.get('case-study.yml').ids, projectRoot, site);
  requireFields('offer.yml', forms.get('offer.yml').ids, ['provider_type', 'display_group']);
  requireFields('skill-repository.yml', forms.get('skill-repository.yml').ids, ['repository_url', 'maintainer', 'summary', 'compatibility']);
  const pages = [
    [path.join(projectRoot, 'dist', 'case-studies', 'index.html'), [site.caseStudyProposalUrl, site.interviewUrl]],
    [path.join(projectRoot, 'dist', 'guides', 'skills-and-plugins', 'index.html'), [SKILL_REPOSITORY_URL]],
  ];
  for (const [location, urls] of pages) {
    if (!fs.existsSync(location)) fail(`${path.relative(projectRoot, location)} is missing; run node build.mjs first`);
    const html = fs.readFileSync(location, 'utf8');
    for (const url of urls) if (!html.includes(`href="${url}"`)) fail(`${path.relative(projectRoot, location)} does not link to ${url}`);
  }
  return { forms: names.length, caseStudyFields: Object.keys(CASE_STUDY_FIELDS).length };
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
