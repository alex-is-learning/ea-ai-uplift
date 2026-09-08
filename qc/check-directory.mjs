import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateProfile, assertValidProject } from '../schema/validate.mjs';
import { CAUSE_AREAS } from '../lib/directory-groups.mjs';
import { peopleDirectory } from '../lib/people-directory.mjs';
import { findChromium, renderFile } from './check-render.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

export async function checkDirectory(projectRoot = root) {
  const people = assertValidProject({ root: projectRoot });
  const schema = JSON.parse(fs.readFileSync(path.join(projectRoot, 'schema/profile.schema.json'), 'utf8'));
  assert.deepEqual(schema.properties.causeAreas.items.enum, CAUSE_AREAS.map(area => area.id), 'Schema and area labels diverge');
  const seed = people.find(person => person.workMode === 'independent') ?? people[0];
  const invalid = [
    ['unknown area', { causeAreas: ['unrecognised'] }, 'causeAreas'],
    ['empty areas', { causeAreas: [] }, 'causeAreas'],
    ['repeated areas', { causeAreas: ['climate', 'climate'] }, 'causeAreas'],
    ['malformed areas', { causeAreas: { some: true } }, 'causeAreas'],
    ['too many areas', { causeAreas: CAUSE_AREAS.slice(0, 5).map(area => area.id) }, 'causeAreas'],
    ['unknown network', { networks: ['unrecognised'] }, 'networks'],
    ['unaffiliated network', { workMode: 'independent', organisation: null, networks: ['aim-charity'] }, 'aim-charity'],
    ['unaffiliated contractor', { workMode: 'independent', organisation: null, organisationRelationship: 'contractor' }, 'organisationRelationship'],
    ['non-boolean conversation', { conversationContact: 'yes' }, 'conversationContact'],
    ['unsafe source protocol', { directorySources: ['http://example.org/'] }, 'directorySources'],
    ['private source', { directorySources: ['https://internal.local/'] }, 'directorySources'],
    ['repeated sources', { directorySources: ['https://example.org/', 'https://example.org/'] }, 'directorySources'],
  ];
  for (const [name, changes, expected] of invalid) {
    const errors = validateProfile({ ...seed, ...changes }, `${seed.slug}.json`);
    assert.ok(errors.some(error => error.includes(expected)), `${name} was not rejected`);
  }
  const fallback = { ...seed, causeAreas: undefined, conversationContact: false, workMode: 'independent', organisation: null };
  delete fallback.organisationRelationship;
  const fallbackHtml = peopleDirectory([fallback], { addYourselfFormUrl: 'https://example.org/contribute' });
  assert.ok(fallbackHtml.includes('data-cause="other"'), 'Unclassified contributions disappear');
  assert.ok(fallbackHtml.includes('1 person'), 'Single person grammar');
  const expected = {
    slugs: people.map(person => person.slug).sort(),
    aim: people.filter(person => person.networks?.includes('aim-charity')).map(person => person.slug).sort(),
    conversation: people.filter(person => person.conversationContact || person.availability === 'peer-exchange').map(person => person.slug).sort(),
    paid: people.filter(person => person.availability === 'available').map(person => person.slug).sort(),
    querySlug: seed.slug,
    query: seed.name,
  };
  const expression = `(async () => {
    const expected = ${JSON.stringify(expected)};
    const errors = [];
    const check = (test, message) => { if (!test) errors.push(message); };
    const visiblePeople = () => [...new Set([...document.querySelectorAll('#directory-groups [data-person-slug]')].filter(row => !row.hidden).map(row => row.dataset.personSlug))].sort();
    const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
    const search = document.querySelector('#directory-search');
    const aim = document.querySelector('#directory-aim');
    const contact = document.querySelector('#directory-contact');
    const change = (element, value, event = 'change') => { element.value = value; element.dispatchEvent(new Event(event, { bubbles: true })); };
    check(equal(visiblePeople(), expected.slugs), 'All profiles are accessible');
    check(!search.closest('[data-directory-controls]').hidden, 'Progressive controls appear');
    aim.checked = true; aim.dispatchEvent(new Event('change'));
    check(equal(visiblePeople(), expected.aim), 'AIM filter results');
    aim.checked = false; aim.dispatchEvent(new Event('change'));
    change(contact, 'conversation');
    check(equal(visiblePeople(), expected.conversation), 'Conversation filter results');
    change(contact, 'available');
    check(equal(visiblePeople(), expected.paid), 'Paid availability is independent');
    change(contact, 'all');
    document.querySelector('#directory-collapse').click();
    check([...document.querySelectorAll('[data-cause]')].every(area => !area.open), 'Collapse areas');
    change(search, expected.query, 'input');
    check(equal(visiblePeople(), [expected.querySlug]), 'Search results');
    const match = document.querySelector('#directory-groups [data-person-slug="' + expected.querySlug + '"]');
    check(match.closest('[data-cause]').open && match.closest('[data-org]').open, 'Search reveals a collapsed result');
    change(search, 'no-such-person-or-organisation-983428', 'input');
    check(!document.querySelector('#directory-empty').hidden, 'Honest empty state');
    document.querySelector('#directory-reset').click();
    check(equal(visiblePeople(), expected.slugs), 'Reset restores directory');
    check(document.activeElement === search, 'Reset restores focus');
    match.closest('[data-cause]').open = false;
    match.closest('[data-org]').open = false;
    change(search, expected.query, 'input');
    check(match.closest('[data-cause]').open && match.closest('[data-org]').open, 'Search reveals one collapsed area');
    document.querySelector('#directory-reset').click();
    document.querySelector('#directory-expand').click();
    check([...document.querySelectorAll('[data-cause]')].every(area => area.open), 'Expand areas');
    check([...document.querySelectorAll('.d-avatar')].every(image => getComputedStyle(image).filter === 'none'), 'Portraits retain colour');
    const ids = [...document.querySelectorAll('[id]')].map(element => element.id);
    check(new Set(ids).size === ids.length, 'No duplicate IDs');
    const links = [...document.querySelectorAll('#directory-groups [data-person-slug] a')];
    check(links.every(link => link.getAttribute('href').startsWith('../people/')), 'Rows use real profile routes');
    return { errors, uniquePeople: visiblePeople().length };
  })()`;
  for (const width of [390, 1280]) {
    const result = await renderFile(findChromium(), path.join(projectRoot, 'dist/people/index.html'), { width, height: 1000 }, { expression });
    assert.deepEqual(result.value.errors, [], `Directory journeys at ${width}px`);
  }
  return { validationCases: invalid.length, viewports: 2, people: people.length };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    console.log('check-directory:', await checkDirectory());
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}
