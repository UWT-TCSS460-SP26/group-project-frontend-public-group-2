import { LoadingState, PageContainer } from "@/components";

export default function TitleDetailLoading() {
  return (
    <PageContainer>
      <LoadingState message="Loading title details..." />
    </PageContainer>
  );
}
