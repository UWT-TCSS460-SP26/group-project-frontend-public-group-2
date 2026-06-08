/**
 * Per-title dynamic accent (JO-2). Extracts a luminance-clamped dominant color
 * from a title's poster so each detail view feels bespoke, while staying legible
 * in both color schemes.
 *
 * Used by <TitleColorScope> (client) to set the `--title-accent` CSS variable on
 * the detail page. The variable defaults to the theme's emerald/mint primary
 * (`var(--mui-palette-primary-main)`) so the fallback automatically tracks light
 * vs. dark; we only override it once a clamped poster color is available.
 *
 * Everything here is DOM-only and meant to run client-side, off the critical
 * path. It degrades gracefully: a missing/grayscale poster, a CORS-tainted
 * canvas, or any failure resolves to `null`, leaving the emerald fallback intact.
 *
 * NEVER apply the accent to body text — it's tuned for fills, hairline rules,
 * icons, borders, and hovers (large/non-text affordances), not paragraph copy.
 */

/** CSS custom property the detail page reads for its per-title accent. */
export const TITLE_ACCENT_VAR = "--title-accent";

/** Default value for the accent variable: the mode-aware brand emerald/mint. */
export const TITLE_ACCENT_FALLBACK = "var(--mui-palette-primary-main)";

interface Rgb {
  r: number;
  g: number;
  b: number;
}

interface Hsl {
  h: number; // 0–360
  s: number; // 0–1
  l: number; // 0–1
}

// Legibility band. The accent fills CTAs/badges/rules in BOTH schemes (MUI flips
// the contained-button text between white in light and near-black in dark), so
// we pin lightness to a mid range that reads acceptably either way and guarantee
// a minimum saturation so it stays a deliberate hue rather than mud. This is a
// pragmatic clamp for readability, not a per-hue WCAG-contrast guarantee.
const MIN_LIGHTNESS = 0.42;
const MAX_LIGHTNESS = 0.56;
const MIN_SATURATION = 0.4;
const MAX_SATURATION = 0.85;

function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;
  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case rn:
        h = ((gn - bn) / delta) % 6;
        break;
      case gn:
        h = (bn - rn) / delta + 2;
        break;
      default:
        h = (rn - gn) / delta + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s, l };
}

function hslToRgb({ h, s, l }: Hsl): Rgb {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

function toHex({ r, g, b }: Rgb): string {
  const hex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

/**
 * Clamp an extracted color into the legible accent band (see the band constants
 * above). Returns a hex string. A pure transform, exported so it can be reused
 * (e.g. a styleguide swatch) or exercised in isolation without the DOM/canvas.
 */
export function clampAccent(rgb: Rgb): string {
  const hsl = rgbToHsl(rgb);
  const clamped: Hsl = {
    h: hsl.h,
    s: Math.min(MAX_SATURATION, Math.max(MIN_SATURATION, hsl.s)),
    l: Math.min(MAX_LIGHTNESS, Math.max(MIN_LIGHTNESS, hsl.l)),
  };
  return toHex(hslToRgb(clamped));
}

// Downscaled sample target — a tiny canvas keeps pixel reads cheap (a few
// thousand samples) so extraction stays off the critical path.
const SAMPLE_WIDTH = 48;
// Hue buckets (15° each) for a cheap saturation-weighted dominant-hue vote.
const HUE_BUCKETS = 24;
// Pixels outside these bounds are skipped as background/letterboxing/glare so
// they don't drag the dominant hue toward black, white, or gray. Kept lenient on
// the dark end: movie posters are mostly dark/moody, and clipping that too early
// is what left most titles on the emerald fallback instead of their own hue.
const MIN_ALPHA = 125;
const SKIP_DARK = 0.06;
const SKIP_LIGHT = 0.96;
const SKIP_GRAY = 0.12;

/**
 * Sample a loaded image and return its saturation-weighted dominant color, or
 * `null` if the poster is effectively grayscale (so the caller keeps emerald).
 */
function dominantColor(img: HTMLImageElement): Rgb | null {
  const naturalW = img.naturalWidth || img.width;
  const naturalH = img.naturalHeight || img.height;
  if (!naturalW || !naturalH) return null;

  const width = Math.min(SAMPLE_WIDTH, naturalW);
  const height = Math.max(1, Math.round((naturalH / naturalW) * width));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  ctx.drawImage(img, 0, 0, width, height);

  let data: Uint8ClampedArray;
  try {
    // A CORS-tainted poster throws here — return null and keep the fallback.
    data = ctx.getImageData(0, 0, width, height).data;
  } catch {
    return null;
  }

  const buckets = Array.from({ length: HUE_BUCKETS }, () => ({
    weight: 0,
    r: 0,
    g: 0,
    b: 0,
  }));

  // Secondary pool: every in-gamut pixel (muted ones included, with a small
  // weight floor). When no vivid hue clearly wins, this average — re-saturated by
  // the clamp — still gives a moody poster its own tint instead of the fallback.
  let poolWeight = 0;
  let poolR = 0;
  let poolG = 0;
  let poolB = 0;

  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < MIN_ALPHA) continue;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const { h, s, l } = rgbToHsl({ r, g, b });
    // Drop only true letterboxing/glare here so muted pixels still feed the pool.
    if (l < SKIP_DARK || l > SKIP_LIGHT) continue;

    const poolW = s + 0.05;
    poolWeight += poolW;
    poolR += r * poolW;
    poolG += g * poolW;
    poolB += b * poolW;

    if (s < SKIP_GRAY) continue;

    const bucket = buckets[Math.min(HUE_BUCKETS - 1, Math.floor(h / (360 / HUE_BUCKETS)))];
    // Weight by saturation so vivid pixels (the title's "color") win over
    // washed-out ones; accumulate raw rgb to average the winning bucket.
    const weight = s;
    bucket.weight += weight;
    bucket.r += r * weight;
    bucket.g += g * weight;
    bucket.b += b * weight;
  }

  let best = buckets[0];
  for (const bucket of buckets) {
    if (bucket.weight > best.weight) best = bucket;
  }
  if (best.weight > 0) {
    return {
      r: Math.round(best.r / best.weight),
      g: Math.round(best.g / best.weight),
      b: Math.round(best.b / best.weight),
    };
  }

  // No vivid hue won the vote — re-saturate the overall average so the title
  // still gets a bespoke accent. Only a fully transparent sample yields null.
  if (poolWeight > 0) {
    return {
      r: Math.round(poolR / poolWeight),
      g: Math.round(poolG / poolWeight),
      b: Math.round(poolB / poolWeight),
    };
  }
  return null;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    // Anonymous CORS lets us read canvas pixels from the TMDB CDN; if the
    // request can't satisfy CORS the canvas taints and we fall back cleanly.
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/**
 * Load a poster and resolve to a legible, clamped hex accent — or `null` to keep
 * the emerald fallback. One-time per detail view; callers should run it off the
 * critical path (e.g. requestIdleCallback) so it never blocks interaction.
 */
export async function extractTitleAccent(src: string): Promise<string | null> {
  if (!src) return null;
  const img = await loadImage(src);
  if (!img) return null;
  const rgb = dominantColor(img);
  return rgb ? clampAccent(rgb) : null;
}

/**
 * The accent value as a CSS expression with a built-in fallback to the brand
 * emerald/mint. Using `var(--title-accent, …)` means that even if the
 * `--title-accent` custom property was never set (e.g. a component rendered
 * outside <TitleColorScope>, extraction failed, or the var didn't inherit for
 * any reason), the affordance still resolves to the standard green token.
 */
export const TITLE_ACCENT = "var(--title-accent, var(--mui-palette-primary-main))";

/** A darkened accent for hover fills (accent mixed toward black). */
const TITLE_ACCENT_HOVER = `color-mix(in srgb, ${TITLE_ACCENT} 86%, var(--mui-palette-common-black))`;

/** MUI `sx` for a contained CTA inside a <TitleColorScope>. */
export const titleAccentButtonSx = {
  bgcolor: TITLE_ACCENT,
  "&:hover": {
    bgcolor: TITLE_ACCENT_HOVER,
  },
};

/** MUI `sx` for a Rating widget inside a <TitleColorScope>. */
export const titleAccentRatingSx = {
  "& .MuiRating-iconFilled": { color: TITLE_ACCENT },
  "& .MuiRating-iconHover": { color: TITLE_ACCENT },
};

/**
 * MUI `sx` for outlined TextField(s) inside a <TitleColorScope>: the focused
 * outline + floating label adopt the accent. The error state is left to MUI's
 * red so validation feedback isn't masked (`:not(.Mui-error)`).
 */
export const titleAccentTextFieldSx = {
  "& .MuiOutlinedInput-root.Mui-focused:not(.Mui-error) .MuiOutlinedInput-notchedOutline":
    { borderColor: TITLE_ACCENT },
  "& .MuiInputLabel-root.Mui-focused:not(.Mui-error)": { color: TITLE_ACCENT },
};
