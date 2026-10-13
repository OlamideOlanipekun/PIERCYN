import React, { useEffect, useRef, useState } from 'react';

const VIDEO_URL =
  'https://pl0borck44uqlgua.public.blob.vercel-storage.com/261131174_1791887681274620.mp4';

export const Preloader: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [phase, setPhase] = useState<'in' | 'playing' | 'out'>('in');

  useEffect(() => {
    // Fade in then start playback
    const fadeInTimer = setTimeout(() => setPhase('playing'), 50);
    return () => clearTimeout(fadeInTimer);
  }, []);

  const handleEnded = () => {
    setPhase('out');
    // Wait for fade-out transition then notify parent
    setTimeout(onDone, 700);
  };

  // Safety net: if video fails to load / takes too long, skip after 6s
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (phase !== 'out') {
        setPhase('out');
        setTimeout(onDone, 700);
      }
    }, 7000);
    return () => clearTimeout(timeout);
  }, [phase, onDone]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'opacity 0.7s ease',
        opacity: phase === 'out' ? 0 : 1,
        pointerEvents: phase === 'out' ? 'none' : 'all',
      }}
    >
      <video
        ref={videoRef}
        src={VIDEO_URL}
        autoPlay
        muted
        playsInline
        onEnded={handleEnded}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
        }}
      />

      {/* PIERCYN wordmark overlay */}
      <div
        style={{
          position: 'absolute',
          bottom: '2.5rem',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '6px',
          opacity: phase === 'playing' ? 1 : 0,
          transition: 'opacity 0.6s ease 0.3s',
        }}
      >
        <span
          style={{
            fontFamily: "'Times New Roman', Times, serif",
            fontSize: 'clamp(11px, 1.5vw, 13px)',
            letterSpacing: '0.35em',
            color: 'rgba(255,255,255,0.55)',
            textTransform: 'uppercase',
          }}
        >
          PIERCYN
        </span>
        {/* Animated progress bar */}
        <div
          style={{
            width: '40px',
            height: '1px',
            background: 'rgba(255,255,255,0.2)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(255,255,255,0.7)',
              animation: 'preloader-bar 6s linear forwards',
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes preloader-bar {
          from { transform: scaleX(0); transform-origin: left; }
          to   { transform: scaleX(1); transform-origin: left; }
        }
      `}</style>
    </div>
  );
};
