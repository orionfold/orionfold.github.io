# Multi-site stats tracking — orionfold.com + ainative.business

**Date:** 2026-06-27
**Status:** Design approved, ready for implementation plan
**Scope:** Extend the existing stats/audit tooling (the `seo-aeo-audit` skill + the `scripts/` metrics fetchers + the M7 health dashboard) so it tracks **ainative.business** alongside **orionfold.com**, at full parity: Cloudflare edge performance, GA4 traffic, GSC indexing/search, and Lighthouse.

## Why

The tooling built for orionfold.com (CF edge fetcher, GA4/GSC manual captures, Lighthouse, the local health dashboard) is single-site by construction. We now want the same growth + performance read on the sister site **ainative.business** (the upstream `ainative-business.github.io` GitHub Pages site). Two facts make this cheap rather than a rebuild:

1. **ainative.business is an active Cloudflare zone on the SAME account as orionfold.com** (`Manav@orionfold.com's Account`, account id `55f407ace1110929222c9dbc269c09d9`). Verified live 2026-06-27 via `GET /client/v4/zones` with the existing token:
   - `ainative.business` → zone id `506ad3d8f352887fd33766b0858f41f6` (active)
   - `orionfold.com` → zone id `3512c8e3c458c154d8eb47598b1d2846` (active)
   The existing All-zones `CLOUDFLARE_API_TOKEN` (Analytics:Read) **already reads both zones** — no new token, no new secret.
2. **The same Google login switches GA4 property and GSC property.** GA4/GSC are already captured manually via Claude-in-Chrome (the Workspace org blocks both APIs — see memory `google-workspace-api-blocks`). Adding ainative is "read a second property under the same login," not new code.

## Decisions (locked during brainstorming)

| Decision | Choice | Rationale |
|---|---|---|
| Tracking scope | **Full parity**: CF + GA4 + GSC + Lighthouse | Same two-engine read (earned vs paid) on both sites |
| Structure | **Shared multi-site pipeline via a sites registry** | One audit run covers both; no duplicated logic to drift |
| File-name migration | **orionfold keeps bare `<source>-<date>.json`; ainative gets a `-ainative` suffix** | Zero rewrite; existing dashboard trend lines stay continuous |
| CF secret | **Reuse existing token; zone id inlined in the registry** | Token already covers both zones; zone ids are identifiers, not credentials |

## Architecture — four layers matching the existing seams

### 1. Sites registry — `scripts/lib/sites.mjs` (new; single source of truth)

An ordered `SITES` array. Zone ids and property ids are **identifiers, not secrets**, so they live inline — nothing new goes into `.env.local`. The CF API *token* stays the only CF secret.

```js
export const SITES = [
  {
    key: 'orionfold',
    domain: 'orionfold.com',
    isDefault: true,                  // ⇒ bare filenames, no site segment
    cfZoneId: '3512c8e3c458c154d8eb47598b1d2846',
    ga4: 'a395553282p538751483',
    gsc: 'sc-domain:orionfold.com',
    lighthouseUrl: 'https://orionfold.com/',
  },
  {
    key: 'ainative',
    domain: 'ainative.business',
    cfZoneId: '506ad3d8f352887fd33766b0858f41f6',
    ga4: 'TBD-first-run',             // read during first roundtrip, then fill
    gsc: 'sc-domain:ainative.business',
    lighthouseUrl: 'https://ainative.business/',
  },
];

export const DEFAULT_SITE = SITES.find((s) => s.isDefault);
export const siteByKey = (key) => SITES.find((s) => s.key === key) ?? null;
```

### 2. File naming + loader — `scripts/lib/metrics.mjs` + `scripts/lib/dashboard-data.mjs`

- **`writeMetric(source, data, site)`** gains an optional `site`. Default site (orionfold) ⇒ `cloudflare-<date>.json` (unchanged). Non-default ⇒ `cloudflare-ainative-<date>.json`. **No file renames; existing trends unbroken.**
- **`loadSnapshots()`** regex gains an optional middle segment:
  `^(.+?)-(?:(ainative|orionfold)-)?(\d{4}-\d{2}-\d{2})\.json$`
  Groups → `{ source, site: (matched || 'orionfold'), date }`. Old bare files load as orionfold via the fallback. Snapshots key by **source AND site**.

### 3. Fetchers — loop over `SITES`

- **`fetch-cloudflare.mjs`** — refactor the body into `fetchZone(token, zoneId) → result`, then loop the registry: per site call `fetchZone(token, site.cfZoneId)` and `writeMetric('cloudflare', result, site.key)`. One token, two zones. Per-site try/catch — ainative failing never blocks orionfold.
- **`summarize-lighthouse.mjs`** — orionfold's CI-artifact path is **unchanged**. ainative is a separate GitHub Pages repo with its own CI, so there is no local ainative LHCI artifact; **ainative Lighthouse is captured live during the skill roundtrip** via `mcp__chrome-devtools__lighthouse_audit` and persisted as `lighthouse-ainative-<date>.json`. The fetcher never fabricates an ainative lab score it cannot source.
- **`fetch-crux.mjs`** — loop over `SITES` (keyed CrUX API, per-origin). Each origin writes `crux[-ainative]-<date>.json`.
- **`fetch-betterstack.mjs`** — **orionfold-only, unchanged** (ainative uptime monitors are a separate spec; the free tier is at its 10-monitor cap).

### 4. Dashboard render — group panels by site — `scripts/lib/dashboard-render.mjs`

- `latest(source)` → `latest(source, site)` (defaults to the default site for back-compat).
- The four data panels (Lighthouse, Cloudflare, Field-CWV, SEO/AEO) render **once per site**, under a site header (`orionfold.com` / `ainative.business`), using the existing panel components and peer design system.
- Better Stack, CI/Deploy, and Todos stay **single** (orionfold infra/agency) — not per-site.
- A site with no snapshot yet ⇒ `latest()` returns null ⇒ existing "capture pending / no data yet" state. ainative panels show "pending" until the first run populates them.

### Manual-capture flow — the `seo-aeo-audit` skill

- `references/analytics-roundtrip.md` gains a **"for each site in `scripts/lib/sites.mjs`"** loop: switch GA4 property, switch GSC property (same Google login), run the live Lighthouse, and drop `{ga4,gsc,lighthouse}-<site-suffix>-<date>.json`.
- `SKILL.md` reframes from "orionfold.com" to "the sites in the registry"; the static-audit step (`audit-static.mjs`, reads `dist/`) stays orionfold-only (it audits this repo's built HTML — ainative's built HTML lives in the other repo and is out of scope for the static checker).

## Error handling

- **Per-site isolation everywhere.** Each fetcher wraps each site in its own try/catch and records a per-site error field (same pattern as the existing `dailyTrendError`/`last24hError`). One site's bad token/zone never aborts the other.
- **Registry as the single config point.** A missing `cfZoneId` for a site ⇒ that site's CF fetch logs "no zone configured" and skips, never throws.
- **`fetch-metrics.mjs`** orchestrator keeps its existing tolerance (a fetcher exiting non-zero never aborts the others); it now logs per-site outcomes.
- **Dashboard** renders null snapshots as the existing pending/no-data states — never an error panel.

## Testing / verification

1. `node scripts/fetch-cloudflare.mjs` → writes **both** `cloudflare-<date>.json` and `cloudflare-ainative-<date>.json`, each with real `dailyTrend`/`last24h` (live API — the real proof the token reads ainative).
2. `npm run metrics` end-to-end → both sites' files land; orchestrator summary shows per-site status.
3. `npm run dashboard` → `audit-reports/dashboard.html` shows two site sections; **orionfold trends are unbroken** (bare-filename fallback works); ainative shows CF data + "pending" for GA4/GSC.
4. Loader regex check: `cloudflare-2026-06-27.json` → site `orionfold`; `cloudflare-ainative-2026-06-27.json` → `ainative`; `ga4-ainative-2026-06-27.json` → `ainative`.

## Open item (resolved on first run, not a blocker)

- ainative's **GA4 property id** and exact **GSC property string** — read during the first roundtrip (switch the property in each console under the same login) and written into the registry then. The registry ships with `ga4: 'TBD-first-run'` so the gap is explicit.

## Scope guard (YAGNI / out of scope)

- **No** ainative Better Stack uptime monitors (separate spec; free tier at its 10-monitor cap).
- **No** ainative changes to this repo's `deploy.yml` / `lighthouse.yml` CI (that is the ainative repo's concern).
- **No** static-audit (`audit-static.mjs`) coverage of ainative (it reads this repo's `dist/`).

## Files touched

| File | Change |
|---|---|
| `scripts/lib/sites.mjs` | **new** — `SITES` registry |
| `scripts/lib/metrics.mjs` | `writeMetric(source, data, site)` site segment |
| `scripts/lib/dashboard-data.mjs` | `loadSnapshots()` site-aware regex + keying |
| `scripts/fetch-cloudflare.mjs` | extract `fetchZone()`, loop registry |
| `scripts/fetch-crux.mjs` | loop registry per origin |
| `scripts/summarize-lighthouse.mjs` | orionfold CI path unchanged; ainative via live capture |
| `scripts/lib/dashboard-render.mjs` | `latest(source, site)`; per-site panel grouping |
| `.claude/skills/seo-aeo-audit/SKILL.md` (+ `.agents/` mirror) | reframe to registry; per-site roundtrip |
| `.claude/skills/seo-aeo-audit/references/analytics-roundtrip.md` (+ mirror) | per-site capture loop |

(Both the `.claude/skills/seo-aeo-audit/` and `.agents/skills/seo-aeo-audit/` copies are kept byte-identical, matching the existing convention.)
