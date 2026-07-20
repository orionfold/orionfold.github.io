// Pure series ordering logic shared by the Astro renderer and deterministic
// tests. Source memo prose carries its series name but not its reading order.
export const MEMO_SERIES = [
  {
    name: 'Relay Packs',
    label: 'Installable operating systems',
    description:
      'Why a Pack is different from a skill, server, or plugin, followed by four domain memos that show the architecture at work.',
    slugs: ['why-relay-packs', 'web-designer-pack', 'agency-bundle', 'marketing-line', 'industry-verticals'],
  },
  {
    name: 'Relay Host & Cells',
    label: 'Honest operating boundaries',
    description:
      'How Hosts and Cells separate organization from isolation, delivery, licensed authority, customer trust, recovery, and the gated cloud direction.',
    slugs: [
      'why-relay-host-cells',
      'npm-and-cell-image',
      'ten-customers-one-host',
      'free-cell-licensed-host',
      'lose-host-keep-cell',
      'same-host-new-address',
    ],
  },
];

const ALL_ORDERED_SLUGS = MEMO_SERIES.flatMap((series) => series.slugs);

export function orderedMemos(collection) {
  const rank = (id) => {
    const index = ALL_ORDERED_SLUGS.indexOf(id);
    return index === -1 ? Number.MAX_SAFE_INTEGER : index;
  };
  return [...collection].sort((a, b) => rank(a.id) - rank(b.id) || a.id.localeCompare(b.id));
}

export function groupedMemos(collection) {
  const byId = new Map(collection.map((memo) => [memo.id, memo]));
  const groups = MEMO_SERIES.map((series) => ({
    ...series,
    memos: series.slugs.map((slug) => byId.get(slug)).filter(Boolean),
  })).filter((series) => series.memos.length > 0);

  const known = new Set(ALL_ORDERED_SLUGS);
  const unknown = collection.filter((memo) => !known.has(memo.id)).sort((a, b) => a.id.localeCompare(b.id));
  if (unknown.length) {
    groups.push({
      name: unknown[0].data.series ?? 'Relay memos',
      label: 'Additional memos',
      description: 'Additional source-verified Relay field memos.',
      slugs: unknown.map((memo) => memo.id),
      memos: unknown,
    });
  }
  return groups;
}

export function memoNeighbors(collection, memoId) {
  const group = groupedMemos(collection).find((series) => series.memos.some((memo) => memo.id === memoId));
  if (!group) return { group: null, prev: null, next: null };
  const index = group.memos.findIndex((memo) => memo.id === memoId);
  return {
    group,
    prev: index > 0 ? group.memos[index - 1] : null,
    next: index < group.memos.length - 1 ? group.memos[index + 1] : null,
  };
}
