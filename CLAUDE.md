# Orionfold website repo

This repo is local development project for Orionfold.com official website.

## Public repo boundary (inventoried 2026-06-10)

This repo deploys GitHub Pages from a **PUBLIC** repository: everything `git ls-files` tracks is world-readable the moment it is committed. Treat committing as publishing.

**Public by design:** `src/`, `public/`, `scripts/`, `supabase/` (functions read secrets from env, never inline), `.github/`, configs, `CLAUDE.md`/`AGENTS.md`/`CODEX-CC.md` (keep them practice-level — no keys, no ids beyond what client code already exposes), and `manav@orionfold.com` — the public business contact and the ONLY email allowed in tracked files.

**Local-only (git-ignored — never commit, never un-ignore):** `_TODOS.json` + `.todos-sync-state.json` (operator todo echo), all `*HANDOFF*.md` + `OPS-NOTES.md`, `_SPECS/`, `.claude/`/`.agents/`/`.codex/`/`.superpowers/`, `.env.local`, `audit-reports/`, `checks/`.

**Guardrails:** no emails other than `manav@orionfold.com`; no customer or subscriber data (PII lives in Supabase/Stripe only); no key material of any shape (`sk_`/`rk_`/`whsec_`/`sbp_`/`AIza…`); before any push, sweep the unpushed range with `git log --name-only` for local-only file names (Codex has committed them before). When in doubt, it stays local.

## Cross project flows

**Agency todo sync (read agency's todos, echo your own).** At session start, read `../agency/_TODOS/_export.json` and act on any todo whose project or `ref_project` is this project. Echo back by writing `_TODOS.json` at this project root (next to _STATUS.json) per `../agency/_SPECS/2026-06-06-todo-sync-contract.md`: for each agency todo you advanced include `{id, status, updated};` for todos you originate, mint an id `<this-project>-<n>` and include full fields. Last-writer-wins by updated (done wins ties). Never write into the agency repo — the agency dashboard reads your `_TODOS.json` fresh on every poll. **`_TODOS.json` is git-ignored as of 2026-06-10 (this is a public repo): write it on disk only, never commit it — disk is all the cockpit reads.**

**Conversions → marketing (added 2026-06-10):** right after the export read, run `node scripts/sync-conversions-todos.mjs`. It polls Supabase for new sponsors and newly confirmed story subscribers (high-water marks in the git-ignored `.todos-sync-state.json`; first run bootstraps silently) and mints `kind: "delegate"` todos tagged `ref_project: "marketing"` into `_TODOS.json` — the cockpit reminds the operator (Gold/Platinum titles name the owed Discord invite) and the marketing agent picks the delegate up once the operator adopts it. PII rule: `_TODOS.json` must never carry emails or names; the script selects only row ids/tiers/dates — keep it that way (the file is git-ignored, but the agency reads it and titles surface in the cockpit).

**Memos (added 2026-06-06):** rows with kind: "memo" are the operator's standing habits — practice, not work requests. If this project has a dashboard, surface the memos whose project/ref_project is this project in a distinct card or "memo" pill in this project's own theme (design-system §4: soft background + -ink text); never auto-advance a memo's status — status belongs to the operator. You may originate memos in your echo (kind: "memo") for the operator's cockpit to adopt.