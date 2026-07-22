# ExternalApps

A git-backed home for a set of standalone applications ("builds"). The repo is
the single source of truth: because it lives on GitHub, you can open it from
**any Claude Code surface** — web, desktop, mobile, or an IDE — as long as
you're logged in as the repo owner. Each surface clones the same repo, so your
apps travel with you.

## Why a monorepo

- **One clone, every app.** Adding the repo to a Claude Code session gives you
  every app at once, with consistent conventions.
- **Git is the sync layer.** Commit + push from one surface; pull from another.
  No server to keep alive, nothing to deploy just to keep working.
- **Isolation where it matters.** Each app under `apps/` is self-contained —
  its own dependencies, its own README, its own run instructions — so builds
  don't interfere with each other.

## Layout

```
ExternalApps/
  README.md            you are here
  CLAUDE.md            repo-wide conventions for Claude Code sessions
  .gitignore           ignores deps, build output, and secrets
  apps/                each app is a self-contained subdirectory
    README.md          how to add a new app
  packages/            optional code shared across apps
    README.md          when to use this
```

## Working from any Claude Code surface

1. **Open a session** logged in as the repo owner (`kungfufita`).
2. **Add the repo** if it isn't already in the session (`add_repo kungfufita/ExternalApps`),
   then clone it.
3. **Work on an app** under `apps/<name>/` — each app documents how to install
   and run it.
4. **Commit and push.** Your changes are now available from every other surface
   on the next pull.

## Adding an app

See [`apps/README.md`](apps/README.md). In short: create `apps/<name>/`, add a
`README.md` describing what it is and how to run it, and keep everything the app
needs inside that folder.

## Conventions

Repo-wide conventions (folder rules, git norms, how Claude should behave in a
session here) live in [`CLAUDE.md`](CLAUDE.md).
