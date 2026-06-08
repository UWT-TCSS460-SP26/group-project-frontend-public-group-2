import { createTheme } from "@mui/material/styles";

/**
 * Single source of truth for the app's visual identity — "Repertory, evolved":
 * a warm, editorial cinema look. Dark (cinema) is the default first impression;
 * light (gallery) is the alternate. Both schemes share one typography scale, spacing,
 * shape, and component vocabulary — only the palette changes between them.
 *
 * We use MUI's CSS-variables / `colorSchemes` API (`colorSchemeSelector: "class"`)
 * so a single class on <html> swaps the whole app with no flash. The shell wiring
 * (InitColorSchemeScript, ThemeProvider defaultMode, the toggle) lands in RU-2.
 *
 * Brand accent: deep emerald (`#1E7A5A` light / mint `#3FB488` dark). Title pages
 * additionally adopt each poster's own color at runtime (per-title accent, RU/JO).
 *
 * Conventions (see CLAUDE.md): no hardcoded hex in components — reference these
 * tokens via `sx`. Buttons: contained = primary, outlined = secondary, text = tertiary.
 */

// ── Color tokens ────────────────────────────────────────────────────────────
// Contrast-tuned to clear WCAG AA for body/large text in both schemes. Emerald
// clears AA as a fill (with white text) and for large text/icons; for SMALL accent
// text/links use `primary.dark` (a deeper emerald) in light mode.

const lightPalette = {
  background: {
    default: "#F3EFE7", // warm bone paper — never stark white (editorial warmth)
    paper: "#FCFAF4",
  },
  text: {
    primary: "#17140F", // deep ink
    secondary: "#6B6253", // muted ink for meta/mono labels
  },
  primary: {
    main: "#1E7A5A", // deep emerald (fills, large accents)
    dark: "#155C44", // deeper emerald for SMALL accent text/links (AA on bone)
    contrastText: "#FFFFFF",
  },
  secondary: {
    main: "#2E5BD6", // cobalt — a cool counterpoint, used sparingly
    contrastText: "#FFFFFF",
  },
  error: { main: "#B23B32" },
  success: { main: "#2E6B45" },
  warning: { main: "#B5852A" },
  info: { main: "#2E5BD6" },
  divider: "rgba(23, 20, 15, 0.12)",
};

const darkPalette = {
  background: {
    default: "#100D0A", // warm near-black (cinema)
    paper: "#1A1611",
  },
  text: {
    primary: "#EDE7DA", // warm cream
    secondary: "#9A9181", // muted sand
  },
  primary: {
    main: "#3FB488", // mint-emerald (brighter for contrast on dark)
    contrastText: "#0D0B08",
  },
  secondary: {
    main: "#6E8CFF", // cobalt, lightened for dark
    contrastText: "#0D0B08",
  },
  error: { main: "#E0796F" },
  success: { main: "#5FB07E" },
  warning: { main: "#E0B84D" },
  info: { main: "#6E8CFF" },
  divider: "rgba(237, 231, 218, 0.10)",
};

// ── Theme ───────────────────────────────────────────────────────────────────

export const theme = createTheme({
  cssVariables: {
    // Swap schemes by toggling a class on <html>; matches InitColorSchemeScript (RU-2).
    colorSchemeSelector: "class",
  },
  // Dark (cinema) is the brand's first impression; the toggle lets users switch.
  defaultColorScheme: "dark",
  colorSchemes: {
    light: { palette: lightPalette },
    dark: { palette: darkPalette },
  },
  typography: {
    fontFamily: "var(--font-inter), system-ui, sans-serif",
    h1: {
      fontFamily: "var(--font-fraunces), Georgia, serif",
      fontWeight: 500,
      letterSpacing: "-0.02em",
      lineHeight: 1.02,
    },
    h2: {
      fontFamily: "var(--font-fraunces), Georgia, serif",
      fontWeight: 500,
      letterSpacing: "-0.015em",
      lineHeight: 1.1,
    },
    h3: {
      fontFamily: "var(--font-fraunces), Georgia, serif",
      fontWeight: 500,
      letterSpacing: "-0.01em",
    },
    h4: {
      fontFamily: "var(--font-fraunces), Georgia, serif",
      fontWeight: 500,
    },
    h5: {
      fontFamily: "var(--font-fraunces), Georgia, serif",
      fontWeight: 500,
    },
    h6: {
      fontFamily: "var(--font-fraunces), Georgia, serif",
      fontWeight: 500,
    },
    overline: {
      fontSize: "0.7rem",
      fontWeight: 600,
      letterSpacing: "0.18em",
      textTransform: "uppercase",
      lineHeight: 1,
    },
  },
  shape: {
    borderRadius: 6,
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 500,
          letterSpacing: "0.01em",
        },
      },
    },
    MuiAppBar: {
      defaultProps: {
        elevation: 0,
        color: "transparent",
      },
      styleOverrides: {
        // Mode-aware glass: a translucent layer of the current surface color, so it
        // reads correctly in both schemes. The CSS vars are regenerated per scheme.
        root: {
          backgroundColor:
            "color-mix(in srgb, var(--mui-palette-background-default) 82%, transparent)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          borderBottom: "1px solid var(--mui-palette-divider)",
        },
      },
    },
  },
});
