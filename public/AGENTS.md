# Browser application guidance

This file applies to `public/`. Inherit the repository-wide rules in
`../AGENTS.md`; this file only adds browser-specific constraints.

- Keep the application zero-build and deployable as checked-in static files.
  Browser files use classic scripts, so do not introduce imports, a bundler, or
  generated bundles without an approved architecture change.
- Preserve the strict Content Security Policy. Do not add inline script/style,
  `unsafe-inline`, `unsafe-eval`, wildcard sources, or unnecessary hosts.
- Treat Supabase, CSV, URL, and storage values as untrusted. Prefer `textContent`
  and the sanitizing helpers in `lib.js`; validate image URLs before assigning
  them to DOM properties.
- Keep Supabase-first loading with the deployed CSV snapshot as a read-only
  fallback. A database outage must not make the collection unavailable.
- `sets.js` is the configured-set registry. Set keys are kebab-case and must
  agree with database `set_id`, backup filenames, image directories, and tests.
- Local manifest images win over `image_url`, then configured API fallbacks.
  Preserve exact Card/Number/Variant identity when changing image lookup.
- Maintain URL-shareable filters, keyboard access, mobile layout, and offline
  behavior. Update the service-worker asset list for new essential files, but
  leave its deployment-version placeholder for CI to replace.
- Add unit tests for pure logic and Playwright tests for visible behavior. Run
  `npm run test:site`, `npm run test:coverage`, and relevant browser tests.

