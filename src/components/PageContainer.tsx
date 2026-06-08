import Box from "@mui/material/Box";

export function PageContainer({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        maxWidth: 1280,
        mx: "auto",
        width: "100%",
        minWidth: 0,
        px: { xs: 2, sm: 3, md: 6 },
        py: { xs: 4, md: 6 },
      }}
    >
      {children}
    </Box>
  );
}
