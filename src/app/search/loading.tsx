import { PageContainer, LoadingState } from "@/components";

export default function SearchLoading() {
  return (
    <PageContainer>
      <LoadingState message="Searching…" />
    </PageContainer>
  );
}
