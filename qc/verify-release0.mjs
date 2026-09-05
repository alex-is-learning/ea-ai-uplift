import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validateProject } from '../schema/validate.mjs';
import { checkOutput } from './check-output.mjs';
import { checkPublicFiles } from './check-public-files.mjs';
import { checkRender } from './check-render.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const fixtureDir = path.join(root, 'qc', 'fixtures');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function readJson(location) {
  return JSON.parse(fs.readFileSync(location, 'utf8'));
}

function writeJson(location, value) {
  fs.writeFileSync(location, `${JSON.stringify(value, null, 2)}\n`);
}

function cloneProject() {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'ea-ai-uplift-r0-'));
  fs.cpSync(root, temporary, {
    recursive: true,
    filter: (source) => !['dist', '.git'].includes(path.basename(source)),
  });
  return temporary;
}

function removeProject(location) {
  fs.rmSync(location, { recursive: true, force: true });
}

function runBuild(project) {
  const result = spawnSync(process.execPath, ['build.mjs'], { cwd: project, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`build failed: ${(result.stderr || result.stdout).trim()}`);
}

function outputDigest(project) {
  const dist = path.join(project, 'dist');
  const entries = [];
  function walk(location) {
    const stat = fs.lstatSync(location);
    if (stat.isDirectory()) for (const name of fs.readdirSync(location).sort()) walk(path.join(location, name));
    else entries.push(`${path.relative(dist, location)}:${crypto.createHash('sha256').update(fs.readFileSync(location)).digest('hex')}`);
  }
  walk(dist);
  return entries.join('\n');
}

function seed(project) {
  return readJson(path.join(project, 'data', 'people', 'alexander-large.json'));
}

function writeSeed(project, profile) {
  writeJson(path.join(project, 'data', 'people', 'alexander-large.json'), profile);
}

function fixtureSlug(project) {
  const used = new Set(fs.readdirSync(path.join(project, 'data', 'people')).filter((name) => name.endsWith('.json')).map((name) => path.basename(name, '.json')));
  const base = 'fixture-practitioner';
  if (!used.has(base)) return base;
  for (let number = 2; ; number += 1) {
    const candidate = `${base}-${number}`;
    if (!used.has(candidate)) return candidate;
  }
}

function validAddedProfile(profile, slug) {
  return {
    ...profile,
    slug,
    name: 'Fixture Practitioner',
    headline: 'Independent AI adoption support.',
    bio: 'A factual public profile used only to exercise the contribution build checks.',
    workMode: 'independent',
    organisation: null,
    capabilities: ['adoption', 'training'],
    availability: 'unknown',
    availabilityChecked: '2026-09-01',
    site: null,
    contact: 'https://example.org/contact',
    photo: null,
    photoApproved: { granted: false, date: '2026-09-01', policyVersion: 'r0-v1' },
  };
}

function modifyForFixture(project, fixture) {
  const profile = seed(project);
  if (fixture.changes) Object.assign(profile, fixture.changes);
  switch (fixture.case) {
    case 'overlong-url':
      profile.site = `https://example.org/${'a'.repeat(2050)}`;
      writeSeed(project, profile);
      return;
    case 'duplicate-slug': {
      const second = { ...profile, name: 'Second Fixture', slug: profile.slug };
      writeJson(path.join(project, 'data', 'people', 'duplicate.json'), second);
      return;
    }
    case 'duplicate-name': {
      const second = validAddedProfile(profile, fixtureSlug(project));
      second.name = profile.name;
      writeJson(path.join(project, 'data', 'people', `${second.slug}.json`), second);
      return;
    }
    case 'wrong-portrait': {
      const image = path.join(project, 'img', profile.photo);
      const bytes = fs.readFileSync(image);
      const sof = bytes.indexOf(Buffer.from([0xff, 0xc0]));
      assert(sof >= 0, 'fixture source JPEG lacks baseline frame marker');
      bytes.writeUInt16BE(479, sof + 7);
      fs.writeFileSync(image, bytes);
      return;
    }
    case 'jpeg-metadata': {
      const image = path.join(project, 'img', profile.photo);
      const original = fs.readFileSync(image);
      const comment = Buffer.from([0xff, 0xfe, 0x00, 0x05, 0x62, 0x61, 0x64]);
      fs.writeFileSync(image, Buffer.concat([original.subarray(0, 2), comment, original.subarray(2)]));
      return;
    }
    case 'jpeg-post-scan-metadata': {
      const image = path.join(project, 'img', profile.photo);
      const original = fs.readFileSync(image);
      const comment = Buffer.concat([Buffer.from([0xff, 0xfe, 0x00, 0x17]), Buffer.from('HIDDEN-REVIEW-PAYLOAD')]);
      fs.writeFileSync(image, Buffer.concat([original.subarray(0, -2), comment, original.subarray(-2)]));
      return;
    }
    case 'jpeg-truncated': {
      const image = path.join(project, 'img', profile.photo);
      const original = fs.readFileSync(image);
      const scan = original.indexOf(Buffer.from([0xff, 0xda]));
      assert(scan >= 0, 'fixture source JPEG lacks scan marker');
      fs.writeFileSync(image, original.subarray(0, scan + 2));
      return;
    }
    case 'jpeg-empty-scan': {
      const image = path.join(project, 'img', profile.photo);
      const original = fs.readFileSync(image);
      const scan = original.indexOf(Buffer.from([0xff, 0xda]));
      assert(scan >= 0, 'fixture source JPEG lacks scan marker');
      const scanHeaderLength = original.readUInt16BE(scan + 2);
      const scanDataStart = scan + 2 + scanHeaderLength;
      fs.writeFileSync(image, Buffer.concat([original.subarray(0, scanDataStart), original.subarray(-2)]));
      return;
    }
    case 'jpeg-corrupt-entropy': {
      const image = path.join(project, 'img', profile.photo);
      const original = fs.readFileSync(image);
      const scan = original.indexOf(Buffer.from([0xff, 0xda]));
      assert(scan >= 0, 'fixture source JPEG lacks scan marker');
      const scanHeaderLength = original.readUInt16BE(scan + 2);
      const scanDataStart = scan + 2 + scanHeaderLength;
      fs.writeFileSync(image, Buffer.concat([original.subarray(0, scanDataStart), Buffer.from([0x01]), original.subarray(-2)]));
      return;
    }
    case 'orphan-asset':
      fs.copyFileSync(path.join(project, 'img', profile.photo), path.join(project, 'img', 'orphan.jpg'));
      return;
    case 'source-symlink':
      fs.symlinkSync(path.join(project, 'data', 'people', 'alexander-large.json'), path.join(project, 'data', 'people', 'linked-profile.json'));
      return;
    case 'profile-filename-mismatch':
      fs.renameSync(path.join(project, 'data', 'people', 'alexander-large.json'), path.join(project, 'data', 'people', 'mismatch.json'));
      return;
    default:
      writeSeed(project, profile);
  }
}

function expectedError(fixture) {
  return {
    'extra-field': 'extra field',
    'duplicate-slug': 'duplicate slug',
    'duplicate-name': 'duplicate name',
    'private-network-url': 'public HTTPS hostname',
    'unsafe-url-characters': 'unsafe characters',
    'unsafe-path': 'photo must be null or exactly',
    'html-injection': 'unsafe or invalid text',
    'control-injection': 'unsafe or invalid text',
    'bidi-injection': 'unsafe or invalid text',
    'zero-width-injection': 'unsafe or invalid text',
    'word-joiner-injection': 'unsafe or invalid text',
    'arabic-letter-mark-injection': 'unsafe or invalid text',
    'overlong-url': 'must not exceed 2048 characters',
    'invalid-consent': 'listingConsent.granted must be true',
    'future-date': 'must not be in the future',
    'no-photo-consent': 'photoApproved.granted must be false',
    'wrong-portrait': '480x480',
    'jpeg-metadata': 'JPEG metadata',
    'jpeg-post-scan-metadata': 'JPEG metadata',
    'jpeg-truncated': 'truncated JPEG marker',
    'jpeg-empty-scan': 'no JPEG scan data',
    'jpeg-corrupt-entropy': 'strict JPEG decoding',
    'orphan-asset': 'orphan or unsafe asset',
    'source-symlink': 'must not be a symlink',
    'non-https-protocol': 'public HTTPS hostname',
    'invalid-work-mode': 'workMode is invalid',
    'invalid-capability': 'capabilities must use the controlled list',
    'invalid-availability': 'availability is invalid',
    'missing-consent-field': 'copyApproved is missing: policyVersion',
    'profile-filename-mismatch': 'file name must match its slug',
  }[fixture.case];
}

async function testFixtures() {
  const fixtures = fs.readdirSync(fixtureDir).filter((name) => name.endsWith('.json')).sort().map((name) => readJson(path.join(fixtureDir, name)));
  const names = [];
  for (const fixture of fixtures) {
    const project = cloneProject();
    try {
      if (fixture.case === 'add-profile') {
        const profile = validAddedProfile(seed(project), fixtureSlug(project));
        writeJson(path.join(project, 'data', 'people', `${profile.slug}.json`), profile);
        const result = validateProject({ root: project });
        assert(result.errors.length === 0, `add-profile fixture should validate: ${result.errors.join('; ')}`);
        runBuild(project);
        const output = await checkOutput(project);
        assert(fs.existsSync(path.join(output.dist, 'people', profile.slug, 'index.html')), 'add-profile fixture did not generate its own page');
      } else {
        modifyForFixture(project, fixture);
        const result = validateProject({ root: project });
        assert(result.errors.length > 0, `${fixture.case} fixture was accepted`);
        assert(result.errors.join('\n').includes(expectedError(fixture)), `${fixture.case} fixture failed for the wrong reason: ${result.errors.join('; ')}`);
      }
      names.push(fixture.case);
    } finally {
      removeProject(project);
    }
  }
  return names;
}

async function testBuildLifecycle() {
  const project = cloneProject();
  try {
    const profile = validAddedProfile(seed(project), fixtureSlug(project));
    writeJson(path.join(project, 'data', 'people', `${profile.slug}.json`), profile);
    runBuild(project);
    const pluralHome = fs.readFileSync(path.join(project, 'dist', 'index.html'), 'utf8');
    assert(pluralHome.includes('people do this work independently of each other.'), 'plural home copy is missing the grammatical plural sentence');
    assert(!pluralHome.includes('people who do this work, independently of each other.'), 'plural home copy contains the fragmentary plural sentence');
    const first = outputDigest(project);
    runBuild(project);
    assert(outputDigest(project) === first, 'build output is not deterministic');
    assert(fs.existsSync(path.join(project, 'dist', 'people', profile.slug, 'index.html')), 'added profile page is missing');
    fs.writeFileSync(path.join(project, 'dist', 'stale.html'), 'stale');
    fs.rmSync(path.join(project, 'data', 'people', `${profile.slug}.json`));
    let staleFailure = '';
    try {
      await checkOutput(project);
    } catch (error) {
      staleFailure = error.message;
    }
    assert(staleFailure.includes('stale or unexpected output'), `stale output was not caught before rebuilding: ${staleFailure || 'no failure'}`);
    runBuild(project);
    assert(!fs.existsSync(path.join(project, 'dist', 'stale.html')), 'stale output survived the clean build');
    assert(!fs.existsSync(path.join(project, 'dist', 'people', profile.slug)), 'removed profile page survived the clean build');
    await checkOutput(project);
  } finally {
    removeProject(project);
  }
}

function testPublicFileBoundary() {
  checkPublicFiles(root);
  const project = cloneProject();
  try {
    fs.writeFileSync(path.join(project, 'unlisted.txt'), 'not public');
    let unlisted = '';
    try {
      checkPublicFiles(project);
    } catch (error) {
      unlisted = error.message;
    }
    assert(unlisted.includes('unlisted public file'), 'unlisted source file was accepted');
    fs.rmSync(path.join(project, 'unlisted.txt'));
    fs.writeFileSync(path.join(project, 'CLAUDE.md'), 'private instructions');
    let forbidden = '';
    try {
      checkPublicFiles(project);
    } catch (error) {
      forbidden = error.message;
    }
    assert(forbidden.includes('forbidden public file class'), 'forbidden source file was accepted');
  } finally {
    removeProject(project);
  }
}

function testTrackedOutputBoundary() {
  const project = cloneProject();
  try {
    const init = spawnSync('git', ['init', '--quiet'], { cwd: project, encoding: 'utf8' });
    assert(init.status === 0, `temporary Git repository failed: ${init.stderr}`);
    const dist = path.join(project, 'dist');
    fs.mkdirSync(dist);
    const privateNote = path.join(dist, 'private-note.txt');
    fs.writeFileSync(privateNote, 'private');
    const add = spawnSync('git', ['add', '--force', 'dist/private-note.txt'], { cwd: project, encoding: 'utf8' });
    assert(add.status === 0, `temporary tracked output failed: ${add.stderr}`);
    fs.rmSync(privateNote);
    let trackedFailure = '';
    try {
      checkPublicFiles(project);
    } catch (error) {
      trackedFailure = error.message;
    }
    assert(trackedFailure.includes('generated output is tracked'), `tracked generated output was accepted: ${trackedFailure || 'no failure'}`);
  } finally {
    removeProject(project);
  }
}

// Section data fixtures: qc/fixtures-sections/<type>/<name>.json holds
// { "expect": "<substring of the build error>", "file": "<slug>.json", "data": {...} }.
// Each one is copied into data/<type>/ of a clone and the build must fail with
// a message containing `expect`. A section module adds fixtures without editing this file.
function testSectionFixtures() {
  const base = path.join(root, 'qc', 'fixtures-sections');
  if (!fs.existsSync(base)) return 0;
  let count = 0;
  for (const type of fs.readdirSync(base).sort()) {
    const typeDir = path.join(base, type);
    if (!fs.lstatSync(typeDir).isDirectory()) continue;
    for (const name of fs.readdirSync(typeDir).sort().filter((item) => item.endsWith('.json'))) {
      const fixture = readJson(path.join(typeDir, name));
      assert(typeof fixture.expect === 'string' && fixture.expect && typeof fixture.file === 'string' && fixture.file, `${type}/${name}: fixture needs expect and file`);
      const project = cloneProject();
      try {
        const dataDir = path.join(project, 'data', type);
        fs.mkdirSync(dataDir, { recursive: true });
        fs.writeFileSync(path.join(dataDir, fixture.file), typeof fixture.raw === 'string' ? fixture.raw : `${JSON.stringify(fixture.data, null, 2)}\n`);
        const result = spawnSync(process.execPath, ['build.mjs'], { cwd: project, encoding: 'utf8' });
        const message = `${result.stderr}${result.stdout}`;
        assert(result.status !== 0, `${type}/${name}: invalid section data was accepted by the build`);
        assert(message.includes(fixture.expect), `${type}/${name}: build failed for the wrong reason: ${message.trim()}`);
      } finally {
        removeProject(project);
      }
      count += 1;
    }
  }
  return count;
}

async function main() {
  runBuild(root);
  testPublicFileBoundary();
  testTrackedOutputBoundary();
  const fixtureNames = await testFixtures();
  await testBuildLifecycle();
  const sectionFixtures = testSectionFixtures();
  const output = await checkOutput(root);
  const render = await checkRender(root);
  console.log(`verify-release0: ${fixtureNames.length} fixtures, ${sectionFixtures} section fixtures, public allow-list boundary, deterministic add/remove lifecycle, ${output.htmlFiles} generated pages, and ${render.results.length} local Chromium renders pass`);
}

try {
  await main();
} catch (error) {
  console.error(`verify-release0: ${error.message}`);
  if (process.env.VERIFY_DEBUG) console.error(error.stack);
  process.exitCode = 1;
}
