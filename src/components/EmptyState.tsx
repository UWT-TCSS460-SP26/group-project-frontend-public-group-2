import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

interface EmptyStateProps {
  message?: string;
  detail?: string;
}

export function EmptyState({
  message = "Nothing here yet.",
  detail,
}: EmptyStateProps) {
  return (
    <Box
      sx={{
        py: { xs: 6, md: 10 },
        textAlign: "center",
        color: "text.secondary",
      }}
    >
      <Typography
        variant="h5"
        sx={{ fontStyle: "italic", color: "text.secondary" }}
      >
        {message}
      </Typography>
      {detail && (
        <Typography sx={{ mt: 1, fontSize: "0.9rem" }}>{detail}</Typography>
      )}
    </Box>
  );
}
