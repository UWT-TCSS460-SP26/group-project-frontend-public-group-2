"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { searchForCompare } from "./actions";
import { TMDB_IMG_BASE } from "@/types/media";
import type { Movie } from "@/types/media";

interface TitlePickerProps {
  /** Which URL slot this picker controls ("a" or "b"). */
  slot: "a" | "b";
  /** Current encoded value of the OTHER slot — preserved in the navigation URL. */
  otherSlot?: string;
}

/**
 * Client-side search panel for selecting a comparison title.
 * Calls the searchForCompare server action, shows a result list,
 * and navigates to /compare?{slot}={mediaType}:{id} on pick.
 */
export function TitlePicker({ slot, otherSlot }: TitlePickerProps) {
  const router = useRouter();
  const [searchType, setSearchType] = useState<"movies" | "tv">("movies");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Movie[]>([]);
  const [searched, setSearched] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    startTransition(async () => {
      const data = await searchForCompare(query, searchType);
      setResults(data?.results ?? []);
      setSearched(true);
    });
  }

  function pick(item: Movie) {
    const mediaType = searchType === "tv" ? "tv" : "movie";
    const slotValue = `${mediaType}:${item.id}`;
    const params = new URLSearchParams();
    params.set(slot, slotValue);
    if (otherSlot) params.set(slot === "a" ? "b" : "a", otherSlot);
    router.push(`/compare?${params.toString()}`);
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Movies / TV toggle */}
      <Box sx={{ display: "flex", gap: 1 }}>
        {(["movies", "tv"] as const).map((t) => (
          <Button
            key={t}
            size="small"
            variant={searchType === t ? "contained" : "outlined"}
            color="primary"
            onClick={() => { setSearchType(t); setResults([]); setSearched(false); }}
          >
            {t === "tv" ? "TV Shows" : "Movies"}
          </Button>
        ))}
      </Box>

      {/* Search form */}
      <Box
        component="form"
        onSubmit={handleSearch}
        sx={{ display: "flex", gap: 1 }}
        aria-label={`Search ${searchType} to compare in slot ${slot.toUpperCase()}`}
      >
        <TextField
          size="small"
          fullWidth
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchType === "tv" ? "Search TV shows…" : "Search movies…"}
          autoComplete="off"
          slotProps={{ htmlInput: { "aria-label": `Search ${searchType}` } }}
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          size="small"
          disabled={isPending || !query.trim()}
          startIcon={isPending ? <CircularProgress size={14} color="inherit" /> : undefined}
          sx={{ minWidth: 80 }}
        >
          {isPending ? "" : "Search"}
        </Button>
      </Box>

      {/* No results */}
      {searched && !isPending && results.length === 0 && (
        <Typography sx={{ color: "text.secondary", fontSize: "0.88rem" }}>
          No results found.
        </Typography>
      )}

      {/* Result list */}
      {results.length > 0 && (
        <Box
          component="ul"
          aria-label="Search results"
          sx={{
            listStyle: "none",
            m: 0,
            p: 0,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1,
            overflow: "hidden",
            maxHeight: 340,
            overflowY: "auto",
          }}
        >
          {results.slice(0, 10).map((item, i) => {
            const posterUrl = item.poster_path
              ? item.poster_path.startsWith("http")
                ? item.poster_path
                : `${TMDB_IMG_BASE}${item.poster_path}`
              : null;
            const year = (item.release_date ?? item.first_air_date)?.slice(0, 4);

            return (
              <Box component="li" key={item.id}>
                {i > 0 && <Divider />}
                <ButtonBase
                  onClick={() => pick(item)}
                  aria-label={`Select ${item.title}${year ? ` (${year})` : ""}`}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    p: 1.25,
                    width: "100%",
                    textAlign: "left",
                    justifyContent: "flex-start",
                    transition: "background-color 140ms ease",
                    "&:hover": { bgcolor: "action.hover" },
                    "&:focus-visible": {
                      outline: "2px solid",
                      outlineColor: "primary.main",
                      outlineOffset: -2,
                    },
                  }}
                >
                  {/* Thumbnail */}
                  {posterUrl && (
                    <Box
                      sx={{
                        position: "relative",
                        width: 34,
                        aspectRatio: "2 / 3",
                        flexShrink: 0,
                        bgcolor: "background.paper",
                        border: "1px solid",
                        borderColor: "divider",
                        overflow: "hidden",
                      }}
                    >
                      <Image
                        src={posterUrl}
                        alt={item.title}
                        fill
                        sizes="34px"
                        className="image-cover"
                      />
                    </Box>
                  )}

                  {/* Info */}
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontSize: "0.88rem",
                        fontWeight: 500,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.title}
                    </Typography>
                    {year && (
                      <Typography
                        sx={{
                          fontSize: "0.72rem",
                          color: "text.secondary",
                          fontFamily: "var(--font-mono), ui-monospace, monospace",
                        }}
                      >
                        {year}
                      </Typography>
                    )}
                  </Box>
                </ButtonBase>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
