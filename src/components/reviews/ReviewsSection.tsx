import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/apiClient';
import { StarRatingDisplay } from './StarRating';
import { ReviewForm } from './ReviewForm';
import { ShieldCheck, ChevronDown, ChevronUp, Loader2, MessageSquarePlus, RefreshCw } from 'lucide-react';

// ============================================================
// Types
// ============================================================

interface ReviewSummary {
  averageRating: number | null;
  totalReviews: number;
  ratingDistribution: { 1: number; 2: number; 3: number; 4: number; 5: number };
}

interface PublicReview {
  id: string;
  productId: string;
  rating: number;
  reviewerDisplayName: string;
  title?: string | null;
  body: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
}

type SortOption = 'recent' | 'highest' | 'lowest';

// ============================================================
// Rating Distribution Bar
// ============================================================

const DistributionBar: React.FC<{
  stars: number;
  count: number;
  total: number;
}> = ({ stars, count, total }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2.5 text-[11px] font-mono">
      <span className="w-10 shrink-0 text-[#141414] font-semibold text-right">
        {stars}★
      </span>
      <div
        className="flex-1 h-1.5 bg-[#DAD8D1] rounded-full overflow-hidden"
        role="meter"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${stars} star reviews: ${count} out of ${total}`}
      >
        <div
          className="h-full bg-[#C9A84C] rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-6 shrink-0 text-[#7A7771]">{count}</span>
    </div>
  );
};

// ============================================================
// Review Card
// ============================================================

const ReviewCard: React.FC<{ review: PublicReview }> = ({ review }) => {
  const [expanded, setExpanded] = useState(false);
  const isLong = review.body.length > 280;
  const displayBody = isLong && !expanded ? review.body.slice(0, 280) + '…' : review.body;

  const dateStr = new Date(review.createdAt).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <article
      className="py-5 border-b border-[#ECEAE4] last:border-none"
      aria-label={`Review by ${review.reviewerDisplayName}`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[12.5px] font-sans font-bold text-[#141414] truncate max-w-[180px]">
              {review.reviewerDisplayName}
            </span>
            {review.isVerifiedPurchase && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full text-[9.5px] font-mono font-semibold uppercase tracking-wider shrink-0"
                title="This reviewer purchased the product"
              >
                <ShieldCheck className="w-3 h-3" />
                Verified
              </span>
            )}
          </div>
          <span className="text-[10.5px] font-mono text-[#9E9B95] mt-0.5 block">{dateStr}</span>
        </div>
        <StarRatingDisplay rating={review.rating} showCount={false} size="sm" />
      </div>

      {review.title && (
        <p className="text-[13px] font-sans font-semibold text-[#141414] mb-1">
          {review.title}
        </p>
      )}

      <p className="text-[12.5px] font-sans text-[#4A4844] leading-relaxed whitespace-pre-wrap break-words">
        {displayBody}
      </p>

      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1.5 flex items-center gap-1 text-[11px] font-sans font-semibold text-[#141414] underline-offset-2 hover:underline cursor-pointer"
          aria-expanded={expanded}
        >
          {expanded ? (
            <>Show less <ChevronUp className="w-3 h-3" /></>
          ) : (
            <>Read more <ChevronDown className="w-3 h-3" /></>
          )}
        </button>
      )}
    </article>
  );
};

// ============================================================
// Skeleton Loader
// ============================================================

const ReviewSkeleton: React.FC = () => (
  <div className="animate-pulse space-y-3 py-5 border-b border-[#ECEAE4]">
    <div className="flex gap-2 items-center">
      <div className="h-3 w-24 bg-[#E8E4DA] rounded" />
      <div className="h-3 w-16 bg-[#E8E4DA] rounded" />
    </div>
    <div className="h-3 w-full bg-[#E8E4DA] rounded" />
    <div className="h-3 w-3/4 bg-[#E8E4DA] rounded" />
  </div>
);

// ============================================================
// Main ReviewsSection Component
// ============================================================

interface ReviewsSectionProps {
  productId: string;
  productName: string;
  onReviewSubmitted?: () => void;
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({
  productId,
  productName,
  onReviewSubmitted,
}) => {
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sort, setSort] = useState<SortOption>('recent');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const LIMIT = 8;

  const fetchReviews = useCallback(
    async (targetPage: number, targetSort: SortOption, reset: boolean) => {
      if (reset) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      try {
        const result = await api.getProductReviews(productId, {
          page: targetPage,
          limit: LIMIT,
          sort: targetSort,
        });

        if (!result.success) throw new Error(result.error || 'Failed to load reviews.');

        const data = result.data;
        const newReviews: PublicReview[] = data.reviews || [];

        setReviews((prev) => (reset ? newReviews : [...prev, ...newReviews]));
        setSummary(data.summary);
        setTotalPages(data.pagination?.totalPages ?? 1);
        setPage(data.pagination?.page ?? targetPage);
      } catch (err: any) {
        setError(err.message || 'Could not load reviews at this time.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [productId]
  );

  // Initial load
  useEffect(() => {
    setPage(1);
    setReviews([]);
    setShowForm(false);
    fetchReviews(1, sort, true);
  }, [productId, sort, fetchReviews]);

  const handleSortChange = (newSort: SortOption) => {
    if (newSort === sort) return;
    setSort(newSort);
    setPage(1);
    setReviews([]);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    fetchReviews(nextPage, sort, false);
  };

  const handleReviewSuccess = () => {
    setShowForm(false);
    // Re-fetch to show updated state (review pending)
    fetchReviews(1, sort, true);
    onReviewSubmitted?.();
  };

  const hasMore = page < totalPages;
  const dist = summary?.ratingDistribution ?? { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  return (
    <section
      id="product-reviews"
      aria-label="Customer ratings and reviews"
      className="w-full pt-12 sm:pt-16 border-t border-[#DAD8D1]"
    >
      {/* Section Header */}
      <div className="mb-8">
        <span className="text-[10px] font-mono tracking-[0.22em] uppercase text-[#7A7771] block mb-1">
          CUSTOMER FEEDBACK
        </span>
        <h2 className="font-editorial text-2xl sm:text-3xl uppercase tracking-tight text-[#141414]">
          Ratings & Reviews
        </h2>
      </div>

      {/* Summary Block */}
      {loading ? (
        <div className="flex items-center gap-3 py-4" aria-busy="true" aria-label="Loading reviews">
          <Loader2 className="w-5 h-5 animate-spin text-[#7A7771]" />
          <span className="text-[12px] font-mono text-[#7A7771]">Loading reviews…</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-center gap-3 mb-6">
          <RefreshCw className="w-4 h-4 text-red-600 shrink-0" />
          <div>
            <p className="text-[12px] text-red-700 font-sans">{error}</p>
            <button
              type="button"
              onClick={() => fetchReviews(1, sort, true)}
              className="text-[11px] font-semibold text-red-800 underline mt-1 cursor-pointer"
            >
              Try again
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Rating Summary Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 p-5 bg-[#F8F6F1] border border-[#DAD8D1] rounded-xl">
            {/* Left: Average */}
            <div className="flex flex-col items-center justify-center gap-2 py-2">
              {summary && summary.totalReviews > 0 ? (
                <>
                  <span
                    className="text-5xl sm:text-6xl font-editorial font-bold text-[#141414] leading-none"
                    aria-label={`${summary.averageRating?.toFixed(1)} average rating`}
                  >
                    {summary.averageRating?.toFixed(1)}
                  </span>
                  <StarRatingDisplay
                    rating={summary.averageRating}
                    reviewCount={summary.totalReviews}
                    size="md"
                    showCount
                  />
                  <span className="text-[11px] font-mono text-[#7A7771]">
                    out of 5
                  </span>
                </>
              ) : (
                <div className="text-center space-y-1.5">
                  <p className="text-[14px] font-sans font-semibold text-[#141414]">No reviews yet</p>
                  <p className="text-[12px] text-[#7A7771] font-sans">
                    Be the first to share your experience.
                  </p>
                </div>
              )}
            </div>

            {/* Right: Distribution bars */}
            <div className="space-y-2 justify-center flex flex-col">
              {[5, 4, 3, 2, 1].map((stars) => (
                <DistributionBar
                  key={stars}
                  stars={stars}
                  count={dist[stars as 1 | 2 | 3 | 4 | 5] ?? 0}
                  total={summary?.totalReviews ?? 0}
                />
              ))}
            </div>
          </div>

          {/* Write a Review CTA */}
          {!showForm && (
            <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <button
                type="button"
                id="write-review-btn"
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 h-10 px-5 rounded-full border border-[#141414] bg-transparent text-[#141414] text-[11.5px] font-bold uppercase tracking-wider hover:bg-[#141414] hover:text-[#F2F0EB] transition-all duration-200 cursor-pointer"
              >
                <MessageSquarePlus className="w-4 h-4" />
                Write a Review
              </button>
              {summary && summary.totalReviews === 0 && (
                <p className="text-[12px] font-sans text-[#7A7771]">
                  No reviews yet — be the first!
                </p>
              )}
            </div>
          )}

          {/* Review Form */}
          {showForm && (
            <div className="mb-8">
              <ReviewForm
                productId={productId}
                productName={productName}
                onSuccess={handleReviewSuccess}
                onCancel={() => setShowForm(false)}
              />
            </div>
          )}

          {/* Sort Controls + Review List */}
          {summary && summary.totalReviews > 0 && (
            <>
              {/* Sort bar */}
              <div className="flex items-center gap-3 mb-4 flex-wrap" role="group" aria-label="Sort reviews">
                <span className="text-[10.5px] font-mono uppercase tracking-wider text-[#7A7771] shrink-0">
                  Sort by:
                </span>
                {(['recent', 'highest', 'lowest'] as SortOption[]).map((opt) => {
                  const labels: Record<SortOption, string> = {
                    recent: 'Most Recent',
                    highest: 'Highest Rated',
                    lowest: 'Lowest Rated',
                  };
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleSortChange(opt)}
                      aria-pressed={sort === opt}
                      className={`px-3 h-7 rounded-full text-[10.5px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
                        sort === opt
                          ? 'bg-[#141414] text-[#F2F0EB]'
                          : 'border border-[#DAD8D1] text-[#7A7771] hover:border-[#141414] hover:text-[#141414]'
                      }`}
                    >
                      {labels[opt]}
                    </button>
                  );
                })}
              </div>

              {/* Review Cards */}
              <div aria-label="Customer reviews list">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => <ReviewSkeleton key={i} />)
                ) : reviews.length === 0 ? (
                  <p className="text-[12.5px] font-sans text-[#7A7771] py-6 text-center">
                    No reviews match this filter.
                  </p>
                ) : (
                  reviews.map((review) => <ReviewCard key={review.id} review={review} />)
                )}
              </div>

              {/* Load More */}
              {hasMore && (
                <div className="pt-6 flex justify-center">
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="h-10 px-6 rounded-full border border-[#DAD8D1] text-[#141414] text-[11px] font-sans font-semibold uppercase tracking-wider hover:border-[#141414] hover:bg-[#141414] hover:text-[#F2F0EB] transition-all duration-200 flex items-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Loading…
                      </>
                    ) : (
                      'Load More Reviews'
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
};
