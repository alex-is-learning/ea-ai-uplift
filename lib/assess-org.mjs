import { loadCollection, safeText } from './data.mjs';
import { load as loadGuides } from './guides.mjs';
import { assessmentPages } from './assess.mjs';

export const id = 'assess-org';
export const navLabel = null;
export const css = '';

const SPOKE_FIELDS = ['slug', 'kind', 'order', 'key', 'label', 'short', 'strong', 'middle', 'edge', 'unmet', 'guide', 'route'];
const QUESTION_FIELDS = ['slug', 'kind', 'order', 'spoke', 'tag', 'statement', 'answers', 'notSureFirst'];
const TAGS = ['reuse', 'blocked', 'sight'];
const ANSWER_KINDS = ['percentage', 'usageMix', 'confidence', 'document', 'yesno'];
const KEY = /^[a-z]+$/u;
const POSITIONING = [
  [/\b(?:we|our|us)\b/iu, 'first-person plural'],
  [/£|\$\s?\d|€\s?\d|\bper hour\b/iu, 'a price or currency'],
  [/\b(?:revolutionary|supercharge|10x|unlock|seamless|cutting-edge|game-changing)\b/iu, 'a hype word'],
];

const ANSWERS = {
  percentage: [[1, '0%'], [2, '1–33%'], [3, '34–66%'], [4, '67–99%'], [5, '100%'], [0, 'Not sure']],
  usageMix: [
    [1, 'None: 0% use AI for real work each week'],
    [2, 'Concentrated: 1–20% use AI for real work each week'],
    [3, 'Emerging: 21–49% use AI for real work each week'],
    [4, 'Broad: 50–79% use AI for real work each week'],
    [5, 'Routine: 80–100% use AI for real work each week'],
    [0, 'Not sure'],
  ],
  confidence: [
    [1, 'Mostly a guess based on the most visible users'],
    [2, 'A rough view from a few teams or conversations'],
    [3, 'A recent view across some teams, but not the whole organisation'],
    [4, 'A recent view across most of the organisation'],
    [5, 'Recent organisation-wide data'],
    [0, 'Not sure'],
  ],
  document: [
    [1, 'Does not exist'],
    [3, 'Exists, but out of date (not touched in the last twelve months)'],
    [4, 'Exists and current, but not in or linked from where staff start work (the handbook, the drive root, onboarding)'],
    [5, 'Exists, current, and in or linked from where staff start work'],
    [0, 'Not sure'],
  ],
  yesno: [[5, 'Yes'], [1, 'No'], [0, 'Not sure']],
};

const PLACES = [
  { n: 3, title: 'Explore what is not known', because: 'Several answers are unknown, or the estimate of staff practice has limited support. Unknown does not mean weak.' },
  { n: 5, title: 'Keep established practice reliable', because: 'Scheduled work, ownership, and written rules are established. The next task is a reusable handover.' },
  { n: 1, title: 'Turn access into useful practice', because: 'Tool access is broad, but regular use and scheduled work remain limited.' },
  { n: 4, title: 'Ask for help with one process', because: 'Staff named a process that still runs by hand. The request can focus on that process.' },
  { n: 2, title: 'Work on one known condition', because: 'The result names the lowest known condition without treating unknown answers as low scores.' },
];

function exactShape(value, required, optional, label, errors) {
  const allowed = new Set([...required, ...optional]);
  for (const key of Object.keys(value)) if (!allowed.has(key)) errors.push(`${label} has an extra field: ${key}`);
  for (const key of required) if (!(key in value)) errors.push(`${label} is missing: ${key}`);
}

function positioning(value, label, errors) {
  if (typeof value !== 'string') return;
  for (const [expression, what] of POSITIONING) {
    const match = value.match(expression);
    if (match) errors.push(`${label} contains ${what}: "${match[0]}"`);
  }
}

function validateRoute(route, file, errors) {
  if (route === null) return;
  if (!route || typeof route !== 'object' || Array.isArray(route)) {
    errors.push(`${file}: route must be null or an object with title and href`);
    return;
  }
  exactShape(route, ['title', 'href'], [], `${file}: route`, errors);
  safeText(route.title, `${file}: route title`, errors, { min: 3, max: 80 });
  if (typeof route.href !== 'string' || !/^(?:https:\/\/[^\s"<>]+|(?:\.\.\/|\.\/|\/|#)(?:[^\s"<>]*))$/u.test(route.href)) errors.push(`${file}: route href must be a safe local or HTTPS link`);
}

function validateAnswers(answers, file, errors) {
  if (typeof answers === 'string') {
    if (!ANSWER_KINDS.includes(answers)) errors.push(`${file}: answers must name one of ${ANSWER_KINDS.join(', ')} or be an inline ladder`);
    return;
  }
  if (!Array.isArray(answers) || answers.length < 2) {
    errors.push(`${file}: answers must be a named kind or an inline ladder`);
    return;
  }
  const scores = [];
  for (const entry of answers) {
    if (!Array.isArray(entry) || entry.length !== 2 || !Number.isInteger(entry[0]) || entry[0] < 0 || entry[0] > 5) {
      errors.push(`${file}: every answer must be [score, label] with a score from 0 to 5`);
      continue;
    }
    scores.push(entry[0]);
    safeText(entry[1], `${file}: answer label`, errors, { min: 2, max: 180 });
    positioning(entry[1], `${file}: answer label`, errors);
  }
  if (new Set(scores).size !== scores.length) errors.push(`${file}: answer scores must be unique`);
  if (!scores.includes(0)) errors.push(`${file}: answers must include Not sure with score 0`);
}

function validateItem(item, file, errors) {
  if (item.kind === 'spoke') {
    exactShape(item, SPOKE_FIELDS, [], file, errors);
    if (!Number.isInteger(item.order) || item.order < 1 || item.order > 7) errors.push(`${file}: order must be an integer from 1 to 7`);
    if (typeof item.key !== 'string' || !KEY.test(item.key) || item.key.length > 20) errors.push(`${file}: key must be lower-case letters`);
    else if (item.slug !== `spoke-${item.key}`) errors.push(`${file}: slug must be spoke-<key>`);
    safeText(item.label, `${file}: label`, errors, { min: 3, max: 14 });
    safeText(item.short, `${file}: short`, errors, { min: 10, max: 180 });
    for (const field of ['strong', 'edge', 'unmet']) safeText(item[field], `${file}: ${field}`, errors, { min: 10, max: 650 });
    if (typeof item.middle === 'string') safeText(item.middle, `${file}: middle`, errors, { min: 10, max: 650 });
    else if (!item.middle || typeof item.middle !== 'object' || Array.isArray(item.middle)) errors.push(`${file}: middle must be text or an object keyed by score`);
    else for (const [score, line] of Object.entries(item.middle)) {
      if (!/^[2-4]$/u.test(score)) errors.push(`${file}: middle keys must be scores 2 to 4`);
      safeText(line, `${file}: middle ${score}`, errors, { min: 5, max: 300 });
      positioning(line, `${file}: middle ${score}`, errors);
    }
    if (item.guide !== null && (typeof item.guide !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(item.guide))) errors.push(`${file}: guide must be null or a guide slug`);
    validateRoute(item.route, file, errors);
    if (item.guide === null && item.route === null) errors.push(`${file}: spoke needs either a guide or a route`);
    if (item.guide !== null && item.route !== null) errors.push(`${file}: spoke must not have both guide and route`);
    for (const field of ['label', 'short', 'strong', 'edge', 'unmet']) positioning(item[field], `${file}: ${field}`, errors);
    return;
  }
  if (item.kind === 'question') {
    exactShape(item, QUESTION_FIELDS, ['freeText', 'note'], file, errors);
    if (!Number.isInteger(item.order) || item.order < 1 || item.order > 10) errors.push(`${file}: order must be an integer from 1 to 10`);
    else if (item.slug !== `question-${String(item.order).padStart(2, '0')}`) errors.push(`${file}: slug must be question-<order, two digits>`);
    safeText(item.statement, `${file}: statement`, errors, { min: 25, max: 320 });
    positioning(item.statement, `${file}: statement`, errors);
    validateAnswers(item.answers, file, errors);
    if (typeof item.notSureFirst !== 'boolean') errors.push(`${file}: notSureFirst must be true or false`);
    else if (item.notSureFirst !== (item.order === 4)) errors.push(`${file}: notSureFirst must be true on Q4 only`);
    if (item.spoke === null) {
      if (!TAGS.includes(item.tag)) errors.push(`${file}: a connective question needs tag one of ${TAGS.join(', ')}`);
    } else {
      if (typeof item.spoke !== 'string' || !KEY.test(item.spoke)) errors.push(`${file}: spoke must be a spoke key or null`);
      if (item.tag !== null) errors.push(`${file}: tag must be null on a spoke question`);
    }
    if (item.order === 9 && item.freeText !== 'Which process?') errors.push(`${file}: Q9 freeText must be exactly Which process?`);
    if (item.order !== 9 && 'freeText' in item) errors.push(`${file}: freeText is allowed on Q9 only`);
    if (item.order === 7 && item.note !== 'If there are two such people, answer for the one whose role is closer to it.') errors.push(`${file}: Q7 note must contain the two-person instruction`);
    if (item.order !== 7 && 'note' in item) errors.push(`${file}: note is allowed on Q7 only`);
    return;
  }
  errors.push(`${file}: kind must be spoke or question`);
}

export function load(root) {
  const loaded = loadCollection(root, id, validateItem);
  const errors = loaded.errors;
  const spokes = loaded.items.filter((item) => item.kind === 'spoke').sort((a, b) => a.order - b.order);
  const questions = loaded.items.filter((item) => item.kind === 'question').sort((a, b) => a.order - b.order);
  if (!errors.length && loaded.items.length) {
    if (spokes.length !== 7) errors.push(`data/${id} must hold exactly seven spoke files (found ${spokes.length})`);
    if (questions.length !== 10) errors.push(`data/${id} must hold exactly ten question files (found ${questions.length})`);
    if (new Set(spokes.map((s) => s.order)).size !== spokes.length) errors.push(`data/${id}: spoke orders must be unique`);
    if (new Set(questions.map((q) => q.order)).size !== questions.length) errors.push(`data/${id}: question orders must be unique`);
    const keys = new Set(spokes.map((s) => s.key));
    const covered = new Set();
    for (const question of questions) {
      if (question.spoke === null) continue;
      if (!keys.has(question.spoke)) errors.push(`${question.slug}: spoke ${question.spoke} does not exist`);
      if (covered.has(question.spoke)) errors.push(`${question.slug}: spoke ${question.spoke} already has a question`);
      covered.add(question.spoke);
    }
    for (const key of keys) if (!covered.has(key)) errors.push(`data/${id}: spoke ${key} has no question`);
    const tags = questions.filter((q) => q.spoke === null).map((q) => q.tag);
    if (tags.length !== 3 || new Set(tags).size !== 3) errors.push(`data/${id}: exactly three connective questions, one per tag (${TAGS.join(', ')})`);
    const guides = loadGuides(root);
    const guideSlugs = new Set(guides.items.map((guide) => guide.slug));
    for (const spoke of spokes) if (spoke.guide !== null && !guideSlugs.has(spoke.guide)) errors.push(`${spoke.slug}: guide ${spoke.guide} is not an entry in data/guides`);
  }
  return { items: loaded.items, errors };
}

export function section() {
  return '';
}

export function pages(ctx) {
  return assessmentPages(ctx, {
    kind: 'org',
    path: 'assess/org/index.html',
    prefix: '../../',
    backHref: '../',
    title: 'Your organisation’s AI conditions — a ten-question assessment — EA AI Uplift',
    description: 'Ten factual questions about the conditions an organisation provides for useful AI practice, with a seven-condition chart and a practical next step.',
    canonical: 'https://eaaiuplift.com/assess/org/',
    answerKinds: ANSWERS,
    places: PLACES,
    connectives: {
      reuse: {
        copy: {
          '1': 'Nothing written by one person is used by another. The same guide, from its first page.',
          '3': 'Once or twice. The guide from one advanced user to shared practice turns that into a habit.',
          '5': 'Prompts moved between people three or more times last month. Someone is already doing the handover job: see Ownership.',
        },
        guide: 'one-user-to-shared-practice',
        routeTitle: 'The guide from one advanced user to shared practice',
      },
      blocked: { route: { title: 'See help options', href: '../../asks/', local: true } },
      sight: { route: { title: 'Run team mode', href: '../', local: true } },
    },
    routeTitles: {
      access: 'The guide to verification and safety at work',
      reach: 'The guide to connecting a model to your systems',
      context: 'The guide to giving a model shared context',
      rules: 'The guide to verification and safety at work',
    },
  });
}
