# TCSS 460 — Group 2 Consumer App (Sprint 6–8)

Front-end consumer app for the TCSS 460 course project. Built with Next.js 16
(App Router), NextAuth v5 (OIDC against Auth²), and MUI.

Signs visitors in through the Auth² instance, then renders search, browse, and
detail pages against our upstream partner's deployed API.

## Partners

### Upstream Partner: Group 1
We consume Group 1's deployed API. Fill in once they share their info:
- API base URL: _TBD_
- OpenAPI spec: _TBD_/api-docs
- Bug Tracker FE: _TBD_
- Audience string: `group-1-api`
- Partner README: _TBD_

### Downstream Partner: Group 3
Group 3 consumes Group 2's back-end deployment (Sprints 1–4).
We triage their bug reports through our Sprint 5 Bug Tracker FE.

## Local Development

1. Copy `.env.example` → `.env.local`
2. Fill in values:
   - `AUTH_SECRET` — generate with `npx auth secret` or `openssl rand -base64 33`
   - `AUTH_TCSS460_ID` / `AUTH_TCSS460_SECRET` — provided by the instructor
   - `AUTH_TCSS460_AUDIENCE` — Group 1's audience string (`group-1-api`)
   - `NEXT_PUBLIC_API_BASE_URL` — Group 1's deployed API URL
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run the dev server:
   ```bash
   npm run dev
   ```
   Open http://localhost:3000

## Deployment

- Host: Vercel
- Deployed URL: https://tcss460-group-2-consumer.vercel.app
- OAuth callback path: `/api/auth/callback/tcss460`
- Localhost callback (for dev): `http://localhost:3000/api/auth/callback/tcss460`

Environment variables in Vercel must mirror `.env.local`, with `AUTH_URL` set to
the deployed URL (not localhost).

## Stack

- **Framework:** Next.js 16 (App Router)
- **Auth:** NextAuth v5 (Auth.js) with custom OIDC provider against Auth²
- **UI:** MUI + Emotion
- **Styling:** Tailwind CSS (optional, alongside MUI)
- **Hosting:** Vercel

## Sprint 6 Scope

Read-only consumer app:
- Sign in / sign out via Auth²
- Search Group 1's API
- Browse / popular page
- Movie/show detail page

No writes this sprint (no ratings, no reviews) — those arrive in Sprint 7.

## Team

- Rudolf
- Collins
- Mani
- Jonathan

## References

- [Sprint 6 spec](docs/sprint-6.md) (in the course site)
- TCSS460-frontend-2 lecture demo — the reference app this project mirrors
