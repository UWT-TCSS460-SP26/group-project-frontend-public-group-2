"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useSession } from "next-auth/react";
import {
  findMyAuthorId,
  findMyReviewForTitle,
} from "@/lib/find-my-review";
import type { MediaType } from "@/types/media";

/** Review shape from the enriched detail payload (and our normalized list). */
export interface DisplayReview {
  id: number;
  title?: string;
  description?: string;
  /** Some enriched payloads may still expose `body`. */
  body?: string;
  createdAt?: string;
  updatedAt?: string;
  author?: {
    id?: number;
    displayName?: string;
  };
}

export interface ReviewsProviderProps {
  /** Initial reviews from the server-rendered enriched payload. */
  reviews: unknown[];
  tmdbId: string;
  mediaType: MediaType;
  children: ReactNode;
}

export interface ReviewFormHandlers {
  onEditReview: (review: DisplayReview) => void;
  onReviewDeleted: (reviewId: number) => void;
}

interface ReviewsContextValue {
  reviews: DisplayReview[];
  tmdbId: string;
  mediaType: MediaType;
  myAuthorId: number | null;
  myReviewId: number | null;
  loadingOwnership: boolean;
  registerReviewFormHandlers: (handlers: ReviewFormHandlers) => void;
  unregisterReviewFormHandlers: () => void;
  requestEditReview: (review: DisplayReview) => void;
  notifyReviewDeleted: (reviewId: number) => void;
  isOwnReview: (review: DisplayReview) => boolean;
}

const ReviewsContext = createContext<ReviewsContextValue | null>(null);

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

export function normalizeDisplayReview(raw: unknown): DisplayReview | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;

  const record = raw as Record<string, unknown>;
  const id = asNumber(record.id);
  if (id === undefined) return null;

  const authorRecord =
    record.author &&
    typeof record.author === "object" &&
    !Array.isArray(record.author)
      ? (record.author as Record<string, unknown>)
      : null;

  return {
    id,
    title: asString(record.title),
    description: asString(record.description),
    body: asString(record.body),
    createdAt: asString(record.createdAt),
    updatedAt: asString(record.updatedAt),
    author: authorRecord
      ? {
          id: asNumber(authorRecord.id),
          displayName: asString(authorRecord.displayName),
        }
      : undefined,
  };
}

export function normalizeDisplayReviews(raw: unknown[]): DisplayReview[] {
  return raw
    .map(normalizeDisplayReview)
    .filter((review): review is DisplayReview => review !== null);
}

interface OwnershipState {
  myAuthorId: number | null;
  myReviewId: number | null;
  loading: boolean;
}

const EMPTY_OWNERSHIP: OwnershipState = {
  myAuthorId: null,
  myReviewId: null,
  loading: false,
};

/**
 * Shared state for {@link ReviewList} and {@link ReviewForm} on the title detail
 * page. Syncs server-provided reviews after `router.refresh()` and coordinates
 * list-initiated edit mode on the form.
 */
export function ReviewsProvider({
  reviews: initialReviews,
  tmdbId,
  mediaType,
  children,
}: ReviewsProviderProps) {
  const { status: sessionStatus } = useSession();
  const isAuthenticated = sessionStatus === "authenticated";
  const formHandlersRef = useRef<ReviewFormHandlers | null>(null);

  const serverReviews = useMemo(
    () => normalizeDisplayReviews(initialReviews),
    [initialReviews],
  );

  const reviewsFingerprint = useMemo(
    () => serverReviews.map((review) => review.id).join(","),
    [serverReviews],
  );

  const [optimisticRemovedIds, setOptimisticRemovedIds] = useState<number[]>([]);
  const [ownership, setOwnership] = useState<OwnershipState>(EMPTY_OWNERSHIP);

  const reviews = useMemo(() => {
    const serverIdSet = new Set(serverReviews.map((review) => review.id));
    const pendingRemovals = optimisticRemovedIds.filter((id) =>
      serverIdSet.has(id),
    );
    return serverReviews.filter(
      (review) => !pendingRemovals.includes(review.id),
    );
  }, [optimisticRemovedIds, serverReviews]);

  const myAuthorId = isAuthenticated ? ownership.myAuthorId : null;
  const loadingOwnership = isAuthenticated ? ownership.loading : false;

  const myReviewId = useMemo(() => {
    if (!isAuthenticated) return null;
    if (ownership.myReviewId !== null) return ownership.myReviewId;
    if (ownership.myAuthorId === null) return null;
    return (
      reviews.find((review) => review.author?.id === ownership.myAuthorId)?.id ??
      null
    );
  }, [isAuthenticated, ownership.myAuthorId, ownership.myReviewId, reviews]);

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    (async () => {
      setOwnership((current) => ({ ...current, loading: true }));

      const mine = await findMyReviewForTitle(tmdbId, mediaType);
      if (cancelled) return;

      if (mine) {
        setOwnership({
          myAuthorId: mine.author.id,
          myReviewId: mine.id,
          loading: false,
        });
        return;
      }

      setOwnership({
        myAuthorId: await findMyAuthorId(),
        myReviewId: null,
        loading: false,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, mediaType, reviewsFingerprint, tmdbId]);

  const isOwnReview = useCallback(
    (review: DisplayReview) => {
      if (myReviewId !== null && review.id === myReviewId) return true;
      if (myAuthorId !== null && review.author?.id === myAuthorId) return true;
      return false;
    },
    [myAuthorId, myReviewId],
  );

  const registerReviewFormHandlers = useCallback(
    (handlers: ReviewFormHandlers) => {
      formHandlersRef.current = handlers;
    },
    [],
  );

  const unregisterReviewFormHandlers = useCallback(() => {
    formHandlersRef.current = null;
  }, []);

  const requestEditReview = useCallback((review: DisplayReview) => {
    formHandlersRef.current?.onEditReview(review);
  }, []);

  const notifyReviewDeleted = useCallback((reviewId: number) => {
    formHandlersRef.current?.onReviewDeleted(reviewId);
    setOptimisticRemovedIds((current) =>
      current.includes(reviewId) ? current : [...current, reviewId],
    );
    setOwnership((current) => ({
      ...current,
      myReviewId: current.myReviewId === reviewId ? null : current.myReviewId,
    }));
  }, []);

  const value = useMemo<ReviewsContextValue>(
    () => ({
      reviews,
      tmdbId,
      mediaType,
      myAuthorId,
      myReviewId,
      loadingOwnership,
      registerReviewFormHandlers,
      unregisterReviewFormHandlers,
      requestEditReview,
      notifyReviewDeleted,
      isOwnReview,
    }),
    [
      reviews,
      tmdbId,
      mediaType,
      myAuthorId,
      myReviewId,
      loadingOwnership,
      registerReviewFormHandlers,
      unregisterReviewFormHandlers,
      requestEditReview,
      notifyReviewDeleted,
      isOwnReview,
    ],
  );

  return (
    <ReviewsContext.Provider value={value}>{children}</ReviewsContext.Provider>
  );
}

export function useReviewsContext(): ReviewsContextValue {
  const context = useContext(ReviewsContext);
  if (!context) {
    throw new Error("useReviewsContext must be used within a ReviewsProvider");
  }
  return context;
}

export function useReviewsContextOptional(): ReviewsContextValue | null {
  return useContext(ReviewsContext);
}
