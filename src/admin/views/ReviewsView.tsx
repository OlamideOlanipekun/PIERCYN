import React, { useState, useEffect, useCallback } from 'react';
import { AdminApi } from '../api';
import type { AdminReview, AdminReviewMetrics, AdminReviewStatus } from '../types';
import {
  Star,
  Shield,
  Clock,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Loader2,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

// ============================================================
// Helpers
// ============================================================

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function StarBadge({ rating }: { rating: number }) {
  const color =
    rating >= 4 ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
      : rating >= 3 ? 'text-amber-700 bg-amber-50 border-amber-200'
      : 'text-red-700 bg-red-50 border-red-200';
  return (
    <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 border rounded-full text-[10.5px] font-mono font-bold ${color}`}>
      <Star className="w-3 h-3 fill-current" />
      {rating}
    </span>
  );
}

function StatusBadge({ status }: { status: AdminReviewStatus }) {
  const map: Record<AdminReviewStatus, { label: string; cls: string }> = {
    PENDING: { label: 'Pending', cls: 'text-amber-700 bg-amber-50 border-amber-200' },
    PUBLISHED: { label: 'Published', cls: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    HIDDEN: { label: 'Hidden', cls: 'text-[#7A7771] bg-[#F2F0EB] border-[#DAD8D1]' },
    REJECTED: { label: 'Rejected', cls: 'text-red-700 bg-red-50 border-red-200' },
  };
  const { label, cls } = map[status] ?? map.PENDING;
  return (
    <span className={`px-2 py-0.5 border rounded-full text-[10.5px] font-mono font-semibold ${cls}`}>
      {label}
    </span>
  );
}

// ============================================================
// Metric Card
// ============================================================

function MetricCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="bg-[#111] border border-[#1E1E1E] rounded-xl p-4 flex flex-col gap-2">
      <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-[#7A7771]">{label}</p>
        <p className="text-2xl font-editorial font-bold text-[#F2F0EB] mt-0.5">{value}</p>
      </div>
    </div>
  );
}

// ============================================================
// Review Detail Modal
// ============================================================

interface ReviewDetailModalProps {
  review: AdminReview;
  onClose: () => void;
  onModerate: (reviewId: string, action: 'PUBLISH' | 'HIDE' | 'REJECT' | 'RESTORE', note?: string) => Promise<void>;
  moderating: boolean;
}

const ReviewDetailModal: React.FC<ReviewDetailModalProps> = ({
  review,
  onClose,
  onModerate,
  moderating,
}) => {
  const [note, setNote] = useState('');
  const [pendingAction, setPendingAction] = useState<'PUBLISH' | 'HIDE' | 'REJECT' | 'RESTORE' | null>(null);

  const handleAction = async (action: 'PUBLISH' | 'HIDE' | 'REJECT' | 'RESTORE') => {
    setPendingAction(action);
    await onModerate(review.id, action, note || undefined);
    setPendingAction(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Review detail"
    >
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#111] border border-[#1E1E1E] rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#1E1E1E]">
          <div className="flex items-center gap-3">
            <StatusBadge status={review.status} />
            <StarBadge rating={review.rating} />
            {review.isVerifiedPurchase && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-emerald-700/40 bg-emerald-900/20 text-emerald-400 rounded-full text-[10px] font-mono">
                <Shield className="w-3 h-3" /> Verified
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#7A7771] hover:text-[#F2F0EB] transition-colors cursor-pointer p-1"
            aria-label="Close"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-[11px] font-mono">
            <div>
              <p className="text-[#7A7771] uppercase tracking-wider mb-0.5">Reviewer</p>
              <p className="text-[#F2F0EB] font-semibold">{review.reviewerDisplayName}</p>
              {review.reviewerEmail && (
                <p className="text-[#7A7771] text-[10px]">{review.reviewerEmail}</p>
              )}
            </div>
            <div>
              <p className="text-[#7A7771] uppercase tracking-wider mb-0.5">Product</p>
              <p className="text-[#F2F0EB] font-semibold">{review.productName || review.productId}</p>
            </div>
            <div>
              <p className="text-[#7A7771] uppercase tracking-wider mb-0.5">Submitted</p>
              <p className="text-[#F2F0EB]">{formatDate(review.createdAt)}</p>
            </div>
            {review.moderatedAt && (
              <div>
                <p className="text-[#7A7771] uppercase tracking-wider mb-0.5">Moderated</p>
                <p className="text-[#F2F0EB]">{formatDate(review.moderatedAt)}</p>
              </div>
            )}
          </div>

          {review.title && (
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-[#7A7771] mb-1">Title</p>
              <p className="text-[#F2F0EB] font-semibold text-[13px]">{review.title}</p>
            </div>
          )}

          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-[#7A7771] mb-1">Review</p>
            <p className="text-[#C8C5BF] text-[13px] leading-relaxed whitespace-pre-wrap break-words">
              {review.body}
            </p>
          </div>

          {review.moderationNote && (
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-3">
              <p className="text-[10px] font-mono uppercase tracking-wider text-[#7A7771] mb-1">Moderation Note</p>
              <p className="text-[#C8C5BF] text-[12px]">{review.moderationNote}</p>
            </div>
          )}

          {/* Moderation Note Input */}
          <div>
            <label htmlFor="mod-note" className="text-[10px] font-mono uppercase tracking-wider text-[#7A7771] mb-1 block">
              Add Note (optional)
            </label>
            <textarea
              id="mod-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder="Internal moderation note..."
              className="w-full px-3 py-2 rounded-lg bg-[#0E0E0E] border border-[#2A2A2A] text-[#F2F0EB] text-[12px] placeholder-[#4A4844] focus:outline-none focus:ring-1 focus:ring-[#C9A84C] resize-none"
            />
          </div>

          {/* Moderation Actions */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-[#1E1E1E]">
            {review.status !== 'PUBLISHED' && (
              <button
                type="button"
                onClick={() => handleAction('PUBLISH')}
                disabled={moderating}
                className="inline-flex items-center gap-1.5 px-4 h-9 rounded-full bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
              >
                {pendingAction === 'PUBLISH' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Publish
              </button>
            )}
            {review.status !== 'HIDDEN' && (
              <button
                type="button"
                onClick={() => handleAction('HIDE')}
                disabled={moderating}
                className="inline-flex items-center gap-1.5 px-4 h-9 rounded-full bg-[#2A2A2A] hover:bg-[#333] text-[#F2F0EB] text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
              >
                {pendingAction === 'HIDE' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <EyeOff className="w-3.5 h-3.5" />}
                Hide
              </button>
            )}
            {review.status !== 'REJECTED' && (
              <button
                type="button"
                onClick={() => handleAction('REJECT')}
                disabled={moderating}
                className="inline-flex items-center gap-1.5 px-4 h-9 rounded-full bg-red-900 hover:bg-red-800 text-white text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
              >
                {pendingAction === 'REJECT' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                Reject
              </button>
            )}
            {(review.status === 'HIDDEN' || review.status === 'REJECTED') && (
              <button
                type="button"
                onClick={() => handleAction('RESTORE')}
                disabled={moderating}
                className="inline-flex items-center gap-1.5 px-4 h-9 rounded-full bg-blue-900 hover:bg-blue-800 text-white text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
              >
                {pendingAction === 'RESTORE' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                Restore
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Main ReviewsView
// ============================================================

export const ReviewsView: React.FC = () => {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [metrics, setMetrics] = useState<AdminReviewMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [ratingFilter, setRatingFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedReview, setSelectedReview] = useState<AdminReview | null>(null);
  const [moderating, setModerating] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const LIMIT = 15;

  const showToast = (text: string, ok: boolean) => {
    setToastMessage({ text, ok });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadReviews = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await AdminApi.getReviews({
        page: p,
        limit: LIMIT,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        rating: ratingFilter ? Number(ratingFilter) : undefined,
        search: search || undefined,
      });
      setReviews(result.reviews as AdminReview[]);
      setMetrics(result.metrics);
      setTotalPages(result.pagination.totalPages);
      setTotal(result.pagination.total);
      setPage(p);
    } catch (err: any) {
      setError(err.message || 'Failed to load reviews.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, ratingFilter, search]);

  useEffect(() => {
    setPage(1);
    loadReviews(1);
  }, [loadReviews]);

  const handleModerate = async (
    reviewId: string,
    action: 'PUBLISH' | 'HIDE' | 'REJECT' | 'RESTORE',
    note?: string
  ) => {
    setModerating(true);
    try {
      const updated = await AdminApi.moderateReview(reviewId, action, note);
      // Update in-list view
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, ...(updated as AdminReview) } : r))
      );
      // Update modal if open
      if (selectedReview?.id === reviewId) {
        setSelectedReview((prev) => prev ? { ...prev, ...(updated as AdminReview) } : null);
      }
      showToast(`Review ${action.toLowerCase()}ed successfully.`, true);
      // Refresh metrics
      loadReviews(page);
    } catch (err: any) {
      showToast(err.message || 'Moderation action failed.', false);
    } finally {
      setModerating(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
  };

  const statusOptions: { value: string; label: string }[] = [
    { value: 'ALL', label: 'All Statuses' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'PUBLISHED', label: 'Published' },
    { value: 'HIDDEN', label: 'Hidden' },
    { value: 'REJECTED', label: 'Rejected' },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">

      {/* Toast */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-[12px] font-sans font-semibold transition-all ${
            toastMessage.ok
              ? 'bg-emerald-900 border border-emerald-700 text-emerald-100'
              : 'bg-red-900 border border-red-700 text-red-100'
          }`}
          role="status"
          aria-live="polite"
        >
          {toastMessage.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toastMessage.text}
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-editorial font-bold text-[#F2F0EB] uppercase tracking-tight">
            Reviews & Ratings
          </h1>
          <p className="text-[11px] font-mono text-[#7A7771] mt-0.5">
            Moderate customer reviews and monitor product ratings
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadReviews(page)}
          disabled={loading}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full border border-[#2A2A2A] text-[#7A7771] text-[11px] font-mono hover:border-[#F2F0EB] hover:text-[#F2F0EB] transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <MetricCard icon={Star} label="Total" value={metrics.totalReviews} color="bg-[#2A2A2A]" />
          <MetricCard icon={CheckCircle2} label="Published" value={metrics.publishedCount} color="bg-emerald-800" />
          <MetricCard icon={Clock} label="Pending" value={metrics.pendingCount} color="bg-amber-800" />
          <MetricCard icon={EyeOff} label="Hidden" value={metrics.hiddenCount} color="bg-[#333]" />
          <MetricCard icon={XCircle} label="Rejected" value={metrics.rejectedCount} color="bg-red-900" />
          <MetricCard
            icon={Star}
            label="Avg. Rating"
            value={metrics.averagePublishedRating !== null ? `${metrics.averagePublishedRating}★` : '—'}
            color="bg-[#8C6D3F]"
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#7A7771]" />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name, email, or content…"
              className="w-full h-9 pl-9 pr-3 rounded-full bg-[#111] border border-[#2A2A2A] text-[#F2F0EB] text-[12px] placeholder-[#4A4844] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
            />
          </div>
          <button
            type="submit"
            className="h-9 px-4 rounded-full bg-[#1E1E1E] border border-[#2A2A2A] text-[#F2F0EB] text-[11px] font-mono hover:border-[#C9A84C] transition-colors cursor-pointer"
          >
            Search
          </button>
        </form>

        {/* Status Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#7A7771] pointer-events-none" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 pl-9 pr-8 rounded-full bg-[#111] border border-[#2A2A2A] text-[#F2F0EB] text-[12px] font-mono focus:outline-none focus:ring-1 focus:ring-[#C9A84C] cursor-pointer appearance-none"
            aria-label="Filter by status"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Rating Filter */}
        <div className="relative">
          <Star className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#7A7771] pointer-events-none" />
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="h-9 pl-9 pr-8 rounded-full bg-[#111] border border-[#2A2A2A] text-[#F2F0EB] text-[12px] font-mono focus:outline-none focus:ring-1 focus:ring-[#C9A84C] cursor-pointer appearance-none"
            aria-label="Filter by rating"
          >
            <option value="">All Ratings</option>
            {[5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={String(r)}>{r} Star{r !== 1 ? 's' : ''}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Reviews Table */}
      {loading ? (
        <div className="flex items-center justify-center gap-3 py-16 text-[#7A7771]">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-[12px] font-mono">Loading reviews…</span>
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 p-5 bg-red-900/20 border border-red-800/40 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <div>
            <p className="text-[12px] text-red-300">{error}</p>
            <button
              type="button"
              onClick={() => loadReviews(page)}
              className="text-[11px] font-semibold text-red-200 underline mt-1 cursor-pointer"
            >
              Retry
            </button>
          </div>
        </div>
      ) : reviews.length === 0 ? (
        <div className="py-16 text-center">
          <Star className="w-10 h-10 text-[#2A2A2A] mx-auto mb-3" />
          <p className="text-[#7A7771] font-mono text-[12px]">No reviews found.</p>
          {(statusFilter !== 'ALL' || ratingFilter || search) && (
            <button
              type="button"
              onClick={() => { setStatusFilter('ALL'); setRatingFilter(''); setSearch(''); setSearchInput(''); }}
              className="mt-2 text-[11px] font-semibold text-[#C9A84C] underline cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Table — desktop */}
          <div className="hidden md:block overflow-hidden rounded-xl border border-[#1E1E1E]">
            <table className="w-full text-left" aria-label="Reviews table">
              <thead className="bg-[#0E0E0E] border-b border-[#1E1E1E]">
                <tr>
                  {['Product', 'Reviewer', 'Rating', 'Excerpt', 'Date', 'Status', 'Actions'].map((h) => (
                    <th key={h} scope="col" className="px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-[#7A7771]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1A1A]">
                {reviews.map((review) => (
                  <tr
                    key={review.id}
                    className="bg-[#111] hover:bg-[#161616] transition-colors"
                  >
                    <td className="px-4 py-3 text-[11px] font-mono text-[#F2F0EB] max-w-[120px] truncate">
                      {review.productName || review.productId.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-[11px] font-sans text-[#F2F0EB] truncate max-w-[100px]">
                        {review.reviewerDisplayName}
                      </div>
                      {review.isVerifiedPurchase && (
                        <span className="text-[9.5px] font-mono text-emerald-400 flex items-center gap-0.5">
                          <Shield className="w-2.5 h-2.5" /> Verified
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StarBadge rating={review.rating} />
                    </td>
                    <td className="px-4 py-3 text-[11px] text-[#9E9B95] max-w-[220px]">
                      {review.title && (
                        <span className="block font-semibold text-[#F2F0EB] truncate">{review.title}</span>
                      )}
                      <span className="line-clamp-2">{review.body}</span>
                    </td>
                    <td className="px-4 py-3 text-[10.5px] font-mono text-[#7A7771] whitespace-nowrap">
                      {formatDate(review.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={review.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedReview(review)}
                          className="h-7 px-2.5 rounded-full border border-[#2A2A2A] text-[#7A7771] text-[10px] font-mono hover:border-[#F2F0EB] hover:text-[#F2F0EB] transition-colors cursor-pointer flex items-center gap-1"
                          title="View full review"
                          aria-label={`View review by ${review.reviewerDisplayName}`}
                        >
                          <Eye className="w-3 h-3" /> View
                        </button>
                        {review.status !== 'PUBLISHED' && (
                          <button
                            type="button"
                            onClick={() => handleModerate(review.id, 'PUBLISH')}
                            disabled={moderating}
                            className="h-7 px-2.5 rounded-full bg-emerald-900/40 border border-emerald-800/40 text-emerald-400 text-[10px] font-mono hover:bg-emerald-800/60 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
                            aria-label={`Publish review by ${review.reviewerDisplayName}`}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                          </button>
                        )}
                        {review.status === 'PUBLISHED' && (
                          <button
                            type="button"
                            onClick={() => handleModerate(review.id, 'HIDE')}
                            disabled={moderating}
                            className="h-7 px-2.5 rounded-full bg-[#2A2A2A] border border-[#333] text-[#7A7771] text-[10px] font-mono hover:bg-[#333] transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
                            aria-label={`Hide review by ${review.reviewerDisplayName}`}
                          >
                            <EyeOff className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Card list — mobile */}
          <div className="md:hidden space-y-3">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-[#111] border border-[#1E1E1E] rounded-xl p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[12px] font-sans font-bold text-[#F2F0EB] truncate">
                      {review.reviewerDisplayName}
                    </p>
                    <p className="text-[10.5px] font-mono text-[#7A7771]">
                      {review.productName || review.productId.slice(0, 12)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <StarBadge rating={review.rating} />
                    <StatusBadge status={review.status} />
                  </div>
                </div>
                {review.title && (
                  <p className="text-[12px] font-semibold text-[#F2F0EB]">{review.title}</p>
                )}
                <p className="text-[11.5px] text-[#9E9B95] line-clamp-3">{review.body}</p>
                <div className="flex items-center gap-2 pt-1 border-t border-[#1A1A1A]">
                  <button
                    type="button"
                    onClick={() => setSelectedReview(review)}
                    className="flex-1 h-8 rounded-full border border-[#2A2A2A] text-[#7A7771] text-[10.5px] font-mono hover:border-[#F2F0EB] hover:text-[#F2F0EB] transition-colors cursor-pointer"
                  >
                    View & Moderate
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-2">
            <p className="text-[11px] font-mono text-[#7A7771]">
              {total} review{total !== 1 ? 's' : ''} · Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => loadReviews(page - 1)}
                disabled={page <= 1 || loading}
                className="h-8 w-8 rounded-full border border-[#2A2A2A] flex items-center justify-center text-[#7A7771] hover:border-[#F2F0EB] hover:text-[#F2F0EB] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => loadReviews(page + 1)}
                disabled={page >= totalPages || loading}
                className="h-8 w-8 rounded-full border border-[#2A2A2A] flex items-center justify-center text-[#7A7771] hover:border-[#F2F0EB] hover:text-[#F2F0EB] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Review Detail Modal */}
      {selectedReview && (
        <ReviewDetailModal
          review={selectedReview}
          onClose={() => setSelectedReview(null)}
          onModerate={handleModerate}
          moderating={moderating}
        />
      )}
    </div>
  );
};
