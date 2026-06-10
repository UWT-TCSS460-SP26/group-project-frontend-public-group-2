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
const MOBILE_VISIBLE_WINDOW = 2;

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

// Shortest signed distance from `active` to card `i` around the ring of `n`.
// Range is roughly [-n/2, n/2], so the deck wraps in both directions.
function signedOffset(i: number, active: number, n: number): number {
  let off = (((i - active) % n) + n) % n;
  if (off > n / 2) off -= n;
  return off;
}

function fanTransform(offset: number): string {
  const abs = Math.abs(offset);
  const x = offset * STEP_X;
  const z = offset === 0 ? Z_ACTIVE : abs === 1 ? Z_NEAR : Z_FAR;
  const rotate = offset === 0 ? 0 : -Math.sign(offset) * (ANGLE_BASE + abs * ANGLE_STEP);
  const scale = 1 - abs * 0.07;
  return `translate(-50%, -50%) translateX(${x}px) translateZ(${z}px) rotateY(${rotate}deg) scale(${scale})`;
}

// Mobile = a side-peek carousel pose so the horizontal swipe affordance is visible
// before the user interacts. The active card sits centred; its neighbours peek in
// from the sides and drop back slightly. One extra "staged" card sits off each edge
// at zero opacity so the next poster is already decoded before a swipe — and so the
// card wrapping across the back of the ring is never seen crossing the deck.
//
// These poses are defined as stops keyed by integer distance from centre, then read
// through `lerpStops` so a *fractional* offset is valid too. That is what lets the
// deck track a finger 1:1 mid-drag (offset 1.6, say) instead of only snapping
// between whole positions — the live drag interpolates every pose continuously.
const MOBILE_X_STOPS = [0, 54, 112, 176];
const MOBILE_Y_STOPS = [0, 10, 20, 28];
const MOBILE_SCALE_STOPS = [1, 0.92, 0.84, 0.78];
const MOBILE_OPACITY_STOPS = [1, 0.6, 0.34, 0];

// Piecewise-linear read of a stop table at a (possibly fractional) absolute offset.
// At whole offsets it returns the exact designed pose; between them it interpolates.
function lerpStops(absOffset: number, stops: number[]): number {
  const last = stops.length - 1;
  if (absOffset <= 0) return stops[0];
  if (absOffset >= last) return stops[last];
  const i = Math.floor(absOffset);
  return stops[i] + (stops[i + 1] - stops[i]) * (absOffset - i);
}

function mobileTransform(offset: number): string {
  const abs = Math.abs(offset);
  const sign = Math.sign(offset);
  const x = sign * lerpStops(abs, MOBILE_X_STOPS);
  const y = lerpStops(abs, MOBILE_Y_STOPS);
  const scale = lerpStops(abs, MOBILE_SCALE_STOPS);
  // translateZ(0) forces a dedicated GPU compositor layer, so the swipe/drag paints
  // off the main thread — kills the first-frame "layerization" hitch on phones.
  return `translate(-50%, 0) translateX(${x}px) translateY(${y}px) scale(${scale}) translateZ(0)`;
}

function mobileOpacity(offset: number): number {
  return lerpStops(Math.abs(offset), MOBILE_OPACITY_STOPS);
}

// Drag feel. A flick projects this many ms of momentum past release; a hard flick
// may skip at most this many cards. Both deliberately conservative so the gesture
// stays predictable without on-device tuning.
const DRAG_VELOCITY_MS = 80;
const DRAG_MAX_STEP = 2;
// Below the md breakpoint the deck is the mobile carousel and accepts drag.
const MOBILE_MAX_WIDTH = 900;

type DragState = {
  startX: number;
  startY: number;
  axis: "undecided" | "horizontal" | "vertical";
  baseOffsets: number[];
  stepPx: number;
  lastX: number;
  lastT: number;
  prevX: number;
  prevT: number;
  frac: number;
  raf: number | null;
};

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
 * Mobile keeps the same one-at-a-time focus, but shifts to a side-peek carousel
 * so the horizontal swipe gesture reads visually. Transform/opacity only (GPU,
 * 60fps); reduced-motion users get a static, legible layout.
 */
export function PosterDeck({ items }: { items: DeckItem[] }) {
  const deck = items.slice(0, MAX_CARDS);
  const n = deck.length;
  const stageRef = useRef<HTMLDivElement | null>(null);
  const suppressClickRef = useRef(false);
  // Live DOM handles for each card so the drag can write transforms straight to the
  // nodes (rAF, off the React render path) for a 60fps finger-follow.
  const cardNodesRef = useRef<Array<HTMLElement | null>>([]);
  const dragRef = useRef<DragState | null>(null);
  const cleanupTimerRef = useRef<number | null>(null);
  // Start near the middle so the fan opens symmetrically.
  const [active, setActive] = useState(() => Math.min(WINDOW, Math.floor(Math.max(n - 1, 0) / 2)));

  const offsetOf = useCallback((i: number) => signedOffset(i, active, n), [active, n]);
  const go = useCallback((delta: number) => setActive((cur) => (((cur + delta) % n) + n) % n), [n]);

  // Track the active index from the previous render so we can tell, this render,
  // which card had to wrap across the back of the ring (offset flipped from one far
  // edge to the other). That one card must teleport, not glide — see the transition
  // below. Derived-previous-state pattern: updating during render keeps `prevActive`
  // correct without reading a ref mid-render.
  const [seenActive, setSeenActive] = useState(active);
  const [prevActive, setPrevActive] = useState(active);
  if (seenActive !== active) {
    setPrevActive(seenActive);
    setSeenActive(active);
  }
  const seam = Math.floor(n / 2);

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

  // Paint the current drag frame: every card sits at its resting offset minus the
  // live drag fraction, so the whole deck slides with the finger. Runs inside rAF
  // and writes straight to the DOM — no React render per move.
  const paintDrag = useCallback(() => {
    const drag = dragRef.current;
    if (!drag) return;
    drag.raf = null;
    for (let i = 0; i < drag.baseOffsets.length; i++) {
      const node = cardNodesRef.current[i];
      if (!node) continue;
      const v = drag.baseOffsets[i] - drag.frac;
      node.style.transform = mobileTransform(v);
      node.style.opacity = String(mobileOpacity(v));
    }
  }, []);

  const onTouchStart = useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      // A new gesture cancels any pending hand-back-to-React cleanup from the last one.
      if (cleanupTimerRef.current != null) {
        window.clearTimeout(cleanupTimerRef.current);
        cleanupTimerRef.current = null;
      }
      const touch = event.touches[0];
      const stage = stageRef.current;
      // Drag is the mobile carousel's gesture only; the desktop fan uses buttons/keys.
      if (!touch || !stage || stage.clientWidth >= MOBILE_MAX_WIDTH || n <= 1) return;
      dragRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        axis: "undecided",
        baseOffsets: Array.from({ length: n }, (_, i) => signedOffset(i, active, n)),
        // How far the finger travels to advance one card. Tied to stage width so it
        // feels the same on any phone; velocity still lets a short flick advance.
        stepPx: Math.max(110, stage.clientWidth * 0.4),
        lastX: touch.clientX,
        lastT: event.timeStamp,
        prevX: touch.clientX,
        prevT: event.timeStamp,
        frac: 0,
        raf: null,
      };
    },
    [active, n],
  );

  const onTouchMove = useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      const touch = event.touches[0];
      if (!drag || !touch) return;
      const dx = touch.clientX - drag.startX;
      const dy = touch.clientY - drag.startY;

      if (drag.axis === "undecided") {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        // Vertical intent → stay out of the way and let the page scroll.
        if (Math.abs(dx) <= Math.abs(dy)) {
          drag.axis = "vertical";
          return;
        }
        drag.axis = "horizontal";
        // Enter drag mode: freeze the easing so the deck tracks the finger 1:1, and
        // promote each card to its own layer for the duration of the gesture.
        for (let i = 0; i < cardNodesRef.current.length; i++) {
          const node = cardNodesRef.current[i];
          if (!node) continue;
          node.style.transition = "none";
          node.style.willChange = "transform, opacity";
        }
      }
      if (drag.axis !== "horizontal") return;

      drag.prevX = drag.lastX;
      drag.prevT = drag.lastT;
      drag.lastX = touch.clientX;
      drag.lastT = event.timeStamp;
      drag.frac = -dx / drag.stepPx; // drag left → positive → advance toward next
      if (drag.raf == null) drag.raf = requestAnimationFrame(paintDrag);
    },
    [paintDrag],
  );

  const onTouchEnd = useCallback(() => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag) return;
    if (drag.raf != null) cancelAnimationFrame(drag.raf);
    if (drag.axis !== "horizontal") return; // a tap or a scroll — let the click run

    // Project release velocity into card units, add it to the dragged distance, and
    // snap to the nearest whole card (a hard flick may skip up to DRAG_MAX_STEP).
    const dt = Math.max(1, drag.lastT - drag.prevT);
    const velFrac = ((-(drag.lastX - drag.prevX) / dt) * DRAG_VELOCITY_MS) / drag.stepPx;
    let step = Math.round(drag.frac + velFrac);
    step = Math.max(-DRAG_MAX_STEP, Math.min(DRAG_MAX_STEP, step));
    const target = (((active + step) % n) + n) % n;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const stage = stageRef.current;
    const fromFrac = drag.frac;
    for (let i = 0; i < n; i++) {
      const node = cardNodesRef.current[i];
      if (!node) continue;
      // 1) Pin the exact spot the finger left this card, with no easing…
      node.style.transition = "none";
      node.style.transform = mobileTransform(drag.baseOffsets[i] - fromFrac);
      node.style.opacity = String(mobileOpacity(drag.baseOffsets[i] - fromFrac));
    }
    // …force one reflow so the browser registers that start pose…
    if (stage) void stage.offsetHeight;
    for (let i = 0; i < n; i++) {
      const node = cardNodesRef.current[i];
      if (!node) continue;
      // 2) …then ease to the settled pose. The card that wraps across the back of
      // the ring snaps (0ms) instead of sliding the full width of the deck.
      // Reduced-motion users get an instant snap, matching the global a11y contract.
      const settled = signedOffset(i, target, n);
      const wrapped = Math.abs(settled - drag.baseOffsets[i]) > seam;
      node.style.transition = reduce
        ? "none"
        : `transform ${wrapped ? "0ms" : "430ms cubic-bezier(0.22, 0.61, 0.36, 1)"}, opacity 280ms ease-out`;
      node.style.transform = mobileTransform(settled);
      node.style.opacity = String(mobileOpacity(settled));
    }

    // A horizontal gesture must never also fire the poster's navigation click.
    suppressClickRef.current = true;
    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 400);

    if (step !== 0) setActive(target);

    // Once settled, hand styling back to React (inline values already equal the
    // className pose, so this is seamless) so a later resize re-poses correctly.
    cleanupTimerRef.current = window.setTimeout(() => {
      cleanupTimerRef.current = null;
      for (let i = 0; i < cardNodesRef.current.length; i++) {
        const node = cardNodesRef.current[i];
        if (!node) continue;
        node.style.transition = "";
        node.style.transform = "";
        node.style.opacity = "";
        node.style.willChange = "";
      }
    }, 480);
  }, [active, n, seam]);

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
        aria-label="Popular this week — poster deck. Swipe left or right on mobile."
        tabIndex={0}
        onKeyDown={onKeyDown}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
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
          // Kill the grey tap-flash and text/image selection so a drag feels native.
          WebkitTapHighlightColor: "transparent",
          userSelect: "none",
          WebkitUserSelect: "none",
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
          const mobileShown = abs <= MOBILE_VISIBLE_WINDOW;
          const reachable = fanShown;
          // Did this card just jump across the back of the ring (e.g. +3 → −3)?
          // A normal step moves an offset by 1; only a wrap changes it by more
          // than half the ring. Such a card must snap to its new edge instantly
          // instead of sliding the full width of the deck behind the centre.
          const wrapped = Math.abs(offset - signedOffset(i, prevActive, n)) > seam;

          return (
            <Box
              key={`${item.mediaType}-${item.id}`}
              ref={(el: HTMLElement | null) => {
                cardNodesRef.current[i] = el;
              }}
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
                width: { xs: "min(244px, calc(100% - 88px))", sm: 268, md: 284 },
                textDecoration: "none",
                transformOrigin: { xs: "center top", md: "center center" },
                transform: { xs: mobileTransform(offset), md: fanTransform(offset) },
                // The seam (abs 3) is a transparent staging buffer on both layouts:
                // it stays mounted so the next poster is already decoded, but it is
                // never painted, so the card that wraps across it can never be seen
                // crossing the deck.
                opacity: {
                  xs: mobileOpacity(offset),
                  md: abs === 0 ? 1 : abs === 1 ? 0.94 : abs === 2 ? 0.74 : 0,
                },
                zIndex: { xs: 30 - abs, md: 30 - abs },
                pointerEvents: { xs: mobileShown ? "auto" : "none", md: fanShown ? "auto" : "none" },
                // The card that wrapped this step gets a 0ms transform (it snaps to
                // its new edge instead of sliding the whole width of the deck — the
                // old "late pop" from one side to the other). Opacity always eases,
                // so it still fades in/out gently at the edge. Mobile keeps a snappy
                // slide for the cards that are genuinely moving; desktop, the longer
                // coverflow glide.
                transition: {
                  xs: `transform ${wrapped ? "0ms" : "430ms cubic-bezier(0.22, 0.61, 0.36, 1)"}, opacity 280ms ease-out`,
                  md: `transform ${wrapped ? "0ms" : "600ms cubic-bezier(0.4, 0, 0.2, 1)"}, opacity 600ms cubic-bezier(0.4, 0, 0.2, 1)`,
                },
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
                    loading="eager"
                    priority={abs <= WINDOW}
                    draggable={false}
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
              // Reserve the full two-line height on mobile so a short title doesn't
              // collapse the caption — keeps the pager + actions below it from
              // jumping every time the deck advances to a title of a different length.
              minHeight: { xs: "calc(2 * 1.03em)", sm: "auto" },
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

        {/* Mobile pager — deliberately OUTSIDE the keyed/reveal-up block above so
            it doesn't remount on every advance. Kept here, the active pip glides
            between positions and sits at a fixed offset instead of jumping around
            as the title above it grows and shrinks between titles. */}
        <Box
          aria-hidden
          sx={{
            display: { xs: "flex", sm: "none" },
            alignItems: "center",
            gap: 1,
            width: "100%",
          }}
        >
          <ChevronLeftIcon sx={{ fontSize: 16, color: "text.secondary", opacity: 0.72 }} />
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.75,
            }}
          >
            {deck.map((item, i) => {
              const isCurrent = i === active;
              return (
                <Box
                  key={`pager-${item.mediaType}-${item.id}`}
                  sx={{
                    width: isCurrent ? 18 : 5,
                    height: 5,
                    borderRadius: 999,
                    bgcolor: isCurrent ? "primary.main" : "divider",
                    transition:
                      "width 260ms cubic-bezier(0.4, 0, 0.2, 1), background-color 260ms ease, opacity 260ms ease",
                    opacity: isCurrent ? 1 : 0.9,
                  }}
                />
              );
            })}
          </Box>
          <ChevronRightIcon sx={{ fontSize: 16, color: "text.secondary", opacity: 0.72 }} />
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
