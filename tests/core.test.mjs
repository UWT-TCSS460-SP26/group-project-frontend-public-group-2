import assert from "node:assert/strict";
import test from "node:test";
import { chooseComparisonScores } from "../src/lib/compare-scores.ts";
import { formatDisplayDate } from "../src/lib/format-date.ts";
import {
  filterAndSortSearchResults,
  yearOf,
} from "../src/lib/search-filter.ts";
import {
  parseMediaType,
  titleHref,
  titleIdentityKey,
} from "../src/lib/title-route.ts";

const baseMovie = {
  id: 1,
  title: "Example",
  overview: "",
  poster_path: null,
  language: "en",
};

test("title identity keeps movie and TV ids separate", () => {
  assert.equal(
    titleIdentityKey({ mediaType: "movie", id: 549 }),
    "movie:549",
  );
  assert.equal(titleIdentityKey({ mediaType: "tv", id: 549 }), "tv:549");
  assert.notEqual(
    titleIdentityKey({ mediaType: "movie", id: 549 }),
    titleIdentityKey({ mediaType: "tv", id: 549 }),
  );
  assert.equal(titleHref("tv", 549), "/title/549?type=tv");
  assert.equal(parseMediaType("movie"), "movie");
  assert.equal(parseMediaType("invalid"), undefined);
});

test("search filters require matching metadata instead of passing unknowns", () => {
  const items = [
    {
      ...baseMovie,
      id: 1,
      title: "Drama",
      release_date: "2020-01-01",
      genres: ["Drama"],
      rating: 8.2,
    },
    {
      ...baseMovie,
      id: 2,
      title: "Comedy",
      release_date: "2021-01-01",
      genres: ["Comedy"],
      rating: 9.1,
    },
    { ...baseMovie, id: 3, title: "Unknown" },
  ];

  const filtered = filterAndSortSearchResults(items, {
    genre: "Drama",
    minRating: 8,
    yearFrom: 2019,
    yearTo: 2022,
    sort: "title",
  });

  assert.deepEqual(
    filtered.map((item) => item.id),
    [1],
  );
  assert.equal(yearOf(items[1]), 2021);
  assert.equal(yearOf(items[2]), 0);
});

test("comparison uses the same score source on both sides", () => {
  assert.deepEqual(
    chooseComparisonScores(
      { communityScore: 8, tmdbRating: 7 },
      { communityScore: 6, tmdbRating: 9 },
    ),
    { label: "Community verdict", scoreA: 8, scoreB: 6 },
  );
  assert.deepEqual(
    chooseComparisonScores(
      { communityScore: 8, tmdbRating: 7 },
      { tmdbRating: 9 },
    ),
    { label: "TMDB verdict", scoreA: 7, scoreB: 9 },
  );
  assert.equal(
    chooseComparisonScores({ communityScore: 8 }, { tmdbRating: 9 }),
    null,
  );
});

test("display dates use one stable format", () => {
  assert.equal(formatDisplayDate("2026-06-07T12:00:00Z"), "Jun 7, 2026");
  assert.equal(formatDisplayDate("not-a-date"), undefined);
});
