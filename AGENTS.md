# Orionfold website repo

This repo is local development project for Orionfold.com official website.

## Cross project flows

**Agency todo sync (read agency's todos, echo your own).** At session start, read `../agency/_TODOS/_export.json` and act on any todo whose project or `ref_project` is this project. Echo back by writing `_TODOS.json` at this project root (next to _STATUS.json) per `../agency/_SPECS/2026-06-06-todo-sync-contract.md`: for each agency todo you advanced include `{id, status, updated};` for todos you originate, mint an id `<this-project>-<n>` and include full fields. Last-writer-wins by updated (done wins ties). Never write into the agency repo — the agency dashboard reads your `_TODOS.json` fresh on every poll. Commit the echo with the session.

**Memos (added 2026-06-06):** rows with kind: "memo" are the operator's standing habits — practice, not work requests. If this project has a dashboard, surface the memos whose project/ref_project is this project in a distinct card or "memo" pill in this project's own theme (design-system §4: soft background + -ink text); never auto-advance a memo's status — status belongs to the operator. You may originate memos in your echo (kind: "memo") for the operator's cockpit to adopt.