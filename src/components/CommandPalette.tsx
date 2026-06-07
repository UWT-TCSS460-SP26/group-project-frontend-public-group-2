"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import Typography from "@mui/material/Typography";
import SearchIcon from "@mui/icons-material/Search";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import ExploreRoundedIcon from "@mui/icons-material/ExploreRounded";
import BookmarkRoundedIcon from "@mui/icons-material/BookmarkRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import CompareArrowsRoundedIcon from "@mui/icons-material/CompareArrowsRounded";
import MovieRoundedIcon from "@mui/icons-material/MovieRounded";
import TvRoundedIcon from "@mui/icons-material/TvRounded";
import { MetaText } from "./MetaText";
import styles from "./CommandPalette.module.css";

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

interface SearchResult {
  id: string;
  href: string;
  title: string;
  mediaType: "movie" | "tv";
  year?: string;
}

type PaletteItem =
  | {
      id: string;
      href: string;
      title: string;
      label: string;
      kind: "link";
      icon: React.ReactNode;
    }
  | {
      id: string;
      href: string;
      title: string;
      label: string;
      kind: "result";
      icon: React.ReactNode;
    };

const QUICK_LINKS: PaletteItem[] = [
  {
    id: "home",
    href: "/",
    title: "Home",
    label: "Page",
    kind: "link",
    icon: <HomeRoundedIcon fontSize="small" />,
  },
  {
    id: "browse",
    href: "/browse",
    title: "Browse",
    label: "Page",
    kind: "link",
    icon: <ExploreRoundedIcon fontSize="small" />,
  },
  {
    id: "watchlist",
    href: "/watchlist",
    title: "Watchlist",
    label: "Page",
    kind: "link",
    icon: <BookmarkRoundedIcon fontSize="small" />,
  },
  {
    id: "compare",
    href: "/compare",
    title: "Compare",
    label: "Page",
    kind: "link",
    icon: <CompareArrowsRoundedIcon fontSize="small" />,
  },
  {
    id: "profile",
    href: "/profile",
    title: "Profile",
    label: "Page",
    kind: "link",
    icon: <PersonRoundedIcon fontSize="small" />,
  },
  {
    id: "about",
    href: "/about",
    title: "About",
    label: "Page",
    kind: "link",
    icon: <InfoRoundedIcon fontSize="small" />,
  },
];

function resultToItem(result: SearchResult): PaletteItem {
  const mediaLabel = result.mediaType === "tv" ? "TV" : "Movie";
  return {
    id: result.id,
    href: result.href,
    title: result.title,
    label: [mediaLabel, result.year].filter(Boolean).join(" · "),
    kind: "result",
    icon:
      result.mediaType === "tv" ? (
        <TvRoundedIcon fontSize="small" />
      ) : (
        <MovieRoundedIcon fontSize="small" />
      ),
  };
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!open) return;
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 250);

    return () => window.clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    if (!open || !debouncedQuery) return;

    const controller = new AbortController();

    fetch(`/api/command-search?q=${encodeURIComponent(debouncedQuery)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Search failed.");
        return (await response.json()) as { results?: SearchResult[] };
      })
      .then((payload) => {
        setResults(Array.isArray(payload.results) ? payload.results : []);
        setActiveIndex(0);
      })
      .catch((fetchError) => {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") {
          return;
        }
        setResults([]);
        setActiveIndex(0);
        setError(fetchError instanceof Error ? fetchError.message : "Search failed.");
      });

    return () => controller.abort();
  }, [debouncedQuery, open]);

  const items = useMemo(
    () => [
      ...QUICK_LINKS,
      ...(debouncedQuery ? results.map(resultToItem) : []),
    ],
    [debouncedQuery, results],
  );

  const activeItem = items[activeIndex];

  function closeAndReset() {
    setQuery("");
    setDebouncedQuery("");
    setResults([]);
    setError(null);
    setActiveIndex(0);
    onClose();
  }

  function openItem(item: PaletteItem | undefined) {
    if (!item) return;
    closeAndReset();
    router.push(item.href);
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % items.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => (current - 1 + items.length) % items.length);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      openItem(activeItem);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={closeAndReset}
      fullWidth
      maxWidth="sm"
      aria-labelledby="command-palette-title"
      slotProps={{
        paper: {
          sx: {
            borderRadius: 0,
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
            overflow: "hidden",
          },
        },
        backdrop: {
          sx: {
            bgcolor: "color-mix(in srgb, var(--mui-palette-common-black) 58%, transparent)",
          },
        },
      }}
    >
      <DialogTitle id="command-palette-title" sx={{ px: 2, py: 1.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
          <SearchIcon fontSize="small" sx={{ color: "text.secondary" }} />
          <input
            ref={inputRef}
            className={styles.input}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setError(null);
              setActiveIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search movies & TV"
            aria-label="Search movies and TV"
            autoComplete="off"
          />
        </Box>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{ p: 0, borderColor: "divider" }}
        onKeyDown={handleKeyDown}
      >
        <List
          role="listbox"
          aria-label="Command palette results"
          sx={{ py: 0, maxHeight: { xs: 420, md: 520 }, overflowY: "auto" }}
        >
          {items.map((item, index) => {
            const selected = index === activeIndex;
            return (
              <ListItemButton
                key={item.id}
                role="option"
                aria-selected={selected}
                selected={selected}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => openItem(item)}
                sx={{
                  display: "grid",
                  gridTemplateColumns: "24px 1fr auto",
                  gap: 1.5,
                  alignItems: "center",
                  px: 2,
                  py: 1.25,
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  color: "text.primary",
                  "&:last-child": { borderBottom: 0 },
                  "&.Mui-selected": {
                    bgcolor: "action.hover",
                  },
                  "&.Mui-selected:hover": {
                    bgcolor: "action.hover",
                  },
                }}
              >
                <Box sx={{ color: "text.secondary", display: "flex" }}>{item.icon}</Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontSize: "0.94rem",
                      fontWeight: 500,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.title}
                  </Typography>
                  <MetaText sx={{ display: "block", mt: 0.25 }}>{item.label}</MetaText>
                </Box>
                <MetaText sx={{ color: "text.secondary" }}>
                  {item.kind === "link" ? "Jump" : "Open"}
                </MetaText>
              </ListItemButton>
            );
          })}
        </List>

        {debouncedQuery && error && (
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography sx={{ color: "error.main", fontSize: "0.88rem" }}>
              {error}
            </Typography>
          </Box>
        )}

        {debouncedQuery && !error && results.length === 0 && (
          <Box sx={{ px: 2, py: 2.5, textAlign: "center" }}>
            <Typography sx={{ color: "text.secondary", fontStyle: "italic" }}>
              No matching titles.
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
