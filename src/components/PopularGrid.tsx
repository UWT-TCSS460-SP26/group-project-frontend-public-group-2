import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { MovieCard } from "./MovieCard";
import type { Movie } from "@/types/media";

interface PopularGridProps {
  title?: string;
  movies: Movie[];
}

export function PopularGrid({ title = "Popular this week", movies }: PopularGridProps) {
  return (
    <Box>
      <Typography
        variant="h2"
        sx={{
          fontSize: { xs: "1.6rem", md: "1.85rem" },
          mb: { xs: 3, md: 4 },
        }}
      >
        {title}
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, 1fr)",
            sm: "repeat(3, 1fr)",
            md: "repeat(5, 1fr)",
            lg: "repeat(6, 1fr)",
          },
          gap: { xs: 2, md: 3 },
        }}
      >
        {movies.map((m) => (
          <MovieCard key={m.id} movie={m} />
        ))}
      </Box>
    </Box>
  );
}
