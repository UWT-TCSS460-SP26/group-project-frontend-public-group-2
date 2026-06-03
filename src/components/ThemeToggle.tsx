"use client";

import { useSyncExternalStore } from "react";
import { useColorScheme } from "@mui/material/styles";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";

// Hydration guard without setState-in-effect: returns false on the server and the
// first client render (matching SSR), then true. Avoids a hydration mismatch since
// `useColorScheme`'s `mode` is undefined until mounted.
const emptySubscribe = () => () => {};
function useHydrated() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

/**
 * Light/dark switch built on MUI's `useColorScheme` (the choice persists
 * automatically via the same storage key InitColorSchemeScript reads, so there's
 * no flash on reload).
 */
export function ThemeToggle() {
  const { mode, systemMode, setMode } = useColorScheme();
  const hydrated = useHydrated();

  const iconSx = {
    color: "text.secondary",
    "&:hover": { color: "text.primary", backgroundColor: "transparent" },
  };

  if (!hydrated) {
    // Reserve the footprint to avoid layout shift before hydration.
    return (
      <IconButton size="small" aria-label="Toggle color scheme" disabled sx={iconSx}>
        <DarkModeOutlinedIcon fontSize="small" />
      </IconButton>
    );
  }

  const resolved = mode === "system" ? systemMode : mode;
  const isDark = resolved === "dark";

  return (
    <Tooltip title={isDark ? "Switch to light" : "Switch to dark"}>
      <IconButton
        size="small"
        onClick={() => setMode(isDark ? "light" : "dark")}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        sx={iconSx}
      >
        {isDark ? (
          <LightModeOutlinedIcon fontSize="small" />
        ) : (
          <DarkModeOutlinedIcon fontSize="small" />
        )}
      </IconButton>
    </Tooltip>
  );
}
