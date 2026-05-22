import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";

export function LoadingState({ message }: { message?: string }) {
  return (
    <Box
      sx={{
        py: { xs: 6, md: 10 },
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        color: "text.secondary",
      }}
    >
      <CircularProgress size={24} color="primary" />
      {message && (
        <Typography sx={{ fontSize: "0.9rem" }}>{message}</Typography>
      )}
    </Box>
  );
}
