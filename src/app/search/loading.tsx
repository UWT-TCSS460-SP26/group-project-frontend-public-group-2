import Box from "@mui/material/Box";
import { CardSkeleton, PageContainer } from "@/components";

export default function SearchLoading() {
  return (
    <PageContainer>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, 1fr)",
            sm: "repeat(3, 1fr)",
            md: "repeat(5, 1fr)",
            lg: "repeat(6, 1fr)",
          },
          gap: { xs: 2, md: 3 },
          mt: 8,
        }}
      >
        {Array.from({ length: 10 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </Box>
    </PageContainer>
  );
}
