// The Flow introduction reel on YouTube. One source for the click-to-play
// component (FlowReel.astro) and the VideoObject structured data on /flow/.
// Upload date and length read from the YouTube watch page on 2026-09-30.
import poster from '../assets/flow/reel/flow-intro-poster.jpg';

export const FLOW_REEL = {
  youtubeId: 'Wj4V5GORr2k',
  title: 'Use Flow to give your documents jobs to do while you sleep',
  eyebrow: 'Watch · 78 seconds',
  durationLabel: '1:18',
  durationIso: 'PT1M18S',
  uploadDate: '2026-09-30T19:46:16-07:00',
  poster,
  posterAlt: 'Video poster: "Give your documents work to do." beside a Flow client brief with a source on every claim.',
};

export function flowReelSchema(siteUrl: string, description: string) {
  const { youtubeId, title, durationIso, uploadDate } = FLOW_REEL;
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: title,
    description,
    thumbnailUrl: `https://i.ytimg.com/vi/${youtubeId}/maxresdefault.jpg`,
    uploadDate,
    duration: durationIso,
    embedUrl: `https://www.youtube.com/embed/${youtubeId}`,
    url: `https://www.youtube.com/watch?v=${youtubeId}`,
    publisher: { '@type': 'Organization', name: 'Orionfold', url: siteUrl },
  };
}
