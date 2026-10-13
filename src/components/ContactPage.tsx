import React, { useState } from 'react';
import { ActivePageView } from '../types';
import { 
  MessageCircle, 
  Mail, 
  MapPin, 
  Clock, 
  ChevronRight, 
  Send, 
  CheckCircle2, 
  Instagram,
  ArrowRight
} from 'lucide-react';

interface ContactPageProps {
  onSelectPage: (page: ActivePageView) => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ onSelectPage }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'general',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setFormError('Please enter your name, email address, and message.');
      return;
    }

    setIsSubmitting(true);
    // Simulate real client submission with immediate response
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: 'general',
        message: '',
      });
    }, 700);
  };

  const whatsappGeneralMessage = encodeURIComponent(
    'Hello PIERCYN! I would like to get in touch regarding your collection.'
  );

  return (
    <main className="w-full bg-[#F2F0EB] text-[#141414] min-h-screen pt-24 sm:pt-28 pb-20 font-sans">
      <div className="piercyn-container max-w-5xl mx-auto">
        
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-mono tracking-[0.16em] uppercase text-[#7A7771] mb-8">
          <button onClick={() => onSelectPage('home')} className="hover:text-[#141414] cursor-pointer">
            HOME
          </button>
          <ChevronRight className="w-3 h-3 text-[#DAD8D1]" />
          <span className="text-[#141414] font-semibold">CONTACT US</span>
        </nav>

        {/* Page Header */}
        <header className="mb-12 border-b border-[#DAD8D1] pb-8">
          <span className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#7A7771] block mb-2 font-semibold">
            COMMUNICATIONS & CONCIERGE
          </span>
          <h1 className="font-editorial text-4xl sm:text-5xl lg:text-6xl text-[#141414] italic font-normal tracking-tight">
            Contact PIERCYN
          </h1>
          <p className="mt-4 text-[14px] sm:text-[15px] text-[#4A4844] max-w-2xl leading-relaxed">
            Have questions about fit, fabric specifications, dispatch timelines, or custom inquiries? Reach our Lagos team directly via WhatsApp, email, or using the contact form below.
          </p>
        </header>

        {/* 2-Column Layout: Direct Channels (Col 5) + Form (Col 7) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          
          {/* Direct Channels */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* WhatsApp Priority */}
            <div className="bg-[#EAE6DD] border border-[#DAD6CC] rounded-2xl p-6">
              <div className="w-10 h-10 rounded-full bg-emerald-800 text-white flex items-center justify-center mb-4">
                <MessageCircle className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase text-emerald-800 block mb-1">
                FASTEST RESPONSE
              </span>
              <h3 className="font-editorial text-2xl italic text-[#141414] mb-2">
                WhatsApp Concierge
              </h3>
              <p className="text-xs text-[#55524D] leading-relaxed mb-4">
                Connect directly with our stylists and operations team. Typical response time is under 15 minutes during operating hours.
              </p>
              <a
                href={`https://wa.me/2348000000000?text=${whatsappGeneralMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#141414] text-[#F2F0EB] text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors"
              >
                <span>Chat on WhatsApp</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Email & Studio Info */}
            <div className="bg-[#EAE6DD] border border-[#DAD6CC] rounded-2xl p-6 space-y-4 text-xs font-sans text-[#4A4844]">
              
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-[#141414] mt-0.5 shrink-0" />
                <div>
                  <strong className="block text-[#141414] uppercase font-mono tracking-wider text-[11px]">Email</strong>
                  <a href="mailto:hello@piercyn.com" className="hover:underline">
                    hello@piercyn.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-3 border-t border-[#DAD6CC]">
                <MapPin className="w-4 h-4 text-[#141414] mt-0.5 shrink-0" />
                <div>
                  <strong className="block text-[#141414] uppercase font-mono tracking-wider text-[11px]">Studio & Dispatch Hub</strong>
                  <span>Victoria Island / Lekki Phase 1, Lagos, Nigeria</span>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-3 border-t border-[#DAD6CC]">
                <Clock className="w-4 h-4 text-[#141414] mt-0.5 shrink-0" />
                <div>
                  <strong className="block text-[#141414] uppercase font-mono tracking-wider text-[11px]">Operating Hours</strong>
                  <span>Monday – Saturday: 9:00 AM – 6:00 PM WAT</span>
                  <span className="block text-[11px] text-[#7A7771]">Sunday: Closed (Orders dispatched Monday)</span>
                </div>
              </div>

            </div>

            {/* Socials */}
            <div className="bg-[#EAE6DD] border border-[#DAD6CC] rounded-2xl p-6">
              <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-[#7A7771] block mb-3 font-semibold">
                SOCIAL PRESENCE
              </span>
              <div className="flex gap-4 text-xs">
                <a
                  href="https://instagram.com/piercyn"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 font-semibold text-[#141414] hover:underline"
                >
                  <Instagram className="w-4 h-4" />
                  <span>@piercyn</span>
                </a>
              </div>
            </div>

          </div>

          {/* Form */}
          <div className="lg:col-span-7 bg-[#EAE6DD] border border-[#DAD6CC] rounded-2xl p-6 sm:p-9">
            <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-[#7A7771] block mb-1 font-semibold">
              MESSAGE DISPATCH
            </span>
            <h2 className="font-editorial text-2xl sm:text-3xl italic text-[#141414] mb-6">
              Send an Inquiry
            </h2>

            {isSuccess ? (
              <div className="py-8 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="font-editorial text-2xl italic text-[#141414]">
                  Message Received
                </h3>
                <p className="text-xs text-[#55524D] max-w-md mx-auto leading-relaxed">
                  Thank you for reaching out. A member of the PIERCYN team will respond to your email address within 24 hours.
                </p>
                <button
                  type="button"
                  onClick={() => setIsSuccess(false)}
                  className="mt-4 px-6 py-2.5 rounded-full bg-[#141414] text-[#F2F0EB] text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors cursor-pointer"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                {formError && (
                  <p className="p-3 rounded-lg bg-red-100 text-red-800 font-mono text-[11px]">
                    {formError}
                  </p>
                )}

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-[#7A7771] mb-1 font-semibold">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Damilola Okon"
                    className="w-full bg-white/70 border border-[#DAD6CC] rounded-lg px-3.5 py-2.5 text-xs text-[#141414] focus:outline-none focus:border-[#141414]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-[#7A7771] mb-1 font-semibold">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="damilola@example.com"
                      className="w-full bg-white/70 border border-[#DAD6CC] rounded-lg px-3.5 py-2.5 text-xs text-[#141414] focus:outline-none focus:border-[#141414]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-[#7A7771] mb-1 font-semibold">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="0802 345 6789"
                      className="w-full bg-white/70 border border-[#DAD6CC] rounded-lg px-3.5 py-2.5 text-xs text-[#141414] focus:outline-none focus:border-[#141414]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-[#7A7771] mb-1 font-semibold">
                    Topic / Subject
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full bg-white/70 border border-[#DAD6CC] rounded-lg px-3.5 py-2.5 text-xs text-[#141414] focus:outline-none focus:border-[#141414]"
                  >
                    <option value="general">General Inquiry</option>
                    <option value="sizing">Sizing & Fit Advice</option>
                    <option value="order">Existing Order Status</option>
                    <option value="exchange">Return or Exchange</option>
                    <option value="collab">Creative / Influencer Collaboration</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-[#7A7771] mb-1 font-semibold">
                    Your Message *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="How can we assist you today?"
                    className="w-full bg-white/70 border border-[#DAD6CC] rounded-lg px-3.5 py-2.5 text-xs text-[#141414] focus:outline-none focus:border-[#141414]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-full bg-[#141414] text-[#F2F0EB] text-xs font-bold uppercase tracking-[0.18em] hover:bg-black transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <span>DISPATCHING…</span>
                  ) : (
                    <>
                      <span>SEND INQUIRY</span>
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            )}

          </div>

        </div>

      </div>
    </main>
  );
};
