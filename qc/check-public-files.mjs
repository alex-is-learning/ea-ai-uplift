import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function globExpression(pattern) {
  let expression = '^';
  for (let index = 0; index < pattern.length; index += 1) {
    const character = pattern[index];
    if (character === '*' && pattern[index + 1] === '*') {
      expression += '.*';
      index += 1;
    } else if (character === '*') {
      expression += '[^/]*';
    } else {
      expression += character.replace(/[|\\{}()[\]^$+?.]/gu, '\\$&');
    }
  }
  return new RegExp(`${expression}$`, 'u');
}

function loadAllowList(projectRoot) {
  const location = path.join(projectRoot, 'public-files.txt');
  if (!fs.existsSync(location)) throw new Error('public-files.txt is missing');
  return fs.readFileSync(location, 'utf8').split(/\r?\n/u).map((line) => line.trim()).filter((line) => line && !line.startsWith('#')).map(globExpression);
}

function forbiddenPath(relative) {
  return /(^|\/)(?:CLAUDE\.md|BAKE[^/]*\.md)$/iu.test(relative)
    || /(?:^|\/)node_modules(?:\/|$)/u.test(relative)
    || /(?:^|\/)\.vercel(?:\/|$)/u.test(relative)
    || /(^|\/)\.env(?:\.|$)/iu.test(relative)
    || /(?:DRAFT|outreach|interview|account|secret)/iu.test(relative)
    || /\.(?:pem|key|p12|pfx|sqlite|db)$/iu.test(relative)
    || /(^|\/)data\/people\.json$/u.test(relative);
}

function walk(projectRoot, location = projectRoot, results = []) {
  for (const name of fs.readdirSync(location).sort()) {
    if (location === projectRoot && (name === '.git' || name === 'dist')) continue;
    const item = path.join(location, name);
    const relative = path.relative(projectRoot, item).split(path.sep).join('/');
    const stat = fs.lstatSync(item);
    if (stat.isSymbolicLink()) throw new Error(`working tree contains a symlink: ${relative}`);
    if (stat.isDirectory()) walk(projectRoot, item, results);
    else if (stat.isFile()) results.push(relative);
    else throw new Error(`working tree contains an unsafe entry: ${relative}`);
  }
  return results;
}

export function checkPublicFiles(projectRoot = root) {
  const allowList = loadAllowList(projectRoot);
  const files = walk(projectRoot);
  for (const relative of files) {
    if (forbiddenPath(relative)) throw new Error(`forbidden public file class: ${relative}`);
    if (!allowList.some((expression) => expression.test(relative))) throw new Error(`unlisted public file: ${relative}`);
  }
  return { files: files.length };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const result = checkPublicFiles();
    console.log(`check-public-files: ${result.files} allow-listed source files pass`);
  } catch (error) {
    console.error(`check-public-files: ${error.message}`);
    process.exitCode = 1;
  }
}
