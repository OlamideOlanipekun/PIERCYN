import React, { useEffect, useRef, useState } from 'react';

const PRELOADER_VIDEO =
  'https://pl0borck44uqlgua.public.blob.vercel-storage.com/261131174_1791887681274620.mp4';

/**
 * Plays the supplied PIERCYN brand intro once per browser session.
 * The video is muted so autoplay works on mobile browsers; a timeout and
 * branded fallback ensure the storefront never stays blocked indefinitely.
 */
export const PiercynPreloader: React.FC = () => {
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return window.sessionStorage.getItem('piercyn-intro-seen') !== '1';
    } catch {
      return true;
    }
  });
  const [leaving, setLeaving] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!visible) return;

    let exitTimer: number | undefined;
    const finish = () => {
      setLeaving(true);
      exitTimer = window.setTimeout(() => {
        setVisible(false);
        try {
          window.sessionStorage.setItem('piercyn-intro-seen', '1');
        } catch {
          // The intro still works when storage is unavailable.
        }
      }, 450);
    };

    // Do not let a slow network or a malformed video block the storefront.
    const safetyTimer = window.setTimeout(finish, 6500);
    if (videoFailed) {
      exitTimer = window.setTimeout(finish, 1400);
    }

    const video = videoRef.current;
    if (video) {
      const playAttempt = video.play();
      if (playAttempt) {
        playAttempt.catch(() => setVideoFailed(true));
      }
    }

    return () => {
      window.clearTimeout(safetyTimer);
      if (exitTimer) window.clearTimeout(exitTimer);
    };
  }, [visible, videoFailed]);

  if (!visible) return null;

  const finishIntro = () => {
    if (!leaving) {
      setLeaving(true);
      window.setTimeout(() => {
        setVisible(false);
        try {
          window.sessionStorage.setItem('piercyn-intro-seen', '1');
        } catch {
          // Ignore unavailable session storage.
        }
      }, 450);
    }
  };

  return (
    <div
      className={`piercyn-intro ${leaving ? 'piercyn-intro--leaving' : ''}`}
      role="status"
      aria-label="Loading PIERCYN"
      aria-live="polite"
    >
      <style>{`
        .piercyn-intro {
          position: fixed; inset: 0; z-index: 99999;
          display: flex; align-items: center; justify-content: center;
          overflow: hidden; background: #080808; color: #F2F0EB;
          opacity: 1; visibility: visible;
          transition: opacity 450ms cubic-bezier(.22,.61,.36,1), visibility 450ms;
          isolation: isolate;
        }
        .piercyn-intro--leaving { opacity: 0; visibility: hidden; pointer-events: none; }
        .piercyn-intro__video {
          position: absolute; inset: 0; width: 100%; height: 100%;
          object-fit: cover; object-position: center; background: #080808;
        }
        .piercyn-intro__fallback {
          position: relative; z-index: 1; display: flex; flex-direction: column;
          align-items: center; gap: 18px; padding: 24px; text-align: center;
          animation: piercyn-intro-rise 700ms ease both;
        }
        .piercyn-intro__mark {
          width: 76px; height: 76px; display: grid; place-items: center;
          border: 1px solid rgba(242,240,235,.24); border-radius: 50%;
        }
        .piercyn-intro__letter {
          font-family: Georgia, 'Times New Roman', serif; font-size: 46px;
          line-height: 1; font-weight: 400; letter-spacing: -.09em;
          transform: translateX(-2px); color: #F2F0EB;
        }
        .piercyn-intro__name {
          font-family: Arial, Helvetica, sans-serif; font-size: 12px;
          letter-spacing: .42em; font-weight: 500; padding-left: .42em;
        }
        .piercyn-intro__rule { height: 1px; width: 34px; background: #F2F0EB; opacity: .6; }
        @keyframes piercyn-intro-rise {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .piercyn-intro, .piercyn-intro * { transition-duration: 1ms !important; }
        }
      `}</style>
      {!videoFailed ? (
        <video
          ref={videoRef}
          className="piercyn-intro__video"
          src={PRELOADER_VIDEO}
          autoPlay
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
          onEnded={finishIntro}
          onError={() => setVideoFailed(true)}
          onCanPlay={() => {
            // If the browser can play the clip, let its natural end dismiss it.
          }}
        />
      ) : (
        <div className="piercyn-intro__fallback" aria-hidden="true">
          <div className="piercyn-intro__mark"><span className="piercyn-intro__letter">P</span></div>
          <div className="piercyn-intro__name">PIERCYN</div>
          <div className="piercyn-intro__rule" />
        </div>
      )}
    </div>
  );
};
