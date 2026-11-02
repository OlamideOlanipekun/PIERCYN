import React from 'react';

export const AuthLoading: React.FC<{ message?: string }> = ({ message = 'Authenticating atelier session…' }) => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center bg-[#0A0A0A] text-[#F2F0EB] px-4">
      <div className="relative w-12 h-12 mb-6">
        <div className="absolute inset-0 rounded-full border border-white/10" />
        <div className="absolute inset-0 rounded-full border-t border-[#F2F0EB] animate-spin" />
      </div>
      <p className="text-[12px] tracking-[0.2em] uppercase font-mono text-[#A8A59D]">
        {message}
      </p>
    </div>
  );
};
