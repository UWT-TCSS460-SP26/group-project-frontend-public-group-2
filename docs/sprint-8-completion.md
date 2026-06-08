# Sprint 8 Completion Audit

Verified on June 8, 2026 against the Sprint 8 course document and
`sprint-8-master-plan.md`.

The deliberate scope exception is per-title poster-derived color. It was
removed from the final product; title pages use the stable emerald theme
accent.

| Deliverable | Status | Evidence |
| --- | --- | --- |
| Coherent visual identity | Complete | Shared MUI color schemes, typography, spacing, component vocabulary, shell, and `/styleguide` |
| About page and credits | Complete | `/about` is linked from the header/footer and credits Group 2, Group 1, TMDB, and Auth² |
| Team-invented feature | Complete | Device-local Watchlist with card/detail controls, header count, cross-tab sync, and `/watchlist`; rationale is in `docs/meetings.md` |
| Mobile usability | Complete | Responsive route layouts, clipped page overflow, compact mobile navigation, touch-safe controls, and mobile Lighthouse coverage |
| Lighthouse before report | Complete | `docs/lighthouse/before-home.report.{html,json}` |
| Top accessibility/performance fixes | Complete | Documented in `docs/lighthouse/README.md` |
| Lighthouse after report | Complete | Production report keeps 100 accessibility/best-practices/SEO and CLS 0; LCP improves from 3.6 s to 2.9 s |
| Consumer app deployed | Complete | `https://tcss460-group-2-consumer.vercel.app` returned HTTP 200 on June 8 |
| Backend issue queue | Production admin verification required | Local queue has zero unresolved rows after closing two duplicate Sprint 4 smoke fixtures. The live admin route is healthy and correctly returns 401 without an Auth² admin identity; Auth² does not support client credentials, so an interactive admin bearer token is required to inspect and close the production rows. |
| End-of-quarter retrospective | Complete | `docs/meetings.md` |
| All members committed in Sprint 8 | Complete | Git history from June 1–8 includes Rudolf, Collins, Mani, and Jonathan |
| Planning and ceremonies | Complete | Sprint planning, mid-sprint sync, integration review, retrospective, and final audit are in `docs/meetings.md` |

## Selected post-MVP features

- Shared-element poster transitions
- Command palette with movie/TV search
- Compare view
- Advanced search filters and sorting
- Recently viewed rail
- Share action

Per-title poster-derived color is intentionally excluded.

## Verification

- Frontend: `npm test` passed (4 tests).
- Frontend: `npm run lint` passed.
- Frontend: `NEXT_DIST_DIR=.next-final npm run build -- --webpack` passed,
  including TypeScript and all routes. The sandbox blocks Turbopack's temporary
  local port, so webpack was used for the production build verification.
- Backend: `npm run lint` passed.
- Backend: `npm run build` passed.
- Backend: `npm test -- --runInBand` passed (26 suites, 231 tests) against the
  repository's Docker PostgreSQL service.
- Backend health: `https://group-2-9289.onrender.com/health` returned HTTP 200.
- Bug Tracker FE: `https://bug-tracker-g2.vercel.app` returned HTTP 200.
