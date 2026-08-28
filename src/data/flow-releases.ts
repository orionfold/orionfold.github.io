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
    // Notes rewritten 2026-08-27 09:00 PDT on the product lane's 08:24 entry:
    // the facts are (a) the update check's outcome is now recorded in the
    // unified log (domain and code) so a failed check can be diagnosed, and
    // (b) the version number. Settings shows WHAT the last check found (since
    // 1382), not WHEN, so the old "when Flow last looked" sentence was false.
    // Sparkle renders this CDATA block as HTML under its own version line.
    notes:
      "<p>This is the first Flow that reaches you through Flow itself. No download and nothing to drag into Applications. " +
      "Press Install Update and Flow restarts as 1.5.1 with your documents, settings, and receipts exactly where they were.</p>" +
      "<p>What is new: Flow now writes the outcome of every update check to the system log, so if a check ever fails there is a reason to read instead of a guess. " +
      "This release also proves the road for the next ones. Every future update arrives the same way.</p>",
  },
  {
    // 1.5.2 (1414): the first update a user's installed 1.5.1 is OFFERED
    // through Sparkle (1.5.1 itself was hand-installed). Every value below is
    // from the product lane's ledger entry of 2026-08-27 10:02 PDT, verified
    // there by `release-dmg.sh verify`, `sign_update --verify`, and a full
    // anonymous download of the URL
    // (sha256 68a047f215a7b9df39172c075b176cb7c70a0230764d4ddb309d907ee8f3e8eb).
    // Website re-check 2026-08-27 10:0x PDT: `curl -I` on the URL returns 200,
    // `content-type: application/x-apple-diskimage`, `content-length: 46352670`.
    build: 1414,
    shortVersion: "1.5.2",
    published: "2026-08-27T09:57:40-07:00",
    url: "https://orionfold.supabase.co/storage/v1/object/public/flow-downloads/1.5.2/1414/Orionfold-Flow-1.5.2-1414.dmg",
    length: 46352670,
    edSignature: "mJkybMNWaxq8udfs0oAkyVyltuR87U0wpaHmitqmppn+JeR/15sEOn28Xl7SbZCPc6uIvVs9vcWI3yFA9Rc2BQ==",
    minimumSystemVersion: "26.0",
    // One user-visible change against 1.5.1, product issue #306: a pressable
    // "Update ready" button in the title bar when a newer Flow is waiting.
    // Nothing else user-visible changed (product lane verified
    // `git log dbd6c1e..340c756`). Sparkle renders this CDATA block as HTML
    // under its own version line, so keep it short: what is new, why it
    // helps, and the invitation to press Install.
    notes:
      "<p>What is new: when a newer Flow is waiting, the title bar now shows a teal Update ready button next to the version number. " +
      "Press it to see what changed and install. Before, those words sat as plain text inside the plan pill, with nothing to press. " +
      "The plan pill now shows your plan and nothing else.</p>" +
      "<p>Press Install Update and Flow restarts as 1.5.2 with your documents, settings, and receipts exactly where they were.</p>",
  },
  {
    // 1.5.3 (1446): the upgrade payload for installed 1.5.2 copies. Every value
    // below is from the product lane's ledger entry of 2026-08-28 04:40 PDT,
    // verified there by `release-dmg.sh verify`, `sign_update --verify`, and a
    // full anonymous download of the URL
    // (sha256 95cc71106d5cda19b787909d09b8d48f86204de41e93220d64f656ae988cd1ea).
    // Website re-check 2026-08-28 04:4x PDT: `curl -I` on the URL returns 200,
    // `content-type: application/x-apple-diskimage`, `content-length: 46442107`.
    build: 1446,
    shortVersion: "1.5.3",
    published: "2026-08-28T04:35:36-07:00",
    url: "https://orionfold.supabase.co/storage/v1/object/public/flow-downloads/1.5.3/1446/Orionfold-Flow-1.5.3-1446.dmg",
    length: 46442107,
    edSignature: "GSochnIz4NHY6vvQJoO9uAc6hWzkS/sQf7Cgm9tZBLmgvk6424JNYdgm+W7RiD/9AGqJ+KGvkA3nLfNjoKyOCA==",
    minimumSystemVersion: "26.0",
    // Against 1.5.2, product goal 0183 "the first week is honest": 32 commits,
    // all about what a stranger meets in their first sessions (product lane
    // verified `git log 340c756..0b1fea2`). The facts are the product lane's;
    // the wording is the website's. Sparkle renders this CDATA block as HTML
    // under its own version line.
    notes:
      "<p>What is new: this release cleans up the small things you meet in your first week with Flow.</p>" +
      "<p>Reviews are honest about size. When a model's reply matches your text except for spacing, Flow says no changes needed instead of opening an empty review. " +
      "Proofread, summarize, translate and expand now end with how many words changed out of how many.</p>" +
      "<p>Receipts read plainly. A run on your Mac says it was free and shows $0.00. The provider is named as Flow Runtime, Ollama or LM Studio. " +
      "Chart, summary, translation and table runs read Evidence, not scored. A string of autosaves folds into one Document saved N times row. " +
      "After Approve and Save, the Receipts tab lands on that run.</p>" +
      "<p>Smaller fixes: a highlight from search, a review or Ideas clears on your next click or Escape. The first heading no longer shows a raw # when a document opens. " +
      "The notice about local models that need a Flow Runtime version stays closed once you close it. Insert Image and Insert Chart grey out when there is no document to insert into. " +
      "The chart hover bubble leaves when your pointer does. Issue or Feature Request in Help opens a new issue with your Flow version filled in.</p>" +
      "<p>Press Install Update and Flow restarts as 1.5.3 with your documents, settings, and receipts exactly where they were.</p>",
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
