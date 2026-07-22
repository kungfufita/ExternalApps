# apps/

Each subdirectory here is **one self-contained application**. Apps are
independent — an app should build and run using only what's inside its own
folder, plus any shared code it explicitly imports from `../../packages/`.

## Adding an app

1. Create a folder: `apps/<name>/` (use kebab-case, e.g. `apps/case-dashboard`).
2. Add a `README.md` that answers:
   - **What is it?** One or two sentences.
   - **How do I install it?** e.g. `npm install`, `pip install -r requirements.txt`.
   - **How do I run it?** The exact command(s), and what URL/port it serves on.
   - **What does it need?** Environment variables, external services, data files.
3. Put the app's dependency manifest inside the folder (`package.json`,
   `requirements.txt`, `go.mod`, …) so it stays independent.
4. If it needs config, add a `.env.example` and document the variables. Never
   commit real secrets.

## Conventions

- Keep everything an app needs inside its own folder (except shared `packages/`).
- Don't let one app import another app's internals — extract shared code into
  `packages/` instead.
- Document run steps in the app's README so it can be launched from any Claude
  Code session without guesswork.

_No apps yet — this repo is scaffolded and ready. Add your first app here._
