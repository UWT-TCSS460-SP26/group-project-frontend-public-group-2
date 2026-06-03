import Link from "next/link";
import Image from "next/image";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { Movie } from "@/types/media";
import { TMDB_IMG_BASE } from "@/types/media";

interface MovieCardProps {
  movie: Movie;
  hrefPrefix?: string;
}

export function MovieCard({ movie, hrefPrefix = "/title" }: MovieCardProps) {
  const href = `${hrefPrefix}/${movie.id}`;

  // poster_path is a relative TMDB path like "/abc123.jpg".
  // Guard: if Group 1 ever sends a pre-resolved full URL, pass it through.
  const posterUrl = movie.poster_path
    ? movie.poster_path.startsWith("http")
      ? movie.poster_path
      : `${TMDB_IMG_BASE}${movie.poster_path}`
    : null;

  // release_date comes as "YYYY-MM-DD" — display just the year.
  const releaseYear = movie.release_date?.slice(0, 4);

  return (
    <Link
      href={href}
      style={{ textDecoration: "none", color: "inherit", display: "block" }}
    >
      <Box
        sx={{
          transition: "transform 200ms ease, opacity 200ms ease",
          "&:hover": {
            transform: "translateY(-2px)",
            opacity: 0.92,
          },
        }}
      >
        <Box
          sx={{
            position: "relative",
            aspectRatio: "2 / 3",
            backgroundColor: "background.paper",
            mb: 1,
            overflow: "hidden",
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
              // Grid is 2 cols (xs) → 3 (sm) → 5–6 (md+); size the request accordingly.
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
        </Box>
        <Typography
          sx={{
            fontSize: "0.95rem",
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
        {releaseYear && (
          <Typography
            sx={{
              mt: 0.25,
              fontSize: "0.8rem",
              color: "text.secondary",
            }}
          >
            {releaseYear}
          </Typography>
        )}
      </Box>
    </Link>
  );
}
