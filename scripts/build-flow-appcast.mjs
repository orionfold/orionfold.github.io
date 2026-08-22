// Generate public/flow/appcast.xml — the Sparkle update feed for Orionfold Flow.
//
//   npm run build:appcast
//
// WHY GENERATED AND ASSERTED RATHER THAN HAND-WRITTEN. Sparkle's worst failure
// mode is silent: it compares `CFBundleVersion`, and a non-increasing build
// number means "you are up to date" with no error, no log line, and a feed that
// validates perfectly. Every Flow build before 0127 A4 shipped build `1`. A
// generator that refuses to emit a feed Sparkle would mis-serve is the only
// thing that catches a defect whose entire nature is looking healthy.
//
// The release data lives in src/data/flow-releases.ts. To publish a release,
// add an entry there and re-run this. Never hand-edit the XML — it is a build
// artifact and will be overwritten.
//
// THE SIGNED-FEED CAVEAT, measured from Sparkle's own sources rather than docs.
// The app sets `SURequireSignedFeed`, so once releases exist the feed must
// carry an EdDSA signature appended AFTER the XML in exactly this shape
// (`SPUExtractSignedFeed.m` lines 13-14, 41-42):
//
//     <!-- sparkle-signatures:
//     edSignature: <base64>
//     length: <bytes>
//     -->
//
// where the signature covers only the bytes BEFORE that block. This generator
// does not sign — the private key is not in this repo and must never be. It
// emits the content half and tells you when signing is required. An EMPTY feed
// needs no signature to be useful: Sparkle skips item selection entirely when
// there are no items, so nothing reaches a signature check that could fail.
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  FEED_LINK,
  FEED_TITLE,
  FEED_URL,
  RELEASES,
} from "../src/data/flow-releases.ts";

const OUT = resolve(process.cwd(), "public/flow/appcast.xml");

/** XML text escaping. Applied to every interpolated value without exception. */
function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * RFC 822 date, which is what RSS (and therefore Sparkle) expects in pubDate.
 * Built from UTC parts rather than `toUTCString()` so the output cannot drift
 * with a Node locale change.
 */
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
function rfc822(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) throw new Error(`unparseable date: ${iso}`);
  const pad = (n) => String(n).padStart(2, "0");
  return `${DAYS[d.getUTCDay()]}, ${pad(d.getUTCDate())} ${MONTHS[d.getUTCMonth()]} ` +
    `${d.getUTCFullYear()} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:` +
    `${pad(d.getUTCSeconds())} +0000`;
}

/**
 * Refuse anything Sparkle would mis-serve. Every check here corresponds to a
 * failure that is silent or near-silent at runtime, which is why they are
 * errors rather than warnings.
 */
export function validate(releases) {
  const problems = [];

  const builds = releases.map((r) => r.build);
  builds.forEach((b, i) => {
    if (!Number.isInteger(b) || b < 1) {
      problems.push(`release ${i}: build must be a positive integer, got ${b}`);
    }
  });

  // THE SILENT ONE. Duplicate or non-increasing builds make Sparkle report "up
  // to date" forever, with everything else looking correct.
  const seen = new Set();
  for (const b of builds) {
    if (seen.has(b)) problems.push(`duplicate CFBundleVersion ${b} — Sparkle would serve neither`);
    seen.add(b);
  }
  for (let i = 1; i < builds.length; i++) {
    if (builds[i] <= builds[i - 1]) {
      problems.push(
        `builds must strictly increase in order: ${builds[i - 1]} then ${builds[i]}`,
      );
    }
  }

  for (const [i, r] of releases.entries()) {
    const where = `release ${r.build ?? i}`;
    if (!r.shortVersion) problems.push(`${where}: shortVersion is required`);
    if (!r.published) problems.push(`${where}: published date is required`);
    else {
      try {
        rfc822(r.published);
      } catch {
        problems.push(`${where}: published is not a valid date: ${r.published}`);
      }
    }

    // A DMG URL must be public, permanent and unauthenticated — the same
    // property the feed URL has, for the same reason (C1864: a lapsed
    // subscriber still receives security fixes).
    if (!r.url) problems.push(`${where}: url is required`);
    else {
      let u;
      try {
        u = new URL(r.url);
      } catch {
        problems.push(`${where}: url is not absolute: ${r.url}`);
      }
      if (u) {
        if (u.protocol !== "https:") problems.push(`${where}: url must be https, got ${u.protocol}`);
        if (u.search) problems.push(`${where}: url carries a query, which can identify who is asking: ${u.search}`);
        if (u.username || u.password) problems.push(`${where}: url carries credentials`);
        // The website repo is PUBLIC and GitHub hard-rejects files over 100 MB.
        // Catching this here is cheaper than discovering it at `git push`.
        if (u.hostname === "orionfold.com" && !u.pathname.endsWith(".xml")) {
          problems.push(
            `${where}: DMGs must NOT be served from orionfold.com — the repo is public and ` +
            `GitHub rejects files over 100 MB. Use the public bucket behind a vanity host.`,
          );
        }
      }
    }

    if (!Number.isInteger(r.length) || r.length <= 0) {
      problems.push(`${where}: length must be the DMG's byte count, got ${r.length}`);
    }
    // Without a signature the app refuses the update at install time — after
    // downloading it. Catching it here saves a user a failed update.
    if (!r.edSignature) {
      problems.push(
        `${where}: edSignature is required — sign the DMG with Sparkle's sign_update tool`,
      );
    }
  }

  return problems;
}

function renderItem(r) {
  const notes = r.notes
    ? `\n      <description><![CDATA[${r.notes}]]></description>`
    : "";
  const minimum = r.minimumSystemVersion
    ? `\n      <sparkle:minimumSystemVersion>${esc(r.minimumSystemVersion)}</sparkle:minimumSystemVersion>`
    : "";
  return `    <item>
      <title>${esc(`Version ${r.shortVersion}`)}</title>
      <pubDate>${esc(rfc822(r.published))}</pubDate>
      <sparkle:version>${esc(r.build)}</sparkle:version>
      <sparkle:shortVersionString>${esc(r.shortVersion)}</sparkle:shortVersionString>${minimum}${notes}
      <enclosure url="${esc(r.url)}"
                 length="${esc(r.length)}"
                 type="application/octet-stream"
                 sparkle:edSignature="${esc(r.edSignature)}" />
    </item>`;
}

export function renderAppcast(releases) {
  // Newest first — conventional for RSS, and Sparkle picks the best item
  // regardless of order, so this is for humans reading the file.
  const ordered = [...releases].sort((a, b) => b.build - a.build);

  const emptyNote = ordered.length === 0
    ? `
    <!-- No releases published yet, and this is deliberate rather than a stub.
         Nothing has shipped with a moving CFBundleVersion, no notarized DMG
         sits at a public URL, and the EdDSA key that would sign one is not in
         this repo. A fabricated entry would be worse than none: Sparkle would
         download it and fail signature verification in front of a user.

         An empty channel is well-formed and yields "you are up to date" —
         Sparkle guards item selection with items.count > 0 and reads items via
         nodesForXPath, which returns an empty array rather than nil. So the
         real feed lives at the real URL today, and the app's Check for
         Updates… tells the truth instead of erroring on a 404. -->
`
    : "";

  const items = ordered.length ? `\n${ordered.map(renderItem).join("\n")}\n` : "\n";

  return `<?xml version="1.0" encoding="utf-8"?>
<!-- Orionfold Flow update feed. GENERATED — do not hand-edit.
     Source: src/data/flow-releases.ts · Generator: scripts/build-flow-appcast.mjs
     Regenerate with: npm run build:appcast -->
<rss version="2.0" xmlns:sparkle="http://www.andymatuschak.org/xml-namespaces/sparkle">
  <channel>
    <title>${esc(FEED_TITLE)}</title>
    <link>${esc(FEED_URL)}</link>
    <description>${esc(`Updates for ${FEED_TITLE}`)}</description>
    <language>en</language>
    <atom:link xmlns:atom="http://www.w3.org/2005/Atom" href="${esc(FEED_URL)}" rel="self" type="application/rss+xml" />
${emptyNote}${items}  </channel>
</rss>
`;
}

async function main() {
  const problems = validate(RELEASES);
  if (problems.length) {
    console.error("[appcast] refusing to write — Sparkle would mis-serve this feed:\n");
    for (const p of problems) console.error(`  ✗ ${p}`);
    console.error("\nFix src/data/flow-releases.ts and re-run.");
    process.exit(1);
  }

  const xml = renderAppcast(RELEASES);
  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, xml, "utf8");

  if (RELEASES.length === 0) {
    console.log(`[appcast] wrote ${OUT} — 0 releases (empty channel, serves "up to date")`);
    console.log("[appcast] no signature needed while empty: Sparkle skips item selection entirely.");
  } else {
    const newest = [...RELEASES].sort((a, b) => b.build - a.build)[0];
    console.log(`[appcast] wrote ${OUT} — ${RELEASES.length} release(s), newest build ${newest.build} (${newest.shortVersion})`);
    console.log("[appcast] SURequireSignedFeed is ON — sign the feed before publishing:");
    console.log("[appcast]   append <!-- sparkle-signatures:\\nedSignature: <b64>\\nlength: <bytes>\\n--> after the XML");
  }
  console.log(`[appcast] ${FEED_URL} · human page ${FEED_LINK}`);
}

// Only run when invoked directly, so the tests can import the pure functions.
if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
