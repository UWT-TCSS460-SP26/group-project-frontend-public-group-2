"use client";

import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import { useWatchlist, type WatchlistItem } from "@/lib/watchlist";

interface WatchlistButtonProps {
  item: WatchlistItem;
  size?: "small" | "medium";
}

/**
 * Bookmark toggle for the watchlist. Instant (no spinner — it's device-local) with a
 * reduced-motion-safe scale "pop" on press. Often lives inside a card <Link>, so it
 * stops the click from navigating.
 */
export function WatchlistButton({ item, size = "small" }: WatchlistButtonProps) {
  const { has, toggle } = useWatchlist();
  const saved = has(item.id);
  const label = saved ? "Remove from watchlist" : "Add to watchlist";
  const iconFontSize = size === "small" ? "small" : "medium";

  return (
    <Tooltip title={label}>
      <IconButton
        size={size}
        aria-label={label}
        aria-pressed={saved}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          toggle(item);
        }}
        sx={{
          color: saved ? "primary.main" : "text.secondary",
          "&:hover": { color: "primary.main", backgroundColor: "transparent" },
          "& .wl-icon": { transition: "transform 150ms ease" },
          "&:active .wl-icon": { transform: "scale(1.2)" },
        }}
      >
        {saved ? (
          <BookmarkIcon className="wl-icon" fontSize={iconFontSize} />
        ) : (
          <BookmarkBorderIcon className="wl-icon" fontSize={iconFontSize} />
        )}
      </IconButton>
    </Tooltip>
  );
}
