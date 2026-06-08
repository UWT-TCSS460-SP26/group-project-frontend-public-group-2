"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import { MetaText } from "./MetaText";
import { ButtonLink } from "./ButtonLink";
import { posterTransitionName } from "@/lib/view-transition";
import { TMDB_IMG_BASE, type MediaType } from "@/types/media";

export interface DeckItem {
  id: number;
  title: string;
  posterPath: string | null;
  href: string;
  mediaType: MediaType;
  year?: string;
  /** Aggregate 0–10 community score, when the popular feed includes it. */
  rating?: number;
  overview?: string;
}

// How many posters the fan can hold, and how many neighbours stay visible on each
// side of the active one (the rest park off-frame until they wrap around to it).
const MAX_CARDS = 7;
const WINDOW = 2;

// Resting pose maths for the 3D fan (desktop). Each step out from the active card
// fans the poster further along X, pushes it back in Z, angles it inward, and
// shrinks it — a real coverflow, not a flat strip.
const STEP_X = 192;
const ANGLE_BASE = 18;
const ANGLE_STEP = 6;
const Z_NEAR = -96;
const Z_FAR = -210;
const Z_ACTIVE = 72;

function posterUrl(path: string | null): string | null {
  if (!path) return null;
  return path.startsWith("http") ? path : `${TMDB_IMG_BASE}${path}`;
}

function fanTransform(offset: number): string {
  const abs = Math.abs(offset);
  const x = offset * STEP_X;
  const z = offset === 0 ? Z_ACTIVE : abs === 1 ? Z_NEAR : Z_FAR;
  const rotate = offset === 0 ? 0 : -Math.sign(offset) * (ANGLE_BASE + abs * ANGLE_STEP);
  const scale = 1 - abs * 0.07;
  return `translate(-50%, -50%) translateX(${x}px) translateZ(${z}px) rotateY(${rotate}deg) scale(${scale})`;
}

// Mobile = a vertical "stacked cards" pose: the active card sits front and full,
// the next two peek up behind it.
function stackTransform(offset: number): string {
  const shown = Math.max(offset, 0);
  return `translate(-50%, 0) translateY(${-shown * 18}px) scale(${1 - shown * 0.05})`;
}

const navBtnSx = {
  border: "1px solid",
  borderColor: "divider",
  borderRadius: 0,
  color: "text.secondary",
  "&:hover": {
    color: "text.primary",
    borderColor: "text.primary",
    backgroundColor: "transparent",
  },
} as const;

// Editorial registration ticks at the plate corners — the "viewfinder" framing
// that sells the 1px hairline-grid aesthetic.
const CORNERS = [
  { top: 12, left: 12, borderTop: "1px solid", borderLeft: "1px solid" },
  { top: 12, right: 12, borderTop: "1px solid", borderRight: "1px solid" },
  { bottom: 12, left: 12, borderBottom: "1px solid", borderLeft: "1px solid" },
  { bottom: 12, right: 12, borderBottom: "1px solid", borderRight: "1px solid" },
] as const;

/**
 * Popular-this-week 3D poster deck. Desktop arranges the week's posters as a
 * concave coverflow fan inside a CSS-`perspective` stage: the active poster is
 * flat, lit, and pulled forward; its neighbours angle inward and recede. The deck
 * loops — flipping past either end wraps straight into the posters on the far side,
 * so it reads as an endless reel. Clicking a neighbour glides it to the centre
 * (everything eases on one shared `cubic-bezier(0.4, 0, 0.2, 1)`); clicking the
 * active poster opens the title with the shared-element view transition. Hovering
 * any poster lifts it with a sheen sweep. Below the stage, the active film's
 * metadata cross-fades in — oversized serif title + a strict mono catalog line.
 *
 * Mobile drops the fan for a tap-friendly vertical stack. Transform/opacity only
 * (GPU, 60fps); reduced-motion users get a static, legible layout.
 */
export function PosterDeck({ items }: { items: DeckItem[] }) {
  const deck = items.slice(0, MAX_CARDS);
  const n = deck.length;
  const stageRef = useRef<HTMLDivElement | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const suppressClickRef = useRef(false);
  // Start near the middle so the fan opens symmetrically.
  const [active, setActive] = useState(() => Math.min(WINDOW, Math.floor(Math.max(n - 1, 0) / 2)));

  // Shortest signed distance around the ring → the deck wraps in both directions.
  const offsetOf = useCallback(
    (i: number) => {
      let off = (((i - active) % n) + n) % n;
      if (off > n / 2) off -= n;
      return off;
    },
    [active, n],
  );
  const go = useCallback((delta: number) => setActive((cur) => (((cur + delta) % n) + n) % n), [n]);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        go(-1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        go(1);
      }
    },
    [go],
  );

  const onTouchStart = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    if (!touch) return;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const onTouchEnd = useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      const start = touchStartRef.current;
      const touch = event.changedTouches[0];
      touchStartRef.current = null;
      if (!start || !touch) return;

      const deltaX = touch.clientX - start.x;
      const deltaY = touch.clientY - start.y;
      if (Math.abs(deltaX) < 44 || Math.abs(deltaX) <= Math.abs(deltaY) * 1.15) {
        return;
      }

      suppressClickRef.current = true;
      go(deltaX < 0 ? 1 : -1);
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 400);
    },
    [go],
  );

  if (n === 0) return null;
  const current = deck[active];
  const catalog = [
    `NO. ${String(active + 1).padStart(2, "0")}`,
    current.year,
    current.mediaType === "tv" ? "TV" : "MOVIE",
  ]
    .filter(Boolean)
    .join("  /  ");

  return (
    <Box
      // Bone-paper stage framed in hairline rules — the gallery "plate".
      sx={{
        position: "relative",
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      {/* 3D stage */}
      <Box
        ref={stageRef}
        role="group"
        aria-label="Popular this week — poster deck"
        tabIndex={0}
        onKeyDown={onKeyDown}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        sx={{
          position: "relative",
          overflow: "hidden",
          width: "100%",
          minWidth: 0,
          height: { xs: "min(132vw, 460px)", sm: 500, md: 540 },
          perspective: { md: "1200px" },
          perspectiveOrigin: "50% 44%",
          touchAction: { xs: "pan-y", md: "auto" },
          overscrollBehaviorX: "contain",
          outline: "none",
          // Soft emerald-tinted halo behind the centre so the active poster lifts
          // off the bone surface — premium depth without a hard shadow on the paper.
          backgroundImage:
            "radial-gradient(58% 64% at 50% 42%, color-mix(in srgb, var(--mui-palette-primary-main) 7%, transparent) 0%, transparent 72%)",
          "&:focus-visible": { boxShadow: "inset 0 0 0 2px var(--mui-palette-primary-main)" },
        }}
      >
        {/* Corner registration ticks. */}
        {CORNERS.map((corner, idx) => (
          <Box
            key={idx}
            aria-hidden
            sx={{
              position: "absolute",
              width: 16,
              height: 16,
              borderColor: "text.secondary",
              opacity: 0.55,
              pointerEvents: "none",
              zIndex: 0,
              ...corner,
            }}
          />
        ))}

        {deck.map((item, i) => {
          const offset = offsetOf(i);
          const abs = Math.abs(offset);
          const src = posterUrl(item.posterPath);
          const isActive = offset === 0;
          const fanShown = abs <= WINDOW;
          const stackShown = offset >= 0 && offset <= WINDOW;
          const reachable = fanShown;

          return (
            <Box
              key={`${item.mediaType}-${item.id}`}
              component={Link}
              href={item.href}
              aria-label={isActive ? `View ${item.title}` : `Bring ${item.title} to the front`}
              aria-hidden={!reachable}
              tabIndex={reachable ? undefined : -1}
              onClick={(event: React.MouseEvent<HTMLAnchorElement>) => {
                if (suppressClickRef.current) {
                  event.preventDefault();
                  return;
                }
                if (!isActive) {
                  event.preventDefault();
                  setActive(i);
                  return;
                }
                const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                if (event.button !== 0 || event.metaKey || event.ctrlKey || reduce) return;
                const poster = event.currentTarget.querySelector<HTMLElement>("[data-title-poster]");
                if (poster) poster.style.viewTransitionName = posterTransitionName(item.mediaType, item.id);
              }}
              className="deck-card"
              sx={{
                position: "absolute",
                left: "50%",
                top: { xs: "auto", md: "50%" },
                bottom: { xs: 24, md: "auto" },
                display: "block",
                width: { xs: "min(250px, calc(100% - 40px))", sm: 268, md: 284 },
                textDecoration: "none",
                transformOrigin: "center center",
                transform: { xs: stackTransform(offset), md: fanTransform(offset) },
                opacity: {
                  xs: offset === 0 ? 1 : offset === 1 ? 0.5 : offset === 2 ? 0.26 : 0,
                  md: abs === 0 ? 1 : abs === 1 ? 0.94 : abs === 2 ? 0.74 : 0,
                },
                zIndex: { xs: 30 - Math.max(offset, 0), md: 30 - abs },
                pointerEvents: { xs: stackShown ? "auto" : "none", md: fanShown ? "auto" : "none" },
                transition:
                  "transform 600ms cubic-bezier(0.4, 0, 0.2, 1), opacity 600ms cubic-bezier(0.4, 0, 0.2, 1)",
                cursor: "pointer",
                "@media (prefers-reduced-motion: reduce)": { transition: "none" },
                // Hover lift + sheen on whichever poster the cursor is over — the
                // lift lives on the inner frame so it never fights the fan pose.
                "@media (hover: hover)": {
                  "&:hover": { zIndex: 40 },
                  "&:hover .deck-poster": {
                    transform: "translateY(-12px) scale(1.035)",
                    borderColor: "color-mix(in srgb, var(--mui-palette-primary-main) 60%, var(--mui-palette-divider))",
                    boxShadow: "0 46px 72px -26px color-mix(in srgb, var(--mui-palette-common-black) 55%, transparent)",
                  },
                  "&:hover .deck-sheen": { transform: "translateX(130%) skewX(-14deg)" },
                },
              }}
            >
              <Box
                className="deck-poster"
                sx={{
                  position: "relative",
                  aspectRatio: "2 / 3",
                  overflow: "hidden",
                  bgcolor: "background.default",
                  border: "1px solid",
                  borderColor: isActive
                    ? "color-mix(in srgb, var(--mui-palette-primary-main) 55%, var(--mui-palette-divider))"
                    : "divider",
                  boxShadow: isActive
                    ? "0 42px 70px -26px color-mix(in srgb, var(--mui-palette-common-black) 52%, transparent)"
                    : "0 26px 48px -24px color-mix(in srgb, var(--mui-palette-common-black) 40%, transparent)",
                  transition:
                    "transform 360ms cubic-bezier(0.16, 1, 0.3, 1), border-color 360ms ease, box-shadow 360ms ease",
                  "@media (prefers-reduced-motion: reduce)": { transition: "none" },
                }}
              >
                {src ? (
                  <Image
                    data-title-poster
                    src={src}
                    alt={item.title}
                    fill
                    quality={85}
                    sizes="(max-width: 900px) 268px, 284px"
                    style={{ objectFit: "cover" }}
                  />
                ) : (
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "text.secondary",
                      fontFamily: "var(--font-fraunces), Georgia, serif",
                      fontStyle: "italic",
                      fontSize: "0.85rem",
                    }}
                  >
                    no poster
                  </Box>
                )}
                {/* Glass sheen — parked off the left edge, sweeps across on hover. */}
                <Box
                  className="deck-sheen"
                  aria-hidden
                  sx={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    backgroundImage:
                      "linear-gradient(105deg, transparent 36%, color-mix(in srgb, var(--mui-palette-common-white) 30%, transparent) 50%, transparent 64%)",
                    transform: "translateX(-130%) skewX(-14deg)",
                    transition: "transform 850ms cubic-bezier(0.22, 0.61, 0.36, 1)",
                    "@media (prefers-reduced-motion: reduce)": { display: "none" },
                  }}
                />
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* Active film's metadata — its own bone caption strip; cross-fades per change. */}
      <Box
        sx={{
          borderTop: "1px solid",
          borderColor: "divider",
          bgcolor: "background.default",
          px: { xs: 2, sm: 2.5, md: 4 },
          py: { xs: 2.5, md: 3.25 },
          display: "flex",
          alignItems: { xs: "flex-start", sm: "flex-end" },
          justifyContent: "space-between",
          gap: 2.5,
          flexDirection: { xs: "column", sm: "row" },
        }}
      >
        <Box
          key={`${current.mediaType}-${current.id}`}
          sx={{
            minWidth: 0,
            animation: "reveal-up 380ms ease-out both",
            "@media (prefers-reduced-motion: reduce)": { animation: "none" },
          }}
        >
          <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.25, mb: 1 }}>
            <MetaText sx={{ color: "primary.dark", textTransform: "uppercase", letterSpacing: { xs: "0.1em", sm: "0.18em" }, overflowWrap: "anywhere" }}>
              {catalog}
            </MetaText>
            {typeof current.rating === "number" && current.rating > 0 && (
              <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.3 }}>
                <StarRoundedIcon sx={{ fontSize: 15, color: "primary.main" }} />
                <MetaText sx={{ color: "text.primary" }}>{current.rating.toFixed(1)}</MetaText>
              </Box>
            )}
          </Box>
          <Typography
            component={Link}
            href={current.href}
            sx={{
              fontFamily: "var(--font-fraunces), Georgia, serif",
              fontSize: { xs: "clamp(1.55rem, 8vw, 1.95rem)", md: "2.7rem" },
              lineHeight: 1.03,
              letterSpacing: "-0.02em",
              color: "text.primary",
              textDecoration: "none",
              display: "-webkit-box",
              WebkitLineClamp: { xs: 2, sm: 1 },
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              overflowWrap: "anywhere",
              "&:hover": { color: "primary.dark" },
            }}
          >
            {current.title}
          </Typography>
          {current.overview && (
            <Typography
              sx={{
                display: { xs: "none", sm: "-webkit-box" },
                mt: 1,
                maxWidth: 520,
                color: "text.secondary",
                fontSize: "0.92rem",
                lineHeight: 1.55,
                WebkitLineClamp: 1,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {current.overview}
            </Typography>
          )}
        </Box>

        <Box
          sx={{
            display: "flex",
            width: { xs: "100%", sm: "auto" },
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            flexShrink: 0,
          }}
        >
          <ButtonLink
            href={current.href}
            variant="text"
            sx={{
              fontFamily: "var(--font-mono), ui-monospace, monospace",
              fontSize: "0.72rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              px: 0,
              color: "text.primary",
              "&:hover": { color: "primary.dark", backgroundColor: "transparent" },
            }}
          >
            View title →
          </ButtonLink>
          <Box sx={{ display: "flex", gap: 0.5 }}>
            <IconButton aria-label="Previous title" size="small" onClick={() => go(-1)} sx={navBtnSx}>
              <ChevronLeftIcon fontSize="small" />
            </IconButton>
            <IconButton aria-label="Next title" size="small" onClick={() => go(1)} sx={navBtnSx}>
              <ChevronRightIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
