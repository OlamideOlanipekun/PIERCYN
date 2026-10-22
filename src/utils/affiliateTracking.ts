// ============================================================
// PIERCYN AFFILIATE TRACKING UTILITY
// Handles client-side click capture, cookie/storage persistence,
// and automated attribution injection into checkout.
// ============================================================

import { AffiliateApiClient } from '../services/affiliateApi';

const STORAGE_AFFILIATE_CODE = 'piercyn_affiliate_code';
const STORAGE_AFFILIATE_TIMESTAMP = 'piercyn_affiliate_ts';
const STORAGE_SESSION_ID = 'piercyn_session_id';
const ATTRIBUTION_WINDOW_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Gets or creates the persistent anonymous browser session ID.
 */
export function getOrCreateSessionId(): string {
  try {
    let sid = localStorage.getItem(STORAGE_SESSION_ID);
    if (!sid) {
      sid = 'psess_' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
      localStorage.setItem(STORAGE_SESSION_ID, sid);
    }
    return sid;
  } catch {
    return 'fallback-session-' + Date.now();
  }
}

export const AFFILIATE_PROGRAM_ENABLED = false;

/**
 * Checks if the user currently has an active, unexpired affiliate attribution.
 */
export function getActiveAffiliateCode(): string | null {
  if (!AFFILIATE_PROGRAM_ENABLED) return null;

  try {
    const code = localStorage.getItem(STORAGE_AFFILIATE_CODE);
    const tsStr = localStorage.getItem(STORAGE_AFFILIATE_TIMESTAMP);

    if (!code || !tsStr) return null;

    const timestamp = parseInt(tsStr, 10);
    if (isNaN(timestamp) || Date.now() - timestamp > ATTRIBUTION_WINDOW_MS) {
      // Expired attribution
      localStorage.removeItem(STORAGE_AFFILIATE_CODE);
      localStorage.removeItem(STORAGE_AFFILIATE_TIMESTAMP);
      return null;
    }

    return code;
  } catch {
    return null;
  }
}

/**
 * Saves or refreshes the affiliate attribution code in localStorage.
 */
export function setAffiliateCode(code: string): void {
  if (!AFFILIATE_PROGRAM_ENABLED) return;

  try {
    localStorage.setItem(STORAGE_AFFILIATE_CODE, code.trim().toUpperCase());
    localStorage.setItem(STORAGE_AFFILIATE_TIMESTAMP, Date.now().toString());
  } catch {}
}

/**
 * Initializes affiliate tracking on page load.
 * Detects ?ref=CODE, ?aff=CODE, ?affiliate=CODE or /r/CODE path.
 * Tracks the click with the backend and handles automatic destination redirect if needed.
 */
export async function initAffiliateTracking(): Promise<void> {
  if (typeof window === 'undefined') return;

  if (!AFFILIATE_PROGRAM_ENABLED) {
    try {
      localStorage.removeItem(STORAGE_AFFILIATE_CODE);
      localStorage.removeItem(STORAGE_AFFILIATE_TIMESTAMP);
    } catch {}
    return;
  }

  const url = new URL(window.location.href);
  let referralCode =
    url.searchParams.get('ref') ||
    url.searchParams.get('aff') ||
    url.searchParams.get('affiliate') ||
    url.searchParams.get('creator');

  // Check /r/CODE pattern
  const pathname = window.location.pathname;
  const isDirectReferralRoute = pathname.startsWith('/r/') || pathname.startsWith('/ref/');
  if (isDirectReferralRoute) {
    const parts = pathname.split('/');
    if (parts[2]) {
      referralCode = decodeURIComponent(parts[2]).trim();
    }
  }

  if (!referralCode) {
    return;
  }

  const cleanCode = referralCode.trim().toUpperCase();
  const sessionId = getOrCreateSessionId();

  // Save attribution code in storage
  setAffiliateCode(cleanCode);

  // Send click event to backend asynchronously
  try {
    const res = await AffiliateApiClient.trackClick({
      code: cleanCode,
      sessionId,
      referrer: document.referrer || undefined,
      landingPage: window.location.pathname + window.location.search,
    });

    // If user accessed via direct /r/:code URL, redirect to intended target destination
    if (isDirectReferralRoute && res.success && res.data?.link?.destination) {
      const targetDest = res.data.link.destination;
      if (targetDest && targetDest !== pathname) {
        window.history.replaceState(null, '', targetDest);
        // Trigger a popstate/custom event so App router picks up new URL
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    } else if (url.searchParams.has('ref') || url.searchParams.has('aff')) {
      // Clean up query param from URL without reloading for a cleaner URL bar
      url.searchParams.delete('ref');
      url.searchParams.delete('aff');
      url.searchParams.delete('affiliate');
      url.searchParams.delete('creator');
      window.history.replaceState(null, '', url.pathname + (url.search ? url.search : '') + url.hash);
    }
  } catch (err) {
    console.warn('[PIERCYN] Affiliate click tracking warning:', err);
  }
}
