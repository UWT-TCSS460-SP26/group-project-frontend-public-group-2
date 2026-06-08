import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import { CardSkeleton, PageContainer } from "@/components";

export default function BrowseLoading() {
  return (
    <PageContainer>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) minmax(360px, 0.72fr)" },
          gap: { xs: 3, md: 6 },
          alignItems: "end",
          pb: { xs: 4, md: 5 },
          mb: { xs: 3, md: 4 },
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box>
          <Skeleton width={92} height={18} />
          <Skeleton width="88%" height={72} sx={{ mt: 1 }} />
          <Skeleton width="70%" height={28} sx={{ mt: 1 }} />
        </Box>
        <Skeleton variant="rectangular" height={112} />
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: { xs: 3, md: 4 },
        }}
      >
        <Skeleton variant="rectangular" width={224} height={40} />
        <Box sx={{ display: { xs: "none", sm: "block" }, textAlign: "right" }}>
          <Skeleton width={180} height={30} />
          <Skeleton width={110} height={18} sx={{ ml: "auto" }} />
        </Box>
      </Box>

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
        }}
      >
        {Array.from({ length: 20 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </Box>
    </PageContainer>
  );
}
