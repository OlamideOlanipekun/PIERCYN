import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Radio, Sparkles, Play, Pause } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const AtelierAudioPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [volume, setVolume] = useState(0.25);
  const [isExpanded, setIsExpanded] = useState(false);
  const { showToast } = useShop();

  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  const lfoIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const tracks = [
    { title: 'LAGOS RUNWAY NOCTURNE', tempo: '60 BPM', vibe: 'Warm Sub-Bass & Atmospheric Chords' },
    { title: 'SURULERE ATELIER TAPE', tempo: '72 BPM', vibe: 'Deep Analog Resonance' },
    { title: 'ATLANTIC SHORE SOUNDSCAPE', tempo: 'Ambient', vibe: 'Drifting Low frequencies & Velvet Pads' }
  ];

  const stopAudio = () => {
    oscillatorsRef.current.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // ignore
      }
    });
    oscillatorsRef.current = [];
    if (lfoIntervalRef.current) clearInterval(lfoIntervalRef.current);
  };

  const startAudio = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }

      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }

      stopAudio();

      const ctx = audioCtxRef.current;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(volume, ctx.currentTime);
      masterGain.connect(ctx.destination);
      masterGainRef.current = masterGain;

      // Chord frequencies based on current track
      const baseFreqs = currentTrackIndex === 0
        ? [55, 110, 164.81, 220, 261.63] // A minor 7 / warm low
        : currentTrackIndex === 1
        ? [65.41, 130.81, 196.00, 246.94] // C maj 7 deep
        : [43.65, 87.31, 130.81, 174.61]; // F deep ambient

      const oscs: OscillatorNode[] = [];

      baseFreqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = idx === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(420 + idx * 80, ctx.currentTime);
        filter.Q.setValueAtTime(1.5, ctx.currentTime);

        const oscGainLevel = idx === 0 ? 0.4 : 0.15;
        gain.gain.setValueAtTime(oscGainLevel, ctx.currentTime);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);

        osc.start();
        oscs.push(osc);
      });

      oscillatorsRef.current = oscs;

      // Subtle atmospheric breathing modulation
      let tick = 0;
      lfoIntervalRef.current = setInterval(() => {
        if (!masterGainRef.current || !audioCtxRef.current) return;
        tick += 0.05;
        const subtleFluctuation = volume * (0.85 + Math.sin(tick) * 0.15);
        masterGainRef.current.gain.setTargetAtTime(subtleFluctuation, audioCtxRef.current.currentTime, 0.4);
      }, 300);

    } catch (err) {
      console.warn('Atelier Soundscape generator init notice:', err);
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      stopAudio();
      setIsPlaying(false);
      showToast('Atelier Soundscape paused');
    } else {
      startAudio();
      setIsPlaying(true);
      showToast(`Playing: ${tracks[currentTrackIndex].title}`);
    }
  };

  const handleNextTrack = () => {
    const nextIdx = (currentTrackIndex + 1) % tracks.length;
    setCurrentTrackIndex(nextIdx);
    if (isPlaying) {
      setTimeout(() => {
        startAudio();
      }, 50);
    }
    showToast(`Track changed to: ${tracks[nextIdx].title}`);
  };

  useEffect(() => {
    if (masterGainRef.current && audioCtxRef.current) {
      masterGainRef.current.gain.setValueAtTime(volume, audioCtxRef.current.currentTime);
    }
  }, [volume]);

  useEffect(() => {
    return () => {
      stopAudio();
      if (audioCtxRef.current) {
        try {
          audioCtxRef.current.close();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  return (
    <div 
      id="atelier-audio-player-pill"
      className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 sm:left-6 z-40 font-mono select-none"
    >
      <div className="relative group">
        {/* Main Floating Capsule Pill */}
        <div className="flex items-center gap-2 px-3.5 h-11 min-h-[44px] rounded-full bg-[#141414]/90 backdrop-blur-md text-[#F2F0EB] border border-white/15 shadow-xl text-[10px] tracking-wider transition-all duration-300 hover:bg-[#141414]">
          {/* Animated Equalizer Soundwave Indicator */}
          <button 
            onClick={togglePlay}
            className="flex items-center gap-1 cursor-pointer min-h-[40px] pr-1"
            title={isPlaying ? 'Pause Atelier Audio' : 'Play Runway Soundscape'}
          >
            {isPlaying ? (
              <div className="flex items-end gap-0.5 h-3 w-4">
                <span className="w-0.5 bg-[#A48B71] h-3 animate-pulse" />
                <span className="w-0.5 bg-[#A48B71] h-2 animate-ping" />
                <span className="w-0.5 bg-[#E3DEC3] h-3.5 animate-pulse" />
                <span className="w-0.5 bg-[#A48B71] h-1.5 animate-ping" />
              </div>
            ) : (
              <Radio className="w-3.5 h-3.5 text-[#A48B71]" />
            )}
          </button>

          {/* Track Name or Mode Info */}
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-left flex flex-col text-[9.5px] cursor-pointer min-h-[40px] justify-center"
          >
            <span className="font-semibold text-[#F2F0EB] uppercase tracking-[0.15em] line-clamp-1 max-w-[130px] sm:max-w-none">
              {isPlaying ? tracks[currentTrackIndex].title : 'ATELIER RUNWAY RADIO'}
            </span>
            <span className="text-[8px] text-[#A48B71] tracking-[0.2em] uppercase">
              {isPlaying ? tracks[currentTrackIndex].tempo : 'TAP TO IMMERSE'}
            </span>
          </button>

          {/* Play/Pause Toggle */}
          <button
            onClick={togglePlay}
            className="w-7 h-7 min-w-[28px] rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer text-white"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
          </button>
        </div>

        {/* Expanded Track Controller Card */}
        {isExpanded && (
          <div className="absolute bottom-full left-0 mb-2 w-72 bg-[#141414] text-[#F2F0EB] p-4 rounded-xl border border-white/20 shadow-2xl space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-[9px] uppercase tracking-[0.25em] text-[#A48B71]">
                LAGOS ATELIER SOUNDSCAPE
              </span>
              <span className="text-[8px] text-white/50">WEB AUDIO SYNTH</span>
            </div>

            <div className="space-y-1">
              <p className="text-[11px] font-semibold text-white uppercase">
                {tracks[currentTrackIndex].title}
              </p>
              <p className="text-[9px] text-[#E3DEC3]/70 font-sans">
                {tracks[currentTrackIndex].vibe}
              </p>
            </div>

            {/* Volume Range */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[8px] text-white/60 tracking-wider">
                <span>SOUND LEVEL</span>
                <span>{Math.round(volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.6"
                step="0.02"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#A48B71]"
              />
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-white/10">
              <button
                onClick={handleNextTrack}
                className="text-[9px] text-[#A48B71] hover:text-white uppercase tracking-[0.2em] underline cursor-pointer"
              >
                NEXT CHANNEL →
              </button>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-[8px] text-white/40 hover:text-white uppercase tracking-widest"
              >
                CLOSE
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
