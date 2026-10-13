import React from 'react';
import { ActivePageView } from '../types';
import { ShieldCheck, ChevronRight, Lock, Database, UserCheck, EyeOff } from 'lucide-react';

interface PrivacyPageProps {
  onSelectPage: (page: ActivePageView) => void;
}

export const PrivacyPage: React.FC<PrivacyPageProps> = ({ onSelectPage }) => {
  return (
    <main className="w-full bg-[#F2F0EB] text-[#141414] min-h-screen pt-24 sm:pt-28 pb-20 font-sans">
      <div className="piercyn-container max-w-4xl mx-auto">
        
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-mono tracking-[0.16em] uppercase text-[#7A7771] mb-8">
          <button onClick={() => onSelectPage('home')} className="hover:text-[#141414] cursor-pointer">
            HOME
          </button>
          <ChevronRight className="w-3 h-3 text-[#DAD8D1]" />
          <span className="text-[#141414] font-semibold">PRIVACY POLICY</span>
        </nav>

        {/* Page Header */}
        <header className="mb-12 border-b border-[#DAD8D1] pb-8">
          <span className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#7A7771] block mb-2 font-semibold">
            DATA PRIVACY & COMPLIANCE
          </span>
          <h1 className="font-editorial text-4xl sm:text-5xl lg:text-6xl text-[#141414] italic font-normal tracking-tight">
            Privacy Policy
          </h1>
          <p className="mt-4 text-[14px] sm:text-[15px] text-[#4A4844] max-w-2xl leading-relaxed">
            At PIERCYN, we respect your privacy. This policy outlines how your information is handled during guest checkout, order fulfillment, and ongoing customer communication.
          </p>
          <span className="text-[11px] font-mono text-[#7A7771] block mt-4">
            LAST REVISED: OCTOBER 2026 · NIGERIA DATA PROTECTION ACT (NDPA/NDPR) COMPLIANT
          </span>
        </header>

        {/* Policy Content Sections */}
        <div className="space-y-10 text-[14px] sm:text-[15px] leading-relaxed text-[#3A3834] font-sans">
          
          {/* Section 1 */}
          <section className="bg-[#EAE6DD] border border-[#DAD6CC] rounded-2xl p-6 sm:p-8">
            <h2 className="font-editorial text-2xl sm:text-3xl italic text-[#141414] mb-4">
              1. Information We Collect
            </h2>
            <p className="mb-3">
              PIERCYN prioritizes friction-free guest checkout. We only collect details essential to assembling, billing, and delivering your order:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-[#4A4844]">
              <li><strong>Contact Identifiers:</strong> Your full name, email address, phone number, and WhatsApp contact number.</li>
              <li><strong>Fulfillment & Logistics Data:</strong> Your physical delivery address, city, and state within Nigeria.</li>
              <li><strong>Order Transaction History:</strong> Pieces ordered, sizes, variant selections, quantities, and transaction references.</li>
              <li><strong>Technical Session Data:</strong> Ephemeral session tokens and device metadata used to secure your order and prevent fraudulent multiple submissions.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="bg-[#EAE6DD] border border-[#DAD6CC] rounded-2xl p-6 sm:p-8">
            <h2 className="font-editorial text-2xl sm:text-3xl italic text-[#141414] mb-4">
              2. How Your Data is Used
            </h2>
            <p className="mb-3">
              Your personal information is utilized strictly for lawful e-commerce operations:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-[#4A4844]">
              <li>Authoritative order calculation, inventory reservation, and dispatch from our Lagos studio.</li>
              <li>Sending live order confirmations, payment receipts, and dispatch updates via email and WhatsApp.</li>
              <li>Coordinating with localized logistics riders and nationwide partner couriers to ensure accurate doorstep delivery.</li>
              <li>Resolving return, exchange, or sizing inquiries requested through our concierge channels.</li>
              <li>Attributing promotional referral commissions for authorized affiliate creators when referral links are used.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="bg-[#EAE6DD] border border-[#DAD6CC] rounded-2xl p-6 sm:p-8">
            <h2 className="font-editorial text-2xl sm:text-3xl italic text-[#141414] mb-4">
              3. Payment Security & Financial Data
            </h2>
            <p className="text-xs sm:text-sm text-[#4A4844] leading-relaxed mb-3">
              <strong>PIERCYN never stores, logs, or views your debit card details, CVV, or banking passwords.</strong> Online payments are processed directly through <strong>Paystack</strong>, a PCI-DSS Level 1 certified gateway. Direct bank transfers are handled securely between your banking application and our verified Lagos commercial corporate account.
            </p>
          </section>

          {/* Section 4 */}
          <section className="bg-[#EAE6DD] border border-[#DAD6CC] rounded-2xl p-6 sm:p-8">
            <h2 className="font-editorial text-2xl sm:text-3xl italic text-[#141414] mb-4">
              4. Third-Party Sharing
            </h2>
            <p className="mb-3 text-xs sm:text-sm text-[#4A4844]">
              We do not sell, rent, or monetize your personal data. We disclose operational data only to trusted infrastructure providers:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-[#4A4844]">
              <li><strong>Courier Partners:</strong> Name, phone number, and address are shared with verified dispatch couriers strictly to deliver packages.</li>
              <li><strong>Hosting & Database:</strong> Secure encrypted server and database infrastructure used to maintain order logs.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="bg-[#EAE6DD] border border-[#DAD6CC] rounded-2xl p-6 sm:p-8">
            <h2 className="font-editorial text-2xl sm:text-3xl italic text-[#141414] mb-4">
              5. Data Retention & Your Rights
            </h2>
            <p className="text-xs sm:text-sm text-[#4A4844] leading-relaxed mb-3">
              Order records are retained in compliance with Nigerian tax and accounting standards. Under applicable data privacy laws, you possess the right to:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-[#4A4844]">
              <li>Request an extract of personal data stored regarding your orders.</li>
              <li>Request correction of inaccurate shipping or contact records.</li>
              <li>Request deletion of contact records where legal retention requirements allow.</li>
            </ul>
            <p className="mt-4 text-xs text-[#6E6B65]">
              To submit a privacy inquiry, contact our Data Protection Officer at <a href="mailto:hello@piercyn.com" className="underline text-[#141414] font-semibold">hello@piercyn.com</a>.
            </p>
          </section>

        </div>

      </div>
    </main>
  );
};
