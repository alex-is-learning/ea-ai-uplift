// Prose pages (guide bodies, the learning route, the hiring pack) are JSON
// block lists, so a contributor edits data and never markup. Each block is one
// of: h2, p, ul, ol, aside, quote, links (external HTTPS), related (local paths).
import { safeText, validateHttpsUrl } from './data.mjs';

const LOCAL_PATH = /^[a-z0-9]+(?:[-/][a-z0-9]+)*\/(?:#[a-z0-9-]+)?$/u;
const TYPES = ['h2', 'p', 'ul', 'ol', 'aside', 'quote', 'links', 'related'];

function list(value, label, errors, { min = 1, max = 12, itemMax = 300 } = {}) {
  if (!Array.isArray(value) || value.length < min || value.length > max) {
    errors.push(`${label} must be a list of ${min} to ${max} entries`);
    return false;
  }
  value.forEach((item, index) => safeText(item, `${label}[${index}]`, errors, { min: 2, max: itemMax }));
  return true;
}

export function validateBlocks(blocks, label, errors, { min = 1, max = 60 } = {}) {
  if (!Array.isArray(blocks) || blocks.length < min || blocks.length > max) {
    errors.push(`${label} must be a list of ${min} to ${max} blocks`);
    return;
  }
  blocks.forEach((block, index) => {
    const where = `${label}[${index}]`;
    if (!block || typeof block !== 'object' || Array.isArray(block)) {
      errors.push(`${where} must be an object`);
      return;
    }
    const keys = Object.keys(block);
    if (!TYPES.includes(block.type)) {
      errors.push(`${where}: type must be one of ${TYPES.join(', ')}`);
      return;
    }
    const allowed = { h2: ['type', 'text'], p: ['type', 'text'], ul: ['type', 'items'], ol: ['type', 'items'], aside: ['type', 'title', 'text'], quote: ['type', 'text', 'attrib'], links: ['type', 'items'], related: ['type', 'items'] }[block.type];
    for (const key of keys) if (!allowed.includes(key)) errors.push(`${where} has an extra field: ${key}`);
    for (const key of allowed) if (!(key in block)) errors.push(`${where} is missing: ${key}`);
    switch (block.type) {
      case 'h2': safeText(block.text, `${where}.text`, errors, { min: 3, max: 90 }); break;
      case 'p': safeText(block.text, `${where}.text`, errors, { min: 10, max: 700 }); break;
      case 'ul':
      case 'ol': list(block.items, `${where}.items`, errors); break;
      case 'aside':
        safeText(block.title, `${where}.title`, errors, { min: 3, max: 80 });
        safeText(block.text, `${where}.text`, errors, { min: 10, max: 600 });
        break;
      case 'quote':
        safeText(block.text, `${where}.text`, errors, { min: 10, max: 400 });
        safeText(block.attrib, `${where}.attrib`, errors, { min: 3, max: 120 });
        break;
      case 'links':
        if (!Array.isArray(block.items) || !block.items.length || block.items.length > 6) errors.push(`${where}.items must be a list of 1 to 6 links`);
        else block.items.forEach((link, i) => {
          const at = `${where}.items[${i}]`;
          if (!link || typeof link !== 'object' || Object.keys(link).sort().join() !== 'label,url') { errors.push(`${at} must have exactly label and url`); return; }
          safeText(link.label, `${at}.label`, errors, { min: 3, max: 90 });
          validateHttpsUrl(link.url, `${at}.url`, errors);
        });
        break;
      case 'related':
        if (!Array.isArray(block.items) || !block.items.length || block.items.length > 6) errors.push(`${where}.items must be a list of 1 to 6 local links`);
        else block.items.forEach((link, i) => {
          const at = `${where}.items[${i}]`;
          if (!link || typeof link !== 'object' || Object.keys(link).sort().join() !== 'label,path') { errors.push(`${at} must have exactly label and path`); return; }
          safeText(link.label, `${at}.label`, errors, { min: 3, max: 90 });
          if (typeof link.path !== 'string' || !LOCAL_PATH.test(link.path)) errors.push(`${at}.path must be a local site path such as guides/mcp/`);
        });
        break;
      default:
    }
  });
}

export const blocksCss = `
/* ---------------- prose pages ---------------- */
.prose{max-width:66ch}
.prose h2{font-size:clamp(23px,2.4vw,30px); margin:44px 0 14px; letter-spacing:-0.025em}
.prose h2:first-child{margin-top:0}
.prose p{margin:0 0 16px; font-size:17.5px; line-height:1.6}
.prose ul,.prose ol{margin:0 0 18px; padding-left:22px; font-size:17px; line-height:1.55}
.prose li{margin-bottom:7px}
.prose .aside{margin:26px 0; padding:18px 22px; background:var(--paper); border:1.5px solid var(--cobalt);
  box-shadow:7px -6px 0 -1px rgba(232,84,31,.55)}
.prose .aside .a-title{font-family:var(--display); font-weight:800; font-size:16px; letter-spacing:-0.01em;
  color:var(--cobalt-deep); margin-bottom:6px}
.prose .aside p{margin:0; font-size:16.5px}
.prose blockquote{margin:26px 0; padding:0 0 0 20px; border-left:3px solid var(--tang)}
.prose blockquote p{font-family:var(--display); font-weight:500; font-size:19px; line-height:1.4; margin-bottom:8px}
.prose blockquote .attrib{font-size:14.5px; color:var(--ink-2); font-style:italic; margin:0}
.prose .p-links{margin:0 0 18px; padding:0; list-style:none; font-family:var(--display); font-weight:600; font-size:15.5px; line-height:1.8}
.prose .p-links a{text-decoration:none; box-shadow:inset 0 -2px 0 0 rgba(18,51,204,.35)}
.prose .p-links a:hover{color:var(--tang-ink); box-shadow:inset 0 -2px 0 0 var(--tang)}
.prose .related{margin:34px 0 0; padding-top:22px; border-top:1.5px dotted var(--tang)}
.prose .related .label{margin-bottom:8px}
`;

export function renderBlocks(blocks, { esc, escAttr, prefix = '' }) {
  return blocks.map((block) => {
    switch (block.type) {
      case 'h2': return `<h2>${esc(block.text)}</h2>`;
      case 'p': return `<p>${esc(block.text)}</p>`;
      case 'ul': return `<ul>\n${block.items.map((item) => `  <li>${esc(item)}</li>`).join('\n')}\n</ul>`;
      case 'ol': return `<ol>\n${block.items.map((item) => `  <li>${esc(item)}</li>`).join('\n')}\n</ol>`;
      case 'aside': return `<div class="aside"><p class="a-title">${esc(block.title)}</p><p>${esc(block.text)}</p></div>`;
      case 'quote': return `<blockquote><p>${esc(block.text)}</p><p class="attrib">${esc(block.attrib)}</p></blockquote>`;
      case 'links': return `<ul class="p-links">\n${block.items.map((link) => `  <li><a href="${escAttr(link.url)}" rel="noopener">${esc(link.label)}&nbsp;&#8599;</a></li>`).join('\n')}\n</ul>`;
      case 'related': return `<div class="related"><span class="label">See also</span><ul class="p-links">\n${block.items.map((link) => `  <li><a href="${escAttr(prefix + link.path)}">${esc(link.label)} &rarr;</a></li>`).join('\n')}\n</ul></div>`;
      default: return '';
    }
  }).join('\n');
}
