// Orionfold Flow's published releases — the source of truth for the Sparkle
// appcast served at https://orionfold.com/flow/appcast.xml.
//
// WHY THIS FILE EXISTS RATHER THAN A HAND-EDITED XML. Sparkle decides "is there
// an update" by comparing `CFBundleVersion`, and it reports "you are up to
// date" SILENTLY when that number does not increase. Every Flow build before
// 0127 A4 shipped `CFBundleVersion` 1, so a feed published against them would
// have told every user forever that nothing was available, with no error and no
// log line. A generated feed with checked assertions is the answer to a failure
// whose whole nature is that it looks healthy.
//
// THE FEED URL IS A ONE-WAY DOOR. `SUFeedURL` is baked into the notarized
// bundle, so moving it strands every copy already installed. The DMG download
// URLs are NOT baked — they are fields inside each entry here and are rewritten
// on every release, which is what lets the binary host move freely later.
//
// HOW TO PUBLISH A RELEASE: add an entry to RELEASES below, run
// `npm run build:appcast`, and commit. The generator refuses anything Sparkle
// would mis-serve. See scripts/build-flow-appcast.mjs.

/** One published Flow release. Every field is required for a real entry. */
export interface FlowRelease {
  /**
   * `CFBundleVersion` — what Sparkle actually compares. Derived by the release
   * script from `git rev-list --count HEAD`, so it is monotonic without anyone
   * having to remember it.
   */
  build: number;
  /** The human-facing version shown in the update prompt, e.g. "0.2.0". */
  shortVersion: string;
  /** Publication date, ISO 8601. Rendered into the feed as RFC 822. */
  published: string;
  /**
   * Public, permanent HTTPS URL of the notarized DMG.
   *
   * NOT the website: this repo is PUBLIC and GitHub hard-rejects files over
   * 100 MB, so binaries live on a public bucket fronted by a vanity host. The
   * appcast (a few KB of text) is the only part that belongs in `public/`.
   */
  url: string;
  /** Exact byte length of the DMG. Sparkle checks it before extraction. */
  length: number;
  /**
   * EdDSA signature of the DMG, from Sparkle's `sign_update` tool. The private
   * key is not in this repo and never will be.
   */
  edSignature: string;
  /** Minimum macOS version, e.g. "14.0". Omit only if there is genuinely none. */
  minimumSystemVersion?: string;
  /** Plain-language release notes. Rendered as an inline CDATA description. */
  notes?: string;
}

/**
 * Every Flow release published to users, oldest first.
 *
 * THE CHANNEL WAS DELIBERATELY EMPTY UNTIL 2026-08-27. Nothing had shipped with
 * a moving build number, no notarized DMG sat at a public URL, and the EdDSA
 * private key lived only on the operator's machine. An empty channel parses
 * cleanly and yields "you are up to date" (Sparkle's `SUAppcast.m` reads items
 * via `nodesForXPath`, which returns an empty array rather than nil, and
 * `SUAppcastDriver.m` guards selection with `appcast.items.count > 0`), which is
 * why the real feed went live at the real URL before the first release existed.
 *
 * SIGNED IN EVERY STATE, EMPTY INCLUDED. Measured 2026-08-27 (product lane,
 * unified log at 01:21 PDT; confirmed in Sparkle 2.9.6 `SUAppcastDriver.m`):
 * because the app sets `SURequireSignedFeed`, Sparkle verifies the downloaded
 * feed bytes BEFORE it looks for items, so an unsigned feed fails every check
 * with `SUSparkleErrorDomain code 1000`. The feed must carry the operator's
 * signature block after every regeneration. See scripts/lib/sparkle-feed.mjs.
 *
 * WHERE EACH FIELD COMES FROM. The product lane posts every value to the
 * flow-growth ledger in one entry after `tools/release-dmg.sh` has built,
 * notarized, stapled and verified the DMG and the operator has signed it with
 * Sparkle's `sign_update`. This file copies those values verbatim; nothing here
 * is derived or guessed. The DMG host is the vanity host
 * `orionfold.supabase.co` (decision of 2026-08-22: no project ref appears in a
 * public URL), bucket `flow-downloads`, immutable versioned path
 * `<shortVersion>/<build>/Orionfold-Flow-<shortVersion>-<build>.dmg`, never
 * overwritten.
 */
export const RELEASES: FlowRelease[] = [
  {
    // 1.5.1 (1404): the first build delivered through Flow's own updater. The
    // upgrade payload for the installed 1.5 (1382). Every value below is from
    // the product lane's ledger entries of 2026-08-27 07:22 and 07:32 PDT,
    // verified there by `release-dmg.sh verify`, `stat`, `shasum -a 256`,
    // `sign_update --verify`, and a full anonymous download of the URL
    // (sha256 d635d541b59b9827d7150676471b8f518413b89eb01d9cd72f8ae1b011d3a53f).
    // Website re-check 2026-08-27 07:4x PDT: `curl -I` on the URL returns 200,
    // `content-type: application/x-apple-diskimage`, `content-length: 46317167`.
    build: 1404,
    shortVersion: "1.5.1",
    published: "2026-08-27T07:19:00-07:00",
    url: "https://orionfold.supabase.co/storage/v1/object/public/flow-downloads/1.5.1/1404/Orionfold-Flow-1.5.1-1404.dmg",
    length: 46317167,
    edSignature: "Te2Q6L2Cp60V6iJ2UMUgh7zSbEokZfvSR6yRlls0QfdZVpjN9HnlJt5Yf8wpms62pduRDuG+rcBPu0dQgKL3Dg==",
    minimumSystemVersion: "26.0",
    notes:
      "Flow 1.5.1 is the first update delivered through Flow's own updater. " +
      "It records the result of each update check, so Settings can show you when Flow last looked for a new version and what it found. " +
      "Nothing else changes.",
  },
];

/**
 * The Ed25519 public key baked into the app as `SUPublicEDKey`
 * (`~/orionfold-flow/App/Info.plist`, generated by the operator 2026-08-22).
 * Public by nature: it ships inside every Flow bundle. Its private half lives
 * in the operator's login Keychain and nowhere else. The feed test and the
 * deploy boundary verify `public/flow/appcast.xml` against this, so a feed
 * signed with any other key is caught here rather than by a user's app.
 */
export const FEED_PUBLIC_ED_KEY_BASE64 = "/K2Wh4mOYlD7J1AHqlGgzN6v4aRpEhMg9QmCCBoRlXE=";

/** The channel's title, as shown by Sparkle in some update UIs. */
export const FEED_TITLE = "Orionfold Flow";

/**
 * The feed's own canonical URL. Baked into the app as `SUFeedURL` and settled
 * with the product lane on 2026-08-22; changing it strands every installed copy.
 */
export const FEED_URL = "https://orionfold.com/flow/appcast.xml";

/** Where a human goes to read about Flow. */
export const FEED_LINK = "https://orionfold.com/flow/";

/** The most recently published release, or null when nothing has shipped. */
export function latestRelease(releases: FlowRelease[] = RELEASES): FlowRelease | null {
  if (releases.length === 0) return null;
  return releases.reduce((best, r) => (r.build > best.build ? r : best));
}
