function profileLinkItems(profile) {
  const items = [];
  if (typeof profile.site === 'string' && profile.site) items.push({ label: profile.site, url: profile.site });
  for (const link of profile.links ?? []) {
    if (!items.some((item) => item.url === link.url)) items.push(link);
  }
  return items;
}

export function renderProfileLinks(profile, { esc, escAttr }) {
  const items = profileLinkItems(profile);
  if (!items.length) return '';
  return `        <div class="p-block">
          <span class="label">Links</span>
          <p class="plinks">${items.map((link) => `<a href="${escAttr(link.url)}" rel="noopener">${esc(link.label)}</a>`).join('\n            ')}</p>
        </div>`;
}

export const linksBlock = renderProfileLinks;
