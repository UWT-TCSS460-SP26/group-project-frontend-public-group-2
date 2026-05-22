import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

interface ErrorStateProps {
  message?: string;
  detail?: string;
}

export function ErrorState({
  message = "Something went wrong.",
  detail,
}: ErrorStateProps) {
  return (
    <Box
      sx={{
        py: { xs: 6, md: 10 },
        textAlign: "center",
      }}
    >
      <Typography
        variant="h5"
        sx={{ color: "primary.main", fontStyle: "italic" }}
      >
        {message}
      </Typography>
      {detail && (
        <Typography
          sx={{ mt: 1, fontSize: "0.9rem", color: "text.secondary" }}
        >
          {detail}
        </Typography>
      )}
    </Box>
  );
}
