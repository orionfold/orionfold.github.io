// The launch email carries exactly one link, https://orionfold.com/launch.
// src/pages/launch.astro sends the reader here with the campaign attribution
// attached on arrival, so GA4 counts every subscriber session from the email
// under `flow-launch` (utm_medium=email lands in the Email channel group) and
// the attribution round-trip keeps the values through checkout. The email
// itself never carries a query string or a tracking host.
export const LAUNCH_LINK_STORY = '/story/the-pit-crew-that-never-touches-the-wheel/';
export const LAUNCH_LINK_CAMPAIGN =
  'utm_source=launch-email&utm_medium=email&utm_campaign=flow-launch&utm_content=story';
export const LAUNCH_LINK_TARGET = `${LAUNCH_LINK_STORY}?${LAUNCH_LINK_CAMPAIGN}`;
