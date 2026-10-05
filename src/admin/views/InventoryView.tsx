import React, { useState, useEffect } from 'react';
import { AdminInventoryItem, AdminInventoryLedgerEntry } from '../types';
import { AdminApi } from '../api';
import {
  Layers,
  Search,
  Plus,
  Sliders,
  History,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  ArrowUpRight,
  ArrowDownRight,
  TrendingDown,
} from 'lucide-react';

export const InventoryView: React.FC = () => {
  const [inventory, setInventory] = useState<AdminInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter tabs
  const [activeTab, setActiveTab] = useState<'all' | 'lowStock' | 'ledger'>('all');
  const [search, setSearch] = useState('');

  // Modals state
  const [restockingItem, setRestockingItem] = useState<AdminInventoryItem | null>(null);
  const [adjustingItem, setAdjustingItem] = useState<AdminInventoryItem | null>(null);
  const [historyItem, setHistoryItem] = useState<AdminInventoryItem | null>(null);
  const [historyLedger, setHistoryLedger] = useState<AdminInventoryLedgerEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Form inputs
  const [restockQty, setRestockQty] = useState<number>(10);
  const [restockRef, setRestockRef] = useState<string>('BATCH-RESTOCK-01');
  const [restockReason, setRestockReason] = useState<string>('Atelier production replenishment');

  const [adjustQty, setAdjustQty] = useState<number>(1);
  const [adjustType, setAdjustType] = useState<
    'PURCHASE' | 'SALE' | 'ADJUSTMENT' | 'DAMAGE' | 'RETURN'
  >('ADJUSTMENT');
  const [adjustRef, setAdjustRef] = useState<string>('AUDIT-CORRECTION');
  const [adjustReason, setAdjustReason] = useState<string>('Physical atelier count adjustment');
  const [submitting, setSubmitting] = useState(false);

  // Global ledger view state
  const [allLedger, setAllLedger] = useState<AdminInventoryLedgerEntry[]>([]);
  const [loadingAllLedger, setLoadingAllLedger] = useState(false);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await AdminApi.getInventory({
        lowStockOnly: activeTab === 'lowStock',
        search: search.trim() || undefined,
      });
      setInventory(data);
    } catch (err: any) {
      setError(err.message || 'Unable to load inventory records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'ledger') {
      loadAllLedger();
    } else {
      fetchInventory();
    }
  }, [activeTab]);

  const loadAllLedger = async () => {
    try {
      setLoadingAllLedger(true);
      const logs = await AdminApi.getInventoryHistory();
      setAllLedger(logs);
    } catch (err: any) {
      setError(err.message || 'Failed to load ledger history');
    } finally {
      setLoadingAllLedger(false);
    }
  };

  const handleOpenHistory = async (item: AdminInventoryItem) => {
    setHistoryItem(item);
    setLoadingHistory(true);
    try {
      const logs = await AdminApi.getInventoryHistory(item.variantId);
      setHistoryLedger(logs);
    } catch {
      setHistoryLedger([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockingItem) return;

    try {
      setSubmitting(true);
      setError(null);
      await AdminApi.adjustInventory({
        variantId: restockingItem.variantId,
        quantity: Number(restockQty),
        type: 'PURCHASE',
        reference: restockRef.trim() || `RESTOCK-${Date.now()}`,
        reason: restockReason.trim() || 'Manual Restock',
      });

      setRestockingItem(null);
      await fetchInventory();
    } catch (err: any) {
      setError(err.message || 'Restock failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingItem) return;

    try {
      setSubmitting(true);
      setError(null);
      await AdminApi.adjustInventory({
        variantId: adjustingItem.variantId,
        quantity: Number(adjustQty),
        type: adjustType,
        reference: adjustRef.trim() || `ADJ-${Date.now()}`,
        reason: adjustReason.trim() || 'Manual adjustment',
      });

      setAdjustingItem(null);
      await fetchInventory();
    } catch (err: any) {
      setError(err.message || 'Adjustment failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------- */}
      {/* 1. VIEW TABS */}
      {/* ------------------------------------------------------------- */}
      <div className="flex items-center gap-1.5 border-b border-[#242424] pb-2 text-xs font-mono">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'all'
              ? 'bg-[#F2F0EB] text-[#0A0A0A] font-bold'
              : 'text-[#A3A199] hover:text-[#F2F0EB] hover:bg-white/5'
          }`}
        >
          All Variants
        </button>
        <button
          onClick={() => setActiveTab('lowStock')}
          className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'lowStock'
              ? 'bg-amber-400 text-[#0A0A0A] font-bold'
              : 'text-amber-400 hover:bg-amber-950/40'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Low Stock / Out of Stock</span>
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'ledger'
              ? 'bg-[#F2F0EB] text-[#0A0A0A] font-bold'
              : 'text-[#A3A199] hover:text-[#F2F0EB] hover:bg-white/5'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Audit Ledger Transactions</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. SEARCH BAR (For Variants) */}
      {/* ------------------------------------------------------------- */}
      {activeTab !== 'ledger' && (
        <div className="p-4 rounded-xl bg-[#141414] border border-[#262626] flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by SKU, product name, color, or size..."
              className="w-full bg-[#0A0A0A] border border-[#2D2D2D] rounded-lg pl-9 pr-3 py-2 text-xs text-[#F2F0EB] placeholder:text-neutral-600 outline-hidden font-sans"
            />
          </div>
          <button
            onClick={fetchInventory}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-[#F2F0EB] rounded-lg text-xs font-mono uppercase cursor-pointer"
          >
            FILTER
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. INVENTORY TABLE OR LEDGER */}
      {/* ------------------------------------------------------------- */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#141414] border border-[#262626]">
        {activeTab === 'ledger' ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#A3A199]">
                IMMUTABLE INVENTORY TRANSACTION LEDGER ({allLedger.length})
              </span>
            </div>

            {loadingAllLedger ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-6 h-6 animate-spin text-[#F2F0EB]" />
                <span className="text-xs font-mono text-neutral-400">RETRIEVING LEDGER...</span>
              </div>
            ) : allLedger.length === 0 ? (
              <p className="text-center py-12 text-neutral-500 font-mono text-xs">
                No ledger transactions recorded yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#262626] text-[10px] font-mono text-[#A3A199] uppercase">
                      <th className="py-2.5">Timestamp</th>
                      <th className="py-2.5">Variant ID / SKU</th>
                      <th className="py-2.5">Type</th>
                      <th className="py-2.5">Units</th>
                      <th className="py-2.5">Reference</th>
                      <th className="py-2.5">Reason / Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#202020] font-mono">
                    {allLedger.map((tx) => (
                      <tr key={tx.id} className="hover:bg-white/5">
                        <td className="py-3 text-neutral-400 text-[11px]">
                          {new Date(tx.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 text-[#F2F0EB] font-bold">{tx.variantId}</td>
                        <td className="py-3">
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                              tx.type === 'PURCHASE'
                                ? 'bg-emerald-950 text-emerald-300'
                                : tx.type === 'SALE'
                                ? 'bg-blue-950 text-blue-300'
                                : tx.type === 'DAMAGE'
                                ? 'bg-rose-950 text-rose-300'
                                : 'bg-neutral-800 text-neutral-300'
                            }`}
                          >
                            {tx.type}
                          </span>
                        </td>
                        <td
                          className={`py-3 font-bold ${
                            tx.quantity > 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}
                        </td>
                        <td className="py-3 text-neutral-300">{tx.reference}</td>
                        <td className="py-3 text-neutral-400 text-[11px] font-sans">
                          {tx.reason || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#A3A199]">
                LIVE VARIANT LEVEL INVENTORY ({inventory.length})
              </span>
            </div>

            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-6 h-6 animate-spin text-[#F2F0EB]" />
                <span className="text-xs font-mono text-neutral-400">SYNCING LIVE STOCK...</span>
              </div>
            ) : error ? (
              <div className="p-4 rounded-lg bg-red-950/30 border border-red-800 text-red-200 text-xs text-center">
                {error}
              </div>
            ) : inventory.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <Layers className="w-8 h-8 text-neutral-600 mx-auto" />
                <p className="text-sm font-semibold text-[#F2F0EB]">No variants found</p>
                <p className="text-xs text-neutral-500 font-sans">
                  Try clearing your search query or switching tabs.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#262626] text-[10px] font-mono text-[#A3A199] uppercase tracking-wider">
                      <th className="py-3 font-normal">Garment / Piece</th>
                      <th className="py-3 font-normal">SKU</th>
                      <th className="py-3 font-normal">Size</th>
                      <th className="py-3 font-normal">Color</th>
                      <th className="py-3 font-normal">Available</th>
                      <th className="py-3 font-normal">Reserved</th>
                      <th className="py-3 font-normal">Sold</th>
                      <th className="py-3 font-normal">Status</th>
                      <th className="py-3 font-normal text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#202020]">
                    {inventory.map((item) => (
                      <tr key={item.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3.5 font-medium text-[#F2F0EB]">
                          {item.productName}
                        </td>

                        <td className="py-3.5 font-mono text-neutral-400 font-bold">
                          {item.sku}
                        </td>

                        <td className="py-3.5 font-mono font-bold text-[#F2F0EB]">
                          {item.size}
                        </td>

                        <td className="py-3.5 font-sans">
                          <div className="flex items-center gap-2">
                            {item.colourHex && (
                              <span
                                className="w-3 h-3 rounded-full border border-white/20 shrink-0"
                                style={{ backgroundColor: item.colourHex }}
                              />
                            )}
                            <span className="text-neutral-300">{item.colour}</span>
                          </div>
                        </td>

                        <td className="py-3.5 font-mono text-base font-bold text-[#F2F0EB]">
                          {item.availableStock}
                        </td>

                        <td className="py-3.5 font-mono text-neutral-400">
                          {item.reservedStock}
                        </td>

                        <td className="py-3.5 font-mono text-neutral-400">
                          {item.soldStock}
                        </td>

                        <td className="py-3.5">
                          <span
                            className={`text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded ${
                              item.status === 'IN_STOCK'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40'
                                : item.status === 'LOW_STOCK'
                                ? 'bg-amber-950 text-amber-300 border border-amber-800/40'
                                : 'bg-rose-950 text-rose-300 border border-rose-800/40'
                            }`}
                          >
                            {(item.status || 'IN_STOCK').replace('_', ' ')}
                          </span>
                        </td>

                        <td className="py-3.5 text-right space-x-1.5">
                          <button
                            onClick={() => {
                              setRestockingItem(item);
                              setRestockQty(10);
                            }}
                            className="px-2 py-1 rounded bg-[#F2F0EB] text-[#0A0A0A] font-bold font-mono text-[10px] uppercase hover:bg-white cursor-pointer"
                          >
                            RESTOCK
                          </button>

                          <button
                            onClick={() => {
                              setAdjustingItem(item);
                              setAdjustQty(1);
                            }}
                            className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-[#F2F0EB] font-mono text-[10px] uppercase cursor-pointer"
                          >
                            ADJUST
                          </button>

                          <button
                            onClick={() => handleOpenHistory(item)}
                            className="p-1 rounded hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                            title="View Ledger History"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. RESTOCK MODAL */}
      {/* ------------------------------------------------------------- */}
      {restockingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-sans">
          <div className="w-full max-w-md bg-[#141414] border border-[#2D2D2D] rounded-2xl shadow-2xl p-6 text-[#F2F0EB] animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#242424] pb-3 mb-4">
              <div>
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest block">
                  RESTOCK INVENTORY
                </span>
                <h3 className="font-bold text-sm text-[#F2F0EB]">
                  {restockingItem.productName} ({restockingItem.colour} / {restockingItem.size})
                </h3>
              </div>
              <button
                onClick={() => setRestockingItem(null)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRestockSubmit} className="space-y-4 text-xs">
              <div className="p-3 rounded-lg bg-white/5 border border-white/10 flex justify-between font-mono">
                <span className="text-neutral-400">Current Stock</span>
                <span className="font-bold text-emerald-400 text-sm">
                  {restockingItem.availableStock} units
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#A3A199] uppercase mb-1">
                  Units to Add *
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={restockQty}
                  onChange={(e) => setRestockQty(Number(e.target.value))}
                  className="w-full bg-[#0A0A0A] border border-[#2D2D2D] rounded-lg px-3 py-2 text-[#F2F0EB] outline-hidden font-mono text-lg font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#A3A199] uppercase mb-1">
                  Batch Reference *
                </label>
                <input
                  type="text"
                  required
                  value={restockRef}
                  onChange={(e) => setRestockRef(e.target.value)}
                  placeholder="e.g. BATCH-RESTOCK-02"
                  className="w-full bg-[#0A0A0A] border border-[#2D2D2D] rounded-lg px-3 py-2 text-[#F2F0EB] outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#A3A199] uppercase mb-1">
                  Reason / Source
                </label>
                <input
                  type="text"
                  value={restockReason}
                  onChange={(e) => setRestockReason(e.target.value)}
                  placeholder="Atelier finished batch delivery"
                  className="w-full bg-[#0A0A0A] border border-[#2D2D2D] rounded-lg px-3 py-2 text-[#F2F0EB] outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#242424]">
                <button
                  type="button"
                  onClick={() => setRestockingItem(null)}
                  className="px-4 py-2 rounded text-neutral-400 hover:text-white font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold font-mono uppercase text-xs transition-all disabled:opacity-50"
                >
                  {submitting ? 'RECORDING...' : 'CONFIRM RESTOCK'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. ADJUST STOCK MODAL */}
      {/* ------------------------------------------------------------- */}
      {adjustingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-sans">
          <div className="w-full max-w-md bg-[#141414] border border-[#2D2D2D] rounded-2xl shadow-2xl p-6 text-[#F2F0EB] animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#242424] pb-3 mb-4">
              <div>
                <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest block">
                  MANUAL INVENTORY ADJUSTMENT
                </span>
                <h3 className="font-bold text-sm text-[#F2F0EB]">
                  {adjustingItem.productName} ({adjustingItem.colour} / {adjustingItem.size})
                </h3>
              </div>
              <button
                onClick={() => setAdjustingItem(null)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs">
              <div className="p-3 rounded-lg bg-white/5 border border-white/10 flex justify-between font-mono">
                <span className="text-neutral-400">Available Stock</span>
                <span className="font-bold text-[#F2F0EB] text-sm">
                  {adjustingItem.availableStock} units
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#A3A199] uppercase mb-1">
                  Adjustment Type *
                </label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as any)}
                  className="w-full bg-[#0A0A0A] border border-[#2D2D2D] rounded-lg px-3 py-2 text-[#F2F0EB] outline-hidden font-mono"
                >
                  <option value="ADJUSTMENT">ADJUSTMENT (Count correction)</option>
                  <option value="DAMAGE">DAMAGE (Write-off damaged pieces)</option>
                  <option value="RETURN">RETURN (Return to stock)</option>
                  <option value="SALE">SALE (Direct offline sale)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#A3A199] uppercase mb-1">
                  Quantity * (Negative to reduce, positive to increase)
                </label>
                <input
                  type="number"
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Number(e.target.value))}
                  className="w-full bg-[#0A0A0A] border border-[#2D2D2D] rounded-lg px-3 py-2 text-[#F2F0EB] outline-hidden font-mono text-lg font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#A3A199] uppercase mb-1">
                  Adjustment Reference *
                </label>
                <input
                  type="text"
                  required
                  value={adjustRef}
                  onChange={(e) => setAdjustRef(e.target.value)}
                  placeholder="e.g. AUDIT-MARCH-2026"
                  className="w-full bg-[#0A0A0A] border border-[#2D2D2D] rounded-lg px-3 py-2 text-[#F2F0EB] outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#A3A199] uppercase mb-1">
                  Reason for Adjustment *
                </label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Describe reason for this manual stock change"
                  className="w-full bg-[#0A0A0A] border border-[#2D2D2D] rounded-lg px-3 py-2 text-[#F2F0EB] outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#242424]">
                <button
                  type="button"
                  onClick={() => setAdjustingItem(null)}
                  className="px-4 py-2 rounded text-neutral-400 hover:text-white font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold font-mono uppercase text-xs transition-all disabled:opacity-50"
                >
                  {submitting ? 'ADJUSTING...' : 'APPLY ADJUSTMENT'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 6. VIEW VARIANT LEDGER HISTORY MODAL */}
      {/* ------------------------------------------------------------- */}
      {historyItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-sans">
          <div className="w-full max-w-2xl bg-[#141414] border border-[#2D2D2D] rounded-2xl shadow-2xl p-6 text-[#F2F0EB] max-h-[85vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#242424] pb-3 mb-4">
              <div>
                <span className="text-[10px] font-mono text-[#A3A199] uppercase tracking-widest block">
                  TRANSACTION LEDGER
                </span>
                <h3 className="font-bold text-base text-[#F2F0EB]">
                  {historyItem.productName} ({historyItem.sku})
                </h3>
              </div>
              <button
                onClick={() => setHistoryItem(null)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingHistory ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-2">
                <Loader2 className="w-5 h-5 animate-spin text-[#F2F0EB]" />
                <span className="text-xs font-mono text-neutral-400">RETRIEVING LEDGER...</span>
              </div>
            ) : historyLedger.length === 0 ? (
              <p className="text-center py-8 text-neutral-500 font-mono text-xs">
                No ledger transactions recorded yet.
              </p>
            ) : (
              <div className="space-y-2 text-xs">
                {historyLedger.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between font-mono"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-bold ${
                            tx.quantity > 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity} UNITS
                        </span>
                        <span className="text-neutral-400">({tx.type})</span>
                        <span className="text-[10px] text-neutral-500 bg-white/5 px-1.5 py-0.5 rounded">
                          {tx.reference}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-1 font-sans">
                        {tx.reason || 'Atelier operation'}
                      </p>
                    </div>

                    <span className="text-[10px] text-neutral-500">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
