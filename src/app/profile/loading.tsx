import { LoadingState, PageContainer } from "@/components";

export default function ProfileLoading() {
  return (
    <PageContainer>
      <LoadingState message="Loading your profile..." />
    </PageContainer>
  );
}
