// The released Flow version every page states. The values live in
// src/data/flow-release.json, refreshed from the live update feed by
// scripts/sync-flow-release.mjs; never type a version into copy.
//   version: the marketing line ("2.1"), what copy says ("Flow 2.1")
//   release: the exact released version from the feed ("2.1" or "2.1.1")
//   build:   that release's build number
import release from '../../data/flow-release.json';

export const FLOW_RELEASE = release;
export const FLOW_VERSION = release.version;
