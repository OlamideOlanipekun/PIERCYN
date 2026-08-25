import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { X, Calendar, MapPin, Check, Clock, User, Mail, Phone, Sparkles } from 'lucide-react';

export const ConciergeModal: React.FC = () => {
  const { isConciergeOpen, setIsConciergeOpen, showToast } = useShop();

  const [location, setLocation] = useState<'Victoria Island Atelier' | 'Surulere Creative Studio'>('Victoria Island Atelier');
  const [sessionType, setSessionType] = useState('Bespoke Fitting & Silhouette Consultation');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('14:00');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isBooked, setIsBooked] = useState(false);

  if (!isConciergeOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      showToast('Please provide your name and contact details.');
      return;
    }
    setIsBooked(true);
    showToast('Your private Atelier appointment request has been scheduled.');
  };

  const handleClose = () => {
    setIsBooked(false);
    setIsConciergeOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      {/* Backdrop */}
      <div 
        onClick={handleClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      <div className="min-h-full flex items-center justify-center p-3 sm:p-6 lg:p-10">
        <div className="relative w-full max-w-2xl bg-[#F2F0EB] text-[#141414] shadow-2xl border border-[#E3DEC3] rounded-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="p-6 sm:p-8 border-b border-[#E3DEC3] flex items-center justify-between bg-[#EBE7DF]">
            <div>
              <span className="text-[10px] uppercase tracking-[0.3em] font-mono text-[#7A7771] block mb-1">
                PRIVATE CLIENT SERVICES
              </span>
              <h2 className="font-editorial text-2xl sm:text-3xl uppercase tracking-tight text-[#141414]">
                BOOK ATELIER FITTING
              </h2>
            </div>

            <button
              onClick={handleClose}
              className="min-w-[44px] min-h-[44px] rounded-full border border-[#141414]/20 hover:bg-[#141414]/10 transition-colors cursor-pointer flex items-center justify-center"
              aria-label="Close Concierge"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6 sm:p-8">
            {isBooked ? (
              <div className="py-8 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-[#141414] text-[#F2F0EB] flex items-center justify-center mx-auto text-xl">
                  ✓
                </div>
                <h3 className="font-editorial text-2xl uppercase tracking-tight">
                  APPOINTMENT SCHEDULED
                </h3>
                <p className="text-[13px] text-[#5C5954] font-light max-w-md mx-auto leading-relaxed">
                  Thank you, <strong className="font-medium text-[#141414]">{name}</strong>. Our Head Stylist at the <strong className="font-medium text-[#141414]">{location}</strong> will prepare the complete 450 GSM foundation and private capsule rack for your arrival.
                </p>
                <div className="p-4 bg-[#EAE5DA] rounded-xl border border-[#D5CFBF] text-[11px] font-mono text-left max-w-sm mx-auto space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-[#7A7771]">VENUE:</span>
                    <span className="font-semibold">{location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#7A7771]">DATE & TIME:</span>
                    <span>{date || 'Upcoming Saturday'} at {time} WAT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#7A7771]">EXPERIENCE:</span>
                    <span>{sessionType}</span>
                  </div>
                </div>

                <button
                  onClick={handleClose}
                  className="mt-4 min-h-[44px] px-8 py-3 rounded-full bg-[#141414] text-[#F2F0EB] text-[11px] uppercase tracking-widest font-mono hover:bg-black transition-colors"
                >
                  RETURN TO ATELIER
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Atelier Location Selection */}
                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-[#7A7771] block">
                    1. SELECT ATELIER DESTINATION
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { name: 'Victoria Island Atelier' as const, desc: 'Flagship Sanctuary & Full Capsule Collection' },
                      { name: 'Surulere Creative Studio' as const, desc: 'Original Design Lab & Tailoring Workshop' }
                    ].map((loc) => (
                      <button
                        type="button"
                        key={loc.name}
                        onClick={() => setLocation(loc.name)}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                          location === loc.name
                            ? 'border-[#141414] bg-[#141414] text-[#F2F0EB] shadow-xs'
                            : 'border-[#D5CFBF] bg-[#FAF8F5] text-[#141414] hover:border-[#141414]'
                        }`}
                      >
                        <div className="flex items-center justify-between font-mono text-[11px] font-semibold uppercase">
                          <span>{loc.name}</span>
                          {location === loc.name && <Check className="w-3.5 h-3.5 text-[#E3DEC3]" />}
                        </div>
                        <p className={`text-[10px] mt-1 line-clamp-2 ${location === loc.name ? 'text-white/70' : 'text-[#7A7771]'}`}>
                          {loc.desc}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-[#7A7771] block">
                      2. PREFERRED DATE
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full min-h-[44px] bg-[#FAF8F5] border border-[#D5CFBF] px-4 py-2 rounded-xl text-[11px] font-mono focus:outline-none focus:border-[#141414]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-[#7A7771] block">
                      3. TIME SLOT (WAT / UTC+1)
                    </label>
                    <select
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full min-h-[44px] bg-[#FAF8F5] border border-[#D5CFBF] px-4 py-2 rounded-xl text-[11px] font-mono focus:outline-none focus:border-[#141414]"
                    >
                      <option value="11:00">11:00 AM WAT</option>
                      <option value="13:00">01:00 PM WAT</option>
                      <option value="15:00">03:00 PM WAT</option>
                      <option value="17:00">05:00 PM WAT</option>
                      <option value="19:00">07:00 PM WAT (Evening Reception)</option>
                    </select>
                  </div>
                </div>

                {/* Client Contact Info */}
                <div className="space-y-3 pt-1 border-t border-[#E3DEC3]">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-[#7A7771] block">
                    4. GUEST CREDENTIALS
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="FULL NAME"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full min-h-[44px] bg-[#FAF8F5] border border-[#D5CFBF] px-4 py-2 rounded-xl text-[11px] uppercase font-mono tracking-wider focus:outline-none focus:border-[#141414]"
                    />
                    <input
                      type="email"
                      placeholder="EMAIL"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full min-h-[44px] bg-[#FAF8F5] border border-[#D5CFBF] px-4 py-2 rounded-xl text-[11px] uppercase font-mono tracking-wider focus:outline-none focus:border-[#141414]"
                    />
                    <input
                      type="tel"
                      placeholder="PHONE / WHATSAPP"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full min-h-[44px] bg-[#FAF8F5] border border-[#D5CFBF] px-4 py-2 rounded-xl text-[11px] uppercase font-mono tracking-wider focus:outline-none focus:border-[#141414]"
                    />
                  </div>
                </div>

                {/* Submit Action with safe area padding */}
                <div className="pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
                  <button
                    type="submit"
                    className="w-full h-12 min-h-[48px] px-8 rounded-full bg-[#141414] text-[#F2F0EB] text-[12px] uppercase tracking-[0.16em] font-sans font-semibold hover:bg-black transition-all cursor-pointer shadow-xs active:scale-[0.98] inline-flex items-center justify-center"
                  >
                    CONFIRM PRIVATE APPOINTMENT →
                  </button>
                  <span className="block text-center text-[10px] uppercase font-sans tracking-[0.1em] text-[#7A7771] mt-2 font-medium">
                    COMPLIMENTARY PRIVATE CONSULTATION • NO PURCHASE OBLIGATION
                  </span>
                </div>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
