import type { Metadata } from "next";
import { EmptyState, PageContainer, PageTitle } from "@/components";

export const metadata: Metadata = { title: "Browse — Group 2" };

// Placeholder so the nav link resolves; the real Movies / TV browse (with tabs and
// pagination) lands in Collins's lane (CO-1).
export default function BrowsePage() {
  return (
    <PageContainer>
      <PageTitle title="Browse" subtitle="Movies and TV." />
      <EmptyState
        message="Browse is on the way."
        detail="A full Movies / TV catalog with tabs and pagination lands here shortly."
      />
    </PageContainer>
  );
}
