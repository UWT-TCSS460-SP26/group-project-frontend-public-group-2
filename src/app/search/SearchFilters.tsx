"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

// TMDB genre taxonomy per media type. The server enriches search results with
// detail metadata whenever genre or rating filtering is requested.
const MOVIE_GENRES = [
  "Action",
  "Adventure",
  "Animation",
  "Comedy",
  "Crime",
  "Documentary",
  "Drama",
  "Fantasy",
  "Horror",
  "Mystery",
  "Romance",
  "Science Fiction",
  "Thriller",
  "Western",
];
const TV_GENRES = [
  "Action & Adventure",
  "Animation",
  "Comedy",
  "Crime",
  "Documentary",
  "Drama",
  "Family",
  "Kids",
  "Mystery",
  "Reality",
  "Sci-Fi & Fantasy",
  "Western",
];

export const SORT_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "year_desc", label: "Newest first" },
  { value: "year_asc", label: "Oldest first" },
  { value: "title", label: "Title A–Z" },
] as const;

// Min-rating buckets (0–10 scale matching Group 1's rating field).
const MIN_RATINGS = [5, 6, 7, 8, 9];

export interface SearchFiltersProps {
  q: string;
  searchType: "movies" | "tv";
  genre: string;
  yearFrom: string;
  yearTo: string;
  minRating: string;
  sort: string;
}

export function SearchFilters({
  q,
  searchType,
  genre,
  yearFrom,
  yearTo,
  minRating,
  sort,
}: SearchFiltersProps) {
  const router = useRouter();

  const [lGenre, setLGenre] = useState(genre);
  const [lYearFrom, setLYearFrom] = useState(yearFrom);
  const [lYearTo, setLYearTo] = useState(yearTo);
  const [lMinRating, setLMinRating] = useState(minRating);
  const [lSort, setLSort] = useState(sort || "relevance");

  const genres = searchType === "tv" ? TV_GENRES : MOVIE_GENRES;

  const hasActive =
    !!genre ||
    !!yearFrom ||
    !!yearTo ||
    !!minRating ||
    (!!sort && sort !== "relevance");

  function buildParams(overrides?: Partial<Record<string, string>>) {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    p.set("type", searchType);
    const g = overrides?.genre ?? lGenre;
    const yf = overrides?.yearFrom ?? lYearFrom;
    const yt = overrides?.yearTo ?? lYearTo;
    const mr = overrides?.minRating ?? lMinRating;
    const s = overrides?.sort ?? lSort;
    if (g) p.set("genre", g);
    if (yf) p.set("yearFrom", yf);
    if (yt) p.set("yearTo", yt);
    if (mr) p.set("minRating", mr);
    if (s && s !== "relevance") p.set("sort", s);
    return p.toString();
  }

  function apply() {
    router.push(`/search?${buildParams()}`);
  }

  function clear() {
    setLGenre("");
    setLYearFrom("");
    setLYearTo("");
    setLMinRating("");
    setLSort("relevance");
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    p.set("type", searchType);
    router.push(`/search?${p.toString()}`);
  }

  const controlSx = { minWidth: 130 };

  return (
    <Box
      component="fieldset"
      sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}
    >
      {/* <legend> groups all controls for screen readers */}
      <Typography
        component="legend"
        sx={{
          mb: 1.5,
          p: 0,
          fontFamily: "var(--font-mono), ui-monospace, monospace",
          fontSize: "0.7rem",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "text.secondary",
        }}
      >
        Filter &amp; sort
      </Typography>

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          alignItems: "flex-end",
        }}
      >
        {/* Genre */}
        <FormControl size="small" sx={controlSx}>
          <InputLabel id="filter-genre-label">Genre</InputLabel>
          <Select
            labelId="filter-genre-label"
            id="filter-genre"
            label="Genre"
            value={lGenre}
            onChange={(e) => setLGenre(e.target.value)}
          >
            <MenuItem value="">
              <em>Any genre</em>
            </MenuItem>
            {genres.map((g) => (
              <MenuItem key={g} value={g}>
                {g}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Year from */}
        <TextField
          label="Year from"
          id="filter-year-from"
          size="small"
          type="number"
          value={lYearFrom}
          onChange={(e) => setLYearFrom(e.target.value)}
          sx={{ ...controlSx, maxWidth: 120 }}
          slotProps={{
            htmlInput: {
              min: 1900,
              max: new Date().getFullYear(),
              placeholder: "e.g. 2000",
            },
          }}
        />

        {/* Year to */}
        <TextField
          label="Year to"
          id="filter-year-to"
          size="small"
          type="number"
          value={lYearTo}
          onChange={(e) => setLYearTo(e.target.value)}
          sx={{ ...controlSx, maxWidth: 120 }}
          slotProps={{
            htmlInput: {
              min: 1900,
              max: new Date().getFullYear() + 2,
              placeholder: "e.g. 2023",
            },
          }}
        />

        {/* Min rating */}
        <FormControl size="small" sx={controlSx}>
          <InputLabel id="filter-rating-label">Min rating</InputLabel>
          <Select
            labelId="filter-rating-label"
            id="filter-rating"
            label="Min rating"
            value={lMinRating}
            onChange={(e) => setLMinRating(String(e.target.value))}
          >
            <MenuItem value="">
              <em>Any rating</em>
            </MenuItem>
            {MIN_RATINGS.map((r) => (
              <MenuItem key={r} value={String(r)}>
                {r}+ / 10
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Sort */}
        <FormControl size="small" sx={controlSx}>
          <InputLabel id="filter-sort-label">Sort by</InputLabel>
          <Select
            labelId="filter-sort-label"
            id="filter-sort"
            label="Sort by"
            value={lSort}
            onChange={(e) => setLSort(e.target.value)}
          >
            {SORT_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Actions */}
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={apply}
          >
            Apply
          </Button>
          {hasActive && (
            <Button
              variant="text"
              size="small"
              onClick={clear}
              sx={{
                color: "text.secondary",
                "&:hover": { color: "text.primary", bgcolor: "transparent" },
              }}
            >
              Clear
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
}
