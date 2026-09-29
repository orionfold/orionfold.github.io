// Historical release notes only. Product owns current releases and the signed bucket feed.
// These records preserve what each old release said; they are not a deployment input.
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
   * current feed and DMGs are owned and published by Product.
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

/** Frozen release history through 1.5.5; current release authority is Product. */
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
  {
    // 1.5.4 (1511): the upgrade payload for installed 1.5.3 copies. Every value
    // below is from the product lane's ledger entry of 2026-08-28 18:30 PDT,
    // verified there by `release-dmg.sh verify`, `sign_update --verify`, and a
    // full anonymous download of the URL
    // (sha256 68868c36fe0fe9cd3dee098127771684bde737eae3c2e41a7d781a5cdeea74ec).
    // Website re-check 2026-08-28 19:0x PDT: a full download of the URL returned
    // 200 with 47236508 bytes and the same sha256.
    build: 1511,
    shortVersion: "1.5.4",
    published: "2026-08-28T18:26:38-07:00",
    url: "https://orionfold.supabase.co/storage/v1/object/public/flow-downloads/1.5.4/1511/Orionfold-Flow-1.5.4-1511.dmg",
    length: 47236508,
    edSignature: "pIeUPM3jIDZzLhV7478hdujlfPZks8KazsBV5XXnlkndXOeBCD03lupVC3jFPRyD4Ho91v7dgu+mD/QMXxWiCA==",
    minimumSystemVersion: "26.0",
    // Against 1.5.3, product goal 0185 "the first week on your own files":
    // 65 commits, 53 of them the goal's, fourteen user-visible rows all walked
    // with the operator on 2026-08-28 (product lane verified
    // `git log 0b1fea2..0637281`). The facts are the product lane's; the
    // wording is the website's. Sparkle renders this CDATA block as HTML under
    // its own version line.
    notes:
      "<p>What is new: this release is about your own files and folders. Flow keeps up with changes you make outside it.</p>" +
      "<p>Folders stay current. A file you add or change outside Flow shows up when you switch back, and the Folders header has a Refresh button that works on one click. " +
      "Every folder row has Copy Path, and a folder's right-click menu is now the same as its three-dot menu.</p>" +
      "<p>Documents open where you left them. A document comes back on the view it was closed in, whether you opened it from the sidebar, Recents, a search hit, or a relaunch. " +
      "An empty file opens in the Editor, and a new or reopened document has the cursor ready. Source view sits on the same centered column as Reader and Editor. " +
      "Deleting a saved document asks first, in its own words, not the unsaved-edits prompt.</p>" +
      "<p>Fewer surprises. Expand tells you how big the draft will be, on the panel and on the Leaves this Mac sheet, and a long proposal shows in full. " +
      "Removing a model from a provider no longer switches that provider off in Smart Routing. Long chart labels shorten with a dot-dot-dot and the full text shows on hover. " +
      "A chart's hover label clears under a toolbar panel or menu. Every document toolbar tool, from Bold to the microphone, shows a short note on hover saying what it does.</p>" +
      "<p>Press Install Update and Flow restarts as 1.5.4 with your documents, settings, and receipts exactly where they were.</p>",
  },
  {
    // 1.5.5 (1526): the upgrade payload for installed 1.5.4 copies. Every value
    // below is from the product lane's ledger entry of 2026-08-29 14:12 PDT,
    // verified there by `release-dmg.sh verify`, two-pass notarization
    // (app e3e27b47…, DMG 8b968448…, both Accepted and stapled), and
    // `publish-dmg.sh sign`/`verify`.
    // Website re-check 2026-08-29 14:11 PDT: a full anonymous download of the
    // URL returned 200 with 46568398 bytes and sha256
    // b2f79b5ade22de1fa8fdd3b11583beac956c74783d7e11ddb3959c296d48b90d,
    // matching the product lane's receipt.
    build: 1526,
    shortVersion: "1.5.5",
    published: "2026-08-29T14:08:48-07:00",
    url: "https://orionfold.supabase.co/storage/v1/object/public/flow-downloads/1.5.5/1526/Orionfold-Flow-1.5.5-1526.dmg",
    length: 46568398,
    edSignature: "Wm4bixihW9se3wXnYeW7J2U7C9vBJo9hKPhfTMdM4eKSu2UNyqodOEYRJQXRD5U/DOUDb4ryS2RJIOddfGbyBA==",
    minimumSystemVersion: "26.0",
    // Against 1.5.4 (1511), product goal 0187 "What leaves your Mac": 15
    // commits, 8 of them the goal's (product lane verified
    // `git log 0637281..395902a`), and the two user-facing rows are the two
    // `Unreleased` entries in the product repo's CHANGELOG. The facts are the
    // product lane's; the wording is the website's. Sparkle renders this CDATA
    // block as HTML under its own version line.
    notes:
      "<p>What is new: this release is about knowing what Flow does with your network, and being able to show it.</p>" +
      "<p>The Flow Guide now lists every time Flow reaches out. Working With Flow has a new section, " +
      "\"What leaves your Mac\", with a row for each connection: when it happens, where it goes, what is sent, and the switch that turns it off. " +
      "It also says what Flow never does. No usage statistics. No crash reports. No analytics or advertising code. " +
      "No hidden number that identifies your copy. No online check to keep working.</p>" +
      "<p>Copy Diagnostics, in the Help menu and in Settings under Flow System, writes a short block for a bug report and puts it on your clipboard. " +
      "It holds your Flow and macOS versions, the kind of Mac you have, which domains are switched on, which local runtimes are serving, and a count of any crashes in the last week. " +
      "No file paths, no document titles, no names. Flow shows you the exact text first, and nothing is sent anywhere. It goes where you paste it.</p>" +
      "<p>Nothing new leaves your Mac in this release. Flow reaches no address it did not reach before.</p>" +
      "<p>Press Install Update and Flow restarts as 1.5.5 with your documents, settings, and receipts exactly where they were.</p>",
  },
];
