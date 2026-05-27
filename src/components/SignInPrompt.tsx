"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { signIn } from "next-auth/react";

interface SignInPromptProps {
  /** Verb phrase for the prompt, e.g. "rate this title" → "Sign in to rate this title." */
  action?: string;
  /** Full override of the prompt text. Wins over `action`. */
  message?: string;
}

/**
 * The inert write affordance shown to signed-out visitors anywhere a rate /
 * review control would otherwise appear (Sprint 7, Story 5). It is a clearly
 * labeled, keyboard-reachable sign-in prompt — never a disabled mystery button
 * and never a control that 401s.
 *
 * Gating is the caller's job: render this when the visitor is signed out
 * (server-side `auth()` check, or client `useSession()`), and the real control
 * when signed in.
 */
export function SignInPrompt({ action = "do that", message }: SignInPromptProps) {
  const label = message ?? `Sign in to ${action}.`;

  return (
    <Box
      role="note"
      aria-label={label}
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 1.5,
        p: 2,
        border: "1px dashed",
        borderColor: "divider",
        borderRadius: 1,
        bgcolor: "background.paper",
      }}
    >
      <Typography sx={{ color: "text.secondary" }}>{label}</Typography>
      <Button
        variant="contained"
        color="primary"
        size="small"
        onClick={() => signIn("tcss460")}
      >
        Sign in
      </Button>
    </Box>
  );
}
