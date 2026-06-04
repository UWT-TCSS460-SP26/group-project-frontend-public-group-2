"use client";

import { useRef } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

interface RailProps {
  /** Section heading node (e.g. a styled title + numeral). */
  title?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Horizontal poster rail — scroll-snap row with desktop scroll arrows. Keyboard
 * users tab through the cards (each link scrolls itself into view); touch users
 * swipe. Scrollbar hidden. Cards are passed as children (usually <MovieCard>s).
 */
export function Rail({ title, children }: RailProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollByPage = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  const arrowSx = {
    border: "1px solid",
    borderColor: "divider",
    borderRadius: 0,
    color: "text.secondary",
    "&:hover": { color: "text.primary", backgroundColor: "transparent" },
  };

  return (
    <Box>
      {title && (
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 2,
            mb: 2,
          }}
        >
          <Box sx={{ minWidth: 0 }}>{title}</Box>
          <Box sx={{ display: { xs: "none", md: "flex" }, gap: 0.5, flexShrink: 0 }}>
            <IconButton
              aria-label="Scroll left"
              size="small"
              onClick={() => scrollByPage(-1)}
              sx={arrowSx}
            >
              <ChevronLeftIcon fontSize="small" />
            </IconButton>
            <IconButton
              aria-label="Scroll right"
              size="small"
              onClick={() => scrollByPage(1)}
              sx={arrowSx}
            >
              <ChevronRightIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      )}
      <Box
        ref={scrollerRef}
        sx={{
          display: "grid",
          gridAutoFlow: "column",
          gridAutoColumns: { xs: "42%", sm: "28%", md: "16.5%" },
          gap: { xs: 2, md: 3 },
          overflowX: "auto",
          overflowY: "hidden",
          scrollSnapType: "x mandatory",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
          "& > *": { scrollSnapAlign: "start" },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
