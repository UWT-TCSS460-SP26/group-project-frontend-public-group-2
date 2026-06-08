"use client";

import { useState } from "react";
import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import ShareRoundedIcon from "@mui/icons-material/ShareRounded";
import { SITE_NAME } from "@/lib/brand";

interface ShareButtonProps {
  title: string;
}

export function ShareButton({ title }: ShareButtonProps) {
  const [message, setMessage] = useState("");

  async function share() {
    const url = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({ title, text: `View ${title} on ${SITE_NAME}`, url });
        setMessage("Shared.");
        return;
      }

      await navigator.clipboard.writeText(url);
      setMessage("Link copied.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setMessage("Could not share this title.");
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outlined"
        size="small"
        startIcon={<ShareRoundedIcon fontSize="small" />}
        onClick={share}
        sx={{
          bgcolor: "background.paper",
          color: "text.primary",
          borderColor: "divider",
          "&:hover": {
            bgcolor: "background.paper",
            borderColor: "primary.main",
          },
        }}
      >
        Share
      </Button>
      <Snackbar
        open={Boolean(message)}
        autoHideDuration={3000}
        onClose={() => setMessage("")}
        message={message}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        slotProps={{ content: { role: "status", "aria-live": "polite" } }}
      />
    </>
  );
}
