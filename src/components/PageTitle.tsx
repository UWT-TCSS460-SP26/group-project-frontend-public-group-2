import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

interface PageTitleProps {
  title: string;
  subtitle?: string;
}

export function PageTitle({ title, subtitle }: PageTitleProps) {
  return (
    <Box sx={{ mb: { xs: 4, md: 6 } }}>
      <Typography
        variant="h1"
        sx={{
          fontSize: { xs: "2.5rem", md: "3.5rem" },
          lineHeight: 1.05,
        }}
      >
        {title}
      </Typography>
      {subtitle && (
        <Typography
          sx={{
            mt: 1.5,
            color: "text.secondary",
            fontSize: { xs: "0.95rem", md: "1.05rem" },
          }}
        >
          {subtitle}
        </Typography>
      )}
    </Box>
  );
}
