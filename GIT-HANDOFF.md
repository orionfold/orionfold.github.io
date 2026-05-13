# Git Handoff — GitHub SSH Identity Setup

A repeatable procedure for wiring a project on a macOS machine to a **specific GitHub account or organization**, when other GitHub identities are already configured on the same machine. Designed to be fed to Claude Code (or any agent) in a new project: supply the four inputs at the top, then have the agent execute the steps in order, pausing only at the marked "USER ACTION" blocks.

## Why this exists

On macOS, the two stores that authenticate GitHub pushes are both **machine-global**:

1. **macOS Keychain** holds the cached HTTPS credentials. One answer per host — every shell on the machine gets the same answer.
2. **`gh` active account** lives in `~/.config/gh/hosts.yml`. `gh auth switch` rewrites this file globally.

Result: out of the box, every push from every terminal uses one effective GitHub identity. To work in multiple GitHub accounts cleanly, you need **per-repo SSH** with a dedicated key + a `~/.ssh/config` Host alias. This binds the identity to the *repo* (via its remote URL), so any terminal that pushes from that repo gets the right identity automatically. Other repos are unaffected.

## Inputs (fill these in before starting)

| Variable | Description | Example |
|---|---|---|
| `ACCOUNT` | The GitHub username or organization name | `orionfold` |
| `USER_ID` | The numeric GitHub user ID (see "Finding USER_ID" below) | `276500412` |
| `REPO` | The repo name on GitHub under `ACCOUNT` | `orionfold.github.io` |
| `LOCAL_PATH` | Absolute path to the project directory on disk | `/Users/<you>/projects/<name>` |

Derived values the agent will use:
- **Noreply email**: `<USER_ID>+<ACCOUNT>@users.noreply.github.com`
- **SSH key path**: `~/.ssh/id_ed25519_<ACCOUNT>`
- **SSH host alias**: `github.com-<ACCOUNT>`
- **Repo SSH URL**: `git@github.com-<ACCOUNT>:<ACCOUNT>/<REPO>.git`

### Finding `USER_ID`

Run one of:
```bash
# If gh is installed and you're signed in as some account with public read access:
gh api /users/<ACCOUNT> --jq .id

# Or open in any browser (no auth required for public accounts):
# https://api.github.com/users/<ACCOUNT>
# Look for the "id" field in the JSON.
```

For private/internal accounts where the public API is gated, the owner of `ACCOUNT` can find this at `https://github.com/settings/profile` (URL in some flows) or by querying the authenticated `/user` endpoint while signed in.

The `USER_ID` is what links commits to the GitHub account when you use the noreply email. **Without the numeric prefix, commits land unattributed** — GitHub strictly checks the `<id>+<name>` format against the named account.

## Procedure

The steps below mix **agent actions** (Claude Code can run these directly) and **user actions** (require a human at github.com). The agent should execute consecutively until it hits a `USER ACTION` block, then wait.

### Step 1 — Repo-local git identity

Set the commit author identity for this repo only. This stamps commits with the right name/email *without* touching your global `~/.gitconfig`. Run from inside `LOCAL_PATH`:

```bash
git config user.name "<ACCOUNT>"
git config user.email "<USER_ID>+<ACCOUNT>@users.noreply.github.com"
```

**Important:** the lack of `--global` is the whole point. Verify with:
```bash
git config --local --get user.name
git config --local --get user.email
```

> **Why noreply?** Pushing with a real personal email exposes it in the public commit log on github.com. The noreply format keeps your email private while still attributing the commit to the GitHub account.

> **Identity vs. credentials.** This step *only* sets who appears as the author on each commit. It does **not** authenticate the push — that's what the SSH setup below is for. The two are independent.

### Step 2 — Generate the SSH keypair

```bash
ssh-keygen -t ed25519 \
  -f ~/.ssh/id_ed25519_<ACCOUNT> \
  -N "" \
  -C "<USER_ID>+<ACCOUNT>@users.noreply.github.com"

chmod 600 ~/.ssh/id_ed25519_<ACCOUNT>
chmod 644 ~/.ssh/id_ed25519_<ACCOUNT>.pub
```

`-N ""` generates the key with **no passphrase**, relying on FileVault + your macOS login as the at-rest protection. This is the same posture most macOS dev keys ship with.

To add a passphrase later (or instead), run interactively in your own terminal:
```bash
ssh-keygen -p -f ~/.ssh/id_ed25519_<ACCOUNT>
```
With a passphrase, add `UseKeychain yes` to the Host block in Step 3 so macOS caches the passphrase and you're not prompted on every push.

> **Why ed25519?** Smaller key (256 bits) than RSA-4096, faster signing, modern default. GitHub recommends it.

> **Why the noreply email in `-C`?** Just a label embedded in the public key. GitHub displays it under your SSH keys list, making the key trivially identifiable later if you have several.

### Step 3 — Add a Host alias to `~/.ssh/config`

Ensure `~/.ssh/config` exists, then append (don't overwrite existing entries):

```
# <ACCOUNT> — dedicated identity for github.com/<ACCOUNT>/*
Host github.com-<ACCOUNT>
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_<ACCOUNT>
  IdentitiesOnly yes
  AddKeysToAgent yes
```

Key field-by-field:
- **`Host github.com-<ACCOUNT>`** — the alias. Just a string; doesn't need DNS to resolve.
- **`HostName github.com`** — what SSH actually connects to.
- **`User git`** — GitHub's required SSH user.
- **`IdentityFile`** — the key SSH should present.
- **`IdentitiesOnly yes`** — critical. Tells SSH to use *only* this key, ignoring any other keys ssh-agent may have loaded. Without this, ssh-agent might offer your default key first, GitHub would auth you as the wrong account, and the push would target the wrong identity.
- **`AddKeysToAgent yes`** — auto-loads the key into ssh-agent on first use so subsequent connections in the same session are fast.

### Step 4 — Reveal the public key for upload

```bash
cat ~/.ssh/id_ed25519_<ACCOUNT>.pub
pbcopy < ~/.ssh/id_ed25519_<ACCOUNT>.pub   # also copies to clipboard on macOS
```

The `.pub` file contains the public key (safe to share anywhere). The corresponding private key (the file *without* `.pub`) must stay on your machine.

> **🔵 USER ACTION REQUIRED — Step 5**
>
> 1. Open **github.com** in a browser (not gh CLI).
> 2. **Sign in as `<ACCOUNT>`.** If you're currently signed in as a different identity, sign out first or use a private/incognito window.
> 3. Navigate to **https://github.com/settings/ssh/new**
> 4. **Title**: any label that helps you recognize the machine later (e.g., `MacBook (<ACCOUNT> dev)`).
> 5. **Key type**: leave as the default `Authentication Key`.
> 6. **Key**: paste the public key (⌘V — it's on your clipboard).
> 7. Click **Add SSH key**. GitHub may ask you to confirm your account password.
> 8. Return to the agent and confirm completion.

### Step 6 — Verify the SSH handshake

```bash
ssh -T -o StrictHostKeyChecking=accept-new git@github.com-<ACCOUNT>
```

Expected output:
```
Hi <ACCOUNT>! You've successfully authenticated, but GitHub does not provide shell access.
```

The command **exits with code 1** even on success — that's normal. GitHub closes the SSH session immediately because it doesn't grant shell access. What matters is the welcome line. Confirm the **name in `Hi <ACCOUNT>!`** matches the expected account.

If you see a different name, ssh-agent is offering a different key first. Double-check `IdentitiesOnly yes` is in the Host block, then try `ssh-add -D` to clear ssh-agent and retry.

### Step 7 — Set the repo remote and push

If the repo doesn't have an `origin` remote yet:
```bash
cd <LOCAL_PATH>
git init -b main   # only if not yet a git repo
git remote add origin git@github.com-<ACCOUNT>:<ACCOUNT>/<REPO>.git
```

If `origin` already exists (e.g., it was added with the HTTPS URL earlier):
```bash
git remote set-url origin git@github.com-<ACCOUNT>:<ACCOUNT>/<REPO>.git
```

Verify:
```bash
git remote -v
# both fetch and push should show git@github.com-<ACCOUNT>:<ACCOUNT>/<REPO>.git
```

Stage, commit, push:
```bash
# Stage specific files by name (safer than -A / .)
git add <file1> <file2> ...
git commit -m "Initial commit"
git push -u origin main
```

The `-u` flag sets `origin/main` as the upstream for the local `main` branch. Subsequent pushes can be plain `git push`.

## Result

After Step 7 succeeds:

- Every push from this repo uses the `<ACCOUNT>` SSH key automatically — no `gh auth switch`, no token juggling, no environment variables.
- Other repos on this machine continue to use whatever default identity they had (your personal SSH key, HTTPS+keychain, or another account-specific alias).
- The repo's `.git/config` records the SSH URL, so any clone of this repo on any machine with the right `~/.ssh/config` entry will Just Work.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `Permission to <ACCOUNT>/<REPO>.git denied to <other-user>` | The remote is still HTTPS *or* the alias isn't pinning the right key. | `git remote -v` — must show `git@github.com-<ACCOUNT>:...`. Then `ssh -T git@github.com-<ACCOUNT>` — welcome message must say `Hi <ACCOUNT>!`. |
| `Hi <wrong-name>!` from the SSH test | `IdentitiesOnly yes` missing from the Host block, or ssh-agent is offering a different key first. | Add `IdentitiesOnly yes`. Run `ssh-add -D` to clear ssh-agent. Retry. |
| `Could not open a connection to your authentication agent.` | ssh-agent isn't running. | `eval "$(ssh-agent -s)"` or restart the shell. On macOS, ssh-agent usually starts on demand. |
| Commits show as `unverified` or unattributed on GitHub | Email mismatch — likely missing the numeric ID prefix in the noreply email. | Re-run Step 1 with the correct `<USER_ID>+<ACCOUNT>@users.noreply.github.com` and amend or re-commit. |
| Push prompts for a username/password | Remote is still HTTPS. | `git remote set-url origin git@github.com-<ACCOUNT>:...`. |
| First push hangs, then "Host key verification failed" | First-time SSH connection to `github.com` from this machine. | Append `-o StrictHostKeyChecking=accept-new` to the verification command (Step 6) so it auto-trusts on first use. |

## Glossary

- **Commit identity** — the `user.name` / `user.email` that get stamped onto every commit. Set per-repo with `git config` (no `--global`).
- **Push credentials** — what authenticates the push to GitHub. For SSH remotes, this is the SSH key matched against the Host config. Totally independent of commit identity.
- **`gh` active account** — the GitHub CLI's notion of who you're signed in as. Global to the machine. Irrelevant for SSH-based git operations; only matters if you also use `gh` to manage issues, PRs, releases, etc.
- **SSH Host alias** — a synthetic hostname (like `github.com-orionfold`) defined in `~/.ssh/config` that rewrites to a real hostname before connecting. Lets one machine present different identities to the same physical host (`github.com`).
