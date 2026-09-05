import fs from 'node:fs';
import path from 'node:path';
import { unsafeText, isDate, isFutureDate, validateHttpsUrl } from '../schema/validate.mjs';

export { unsafeText, isDate, isFutureDate, validateHttpsUrl };

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

export function safeText(value, label, errors, { min = 1, max = 400 } = {}) {
  if (unsafeText(value) || !value.trim() || value.length < min || value.length > max) {
    errors.push(`${label} contains unsafe or invalid text (${min}–${max} characters, no markup, no hidden characters)`);
    return false;
  }
  return true;
}

export function exactKeys(value, fields, label, errors) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    errors.push(`${label} must be an object`);
    return false;
  }
  const allowed = new Set(fields);
  for (const key of Object.keys(value)) if (!allowed.has(key)) errors.push(`${label} has an extra field: ${key}`);
  for (const key of fields) if (!(key in value)) errors.push(`${label} is missing: ${key}`);
  return true;
}

// Loads data/<type>/*.json. A missing folder is an empty list, so a section can
// ship its module before its first entry. Every file must be a regular file
// named by its slug; validateItem(item, fileName, errors) checks the fields.
export function loadCollection(root, type, validateItem) {
  const dir = path.join(root, 'data', type);
  const errors = [];
  const items = [];
  let stat;
  try {
    stat = fs.lstatSync(dir);
  } catch {
    return { items, errors };
  }
  if (stat.isSymbolicLink() || !stat.isDirectory()) return { items, errors: [`data/${type} must be a real directory`] };
  const slugs = new Set();
  for (const name of fs.readdirSync(dir).sort()) {
    const location = path.join(dir, name);
    const itemStat = fs.lstatSync(location);
    if (itemStat.isSymbolicLink() || !itemStat.isFile() || !/^[a-z0-9]+(?:-[a-z0-9]+)*\.json$/u.test(name)) {
      errors.push(`data/${type}/${name} is an unsafe path`);
      continue;
    }
    let item;
    try {
      item = JSON.parse(fs.readFileSync(location, 'utf8'));
    } catch {
      errors.push(`data/${type}/${name} is not valid JSON`);
      continue;
    }
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      errors.push(`data/${type}/${name} must be an object`);
      continue;
    }
    if (typeof item.slug !== 'string' || !SLUG.test(item.slug) || item.slug.length > 64) errors.push(`data/${type}/${name}: slug is unsafe`);
    else if (path.basename(name, '.json') !== item.slug) errors.push(`data/${type}/${name}: file name must match its slug`);
    else if (slugs.has(item.slug)) errors.push(`data/${type}: duplicate slug ${item.slug}`);
    slugs.add(item.slug);
    validateItem(item, `data/${type}/${name}`, errors);
    items.push(item);
  }
  items.sort((a, b) => (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0));
  return { items, errors };
}

export function loadSiteConfig(root) {
  const errors = [];
  const location = path.join(root, 'data', 'site.json');
  let config;
  try {
    config = JSON.parse(fs.readFileSync(location, 'utf8'));
  } catch {
    return { config: null, errors: ['data/site.json is missing or not valid JSON'] };
  }
  exactKeys(config, ['askFormUrl', 'offerFormUrl', 'addYourselfFormUrl'], 'data/site.json', errors);
  for (const key of ['askFormUrl', 'offerFormUrl', 'addYourselfFormUrl']) validateHttpsUrl(config?.[key], `data/site.json ${key}`, errors);
  return { config, errors };
}
