# packages/

Optional home for **code shared across two or more apps** — utilities, types,
UI components, client libraries, etc.

## When to use this

- Two apps need the same logic → extract it into `packages/<name>/` and import it
  from each app, rather than copy-pasting or cross-importing between apps.

## When *not* to use this

- Code used by only one app → keep it inside that app's folder.
- App-specific assumptions → packages should be generic and reusable.

## Adding a package

1. Create `packages/<name>/` (kebab-case).
2. Add its own manifest (`package.json`, etc.) and a short `README.md`.
3. Keep it dependency-light and free of app-specific behaviour.

_Empty for now — add shared code here only once a second app actually needs it._
