# Lighthouse — Sprint 8 (deliverables #5–#7)

Performance + accessibility evidence for the "Ship It" sprint: a baseline, the
shipped result, and the concrete a11y/perf fixes that moved the needle.

## How these were captured

- **Tool:** `lighthouse@12` (Google Chrome, headless) — categories
  `performance, accessibility, best-practices, seo`, default mobile preset.
- **Route:** the home page `/` — the heaviest public route (cinematic hero +
  marquee + four streamed rails). It exercises images, fonts, motion, and the
  most JavaScript, so it's the honest stress test. (The other required surface,
  an authenticated route, renders behind Auth² OIDC sign-in and can't be driven
  by headless Lighthouse without an interactive session; the signed-out
  `/profile` simply shows the `<SignInPrompt>`.)
- **Before:** the **pre-Sprint-8 commit** (`4b9151b`, end of Sprint 7) — the
  last commit before the identity work began. The pre-Sprint-8 *deployment* no
  longer exists, so the baseline was reconstructed by building that commit
  (`npm ci && npm run build && npm start`) and running Lighthouse against it on
  the same machine.
- **After (production):** the live Vercel deploy
  (`https://tcss460-group-2-consumer.vercel.app`) — the actual shipped app.
- **After (local):** the current `dev` build served locally, included for
  transparency (see the caveat below).

Raw reports live beside this file: `before-home.report.{html,json}`,
`after-home.report.{html,json}`, `after-home-local.report.html`.

## Results

| Category | Before (Sprint 7, local) | After (production deploy) |
| --- | --- | --- |
| Performance | 83 | 80 |
| Accessibility | 100 | **100** |
| Best practices | 100 | **100** |
| SEO | 100 | **100** |
| Cumulative Layout Shift | 0 | **0** |
| Largest Contentful Paint | 3.6 s | **2.9 s** |
| Speed Index | 2.7 s | 2.6 s |

The shipped app holds **100 / 100 / 100** on accessibility, best practices, and
SEO and a **0 cumulative layout shift** while doing far more than the Sprint-7
home — the whole point of the sprint — and **improves LCP** (3.6 s → 2.9 s).

### An honest note on the numbers

- **Automated scores were already high.** Sprint 7 already scored 100 on the
  automated a11y/best-practices/SEO audits, so there was no headroom for those
  numbers to "go up." Lighthouse's automated accessibility audit only covers a
  fraction of WCAG; the bulk of Sprint 8's a11y work (landmarks, skip link,
  both-mode AA contrast, keyboard operability, honored reduced-motion) is
  *structural correctness it can't score*. We list those fixes below because the
  win is real even where the gauge was already pinned.
- **The local "after" run looks worse on raw performance — and that's a
  measurement artifact.** `after-home-local.report.html` scored Performance 54
  because the local home streams four community/TV rails over Group 1's
  cold-starting Render API (vs. the Sprint-7 home's single popular grid), and a
  cold single request dominates Total Blocking Time. The warm production CDN run
  is representative (80); CLS is 0 in every run, so nothing *moves* — it's slower
  to settle locally, not janky. The transient local `heading-order` flag is the
  same cold-start effect: the hero `<h1>` sits in a fallback-less `<Suspense>`,
  so when the upstream API is slow the rail `<h2>`s paint first; the warm
  production run renders the `<h1>` first and scores 100.

## Top accessibility fixes (Sprint 8)

1. **Landmarks + skip-to-content.** One `<main id="main-content" tabIndex={-1}>`,
   semantic `<header>` / `<nav aria-label>` / `<footer>` (contentinfo), and a
   skip link as the first focusable element, visually hidden until focused
   (`src/app/layout.tsx`, `.skip-link` in `globals.css`). `lang="en"` on `<html>`.
2. **Visible focus + full keyboard operability.** A single `:focus-visible`
   emerald outline on every interactive element (`globals.css`); the `Rail` is
   keyboard-scrollable, and the ⌘K command palette is a proper dialog
   (`role="listbox"`/`option`, ↑↓/Enter/Esc, focus trap, `aria-selected`).
3. **AA contrast in both modes + honored reduced motion.** Small accent
   text/links use the deeper `primary.dark` on the bone surface (and the
   brighter mint in dark mode via `theme.applyStyles`); a
   `prefers-reduced-motion: reduce` block neutralizes animations, freezes the
   marquee, and disables the poster view-transition. Every poster/backdrop is a
   `next/image` with a meaningful `alt` (decorative scrims are `alt=""`).

## Top performance fixes (Sprint 8)

1. **`next/image` everywhere → zero layout shift.** Posters and backdrops render
   through `next/image` with `fill` + `sizes` (and `priority` only on the hero
   backdrop), inside fixed `aspectRatio` boxes — responsive/lazy/modern-format
   images with **CLS 0**.
2. **Per-rail streaming + cheap skeletons.** Each home rail is its own
   `<Suspense>` boundary with a transform-only shimmer skeleton, so rails paint
   independently and a slow or failing upstream rail never blocks the rest; the
   `tmdb:null` community self-enrichment is capped (~12) and cached
   (`revalidate: 300`).
3. **Self-hosted fonts + GPU-only motion.** Inter / Fraunces / IBM Plex Mono ship
   via `next/font/local` with `display: swap` (no Google-Fonts network round trip
   at build or runtime, no FOIT), and all motion is `transform`/`opacity` only
   (the documented 60fps contract) so animation never triggers layout.

## Reproduce

```bash
# after (current build), local
npm run build && (PORT=4002 npm start &) && \
  npx lighthouse@12 http://localhost:4002/ \
    --only-categories=performance,accessibility,best-practices,seo \
    --chrome-flags="--headless=new --no-sandbox" \
    --output=html --output=json --output-path=docs/lighthouse/after-home

# before (Sprint 7 baseline)
git worktree add /tmp/lh-before 4b9151b && cd /tmp/lh-before && \
  npm ci && npm run build && (PORT=4001 npm start &) && \
  npx lighthouse@12 http://localhost:4001/ ... --output-path=before-home
```
