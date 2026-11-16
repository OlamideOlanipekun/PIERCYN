import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  CheckCircle2,
  Clock3,
  Link2,
  Share2,
  Sparkles,
  UserCheck,
  X,
} from 'lucide-react';

interface AffiliateOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: () => void;
  onLogin: () => void;
  onComplete?: () => void;
}

const steps = [
  {
    eyebrow: '01 / WELCOME TO PIERCYN PLUG',
    title: 'TURN YOUR NETWORK INTO EARNINGS.',
    description:
      'Welcome to PIERCYN PLUG, where you earn by introducing customers to pieces they love. No joining fee. No inventory. No capital required.',
    icon: Sparkles,
  },
  {
    eyebrow: '02 / GET APPROVED & GET YOUR LINK',
    title: 'YOUR LINK. YOUR IDENTITY.',
    description:
      'Submit your application for review. Once approved, your account unlocks a unique referral link connected to your affiliate profile so PIERCYN can attribute qualifying orders to you.',
    icon: Link2,
  },
  {
    eyebrow: '03 / SHARE YOUR LINK',
    title: 'SPREAD THE WORD. GET CUSTOMERS.',
    description:
      'Share your link with friends, WhatsApp groups, football communities, Instagram followers, and anyone interested in fashion. Attribution lasts for 30 days from the last valid click.',
    icon: Share2,
  },
  {
    eyebrow: '04 / EARN ₦1,000 PER ORDER',
    title: 'EVERY QUALIFYING ORDER COUNTS.',
    description:
      'Earn one ₦1,000 commission for each qualifying order attributed to your link. The commission stays pending until the order is delivered and the customer confirms that everything is okay.',
    icon: UserCheck,
  },
  {
    eyebrow: '05 / WITHDRAW YOUR EARNINGS',
    title: 'YOUR EARNINGS. YOUR REWARD.',
    description:
      'After delivery and customer confirmation, the approved commission becomes available in your wallet. Request withdrawal to your verified Nigerian bank account; approved payouts are processed within 24–48 business hours.',
    icon: Banknote,
  },
] as const;

export const AffiliateOnboardingModal: React.FC<AffiliateOnboardingModalProps> = ({
  isOpen,
  onClose,
  onRegister,
  onLogin,
  onComplete,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    setActiveStep(0);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight') setActiveStep((step) => Math.min(step + 1, steps.length - 1));
      if (event.key === 'ArrowLeft') setActiveStep((step) => Math.max(step - 1, 0));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.setTimeout(() => dialogRef.current?.focus(), 0);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const step = steps[activeStep];
  const Icon = step.icon;
  const isFinalStep = activeStep === steps.length - 1;

  const handleNext = () => {
    if (isFinalStep) {
      onComplete?.();
      onRegister();
      return;
    }
    setActiveStep((current) => Math.min(current + 1, steps.length - 1));
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#141414]/75 p-4 backdrop-blur-sm sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="affiliate-onboarding-title"
        aria-describedby="affiliate-onboarding-description"
        className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden border border-[#E5E2DC] bg-[#F2F0EB] text-[#141414] shadow-2xl outline-none"
      >
        <div className="flex items-start justify-between border-b border-[#E5E2DC] bg-white px-5 py-4 sm:px-8 sm:py-5">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#737373]">
              PIERCYN PLUG · HOW IT WORKS
            </span>
            <div className="mt-2 flex items-center gap-2" aria-label={`Step ${activeStep + 1} of ${steps.length}`}>
              {steps.map((_, index) => (
                <span
                  key={index}
                  className={`h-1.5 transition-all ${index === activeStep ? 'w-8 bg-[#141414]' : 'w-4 bg-[#D4D2CD]'}`}
                />
              ))}
              <span className="ml-2 text-[10px] font-semibold uppercase tracking-widest text-[#737373]">
                Step {activeStep + 1} of {steps.length}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close onboarding tutorial"
            className="p-2 text-[#737373] transition-colors hover:bg-[#F2F0EB] hover:text-[#141414]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-8 sm:px-12 sm:py-12">
          <div className="grid gap-8 sm:grid-cols-[112px_1fr] sm:items-start">
            <div className="flex h-20 w-20 items-center justify-center bg-[#141414] text-[#A48B71] sm:h-24 sm:w-24">
              <Icon className="h-9 w-9" strokeWidth={1.5} aria-hidden="true" />
            </div>
            <div className="space-y-5">
              <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#737373]">{step.eyebrow}</span>
              <h2 id="affiliate-onboarding-title" className="max-w-xl text-3xl font-serif font-medium leading-tight tracking-tight sm:text-5xl">
                {step.title}
              </h2>
              <p id="affiliate-onboarding-description" className="max-w-xl text-sm leading-7 text-[#555555] sm:text-base">
                {step.description}
              </p>
              {activeStep === 3 && (
                <div className="grid max-w-md grid-cols-3 gap-2 pt-1 text-center">
                  {['1 order · ₦1,000', '5 orders · ₦5,000', '10 orders · ₦10,000'].map((example) => (
                    <div key={example} className="border border-[#E5E2DC] bg-white px-2 py-3 text-[10px] font-semibold uppercase tracking-wide text-[#141414]">
                      {example}
                    </div>
                  ))}
                </div>
              )}
              {activeStep === 4 && (
                <div className="flex items-start gap-2 border-l-2 border-[#A48B71] bg-white px-4 py-3 text-xs leading-5 text-[#555555]">
                  <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-[#141414]" aria-hidden="true" />
                  <span>No minimum withdrawal threshold applies to approved available earnings; the request must be greater than zero and within your available balance.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-[#E5E2DC] bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <button
            type="button"
            onClick={onClose}
            className="text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-[#737373] transition-colors hover:text-[#141414]"
          >
            Skip tutorial
          </button>
          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <button
              type="button"
              onClick={() => setActiveStep((current) => Math.max(current - 1, 0))}
              disabled={activeStep === 0}
              className="inline-flex items-center gap-2 border border-[#E5E2DC] px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#141414] transition-colors hover:border-[#141414] disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Back
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-2 bg-[#141414] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#262626]"
            >
              {isFinalStep ? 'Create my affiliate account' : 'Next'}
              {isFinalStep ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> : <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />}
            </button>
          </div>
        </div>

        {isFinalStep && (
          <div className="border-t border-[#E5E2DC] bg-[#F2F0EB] px-5 py-3 text-center sm:px-8">
            <button
              type="button"
              onClick={onLogin}
              className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#555555] underline decoration-[#A48B71] underline-offset-4 transition-colors hover:text-[#141414]"
            >
              I already have an account — sign in
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
