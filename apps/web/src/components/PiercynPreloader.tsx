import React, { useEffect, useState } from 'react';

/**
 * PIERCYN's one-time entry animation.
 * Lightweight CSS animation; no blocking video download and no repeated
 * flashes when the customer navigates between store pages.
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
          // Private browsing may disable storage; the animation still works.
        }
    }, 550);
    };

    // Keep the intro brief, and don't wait indefinitely for slow assets.
    const minTimer = window.setTimeout(finish, 1750);
    const safetyTimer = window.setTimeout(finish, 2800);

    return () => {
      window.clearTimeout(minTimer);
      window.clearTimeout(safetyTimer);
      if (exitTimer) window.clearTimeout(exitTimer);
    };
  }, [visible]);

  if (!visible) return null;

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
          transition: opacity 520ms cubic-bezier(.22,.61,.36,1), visibility 520ms;
          isolation: isolate;
        }
        .piercyn-intro--leaving { opacity: 0; visibility: hidden; pointer-events: none; }
        .piercyn-intro__content {
          display: flex; flex-direction: column; align-items: center;
          gap: 22px; padding: 24px; text-align: center;
          animation: piercyn-intro-rise 850ms cubic-bezier(.2,.7,.2,1) both;
        }
        .piercyn-intro__mark {
          width: 88px; height: 88px; display: grid; place-items: center;
          border: 1px solid rgba(242,240,235,.22); border-radius: 50%;
          position: relative; animation: piercyn-mark-glow 1.8s ease-in-out infinite alternate;
        }
        .piercyn-intro__mark::before {
          content: ''; position: absolute; inset: -7px; border: 1px solid rgba(242,240,235,.09);
          border-radius: 50%; animation: piercyn-ring 2.8s ease-out infinite;
        }
        .piercyn-intro__letter {
          font-family: Georgia, 'Times New Roman', serif; font-size: 51px;
          line-height: 1; font-weight: 400; letter-spacing: -.09em;
          transform: translateX(-2px); color: #F2F0EB;
        }
        .piercyn-intro__name {
          font-family: Arial, Helvetica, sans-serif; font-size: 12px;
          letter-spacing: .42em; font-weight: 500; padding-left: .42em;
        }
        .piercyn-intro__tagline {
          margin-top: -13px; font-family: Arial, Helvetica, sans-serif;
          font-size: 9px; letter-spacing: .22em; color: rgba(242,240,235,.56);
          text-transform: uppercase;
        }
        .piercyn-intro__rule { height: 1px; width: 38px; background: #F2F0EB; opacity: .6; }
        @keyframes piercyn-intro-rise {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes piercyn-mark-glow {
          from { box-shadow: 0 0 0 rgba(242,240,235,0); }
          to { box-shadow: 0 0 30px rgba(242,240,235,.09); }
        }
        @keyframes piercyn-ring {
          0% { transform: scale(.92); opacity: .6; }
          100% { transform: scale(1.16); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .piercyn-intro, .piercyn-intro * { animation: none !important; transition-duration: 1ms !important; }
        }
      `}</style>
      <div className="piercyn-intro__content">
        <div className="piercyn-intro__mark" aria-hidden="true">
          <span className="piercyn-intro__letter">P</span>
        </div>
        <div className="piercyn-intro__name">PIERCYN</div>
        <div className="piercyn-intro__rule" aria-hidden="true" />
        <div className="piercyn-intro__tagline">Crafting the experience</div>
      </div>
    </div>
  );
};
