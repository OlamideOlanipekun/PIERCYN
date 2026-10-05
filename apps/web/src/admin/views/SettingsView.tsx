import React, { useState, useEffect } from 'react';
import { AdminSettingsData } from '../types';
import { AdminApi } from '../api';
import { useAdminAuth } from '../context/AdminAuthContext';
import {
  Settings,
  Truck,
  CreditCard,
  Building,
  Shield,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  Database,
  Sparkles,
} from 'lucide-react';

export const SettingsView: React.FC<{ onSeedSampleOrders?: () => void }> = ({
  onSeedSampleOrders,
}) => {
  const { admin } = useAdminAuth();
  const [settings, setSettings] = useState<AdminSettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [seeding, setSeeding] = useState(false);

  // Form local state
  const [storeName, setStoreName] = useState('');
  const [tagline, setTagline] = useState('');
  const [atelierAddress, setAtelierAddress] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [supportPhone, setSupportPhone] = useState('');
  const [freeShippingThreshold, setFreeShippingThreshold] = useState<number>(100000);
  const [lagosDeliveryFee, setLagosDeliveryFee] = useState<number>(2500);
  const [nationwideDeliveryFee, setNationwideDeliveryFee] = useState<number>(4500);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(5);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await AdminApi.getSettings();
      setSettings(data);
      setStoreName(data.storeName);
      setTagline(data.tagline);
      setAtelierAddress(data.atelierAddress);
      setSupportEmail(data.supportEmail);
      setSupportPhone(data.supportPhone);
      setFreeShippingThreshold(data.freeShippingThresholdNGN);
      setLagosDeliveryFee(data.lagosDeliveryFeeNGN);
      setNationwideDeliveryFee(data.nationwideDeliveryFeeNGN);
      setLowStockThreshold(data.lowStockThreshold);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to load store settings.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage(null);
      const updated = await AdminApi.updateSettings({
        storeName,
        tagline,
        atelierAddress,
        supportEmail,
        supportPhone,
        freeShippingThresholdNGN: Number(freeShippingThreshold),
        lagosDeliveryFeeNGN: Number(lagosDeliveryFee),
        nationwideDeliveryFeeNGN: Number(nationwideDeliveryFee),
        lowStockThreshold: Number(lowStockThreshold),
      });
      setSettings(updated);
      setMessage({ type: 'success', text: 'Store operational parameters updated successfully.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update settings.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSeedOrders = async () => {
    try {
      setSeeding(true);
      setMessage(null);
      const res = await AdminApi.seedSampleOrders();
      setMessage({ type: 'success', text: res.message || 'Sample validation orders generated.' });
      if (onSeedSampleOrders) onSeedSampleOrders();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to seed sample orders.' });
    } finally {
      setSeeding(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-6 h-6 animate-spin text-[#F2F0EB]" />
        <span className="text-xs font-mono text-neutral-400">RETRIEVING ATELIER SETTINGS...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8 font-sans">
      <div>
        <span className="text-[10px] font-mono uppercase tracking-widest text-[#A3A199] block mb-0.5">
          V1 CONFIGURATION
        </span>
        <h2 className="text-xl font-bold text-[#F2F0EB]">Operations & Delivery Settings</h2>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2.5 ${
            message.type === 'success'
              ? 'bg-emerald-950/40 border border-emerald-800 text-emerald-200'
              : 'bg-red-950/40 border border-red-800 text-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Store Identity */}
        <div className="p-6 rounded-2xl bg-[#141414] border border-[#262626] space-y-4">
          <div className="flex items-center gap-2 border-b border-[#242424] pb-3">
            <Building className="w-4 h-4 text-[#A3A199]" />
            <h3 className="font-bold text-sm text-[#F2F0EB]">Store Information</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[11px] font-mono text-[#A3A199] uppercase mb-1">
                Brand Name
              </label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-[#2D2D2D] rounded-lg px-3 py-2 text-[#F2F0EB] outline-hidden font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-[#A3A199] uppercase mb-1">
                Atelier Tagline
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-[#2D2D2D] rounded-lg px-3 py-2 text-[#F2F0EB] outline-hidden font-editorial italic"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-mono text-[#A3A199] uppercase mb-1">
                Atelier Physical Dispatch Location
              </label>
              <input
                type="text"
                value={atelierAddress}
                onChange={(e) => setAtelierAddress(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-[#2D2D2D] rounded-lg px-3 py-2 text-[#F2F0EB] outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-[#A3A199] uppercase mb-1">
                Operations Support Email
              </label>
              <input
                type="email"
                required
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-[#2D2D2D] rounded-lg px-3 py-2 text-[#F2F0EB] outline-hidden font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-[#A3A199] uppercase mb-1">
                Dispatch Phone / WhatsApp
              </label>
              <input
                type="text"
                required
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-[#2D2D2D] rounded-lg px-3 py-2 text-[#F2F0EB] outline-hidden font-mono"
              />
            </div>
          </div>
        </div>

        {/* 2. Delivery & Fulfillment Rules */}
        <div className="p-6 rounded-2xl bg-[#141414] border border-[#262626] space-y-4">
          <div className="flex items-center gap-2 border-b border-[#242424] pb-3">
            <Truck className="w-4 h-4 text-[#A3A199]" />
            <h3 className="font-bold text-sm text-[#F2F0EB]">Fulfillment & Delivery Settings</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            <div>
              <label className="block text-[11px] text-[#A3A199] uppercase mb-1">
                Free Delivery Threshold (NGN ₦)
              </label>
              <input
                type="number"
                min={0}
                step={5000}
                required
                value={freeShippingThreshold}
                onChange={(e) => setFreeShippingThreshold(Number(e.target.value))}
                className="w-full bg-[#0A0A0A] border border-[#2D2D2D] rounded-lg px-3 py-2 text-[#F2F0EB] outline-hidden font-bold"
              />
              <span className="text-[10px] text-neutral-500 font-sans block mt-1">
                Cart subtotal qualifying for ₦0 delivery fee.
              </span>
            </div>

            <div>
              <label className="block text-[11px] text-[#A3A199] uppercase mb-1">
                Lagos Express Fee (NGN ₦)
              </label>
              <input
                type="number"
                min={0}
                step={500}
                required
                value={lagosDeliveryFee}
                onChange={(e) => setLagosDeliveryFee(Number(e.target.value))}
                className="w-full bg-[#0A0A0A] border border-[#2D2D2D] rounded-lg px-3 py-2 text-[#F2F0EB] outline-hidden"
              />
              <span className="text-[10px] text-neutral-500 font-sans block mt-1">
                24–48 hours direct dispatch within Lagos.
              </span>
            </div>

            <div>
              <label className="block text-[11px] text-[#A3A199] uppercase mb-1">
                Nationwide Fee (NGN ₦)
              </label>
              <input
                type="number"
                min={0}
                step={500}
                required
                value={nationwideDeliveryFee}
                onChange={(e) => setNationwideDeliveryFee(Number(e.target.value))}
                className="w-full bg-[#0A0A0A] border border-[#2D2D2D] rounded-lg px-3 py-2 text-[#F2F0EB] outline-hidden"
              />
              <span className="text-[10px] text-neutral-500 font-sans block mt-1">
                All 35 Nigerian States outside Lagos.
              </span>
            </div>
          </div>
        </div>

        {/* 3. Operational Rules & Alert Thresholds */}
        <div className="p-6 rounded-2xl bg-[#141414] border border-[#262626] space-y-4">
          <div className="flex items-center gap-2 border-b border-[#242424] pb-3">
            <Shield className="w-4 h-4 text-[#A3A199]" />
            <h3 className="font-bold text-sm text-[#F2F0EB]">Inventory Control Rules</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <label className="block text-[11px] text-[#A3A199] uppercase mb-1">
                Low Stock Threshold (Pieces)
              </label>
              <input
                type="number"
                min={1}
                max={50}
                required
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                className="w-full bg-[#0A0A0A] border border-[#2D2D2D] rounded-lg px-3 py-2 text-[#F2F0EB] outline-hidden font-bold"
              />
              <span className="text-[10px] text-neutral-500 font-sans block mt-1">
                Variants at or below this count trigger dashboard operational alerts.
              </span>
            </div>

            <div>
              <label className="block text-[11px] text-[#A3A199] uppercase mb-1">
                Checkout Reservation TTL
              </label>
              <input
                type="text"
                disabled
                value="15 Minutes (Active Lock)"
                className="w-full bg-[#0A0A0A] border border-[#2D2D2D] rounded-lg px-3 py-2 text-neutral-400 outline-hidden cursor-not-allowed"
              />
              <span className="text-[10px] text-neutral-500 font-sans block mt-1">
                Overselling protection during checkout payment authorization.
              </span>
            </div>
          </div>
        </div>

        {/* 4. Connectivity & Provider Status (Never exposes secret keys) */}
        <div className="p-6 rounded-2xl bg-[#141414] border border-[#262626] space-y-4">
          <div className="flex items-center gap-2 border-b border-[#242424] pb-3">
            <CreditCard className="w-4 h-4 text-[#A3A199]" />
            <h3 className="font-bold text-sm text-[#F2F0EB]">Integrations Status</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-3.5 rounded-lg bg-white/5 border border-white/5 space-y-1">
              <span className="text-[10px] text-neutral-400 uppercase block">
                PAYSTACK GATEWAY STATUS
              </span>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="font-bold text-[#F2F0EB]">
                  {settings?.paymentEnvironment} MODE CONNECTED
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 font-sans">
                Webhook HMAC signature verification active.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-white/5 border border-white/5 space-y-1">
              <span className="text-[10px] text-neutral-400 uppercase block">
                COURIER DISPATCH INTEGRATIONS
              </span>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="font-bold text-[#F2F0EB]">KWIK & GIG LOGISTICS READY</span>
              </div>
              <p className="text-[11px] text-neutral-500 font-sans">
                Waybill tracking and dispatch manifest enabled.
              </p>
            </div>
          </div>
        </div>

        {/* 5. Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#F2F0EB] hover:bg-white text-[#0A0A0A] font-bold font-mono text-xs uppercase tracking-widest rounded-lg transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>SAVING SETTINGS...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>SAVE CONFIGURATION</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* 6. Admin Account Details & Cycle 1 Test Sandbox */}
      <div className="p-6 rounded-2xl bg-[#141414] border border-[#262626] space-y-4">
        <div className="flex items-center gap-2 border-b border-[#242424] pb-3">
          <Database className="w-4 h-4 text-[#A3A199]" />
          <h3 className="font-bold text-sm text-[#F2F0EB]">Cycle 1 Validation Utilities</h3>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
          <div>
            <h4 className="font-semibold text-[#F2F0EB]">Generate Sample Cycle 1 Orders</h4>
            <p className="text-neutral-400 text-[11px] font-sans mt-0.5 max-w-lg">
              Populates realistic validation orders across different states (Delivered, Processing, Packed, and Pending Payment) with authentic Nigerian customer details for end-to-end fulfillment validation.
            </p>
          </div>

          <button
            type="button"
            disabled={seeding}
            onClick={handleSeedOrders}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-[#F2F0EB] rounded-lg font-mono text-xs uppercase font-bold flex items-center gap-2 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
          >
            {seeding ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span>SEED VALIDATION ORDERS</span>
          </button>
        </div>
      </div>
    </div>
  );
};
