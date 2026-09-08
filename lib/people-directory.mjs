import { affiliationTags, esc, escAttr } from './shared.mjs';
import { CAUSE_AREAS } from './directory-groups.mjs';

const INDEPENDENT = 'Independent practitioners';
const quantity = (n, singular, plural = `${singular}s`) => `${n} ${n === 1 ? singular : plural}`;
const conversationContact = (person) => person.conversationContact === true || person.availability === 'peer-exchange';
const availability = {
  available: 'Available for work',
  'peer-exchange': 'Available for peer exchange',
  limited: 'Limited work availability',
  unavailable: 'Not taking work',
  unknown: 'Work availability not stated',
};

function portrait(person, prefix) {
  return person.photo
    ? `<img class="d-avatar" src="${escAttr(prefix)}img/${escAttr(person.photo)}" alt="" width="40" height="40">`
    : `<span class="d-avatar d-initials" aria-hidden="true">${esc(person.name.split(' ').map((name) => name[0]).slice(0, 2).join(''))}</span>`;
}

function personRow(person, prefix, prominent = false) {
  const causes = CAUSE_AREAS.filter((cause) => (person.causeAreas || ['other']).includes(cause.id)).map((cause) => cause.label);
  const search = [person.name, person.organisation, person.headline, ...affiliationTags(person), ...causes, ...(person.capabilities || [])].filter(Boolean).join(' ');
  return `<article class="d-person${prominent ? ' d-conversation-person' : ''}" data-person-slug="${escAttr(person.slug)}" data-search="${escAttr(search)}" data-organisation="${escAttr(person.organisation || '')}" data-aim="${(person.networks || []).includes('aim-charity')}" data-conversation="${conversationContact(person)}" data-availability="${escAttr(person.availability)}">
    ${prominent ? portrait(person, prefix) : ''}
    <div class="d-person-copy">
      <h3><a href="${escAttr(prefix)}people/${escAttr(person.slug)}/">${esc(person.name)}</a></h3>
      <p class="d-affiliation" aria-label="Work affiliation">${affiliationTags(person).map((tag) => `<span>${esc(tag)}</span>`).join(' · ')}</p>
      ${prominent ? '' : `<p class="d-headline">${esc(person.headline)}</p>`}
      ${person.publicationBasis === 'public-sources-pending-review' ? '<p class="d-draft">Public-source draft · not yet reviewed by this person</p>' : ''}
    </div>
    <div class="d-contact">
      <p>${esc(availability[person.availability])}</p>
      <a href="${prominent ? escAttr(person.contact) : `${escAttr(prefix)}people/${escAttr(person.slug)}/`}">${prominent ? 'Arrange a conversation' : 'Profile &amp; contact'} <span aria-hidden="true">↗</span></a>
    </div>
  </article>`;
}

function organisation(name, members, prefix) {
  const independent = name === INDEPENDENT;
  return `<details class="d-organisation" data-org="${escAttr(name)}" data-independent="${independent}">
    <summary>
      <span class="d-chevron" aria-hidden="true"></span>
      <span><span class="d-org-name">${esc(name)}</span>${!independent && members.some((p) => (p.networks || []).includes('aim-charity')) ? '<span class="d-org-flag">AIM charity</span>' : ''}<span class="d-org-note"><span data-org-count>${quantity(members.length, 'person', 'people')} listed</span>${independent ? ' · no shared employer' : ''}</span></span>
      <span class="d-member-previews">${members.map((person, index) => `<span class="d-member-preview" data-preview-slug="${escAttr(person.slug)}"${index ? ' hidden' : ''}>${portrait(person, prefix)}<span>${esc(person.name)}<span class="d-member-more" data-more>${members.length > 1 ? `and ${members.length - 1} more` : ''}</span></span></span>`).join('')}</span>
      <span class="d-open-hint" aria-hidden="true"></span>
    </summary>
    <div class="d-members">${members.map((person) => personRow(person, prefix)).join('\n')}</div>
  </details>`;
}

function causeGroups(people) {
  return CAUSE_AREAS.map((cause) => {
    const groups = new Map();
    const add = (name, person) => {
      if (!groups.has(name)) groups.set(name, []);
      if (!groups.get(name).some((entry) => entry.slug === person.slug)) groups.get(name).push(person);
    };
    for (const person of people) {
      if (person.workMode === 'both' && cause.id === 'cross-cause-support') add(INDEPENDENT, person);
      else if ((person.causeAreas || ['other']).includes(cause.id)) add(person.organisation || INDEPENDENT, person);
    }
    return { ...cause, groups: [...groups].sort(([a], [b]) => a === INDEPENDENT ? 1 : b === INDEPENDENT ? -1 : a.localeCompare(b, 'en')) };
  }).filter((cause) => cause.groups.length);
}

export function peopleDirectory(people, site, prefix = '../') {
  const groups = causeGroups(people);
  const independentPeople = people.filter((person) => person.workMode !== 'in-house');
  const conversations = people.filter((person) => person.conversationContact === true && person.workMode !== 'in-house');
  const count = new Set(people.map((person) => person.slug)).size;
  const organisations = new Set(people.map((person) => person.organisation).filter(Boolean)).size;
  return `<section class="people-directory" id="people" aria-labelledby="people-title">
  <div class="wrap">
    <div class="d-intro"><div><p class="legend">The people</p><h1 id="people-title">People doing this work</h1><p>Find people at organisations in your field, and independent practitioners.</p></div><a class="more" href="${escAttr(site.addYourselfFormUrl)}">Add yourself</a></div>
    <p class="d-offers"><a href="${escAttr(prefix)}offers/">Offers</a></p>
    <div class="d-toolbar" data-directory-controls hidden>
      <label class="d-search">Find<input id="directory-search" type="search" placeholder="Person, organisation or area" autocomplete="off"></label>
      <label class="d-aim" title="Organisations incubated by AIM’s Charity Entrepreneurship programme"><input id="directory-aim" type="checkbox"> AIM charities</label>
      <label class="d-contact-filter">Contact<select id="directory-contact"><option value="all">Any preference</option><option value="conversation">Conversation contacts</option><option value="available">Available for work</option><option value="limited">Limited availability</option><option value="unavailable">Not taking work</option><option value="unknown">Work availability not stated</option></select></label>
    </div>
    <div class="d-listing-bar"><p id="directory-total" role="status">${quantity(count, 'person', 'people')} · ${quantity(organisations, 'organisation')} · group counts overlap</p><div class="d-actions" data-directory-controls hidden><button type="button" id="directory-expand">Expand cause areas</button><button type="button" id="directory-collapse">Collapse cause areas</button></div></div>
    <p class="d-aim-note" id="directory-aim-note" hidden>AIM charities are organisations incubated by Charity Entrepreneurship at Ambitious Impact. This filter uses recorded affiliations.</p>
    ${conversations.length ? `<section class="d-conversations" aria-labelledby="conversation-title"><h2 id="conversation-title">Talk about AI uplift</h2><p class="d-section-note">Independent practitioners with a contact route for a conversation about AI uplift.</p><div class="d-conversation-grid">${conversations.map((person) => personRow(person, prefix, true)).join('\n')}</div></section>` : ''}
    <div id="directory-groups"><h2 class="d-browse-title">Browse by area</h2>
      ${groups.map((cause) => {
        const members = new Set(cause.groups.flatMap(([, entries]) => entries.map((p) => p.slug))).size;
        const orgs = cause.groups.filter(([name]) => name !== INDEPENDENT).length;
        const contributionUrl = new URL(site.addYourselfFormUrl);
        contributionUrl.searchParams.set('cause_areas', cause.id);
        return `<details class="d-cause" data-cause="${cause.id}" open><summary><span class="d-chevron" aria-hidden="true"></span><h2>${esc(cause.label)}</h2><span class="d-cause-count"><span data-cause-org-count>${quantity(orgs, 'organisation')}</span><span class="d-count-dot" data-cause-count aria-label="${quantity(members, 'person', 'people')}">${members}</span></span></summary><div class="d-cause-body">${cause.groups.map(([name, entries]) => organisation(name, entries, prefix)).join('\n')}<p class="d-cause-footer"><a href="${escAttr(contributionUrl.href)}">Add yourself here</a></p></div></details>`;
      }).join('\n')}
      <details class="d-cause d-independent-section" data-independent-group open><summary><span class="d-chevron" aria-hidden="true"></span><h2>${INDEPENDENT}</h2><span class="d-cause-count"><span class="d-count-dot" data-independent-count aria-label="${quantity(independentPeople.length, 'person', 'people')}">${independentPeople.length}</span></span></summary><div class="d-cause-body d-independent-members">${independentPeople.map((person) => personRow(person, prefix)).join('\n')}</div></details>
    </div>
    <div class="d-empty" id="directory-empty" hidden><h2>No profiles match these filters</h2><p>These filters use recorded information. A missing match does not mean that no relevant work exists.</p><button type="button" id="directory-reset">Clear filters</button></div>
    <div class="d-footer"><p>People can appear in more than one area. Counts describe listed people, not all activity in a field.</p><a href="${escAttr(site.addYourselfFormUrl)}">Your organisation missing? Add yourself</a></div>
  </div>
</section>`;
}

export const peopleDirectoryCss = `
.people-directory{padding:34px 0 48px}
.people-directory [hidden]{display:none!important}
.people-directory button,.people-directory input,.people-directory select{font:inherit}
.d-intro{display:flex;align-items:center;justify-content:space-between;gap:24px}
.d-intro h1{font-size:clamp(30px,3.5vw,40px)}
.d-intro p:not(.legend){color:var(--ink-2);margin-top:12px;font-size:17px}
.d-intro>a{flex-shrink:0;font-size:14px;font-weight:700}
.d-offers{margin:14px 0 20px;font-size:14px;font-weight:700}
.d-toolbar{display:flex;align-items:center;gap:18px;padding:16px 0;border-block:1px solid var(--rule)}
.d-search{flex:1;display:flex;align-items:center;gap:12px;font-size:14px;color:var(--ink-2)}
.d-search input{width:100%;min-width:0;max-width:470px}
.d-toolbar input[type=search],.d-toolbar select{border:1px solid #a9a79e;background:#fffdf8;padding:10px 12px;border-radius:2px;color:var(--ink)}
.d-aim{display:flex;align-items:center;gap:8px;white-space:nowrap;font-size:15px;font-weight:700;cursor:pointer}
.d-aim input{width:18px;height:18px;margin:0;accent-color:var(--cobalt)}
.d-contact-filter{display:flex;align-items:center;gap:8px;font-size:14px;color:var(--ink-2)}
.d-contact-filter select{max-width:215px}
.d-listing-bar{display:flex;justify-content:space-between;align-items:baseline;gap:15px;margin:14px 0 24px;font-size:13px;color:var(--ink-2)}
.d-actions{display:flex;gap:18px}
.people-directory button{border:0;background:none;color:var(--cobalt);padding:0;font-weight:700;text-align:left;cursor:pointer;text-decoration:underline;text-underline-offset:3px}
.d-aim-note{font-size:14px;margin-bottom:20px;color:var(--ink-2)}
.d-conversations{padding:18px 20px 10px;margin-bottom:30px;border:1px solid var(--rule);border-top:3px solid var(--tang);background:var(--paper-2)}
.d-conversations h2{font-size:23px}
.d-section-note{font-size:14px;color:var(--ink-2);margin:8px 0 14px}
.d-person{display:grid;grid-template-columns:minmax(0,1fr) 205px;gap:20px;padding:13px 0;border-top:1px dotted var(--tang-ink)}
.d-person h3{font-size:16px;line-height:1.3}
.d-person h3 a{color:var(--ink);text-decoration:none}
.d-person h3 a:hover{color:var(--cobalt);text-decoration:underline}
.d-person .d-affiliation{font-size:13px;line-height:1.45;color:var(--ink-2);margin-top:3px}
.d-headline{font-size:15px;line-height:1.4;margin-top:5px;color:var(--ink-2);max-width:72ch}
.d-draft{font-size:12px;color:var(--tang-ink);margin-top:6px}
.d-contact p{font-size:13px;color:var(--ink-2);margin-bottom:5px}
.d-contact a{font-size:14px;font-weight:700}
.d-conversation-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px}
.d-conversation-person{grid-template-columns:40px minmax(0,1fr);align-content:start;align-items:start;gap:12px;border-color:var(--rule)}
.d-conversation-person .d-contact{grid-column:1/-1}
.d-browse-title{font-size:16px;margin-bottom:6px;color:var(--ink-2)}
.d-cause{margin-bottom:23px}
.d-cause>summary{display:flex;align-items:center;gap:12px;padding:13px 0;border-bottom:2px solid var(--cobalt);list-style:none;color:var(--cobalt);cursor:pointer}
.people-directory summary::-webkit-details-marker{display:none}
.d-cause>summary h2{font-size:24px;line-height:1.2}
.d-chevron{width:15px;flex-shrink:0;font-family:system-ui;font-size:20px;line-height:1}
.d-chevron::before{content:"+"}
.d-cause[open]>summary>.d-chevron::before,.d-organisation[open]>summary>.d-chevron::before{content:"−"}
.d-cause-count{margin-left:auto;display:flex;gap:12px;align-items:center;color:var(--ink-2);font-size:13px;flex-shrink:0}
.d-count-dot{min-width:28px;height:28px;padding:0 5px;border-radius:50%;background:var(--tang-ink);color:white;display:inline-flex;align-items:center;justify-content:center;font-weight:700}
.d-cause-body{padding-left:27px}
.d-cause-footer{padding-top:9px;text-align:right;font-size:13px}
.d-organisation{border-bottom:1px solid var(--rule)}
.d-organisation>summary{display:grid;grid-template-columns:14px minmax(0,1fr) 218px 22px;align-items:center;gap:13px;list-style:none;padding:14px 0;cursor:pointer}
.d-org-name{font-family:var(--display);font-weight:700;font-size:19px;letter-spacing:-.02em;line-height:1.25}
.d-org-note{display:block;color:var(--ink-2);font-size:13px;margin-top:3px}
.d-org-flag{display:inline-block;color:var(--tang-ink);font-size:11px;line-height:1.2;border:1px solid var(--tang-ink);padding:3px 5px;margin-left:9px;vertical-align:middle;font-weight:700}
.d-member-preview{display:flex;align-items:center;gap:11px;font-size:14px;color:var(--ink-2);min-width:0}
.d-member-more{display:block;font-size:12px}
.d-avatar{display:block;width:40px;height:40px;object-fit:cover;flex-shrink:0;border:1px solid var(--ink);background:var(--paper-2);box-shadow:3px -3px 0 #ed916e;filter:none;mix-blend-mode:normal}
.d-initials{display:flex;align-items:center;justify-content:center;font-size:13px}
.d-open-hint{color:var(--cobalt);font-size:19px}
.d-open-hint::before{content:"›"}
.d-organisation[open]>summary>.d-open-hint::before{content:"⌄"}
.d-members{padding:2px 0 8px 27px}
.d-empty{padding:20px 0}
.d-empty h2{font-size:24px}
.d-empty p{margin:10px 0 16px;color:var(--ink-2)}
.d-footer{display:flex;justify-content:space-between;gap:25px;border-top:1.5px solid var(--ink);padding-top:20px;margin-top:30px;font-size:13px;color:var(--ink-2)}
.d-footer p{max-width:70ch}
.d-footer a{font-weight:700;flex-shrink:0}
@media(max-width:1000px){.d-toolbar{flex-wrap:wrap}.d-search{flex-basis:100%}.d-search input{max-width:none}.d-contact-filter{margin-left:auto}}
@media(max-width:650px){
  .d-intro{display:block}.d-intro>a{display:inline-block;margin-top:15px}
  .d-toolbar{gap:14px}.d-contact-filter{margin-left:0;width:100%;justify-content:space-between}.d-contact-filter select{max-width:70%}
  .d-listing-bar{flex-wrap:wrap;margin-bottom:20px}.d-actions{gap:16px}
  .d-conversations{padding:16px 13px 8px}.d-conversation-grid{grid-template-columns:1fr;gap:0}.d-conversation-person{grid-template-columns:36px minmax(0,1fr)}.d-conversation-person .d-contact{grid-column:2}
  .d-person{gap:10px}.d-person:not(.d-conversation-person){grid-template-columns:1fr}
  .d-contact{display:flex;gap:8px 16px;align-items:center;flex-wrap:wrap}.d-contact p{margin:0}
  .d-cause>summary{gap:8px}.d-cause>summary h2{font-size:21px}.d-cause-count>[data-cause-org-count]{display:none}.d-count-dot{min-width:25px;height:25px}
  .d-cause-body{padding-left:12px}.d-organisation>summary{grid-template-columns:12px minmax(0,1fr) 18px;gap:8px}.d-org-name{font-size:17px}
  .d-member-previews{grid-column:2;grid-row:2;margin-top:4px}.d-open-hint{grid-column:3;grid-row:1}.d-avatar{width:36px;height:36px}
  .d-org-flag{margin-left:0;margin-top:5px;display:table}.d-members{padding-left:20px}.d-org-note{font-size:12px}
  .d-footer{display:block}.d-footer a{display:inline-block;margin-top:12px}
}
`;
