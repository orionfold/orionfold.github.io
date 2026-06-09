# Codex / Claude Code Interoperability Log

Root log for keeping Codex and Claude Code behavior aligned in this project.
Ask either agent to read this file when switching tools or changing shared
agent behavior. Record every interoperability, no-drift, shared-skill,
launch-environment, or agent-presence decision here. Keep operational detail in
`HANDOFF.md`; keep website feature and dashboard specs in `specs/`.

Status legend: `[-]` pending · `[~]` in progress · `[x]` complete · `[!]` blocked

## Current Contract

- `[x]` `AGENTS.md` and `CLAUDE.md` are intentionally byte-for-byte identical.
- `[x]` `.agents/skills/` and `.claude/skills/` are mirrored skill trees.
- `[x]` `python3 scripts/check_agent_parity.py` is the local drift gate for
  top-level agent docs and mirrored skills.
- `[x]` Both agents may write through the same website repo file contracts and
  mirrored skills; production deploys remain operator-gated because pushes to
  `main` ship the site.
- `[x]` Private Claude Code session state under `.claude/` and private Codex
  state under `.codex/` stay out of the repo. The committed exception is the
  mirrored `.claude/skills/` tree.
- `[!]` Browser/Gmail/Chrome automation wording in some skill references still
  describes Claude-era MCP names. The runnable skill contract is mirrored, but
  tool-specific browser instructions should be normalized when those flows are
  next exercised.
- `[!]` Active-agent presence, launcher behavior, and transcript discovery are
  not specified for this website workspace yet.

## 2026-06-09

### S1 — Initial No-Drift Contract

- `[x]` Added Codex-facing `AGENTS.md` and kept it byte-for-byte identical with
  `CLAUDE.md`.
- `[x]` Mirrored `.claude/skills/` into `.agents/skills/` and normalized
  avoidable Codex-vs-Claude wording in shared skills.
- `[x]` Added `scripts/check_agent_parity.py` to compare `AGENTS.md` vs
  `CLAUDE.md` and `.agents/skills/` vs `.claude/skills/`, excluding generated
  `*-workspace/`, `__pycache__/`, and `.DS_Store` files.
- `[x]` Updated `.gitignore` so private `.claude/` session state and `.codex/`
  state stay ignored while `.claude/skills/` can participate in the mirrored
  shared-skill contract.
- `[!]` Explicitly documented that browser tool naming in older references and
  active-agent presence remain implementation areas for later.

Verification:

```
python3 scripts/check_agent_parity.py
```
