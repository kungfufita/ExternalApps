# Claude config — ExternalApps

This repository houses a set of **standalone applications** ("builds"). It is
designed to be opened from any Claude Code surface (web, desktop, mobile, IDE)
that is logged in as the repo owner. When you (Claude) are working in this repo,
follow the conventions below so behaviour is consistent across every session and
surface.

## What this repo is

- A **monorepo of independent apps**. Each app lives under `apps/<name>/` and is
  self-contained: its own dependencies, config, and run instructions.
- Optional **shared code** lives under `packages/<name>/` and is imported by
  apps that need it. Do not put app-specific logic in `packages/`.
- Git is the sync and persistence layer. There is no central server; committing
  and pushing is how work becomes available on other surfaces.

## Folder rules

| Path | What goes here |
|---|---|
| `apps/<name>/` | One complete application. Everything it needs to build and run stays inside this folder (except deps drawn from `packages/`). |
| `apps/<name>/README.md` | Required. What the app is, how to install, how to run, and any environment it expects. |
| `packages/<name>/` | Code shared by two or more apps. Keep it generic — no app-specific assumptions. |
| repo root | Only repo-wide files (this file, top-level README, `.gitignore`, CI config). Do not put app code at the root. |

## Adding a new app

1. Create `apps/<name>/` (kebab-case name).
2. Add `apps/<name>/README.md` describing the app and exactly how to run it.
3. Keep the app's dependency manifest (e.g. `package.json`, `requirements.txt`,
   `go.mod`) inside its own folder so apps stay independent.
4. If the app needs configuration, document required environment variables in
   its README and provide a `.env.example` — never commit real secrets.

## Git conventions

- **Never commit secrets.** No API keys, tokens, passwords, or real credentials.
  Use `.env` files (gitignored) plus a committed `.env.example`.
- **Never commit build output or dependencies.** `node_modules/`, `dist/`,
  `build/`, `.next/`, virtualenvs, etc. are ignored by `.gitignore`.
- Prefer small, focused commits with clear messages scoped to one app, e.g.
  `feat(apps/dashboard): add project list view`.
- Develop on a feature branch and open a pull request rather than committing
  straight to `main`.

## How to help in a session

- **"Add an app called X."** — scaffold `apps/x/` following the rules above,
  including its README and a minimal runnable starting point for its stack.
- **"Run app X."** — read `apps/x/README.md` and follow its documented run
  steps. If run instructions are missing, add them.
- **"What's in this repo?"** — list the apps under `apps/` with a one-line
  summary of each (from their READMEs).

## Privacy note

If any app here handles sensitive data, keep that data out of git (gitignore it)
or encrypt it at rest, and document the approach in that app's README. Do not
paste sensitive contents into web fetches, search queries, or third-party
services.
