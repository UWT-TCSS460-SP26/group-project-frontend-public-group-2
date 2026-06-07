import Link from "next/link";
import Image from "next/image";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { MetaText } from "./MetaText";
import { WatchlistButton } from "./WatchlistButton";
import type { Movie, MediaType } from "@/types/media";
import { TMDB_IMG_BASE } from "@/types/media";

interface MovieCardProps {
  movie: Movie;
  hrefPrefix?: string;
  /** Extra mono meta after the year, e.g. "TV" or a runtime. */
  metaSuffix?: string;
  /** Used for the watchlist entry; defaults to "movie". */
  mediaType?: MediaType;
}

export function MovieCard({
  movie,
  hrefPrefix = "/title",
  metaSuffix,
  mediaType = "movie",
}: MovieCardProps) {
  const href = `${hrefPrefix}/${movie.id}`;

  // poster_path is a relative TMDB path like "/abc123.jpg".
  // Guard: if Group 1 ever sends a pre-resolved full URL, pass it through.
  const posterUrl = movie.poster_path
    ? movie.poster_path.startsWith("http")
      ? movie.poster_path
      : `${TMDB_IMG_BASE}${movie.poster_path}`
    : null;

  // Movies have release_date; TV shows have first_air_date — fall back gracefully.
  const releaseYear = (movie.release_date ?? movie.first_air_date)?.slice(0, 4);
  const meta = [releaseYear, metaSuffix].filter(Boolean).join(" · ");

  return (
    <Link
      href={href}
      style={{ textDecoration: "none", color: "inherit", display: "block" }}
    >
      <Box
        sx={{
          "&:hover .poster": { transform: "translateY(-3px)" },
          "&:hover .accent-rule": { transform: "scaleX(1)" },
          "&:hover .poster-overlay, &:focus-within .poster-overlay": {
            opacity: 1,
          },
        }}
      >
        <Box
          className="poster"
          sx={{
            position: "relative",
            aspectRatio: "2 / 3",
            backgroundColor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
            overflow: "hidden",
            transition: "transform 220ms ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {posterUrl ? (
            <Image
              src={posterUrl}
              alt={movie.title}
              fill
              sizes="(max-width: 600px) 50vw, (max-width: 900px) 33vw, 17vw"
              style={{ objectFit: "cover" }}
            />
          ) : (
            <Typography
              sx={{
                color: "text.secondary",
                fontFamily: "var(--font-fraunces), serif",
                fontStyle: "italic",
                fontSize: "0.85rem",
              }}
            >
              no poster
            </Typography>
          )}

          {/* Watchlist toggle — revealed on hover/focus, always shown on touch. */}
          <Box
            className="poster-overlay"
            sx={{
              position: "absolute",
              top: 6,
              right: 6,
              bgcolor: "background.paper",
              border: "1px solid",
              borderColor: "divider",
              opacity: 0,
              transition: "opacity 160ms ease",
              "@media (hover: none)": { opacity: 1 },
            }}
          >
            <WatchlistButton
              item={{
                id: movie.id,
                mediaType,
                title: movie.title,
                posterPath: movie.poster_path,
                year: releaseYear,
              }}
            />
          </Box>
        </Box>

        {/* Emerald accent rule — grows in on hover (transform only). */}
        <Box
          className="accent-rule"
          aria-hidden
          sx={{
            height: "2px",
            mt: 1,
            mb: 0.75,
            backgroundColor: "primary.main",
            transformOrigin: "left",
            transform: "scaleX(0)",
            transition: "transform 220ms ease",
          }}
        />

        <Typography
          sx={{
            fontSize: "0.92rem",
            fontWeight: 500,
            lineHeight: 1.25,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {movie.title}
        </Typography>
        {meta && (
          <MetaText
            sx={{ display: "block", mt: 0.5, textTransform: "uppercase" }}
          >
            {meta}
          </MetaText>
        )}
      </Box>
    </Link>
  );
}
