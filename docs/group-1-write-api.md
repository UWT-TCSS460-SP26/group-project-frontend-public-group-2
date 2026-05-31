# Group 1 Write API — Reference

What we hit and how we hit it. This is the authoritative contract our Sprint 7
Server Actions ([src/lib/actions/](../src/lib/actions/)) implement against.
For the full OpenAPI (including the routes we only read) see Group 1's spec:
<https://tcss460-team-1-api.onrender.com/api-docs>.

- **Base URL:** `https://tcss460-team-1-api.onrender.com`
- **Auth:** RS256 JWT minted by Auth² (`https://tcss-460-iam.onrender.com`),
  audience `group-1-api`, attached as `Authorization: Bearer <accessToken>`.
  Our [api.ts](../src/lib/api.ts) does this whenever `withAuth: true`.
- **Identity sync:** `POST /users/add-subject-id` is called once after sign-in
  so Group 1's `/me` routes can resolve a stable user (`syncSubjectId` in
  [users.ts](../src/lib/actions/users.ts)).

## Ratings

### `POST /ratings` — create
**Body:** `{ tmdbId: string, mediaType: "movie" | "tv", score: int 0–10 }`
**Returns:** `201` → `Rating`
**Errors:** `400` invalid fields / score out of range · `401` no token · `500`
**Used by:** `createRating` ([ratings.ts](../src/lib/actions/ratings.ts))

### `PUT /ratings/{id}` — change score
**Body:** `{ score: int 0–10 }` (only the score is changeable)
**Returns:** `200` → `Rating`
**Errors:** `400` · `401` · `403` not owner · `404` · `500`
**Used by:** `updateRating`

### `DELETE /ratings/{id}`
**Returns:** `204` — **no body**. The client must not call `res.json()`.
**Errors:** `400` · `401` · `403` not owner · `404` · `500`
**Used by:** `deleteRating`

### `GET /ratings/me/items` — *enriched* my ratings
TMDB metadata is joined per row (`tmdb.title`, `tmdb.poster_path`, …).
Use this for the profile ratings list and to find a user's existing rating for
a specific title (filter by `tmdbId` + `mediaType` — see Quirks).
**Returns:** `200` → `EnrichedRatedItem[]`
**Used by:** `getMyRatings`, the profile page, `RatingControl` lookup.

> Group 1 also exposes `GET /ratings/me?page&limit` returning the non-enriched
> `MyRatingsResponse`. We don't currently use it.

## Reviews

### `POST /reviews` — create
**Body:** `{ tmdbId: string, mediaType: "movie" | "tv", title?: string, body: string (1–5000) }`
**Returns:** `201` → `Review`
**Errors:**
- `400` — **Zod envelope** `{ errors: { <field>: string[] } }` (see Errors).
- `401` — no token.
- `409` — **caller has already reviewed this `(mediaType, tmdbId)`.** A user
  can only post one review per title; the form must catch this and flip into
  edit mode (see `findMyReviewForTitle` in [find-my-review.ts](../src/lib/find-my-review.ts)).
- `500`.

> **Title is optional.** When omitted, Group 1 generates `Review of {tmdbId}` server-side.
> **The body field is renamed on the way back.** You send `body`; the response (and
> every later read) uses `description`. PUT also takes `description` — see below.

**Used by:** `createReview` ([reviews.ts](../src/lib/actions/reviews.ts)).

### `PUT /reviews/{id}` — edit
**Body:** `{ title?: string, description?: string }` — both optional, only the
provided fields are written. **Note the field name is `description`, not `body`.**
**Returns:** `200` → `Review`
**Errors:** `400` · `401` · `403` not owner · `404` · `500`
**Used by:** `updateReview`

### `DELETE /reviews/{id}`
**Returns:** `204` — no body. Owner or admin.
**Errors:** `400` · `401` · `403` · `404` · `500`
**Used by:** `deleteReview`

### `GET /reviews/me?page&limit` — my reviews (**thin**, not enriched)
TMDB metadata is *not* joined. The profile reviews list either renders the
fields as-returned (current choice) or fetches metadata per row. Pagination
limit is capped server-side at **50**; we use `limit=50` on the profile.
**Returns:** `200` → `MyReviewsResponse { page, limit, total, totalPages, results }`
**Used by:** `getMyReviews`, the profile page, `findMyReviewForTitle` (paginates to find the user's review for a given title).

## Detail enrichment (read, but written paths refresh through it)

`GET /details/{mediaType}/{id}/enriched` → `{ tmdb, ratings: { average, count }, reviews: Review[] }`.

The title detail page fetches this with `init: { cache: "no-store" }` so that
after a successful write the client can call `useRouter().refresh()` and see
the new aggregate / review immediately. See [title/[id]/page.tsx](../src/app/title/%5Bid%5D/page.tsx).

## Identity

### `POST /users/add-subject-id`
Syncs the JWT `sub` claim onto the local user record. Required for the `/me`
routes to resolve cross-device.
**Returns:** `200` → `UserResponse`
**Used by:** `syncSubjectId` — safe to call repeatedly.

## Error envelopes (two shapes)

Both come back as JSON with a non-2xx status. Our `ApiError` in
[api.ts](../src/lib/api.ts) normalizes them.

```jsonc
// ErrorResponse — most routes
{ "error": "Unauthorized", "detail": "Optional diagnostic" }
```

```jsonc
// ZodErrorResponse — POST /reviews 400 (and any Zod-validated endpoint)
{ "errors": { "body": ["Required"], "title": ["Too long"] } }
```

`ApiError` exposes both:

```ts
class ApiError extends Error {
  status: number;
  detail?: string;
  fieldErrors?: Record<string, string[]>;
}
```

Server Actions catch it and return an `ActionResult<T>` so the structured
fields survive the Server Action → client boundary (a thrown error gets
stripped to a generic message by Next.js):

```ts
type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { status: number; message: string; detail?: string; fieldErrors?: Record<string, string[]> } };
```

The review form maps `error.fieldErrors` onto the matching `TextField`s and
re-focuses the first invalid one — see `mapServerFieldErrors` in
[ReviewForm.tsx](../src/components/ReviewForm.tsx).

## Quirks / gotchas

- **`body` on POST, `description` everywhere else.** POST `/reviews` is the only
  place that takes `body`; the server stores and returns it as `description`,
  and PUT `/reviews/{id}` takes `description`. Easy to swap by accident — keep
  the action signatures honest.
- **One review per (mediaType, tmdbId) per user.** Group 1 returns `409` on a
  duplicate POST. The form recovers by paginating `/reviews/me` to find the
  existing review and switching into edit mode.
- **Rating score is an integer 0–10.** Our 5-star half-star widget maps
  `Math.round(stars * 2)`; the Server Action also validates the range so a
  bad value never reaches the wire.
- **No "my rating for this title" endpoint.** We derive it client-side by
  filtering `/ratings/me/items` on `tmdbId` + `mediaType`. Acceptable cost given
  the list is small per user.
- **`DELETE` returns `204` with no body.** `fetchGroupOneApi` short-circuits on
  `res.status === 204` to avoid a `JSON.parse` on an empty body.
- **Enriched detail returns `200` even on a TMDB miss.** The detail page checks
  the `tmdb` payload for a TMDB error envelope before treating the response as
  a hit, then falls back to the other media type. See `hasTmdbData` and
  `tryFetchDetail` in [title/[id]/page.tsx](../src/app/title/%5Bid%5D/page.tsx).
- **Bearer-token gate vs user gate.** The detail page and profile gate writes on
  `session?.user && session?.accessToken` — a session with a user but no access
  token would render controls that 401, which Story 5 explicitly bans.

## Bug-tracker channel

Group 1's Bug Tracker FE is at <https://group-1-frontend.onrender.com/>. We did
not file any bugs against their write routes this sprint — the contract above
held in practice.
