"""Verify Codex and Claude Code agent-facing instructions stay in sync.

The project intentionally supports both entrypoints:
- Codex reads AGENTS.md and .agents/skills/
- Claude Code reads CLAUDE.md and .claude/skills/

Run this after editing either side.
"""

from __future__ import annotations

import filecmp
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
IGNORED_DIR_SUFFIXES = ("-workspace", "__pycache__")
IGNORED_FILE_NAMES = {".DS_Store"}


def rel(path: Path) -> str:
    return str(path.relative_to(ROOT))


def is_ignored(path: Path) -> bool:
    if path.name in IGNORED_FILE_NAMES:
        return True
    return any(part.endswith(IGNORED_DIR_SUFFIXES) for part in path.parts)


def files_under(root: Path) -> set[Path]:
    if not root.exists():
        return set()
    return {
        path.relative_to(root)
        for path in root.rglob("*")
        if path.is_file() and not is_ignored(path.relative_to(root))
    }


def compare_files(left: Path, right: Path, label: str, errors: list[str]) -> None:
    if not left.exists():
        errors.append(f"missing {rel(left)} for {label}")
        return
    if not right.exists():
        errors.append(f"missing {rel(right)} for {label}")
        return
    if not filecmp.cmp(left, right, shallow=False):
        errors.append(f"drift: {rel(left)} != {rel(right)}")


def compare_skill_trees(errors: list[str]) -> None:
    left_root = ROOT / ".agents" / "skills"
    right_root = ROOT / ".claude" / "skills"
    left_files = files_under(left_root)
    right_files = files_under(right_root)

    for missing in sorted(right_files - left_files):
        errors.append(f"missing .agents/skills/{missing}")
    for missing in sorted(left_files - right_files):
        errors.append(f"missing .claude/skills/{missing}")

    for shared in sorted(left_files & right_files):
        compare_files(left_root / shared, right_root / shared, f"skill {shared}", errors)


def main() -> int:
    errors: list[str] = []
    compare_files(ROOT / "AGENTS.md", ROOT / "CLAUDE.md", "top-level docs", errors)
    compare_skill_trees(errors)

    if errors:
        print("Agent parity check failed:")
        for error in errors:
            print(f"- {error}")
        return 1

    print("Agent parity check passed: AGENTS.md, CLAUDE.md, and mirrored skills match.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
