(() => {
  const directory = document.querySelector('.people-directory');
  if (!directory) return;
  const search = directory.querySelector('#directory-search');
  const aim = directory.querySelector('#directory-aim');
  const contact = directory.querySelector('#directory-contact');
  const rows = [...directory.querySelectorAll('[data-person-slug]')];
  const causes = [...directory.querySelectorAll('[data-cause]')];
  const organisations = [...directory.querySelectorAll('[data-org]')];
  const conversations = directory.querySelector('.d-conversations');
  const quantity = (n, singular, plural = `${singular}s`) => `${n} ${n === 1 ? singular : plural}`;
  const normalise = (text) => text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('en');

  function filter() {
    const words = normalise(search.value).trim().split(/\s+/).filter(Boolean);
    const active = words.length > 0 || aim.checked || contact.value !== 'all';
    const people = new Map();
    for (const row of rows) {
      const matchesContact = contact.value === 'all' || (contact.value === 'conversation' ? row.dataset.conversation === 'true' : row.dataset.availability === contact.value);
      row.hidden = !((!aim.checked || row.dataset.aim === 'true') && matchesContact && words.every((word) => normalise(row.dataset.search).includes(word)));
      if (!row.hidden) people.set(row.dataset.personSlug, row.dataset.organisation);
    }
    for (const organisation of organisations) {
      const members = [...organisation.querySelectorAll('[data-person-slug]')].filter((row) => !row.hidden);
      organisation.hidden = members.length === 0;
      organisation.querySelector('[data-org-count]').textContent = `${quantity(members.length, 'person', 'people')} listed`;
      for (const preview of organisation.querySelectorAll('[data-preview-slug]')) {
        preview.hidden = preview.dataset.previewSlug !== members[0]?.dataset.personSlug;
        preview.querySelector('[data-more]').textContent = members.length > 1 ? `and ${members.length - 1} more` : '';
      }
      if (active && members.length) organisation.open = true;
    }
    for (const cause of causes) {
      const visibleOrgs = [...cause.querySelectorAll('[data-org]')].filter((organisation) => !organisation.hidden);
      const members = new Set([...cause.querySelectorAll('[data-person-slug]')].filter((row) => !row.hidden).map((row) => row.dataset.personSlug));
      cause.hidden = members.size === 0;
      if (active && members.size) cause.open = true;
      const badge = cause.querySelector('[data-cause-count]');
      badge.textContent = members.size;
      badge.setAttribute('aria-label', quantity(members.size, 'person', 'people'));
      cause.querySelector('[data-cause-org-count]').textContent = quantity(visibleOrgs.filter((organisation) => organisation.dataset.independent !== 'true').length, 'organisation');
    }
    if (conversations) conversations.hidden = ![...conversations.querySelectorAll('[data-person-slug]')].some((row) => !row.hidden);
    directory.querySelector('#directory-groups').hidden = people.size === 0;
    directory.querySelector('#directory-empty').hidden = people.size !== 0;
    directory.querySelector('#directory-aim-note').hidden = !aim.checked;
    const orgCount = new Set([...people.values()].filter(Boolean)).size;
    directory.querySelector('#directory-total').textContent = `${quantity(people.size, 'person', 'people')} · ${quantity(orgCount, 'organisation')} · ${aim.checked ? 'AIM charities only · ' : ''}group counts overlap`;
  }

  search.addEventListener('input', filter);
  aim.addEventListener('change', filter);
  contact.addEventListener('change', filter);
  directory.querySelector('#directory-expand').addEventListener('click', () => causes.filter((cause) => !cause.hidden).forEach((cause) => { cause.open = true; }));
  directory.querySelector('#directory-collapse').addEventListener('click', () => causes.filter((cause) => !cause.hidden).forEach((cause) => { cause.open = false; }));
  directory.querySelector('#directory-reset').addEventListener('click', () => {
    search.value = '';
    aim.checked = false;
    contact.value = 'all';
    filter();
    causes.forEach((cause) => { cause.open = true; });
    search.focus();
  });
  filter();
  directory.querySelectorAll('[data-directory-controls]').forEach((control) => { control.hidden = false; });
})();
