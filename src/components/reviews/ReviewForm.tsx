import React, { useState } from 'react';
import { api } from '../../services/apiClient';
import { StarRatingSelector } from './StarRating';
import { Loader2, CheckCircle, AlertCircle, X } from 'lucide-react';

// ============================================================
// ReviewForm — Customer review submission
// Validates all fields client-side before sending.
// Server-side validation runs independently.
// ============================================================

interface ReviewFormProps {
  productId: string;
  productName: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

type FormState = 'idle' | 'submitting' | 'success' | 'error';

export const ReviewForm: React.FC<ReviewFormProps> = ({
  productId,
  productName,
  onSuccess,
  onCancel,
}) => {
  const [rating, setRating] = useState(0);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [formState, setFormState] = useState<FormState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false); // Prevent double-submission

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!rating) errors.rating = 'Please select a star rating.';
    if (!displayName.trim() || displayName.trim().length < 2)
      errors.displayName = 'Please enter your name (at least 2 characters).';
    if (displayName.trim().length > 50)
      errors.displayName = 'Name cannot exceed 50 characters.';
    if (!body.trim() || body.trim().length < 10)
      errors.body = 'Your review must be at least 10 characters.';
    if (body.trim().length > 2000)
      errors.body = 'Your review cannot exceed 2,000 characters.';
    if (title.trim().length > 100)
      errors.title = 'Title cannot exceed 100 characters.';
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errors.email = 'Please enter a valid email address.';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitted || formState === 'submitting') return; // Prevent double-submit

    if (!validate()) return;

    setFormState('submitting');
    setErrorMessage('');

    try {
      const result = await api.submitReview(productId, {
        rating,
        reviewerDisplayName: displayName.trim(),
        reviewerEmail: email.trim() || undefined,
        title: title.trim() || undefined,
        body: body.trim(),
        orderNumber: orderNumber.trim() || undefined,
      });

      if (result.success === false) {
        throw new Error(result.error || 'Submission failed. Please try again.');
      }

      setSubmitted(true);
      setFormState('success');
      setSuccessMessage(
        result.requiresModeration
          ? "Thank you! Your review has been submitted and will appear once it's approved by our team."
          : 'Your review is now live. Thank you for sharing your experience!'
      );

      setTimeout(() => {
        onSuccess?.();
      }, 3000);
    } catch (err: any) {
      setFormState('error');
      setErrorMessage(err.message || 'Something went wrong. Please try again.');
    }
  };

  const bodyCharCount = body.length;

  if (formState === 'success') {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 flex flex-col items-center text-center gap-3">
        <CheckCircle className="w-10 h-10 text-emerald-600" />
        <div>
          <p className="text-[13px] font-sans font-semibold text-emerald-900">Review Submitted</p>
          <p className="text-[12px] text-emerald-700 mt-1 max-w-xs">{successMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="bg-[#F8F6F1] border border-[#DAD8D1] rounded-xl p-5 sm:p-6 space-y-4"
      aria-label={`Write a review for ${productName}`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-[13px] font-sans font-bold uppercase tracking-wider text-[#141414]">
          Write a Review
        </h3>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-full hover:bg-[#E8E4DA] transition-colors cursor-pointer text-[#7A7771]"
            aria-label="Close review form"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Star Rating Selector */}
      <div className="space-y-1">
        <label className="text-[11px] font-sans font-semibold uppercase tracking-wider text-[#141414]">
          Your Rating <span aria-hidden="true" className="text-red-500">*</span>
        </label>
        <StarRatingSelector
          value={rating}
          onChange={(r) => {
            setRating(r);
            setFieldErrors((prev) => ({ ...prev, rating: '' }));
          }}
          disabled={formState === 'submitting'}
        />
        {fieldErrors.rating && (
          <p className="text-[11px] text-red-600 font-medium" role="alert">
            {fieldErrors.rating}
          </p>
        )}
      </div>

      {/* Display Name */}
      <div className="space-y-1">
        <label
          htmlFor="review-display-name"
          className="text-[11px] font-sans font-semibold uppercase tracking-wider text-[#141414]"
        >
          Your Name <span aria-hidden="true" className="text-red-500">*</span>
        </label>
        <input
          id="review-display-name"
          type="text"
          value={displayName}
          onChange={(e) => {
            setDisplayName(e.target.value);
            setFieldErrors((prev) => ({ ...prev, displayName: '' }));
          }}
          placeholder="e.g. Adebayo K."
          maxLength={50}
          disabled={formState === 'submitting'}
          className={`w-full h-10 px-3 rounded-lg border text-[13px] font-sans bg-white placeholder-[#B8B4AE] text-[#141414] focus:outline-none focus:ring-1 transition-all disabled:opacity-60 ${
            fieldErrors.displayName
              ? 'border-red-400 focus:ring-red-400'
              : 'border-[#DAD8D1] focus:ring-[#141414]'
          }`}
          aria-describedby={fieldErrors.displayName ? 'review-name-error' : undefined}
          aria-required="true"
          aria-invalid={Boolean(fieldErrors.displayName)}
        />
        {fieldErrors.displayName && (
          <p id="review-name-error" className="text-[11px] text-red-600 font-medium" role="alert">
            {fieldErrors.displayName}
          </p>
        )}
      </div>

      {/* Review Title (optional) */}
      <div className="space-y-1">
        <label
          htmlFor="review-title"
          className="text-[11px] font-sans font-semibold uppercase tracking-wider text-[#141414]"
        >
          Review Title <span className="text-[#9E9B95] font-normal normal-case tracking-normal">(optional)</span>
        </label>
        <input
          id="review-title"
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setFieldErrors((prev) => ({ ...prev, title: '' }));
          }}
          placeholder="e.g. Best tee I've owned"
          maxLength={100}
          disabled={formState === 'submitting'}
          className={`w-full h-10 px-3 rounded-lg border text-[13px] font-sans bg-white placeholder-[#B8B4AE] text-[#141414] focus:outline-none focus:ring-1 transition-all disabled:opacity-60 ${
            fieldErrors.title
              ? 'border-red-400 focus:ring-red-400'
              : 'border-[#DAD8D1] focus:ring-[#141414]'
          }`}
        />
        {fieldErrors.title && (
          <p className="text-[11px] text-red-600 font-medium" role="alert">
            {fieldErrors.title}
          </p>
        )}
      </div>

      {/* Review Body */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label
            htmlFor="review-body"
            className="text-[11px] font-sans font-semibold uppercase tracking-wider text-[#141414]"
          >
            Your Review <span aria-hidden="true" className="text-red-500">*</span>
          </label>
          <span
            className={`text-[10px] font-mono ${bodyCharCount > 1900 ? 'text-amber-700' : 'text-[#9E9B95]'}`}
            aria-live="polite"
            aria-atomic="true"
          >
            {bodyCharCount}/2000
          </span>
        </div>
        <textarea
          id="review-body"
          value={body}
          onChange={(e) => {
            setBody(e.target.value);
            setFieldErrors((prev) => ({ ...prev, body: '' }));
          }}
          placeholder="Tell other customers about the fit, fabric quality, and your honest experience..."
          rows={4}
          maxLength={2000}
          disabled={formState === 'submitting'}
          className={`w-full px-3 py-2.5 rounded-lg border text-[13px] font-sans bg-white placeholder-[#B8B4AE] text-[#141414] leading-relaxed focus:outline-none focus:ring-1 transition-all resize-none disabled:opacity-60 ${
            fieldErrors.body
              ? 'border-red-400 focus:ring-red-400'
              : 'border-[#DAD8D1] focus:ring-[#141414]'
          }`}
          aria-describedby={fieldErrors.body ? 'review-body-error' : undefined}
          aria-required="true"
          aria-invalid={Boolean(fieldErrors.body)}
        />
        {fieldErrors.body && (
          <p id="review-body-error" className="text-[11px] text-red-600 font-medium" role="alert">
            {fieldErrors.body}
          </p>
        )}
      </div>

      {/* Optional: Email for verified purchase */}
      <div className="space-y-1 pt-1 border-t border-[#DAD8D1]">
        <p className="text-[11px] font-sans text-[#7A7771] leading-relaxed">
          <strong className="text-[#141414]">Verified purchase?</strong> Enter your order email and order number below.
          Verified reviews help other shoppers make confident decisions.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="space-y-1">
            <label
              htmlFor="review-email"
              className="text-[10.5px] font-sans font-semibold uppercase tracking-wider text-[#7A7771]"
            >
              Order Email
            </label>
            <input
              id="review-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setFieldErrors((prev) => ({ ...prev, email: '' }));
              }}
              placeholder="you@example.com"
              disabled={formState === 'submitting'}
              className={`w-full h-9 px-3 rounded-lg border text-[12px] font-sans bg-white placeholder-[#B8B4AE] text-[#141414] focus:outline-none focus:ring-1 transition-all disabled:opacity-60 ${
                fieldErrors.email ? 'border-red-400 focus:ring-red-400' : 'border-[#DAD8D1] focus:ring-[#141414]'
              }`}
            />
            {fieldErrors.email && (
              <p className="text-[11px] text-red-600 font-medium" role="alert">{fieldErrors.email}</p>
            )}
          </div>
          <div className="space-y-1">
            <label
              htmlFor="review-order-number"
              className="text-[10.5px] font-sans font-semibold uppercase tracking-wider text-[#7A7771]"
            >
              Order Number
            </label>
            <input
              id="review-order-number"
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
              placeholder="e.g. PC-000123"
              disabled={formState === 'submitting'}
              className="w-full h-9 px-3 rounded-lg border border-[#DAD8D1] text-[12px] font-sans bg-white placeholder-[#B8B4AE] text-[#141414] focus:outline-none focus:ring-1 focus:ring-[#141414] transition-all disabled:opacity-60"
            />
          </div>
        </div>
      </div>

      {/* Server error */}
      {formState === 'error' && errorMessage && (
        <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-lg p-3" role="alert">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <p className="text-[12px] text-red-700 font-sans leading-relaxed">{errorMessage}</p>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={formState === 'submitting' || submitted}
        className="w-full h-11 rounded-full bg-[#141414] text-[#F2F0EB] text-[11.5px] font-sans font-bold uppercase tracking-[0.16em] hover:bg-black active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {formState === 'submitting' ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Submitting...</span>
          </>
        ) : (
          <span>Submit Review</span>
        )}
      </button>
    </form>
  );
};
