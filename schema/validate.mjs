import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const profileSchema = JSON.parse(fs.readFileSync(path.join(scriptDir, 'profile.schema.json'), 'utf8'));
export const projectRoot = path.dirname(scriptDir);
export const PROFILE_FIELDS = profileSchema.required;
export const capabilityValues = new Set(profileSchema.properties.capabilities.items.enum);
const textFields = new Set(['name', 'headline', 'bio', 'organisation']);
const bidiOrControl = /[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff]/u;
const markup = /[<>&]/u;
const unfinishedToken = /\[\s*placeholder\b/iu;

function fail(errors, message) {
  errors.push(message);
}

function ownKeys(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? Object.keys(value) : [];
}

function exactKeys(value, fields, label, errors) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    fail(errors, `${label} must be an object`);
    return;
  }
  const allowed = new Set(fields);
  for (const key of ownKeys(value)) if (!allowed.has(key)) fail(errors, `${label} has an extra field: ${key}`);
  for (const key of fields) if (!(key in value)) fail(errors, `${label} is missing: ${key}`);
}

function isDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function isFutureDate(value) {
  return value > new Date().toISOString().slice(0, 10);
}

function unsafeText(value) {
  return typeof value !== 'string' || bidiOrControl.test(value) || markup.test(value) || unfinishedToken.test(value);
}

function isPublicHostname(hostname) {
  const host = hostname.toLowerCase().replace(/\.$/, '');
  if (!host || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) return false;
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host) || host.includes(':')) return false;
  return /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/u.test(host);
}

export function validateHttpsUrl(value, label, errors) {
  if (typeof value !== 'string' || bidiOrControl.test(value) || /[\s"'<>]/u.test(value) || /%0[0-9a-f]|%1[0-9a-f]/iu.test(value)) {
    fail(errors, `${label} has unsafe characters`);
    return;
  }
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    fail(errors, `${label} must be a valid HTTPS URL`);
    return;
  }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || !isPublicHostname(parsed.hostname)) {
    fail(errors, `${label} must use a public HTTPS hostname`);
  }
}

function validateConsent(value, field, errors, required) {
  exactKeys(value, ['granted', 'date', 'policyVersion'], field, errors);
  if (!value || typeof value !== 'object' || Array.isArray(value)) return;
  if (value.granted !== required) fail(errors, `${field}.granted must be ${required}`);
  if (!isDate(value.date)) fail(errors, `${field}.date must be an ISO date`);
  if (isDate(value.date) && isFutureDate(value.date)) fail(errors, `${field}.date must not be in the future`);
  if (value.policyVersion !== 'r0-v1') fail(errors, `${field}.policyVersion must be r0-v1`);
}

export function validateProfile(profile, fileName = 'profile.json') {
  const errors = [];
  exactKeys(profile, PROFILE_FIELDS, fileName, errors);
  if (!profile || typeof profile !== 'object' || Array.isArray(profile)) return errors;

  if (profile.schemaVersion !== 'r0-v1') fail(errors, `${fileName}: schemaVersion must be r0-v1`);
  if (typeof profile.slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(profile.slug) || profile.slug.length > 64) fail(errors, `${fileName}: slug is unsafe`);
  if (path.basename(fileName, '.json') !== profile.slug) fail(errors, `${fileName}: file name must match its slug`);
  for (const field of textFields) {
    const value = profile[field];
    const limit = field === 'bio' ? profileSchema.properties.bio.maxLength : field === 'headline' ? profileSchema.properties.headline.maxLength : profileSchema.properties.name.maxLength;
    if (field === 'organisation' && value === null) continue;
    if (unsafeText(value) || !value.trim() || value.length > limit) fail(errors, `${fileName}: ${field} contains unsafe or invalid text`);
  }
  if (typeof profile.name === 'string' && profile.name.length < 2) fail(errors, `${fileName}: name is too short`);
  if (typeof profile.headline === 'string' && profile.headline.length < 2) fail(errors, `${fileName}: headline is too short`);
  if (typeof profile.bio === 'string' && profile.bio.length < 20) fail(errors, `${fileName}: bio is too short`);
  if (!['in-house', 'independent', 'both'].includes(profile.workMode)) fail(errors, `${fileName}: workMode is invalid`);
  if (profile.workMode === 'independent' && profile.organisation !== null) fail(errors, `${fileName}: organisation must be null for independent work`);
  if (!Array.isArray(profile.capabilities) || profile.capabilities.length < profileSchema.properties.capabilities.minItems || profile.capabilities.length > profileSchema.properties.capabilities.maxItems || new Set(profile.capabilities).size !== profile.capabilities.length || profile.capabilities.some((item) => !capabilityValues.has(item))) fail(errors, `${fileName}: capabilities must use the controlled list without duplicates`);
  if (!['available', 'limited', 'unavailable', 'unknown'].includes(profile.availability)) fail(errors, `${fileName}: availability is invalid`);
  if (!isDate(profile.availabilityChecked)) fail(errors, `${fileName}: availabilityChecked must be an ISO date`);
  if (isDate(profile.availabilityChecked) && isFutureDate(profile.availabilityChecked)) fail(errors, `${fileName}: availabilityChecked must not be in the future`);
  if (profile.site !== null) validateHttpsUrl(profile.site, 'site', errors);
  validateHttpsUrl(profile.contact, 'contact', errors);
  if (profile.photo !== null && (typeof profile.photo !== 'string' || !new RegExp(`^${profile.slug}\\.jpg$`, 'u').test(profile.photo))) fail(errors, `${fileName}: photo must be null or exactly <slug>.jpg`);
  validateConsent(profile.listingConsent, 'listingConsent', errors, true);
  validateConsent(profile.copyApproved, 'copyApproved', errors, true);
  validateConsent(profile.photoApproved, 'photoApproved', errors, profile.photo !== null);
  return errors;
}

function ensureRegular(location, label, errors) {
  let stat;
  try {
    stat = fs.lstatSync(location);
  } catch {
    fail(errors, `${label} is missing`);
    return false;
  }
  if (stat.isSymbolicLink()) {
    fail(errors, `${label} must not be a symlink`);
    return false;
  }
  if (!stat.isFile()) {
    fail(errors, `${label} must be a regular file`);
    return false;
  }
  return true;
}

export function validateJpeg(location, expectedWidth, expectedHeight, errors, label = location) {
  if (!ensureRegular(location, label, errors)) return;
  const bytes = fs.readFileSync(location);
  if (bytes.length > 5 * 1024 * 1024) {
    fail(errors, `${label} must not exceed 5 MB`);
    return;
  }
  if (bytes.length < 10 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    fail(errors, `${label} must be a JPEG`);
    return;
  }
  let offset = 2;
  let width = 0;
  let height = 0;
  let sawJfif = false;
  while (offset < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    while (bytes[offset] === 0xff) offset += 1;
    const marker = bytes[offset++];
    if (marker === 0xd9 || marker === 0xda) break;
    if (marker === 0xfe) fail(errors, `${label} must not carry JPEG metadata`);
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (offset + 2 > bytes.length) {
      fail(errors, `${label} has a truncated JPEG marker`);
      return;
    }
    const length = bytes.readUInt16BE(offset);
    if (length < 2 || offset + length > bytes.length) {
      fail(errors, `${label} has an invalid JPEG marker length`);
      return;
    }
    const payload = bytes.subarray(offset + 2, offset + length);
    if (marker >= 0xe0 && marker <= 0xef) {
      const isJfif = marker === 0xe0 && payload.subarray(0, 5).toString('ascii') === 'JFIF\0';
      if (!isJfif) fail(errors, `${label} must not carry JPEG metadata`);
      sawJfif ||= isJfif;
    }
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      if (payload.length < 5) {
        fail(errors, `${label} has an invalid JPEG frame`);
        return;
      }
      height = payload.readUInt16BE(1);
      width = payload.readUInt16BE(3);
    }
    offset += length;
  }
  if (!sawJfif) fail(errors, `${label} must use a stripped JFIF JPEG`);
  if (width !== expectedWidth || height !== expectedHeight) fail(errors, `${label} must be exactly ${expectedWidth}x${expectedHeight}`);
}

function validateTemplate(templatePath, errors) {
  if (!ensureRegular(templatePath, '_template.json', errors)) return;
  let template;
  try {
    template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
  } catch {
    fail(errors, '_template.json is not valid JSON');
    return;
  }
  exactKeys(template, PROFILE_FIELDS, '_template.json', errors);
}

export function validateProject({ root = projectRoot, dataDir = path.join(root, 'data', 'people'), imgDir = path.join(root, 'img') } = {}) {
  const errors = [];
  let dataStat;
  try {
    dataStat = fs.lstatSync(dataDir);
  } catch {
    return { people: [], errors: ['data/people is missing'] };
  }
  if (dataStat.isSymbolicLink() || !dataStat.isDirectory()) return { people: [], errors: ['data/people must be a real directory'] };
  let imageStat;
  try {
    imageStat = fs.lstatSync(imgDir);
  } catch {
    return { people: [], errors: ['img is missing'] };
  }
  if (imageStat.isSymbolicLink() || !imageStat.isDirectory()) return { people: [], errors: ['img must be a real directory'] };

  const names = fs.readdirSync(dataDir).sort();
  if (!names.includes('_template.json')) fail(errors, 'data/people/_template.json is required');
  for (const name of names) {
    const itemPath = path.join(dataDir, name);
    const stat = fs.lstatSync(itemPath);
    if (stat.isSymbolicLink()) fail(errors, `data/people/${name} must not be a symlink`);
    if (!stat.isFile() || !/^(?:_template|[a-z0-9]+(?:-[a-z0-9]+)*)\.json$/u.test(name)) fail(errors, `data/people/${name} is an unsafe path`);
  }
  validateTemplate(path.join(dataDir, '_template.json'), errors);

  const people = [];
  const slugs = new Set();
  const publicNames = new Set();
  for (const name of names.filter((item) => item !== '_template.json' && item.endsWith('.json'))) {
    const location = path.join(dataDir, name);
    if (!ensureRegular(location, `data/people/${name}`, errors)) continue;
    let profile;
    try {
      profile = JSON.parse(fs.readFileSync(location, 'utf8'));
    } catch {
      fail(errors, `data/people/${name} is not valid JSON`);
      continue;
    }
    errors.push(...validateProfile(profile, name));
    const normalizedSlug = typeof profile.slug === 'string' ? profile.slug.normalize('NFKC').toLowerCase() : '';
    const normalizedName = typeof profile.name === 'string' ? profile.name.normalize('NFKC').trim().toLocaleLowerCase('en-GB') : '';
    if (slugs.has(normalizedSlug)) fail(errors, `duplicate slug: ${profile.slug}`);
    if (publicNames.has(normalizedName)) fail(errors, `duplicate name: ${profile.name}`);
    slugs.add(normalizedSlug);
    publicNames.add(normalizedName);
    if (typeof profile.photo === 'string') {
      validateJpeg(path.join(imgDir, profile.photo), 480, 480, errors, `img/${profile.photo}`);
      validateJpeg(path.join(imgDir, `${profile.slug}-960.jpg`), 960, 960, errors, `img/${profile.slug}-960.jpg`);
    }
    people.push(profile);
  }
  if (people.length < 1) fail(errors, 'at least one profile is required');

  const expectedImages = new Set(people.flatMap((profile) => profile.photo ? [profile.photo, `${profile.slug}-960.jpg`] : []));
  for (const name of fs.readdirSync(imgDir).sort()) {
    const item = path.join(imgDir, name);
    const stat = fs.lstatSync(item);
    if (stat.isSymbolicLink()) fail(errors, `img/${name} must not be a symlink`);
    if (!stat.isFile() || !expectedImages.has(name)) fail(errors, `img/${name} is an orphan or unsafe asset`);
  }
  return { people, errors };
}

export function assertValidProject(options) {
  const result = validateProject(options);
  if (result.errors.length) throw new Error(result.errors.join('\n'));
  return result.people;
}
