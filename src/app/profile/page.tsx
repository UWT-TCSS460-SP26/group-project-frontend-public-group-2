import type { Metadata } from "next";
import { auth } from "@/auth";
import { EmptyState, PageContainer, PageTitle, SignInPrompt } from "@/components";
import { getMyRatings } from "@/lib/actions/ratings";
import { getMyReviews } from "@/lib/actions/reviews";
import { ProfileRows } from "./ProfileRows";

export const metadata: Metadata = { title: "Profile - Group 2" };

// Group 1 caps GET /reviews/me at limit=50 per the OpenAPI spec.
const REVIEW_LIMIT = 50;

export default async function ProfilePage() {
  const session = await auth();
  const canReadProfile = Boolean(session?.user && session?.accessToken);

  if (!canReadProfile) {
    return (
      <PageContainer>
        <PageTitle
          title="Profile"
          subtitle="Sign in to see everything you have rated and reviewed."
        />
        <SignInPrompt action="view your profile" />
      </PageContainer>
    );
  }

  const [ratingsResult, reviewsResult] = await Promise.all([
    getMyRatings(),
    getMyReviews({ limit: REVIEW_LIMIT }),
  ]);

  const ratings = ratingsResult.ok ? ratingsResult.data : [];
  const reviews = reviewsResult.ok ? reviewsResult.data.results : [];
  const hasRatings = ratings.length > 0;
  const hasReviews = reviews.length > 0;

  return (
    <PageContainer>
      <PageTitle
        title="Profile"
        subtitle="Everything you have rated and reviewed."
      />

      {!hasRatings && !hasReviews && ratingsResult.ok && reviewsResult.ok ? (
        <EmptyState
          message="You haven't rated or reviewed anything yet."
          detail="Your ratings and reviews will appear here after you add them."
        />
      ) : (
        <ProfileRows
          ratings={ratings}
          reviews={reviews}
          ratingsError={ratingsResult.ok ? undefined : ratingsResult.error.message}
          reviewsError={reviewsResult.ok ? undefined : reviewsResult.error.message}
        />
      )}
    </PageContainer>
  );
}
