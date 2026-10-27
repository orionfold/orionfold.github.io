// Essays: the flagship (latest) first, then the rest in series order. 03 was
// first published as The Living Documents Manifesto and keeps its /manifesto/
// address and its September 6 publication date.
export const ESSAYS = [
  {
    number: '02',
    title: 'The Work We Want to Keep',
    subtitle: 'How Flow Jobs gives documents work to do while their owners keep the judgment.',
    description: 'Manav Sehgal on personal AI, working knowledge, and Flow Jobs: documents with Jobs, results you can inspect, and judgment that stays yours.',
    href: '/essays/the-work-we-want-to-keep/',
    date: '2026-09-17',
    dateLabel: 'September 17, 2026',
    minutes: 17,
    download: '/downloads/the-work-we-want-to-keep.md',
  },
  {
    number: '01',
    title: 'Room for a Renaissance',
    subtitle: 'How knowledge that keeps working can make more room for the researcher, writer, and builder in each of us.',
    description: 'The founding argument for Living Documents and a broader working life, by Manav Sehgal.',
    href: '/essay/',
    date: '2026-09-06',
    dateLabel: 'September 6, 2026',
    minutes: 13,
    download: '/downloads/room-for-a-renaissance.md',
  },
  {
    number: '03',
    title: 'The Researcher, Writer and Builder in You',
    subtitle: 'Eighteen ideas for letting your documents carry the routine.',
    description: 'Manav Sehgal on Living Documents: eighteen ideas for work that continues, judgment that stays yours, and the researcher, writer and builder in you.',
    href: '/manifesto/',
    date: '2026-09-06',
    dateLabel: 'September 6, 2026',
    minutes: 13,
    download: undefined,
  },
] as const;

export const FLAGSHIP_ESSAY = ESSAYS[0];
