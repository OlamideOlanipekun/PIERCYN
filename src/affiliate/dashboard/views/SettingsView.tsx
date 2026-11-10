import React, { useState } from 'react';
import { AffiliateUser, AffiliateApiClient } from '../../../services/affiliateApi';
import {
  User,
  CreditCard,
  Building,
  Bell,
  ShieldCheck,
  Check,
  AlertCircle,
  FileText,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { GuidelinesModal } from '../../components/GuidelinesModal';

interface SettingsViewProps {
  user: AffiliateUser;
  onUpdateUser: (updatedUser: AffiliateUser) => void;
  onLogout: () => void;
  primaryReferralCode: string;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  onUpdateUser,
  onLogout,
  primaryReferralCode,
}) => {
  const [isGuidelinesOpen, setIsGuidelinesOpen] = useState(false);

  // Social form
  const [instagram, setInstagram] = useState(user.instagram || '');
  const [tiktok, setTiktok] = useState(user.tiktok || '');
  const [promotionChannels, setPromotionChannels] = useState(user.promotionChannels || '');
  const [audienceSize, setAudienceSize] = useState(user.audienceSize || '5K - 25K');
  const [isSavingSocial, setIsSavingSocial] = useState(false);
  const [socialSuccess, setSocialSuccess] = useState(false);

  // Bank Account form
  const [bankName, setBankName] = useState(user.bankName || '');
  const [accountNumber, setAccountNumber] = useState(user.accountNumber || '');
  const [accountName, setAccountName] = useState(user.accountName || '');
  const [isSavingBank, setIsSavingBank] = useState(false);
  const [bankSuccess, setBankSuccess] = useState(false);
  const [bankError, setBankError] = useState<string | null>(null);

  // Common Nigerian banks list
  const nigerianBanks = [
    'Access Bank',
    'Citibank Nigeria',
    'Ecobank Nigeria',
    'Fidelity Bank',
    'First Bank of Nigeria',
    'First City Monument Bank (FCMB)',
    'Guaranty Trust Bank (GTBank)',
    'Heritage Bank',
    'Jaiz Bank',
    'Keystone Bank',
    'Kuda Bank',
    'Moniepoint MFB',
    'OPay',
    'Palmpay',
    'Polaris Bank',
    'Providus Bank',
    'Stanbic IBTC Bank',
    'Standard Chartered Bank',
    'Sterling Bank',
    'SunTrust Bank',
    'Titan Trust Bank',
    'Union Bank of Nigeria',
    'United Bank for Africa (UBA)',
    'Unity Bank',
    'Wema Bank',
    'Zenith Bank',
  ];

  const handleSaveSocial = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSocial(true);
    try {
      const res = await AffiliateApiClient.updateProfile({
        instagram: instagram.trim() || undefined,
        tiktok: tiktok.trim() || undefined,
        promotionChannels: promotionChannels.trim() || undefined,
        audienceSize,
      });

      if (res.success && res.data) {
        onUpdateUser(res.data);
        setSocialSuccess(true);
        setTimeout(() => setSocialSuccess(false), 2500);
      }
    } catch {
      // ignore
    } finally {
      setIsSavingSocial(false);
    }
  };

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    setBankError(null);

    if (!bankName || !accountNumber || !accountName) {
      setBankError('Please fill in all bank account fields.');
      return;
    }

    if (accountNumber.length !== 10 || !/^\d+$/.test(accountNumber)) {
      setBankError('Nigerian bank account number must be exactly 10 digits.');
      return;
    }

    setIsSavingBank(true);
    try {
      const res = await AffiliateApiClient.updateProfile({
        bankName,
        accountNumber: accountNumber.trim(),
        accountName: accountName.trim(),
      });

      if (res.success && res.data) {
        onUpdateUser(res.data);
        setBankSuccess(true);
        setTimeout(() => setBankSuccess(false), 2500);
      } else {
        setBankError(res.error || 'Failed to update bank details.');
      }
    } catch (err: any) {
      setBankError(err.message || 'An error occurred while saving.');
    } finally {
      setIsSavingBank(false);
    }
  };

  return (
    <div className="space-y-10 animate-fade-up max-w-4xl mx-auto">
      {/* Header bar */}
      <div className="bg-white border border-[#E5E2DC] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <span className="text-[10px] uppercase tracking-[0.24em] font-semibold text-[#737373]">
            Preferences & Security
          </span>
          <h2 className="text-2xl font-serif font-medium text-[#141414]">
            Account Settings
          </h2>
          <p className="text-xs text-[#737373] mt-0.5">
            Manage your verified payout destination, social channels, and credentials.
          </p>
        </div>

        <button
          onClick={onLogout}
          className="px-4 py-2 border border-[#E5E2DC] hover:border-[#7F1D1D] text-[#7F1D1D] text-xs uppercase tracking-wider font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" /> Sign Out
        </button>
      </div>

      {/* Account Profile Card */}
      <div className="bg-white border border-[#E5E2DC] p-6 sm:p-8 shadow-sm space-y-6">
        <div className="border-b border-[#E5E2DC] pb-4 flex items-center justify-between">
          <div>
            <h3 className="font-serif font-medium text-base text-[#141414]">
              Creator Identity
            </h3>
            <p className="text-xs text-[#737373]">Your legal and registered partner details.</p>
          </div>
          <span className="px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-semibold bg-[#141414] text-white">
            {user.status}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          <div>
            <span className="text-[#737373] block mb-1">Full Legal Name</span>
            <div className="font-semibold text-sm text-[#141414] bg-[#FAF8F5] p-3 border border-[#E5E2DC]">
              {user.firstName} {user.lastName}
            </div>
          </div>
          <div>
            <span className="text-[#737373] block mb-1">Registered Email</span>
            <div className="font-semibold text-sm text-[#141414] bg-[#FAF8F5] p-3 border border-[#E5E2DC] truncate">
              {user.email}
            </div>
          </div>
          <div>
            <span className="text-[#737373] block mb-1">Primary Referral Code</span>
            <div className="font-mono font-bold text-sm text-[#141414] bg-[#FAF8F5] p-3 border border-[#E5E2DC]">
              {primaryReferralCode}
            </div>
          </div>
          <div>
            <span className="text-[#737373] block mb-1">Commission Rate</span>
            <div className="font-semibold text-sm text-[#141414] bg-[#FAF8F5] p-3 border border-[#E5E2DC]">
              ₦1,000 per delivered referral
            </div>
          </div>
        </div>
      </div>

      {/* Bank Account Destination */}
      <div className="bg-white border border-[#E5E2DC] p-6 sm:p-8 shadow-sm space-y-6">
        <div className="border-b border-[#E5E2DC] pb-4">
          <div className="flex items-center gap-2">
            <h3 className="font-serif font-medium text-base text-[#141414]">
              Disbursement Bank Account
            </h3>
            <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 bg-[#FAF8F5] border border-[#E5E2DC] text-[#737373] font-semibold">
              Nigeria NIP
            </span>
          </div>
          <p className="text-xs text-[#737373] mt-0.5">
            Commissions requested for withdrawal are settled directly to this account within 24 to 48 hours.
          </p>
        </div>

        {bankError && (
          <div className="p-3 bg-[#FDF2F2] border border-[#FCA5A5] text-[#7F1D1D] text-xs">
            {bankError}
          </div>
        )}

        {bankSuccess && (
          <div className="p-3 bg-[#FAF8F5] border border-[#141414] text-[#141414] text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4" /> Bank account details saved successfully.
          </div>
        )}

        <form onSubmit={handleSaveBank} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-wider font-semibold text-[#141414]">
                Bank Name *
              </label>
              <select
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E2DC] focus:border-[#141414] text-xs text-[#141414] focus:outline-none"
              >
                <option value="">Select your bank...</option>
                {nigerianBanks.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-wider font-semibold text-[#141414]">
                Account Number (10 digits) *
              </label>
              <input
                type="text"
                required
                maxLength={10}
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="0123456789"
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E2DC] focus:border-[#141414] text-xs font-mono text-[#141414] focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-wider font-semibold text-[#141414]">
              Account Beneficiary Name *
            </label>
            <input
              type="text"
              required
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="As registered on bank account"
              className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E2DC] focus:border-[#141414] text-xs text-[#141414] focus:outline-none"
            />
            <span className="text-[10px] text-[#737373]">
              Must match the name on your government-issued ID for financial compliance.
            </span>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSavingBank}
              className="px-6 py-2.5 bg-[#141414] hover:bg-[#262626] text-white text-xs uppercase tracking-wider font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSavingBank ? 'Saving...' : 'Save Bank Account'}
            </button>
          </div>
        </form>
      </div>

      {/* Social & Channel Details */}
      <div className="bg-white border border-[#E5E2DC] p-6 sm:p-8 shadow-sm space-y-6">
        <div className="border-b border-[#E5E2DC] pb-4">
          <h3 className="font-serif font-medium text-base text-[#141414]">
            Promotion & Audience Channels
          </h3>
          <p className="text-xs text-[#737373]">Keep your social handles updated for custom brand seeding and PR drops.</p>
        </div>

        {socialSuccess && (
          <div className="p-3 bg-[#FAF8F5] border border-[#141414] text-[#141414] text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4" /> Channels updated successfully.
          </div>
        )}

        <form onSubmit={handleSaveSocial} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-wider font-semibold text-[#141414]">
                Instagram Handle
              </label>
              <input
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="@yourhandle"
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E2DC] focus:border-[#141414] text-xs text-[#141414] focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-wider font-semibold text-[#141414]">
                TikTok Handle
              </label>
              <input
                type="text"
                value={tiktok}
                onChange={(e) => setTiktok(e.target.value)}
                placeholder="@yourtiktok"
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E2DC] focus:border-[#141414] text-xs text-[#141414] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-wider font-semibold text-[#141414]">
                Primary Channels
              </label>
              <input
                type="text"
                value={promotionChannels}
                onChange={(e) => setPromotionChannels(e.target.value)}
                placeholder="Instagram Stories, WhatsApp"
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E2DC] focus:border-[#141414] text-xs text-[#141414] focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-wider font-semibold text-[#141414]">
                Audience Size
              </label>
              <select
                value={audienceSize}
                onChange={(e) => setAudienceSize(e.target.value)}
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E2DC] focus:border-[#141414] text-xs text-[#141414] focus:outline-none"
              >
                <option value="Under 1K">Under 1,000</option>
                <option value="1K - 5K">1,000 – 5,000</option>
                <option value="5K - 25K">5,000 – 25,000</option>
                <option value="25K - 100K">25,000 – 100,000</option>
                <option value="100K+">100,000+</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSavingSocial}
              className="px-6 py-2.5 bg-[#141414] hover:bg-[#262626] text-white text-xs uppercase tracking-wider font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSavingSocial ? 'Saving...' : 'Update Channels'}
            </button>
          </div>
        </form>
      </div>

      {/* Guidelines Accordion */}
      <div className="p-6 bg-[#FAF8F5] border border-[#E5E2DC] flex items-center justify-between">
        <div>
          <h4 className="font-serif font-medium text-base text-[#141414]">
            Affiliate Operating Guidelines
          </h4>
          <p className="text-xs text-[#737373]">
            Review commission policies, return hold windows, and ethical promotion standards.
          </p>
        </div>
        <button
          onClick={() => setIsGuidelinesOpen(true)}
          className="px-4 py-2 border border-[#141414] text-xs uppercase tracking-wider font-semibold text-[#141414] hover:bg-white"
        >
          View Guidelines
        </button>
      </div>

      <GuidelinesModal isOpen={isGuidelinesOpen} onClose={() => setIsGuidelinesOpen(false)} />
    </div>
  );
};

