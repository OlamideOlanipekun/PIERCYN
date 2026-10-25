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

type RestockAllPreview = Awaited<ReturnType<typeof AdminApi.previewRestockAll>>;

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
  const [notice, setNotice] = useState<string | null>(null);
  const [restockAllOpen, setRestockAllOpen] = useState(false);
  const [restockAllQuantity, setRestockAllQuantity] = useState(1);
  const [restockAllReference, setRestockAllReference] = useState('');
  const [restockAllReason, setRestockAllReason] = useState('Bulk restock across all inventory variants');
  const [restockAllPreview, setRestockAllPreview] = useState<RestockAllPreview | null>(null);
  const [previewingRestockAll, setPreviewingRestockAll] = useState(false);
  const [submittingRestockAll, setSubmittingRestockAll] = useState(false);

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

  const openRestockAll = () => {
    setError(null);
    setNotice(null);
    setRestockAllQuantity(1);
    setRestockAllReference(`BULK-RESTOCK-${Date.now()}`);
    setRestockAllReason('Bulk restock across all inventory variants');
    setRestockAllPreview(null);
    setRestockAllOpen(true);
  };

  const handlePreviewRestockAll = async () => {
    if (!Number.isSafeInteger(restockAllQuantity) || restockAllQuantity < 1 || restockAllQuantity > 100_000) {
      setError('Enter a whole-number quantity from 1 to 100,000 per variant.');
      return;
    }
    try {
      setPreviewingRestockAll(true);
      setError(null);
      setRestockAllPreview(await AdminApi.previewRestockAll(restockAllQuantity));
    } catch (err: any) {
      setError(err.message || 'Unable to preview bulk restock.');
      setRestockAllPreview(null);
    } finally {
      setPreviewingRestockAll(false);
    }
  };

  const handleRestockAllSubmit = async () => {
    if (!restockAllPreview || restockAllPreview.quantityPerVariant !== restockAllQuantity) {
      setError('Preview the current quantity before confirming the bulk restock.');
      return;
    }
    try {
      setSubmittingRestockAll(true);
      setError(null);
      const result = await AdminApi.restockAll({
        quantity: restockAllQuantity,
        reference: restockAllReference.trim() || `BULK-RESTOCK-${Date.now()}`,
        reason: restockAllReason.trim() || 'Bulk restock across all inventory variants',
      });
      setRestockAllOpen(false);
      setNotice(`Restocked ${result.updatedCount} variants; added ${result.totalUnitsAdded.toLocaleString()} units total.${result.auditWarning ? ` ${result.auditWarning}` : ''}`);
      if (activeTab === 'ledger') await loadAllLedger();
      else await fetchInventory();
    } catch (err: any) {
      setError(err.message || 'Unable to confirm the bulk restock. Refresh inventory and the ledger before retrying to avoid duplicate adjustments.');
    } finally {
      setSubmittingRestockAll(false);
    }
  };

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockingItem) return;
    const quantity = Number(restockQty);
    if (!Number.isSafeInteger(quantity) || quantity < 1) {
      setError('Units to add must be a positive whole number.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await AdminApi.adjustInventory({
        variantId: restockingItem.variantId,
        quantity,
        type: 'PURCHASE',
        reference: restockRef.trim() || `RESTOCK-${Date.now()}`,
        reason: restockReason.trim() || 'Manual Restock',
      });

      setRestockingItem(null);
      setNotice(`Added ${quantity} units to ${restockingItem.productName} (${restockingItem.sku}).`);
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
    const quantity = Number(adjustQty);
    if (!Number.isSafeInteger(quantity) || (adjustType === 'ADJUSTMENT' ? quantity < 0 : quantity < 1)) {
      setError(adjustType === 'ADJUSTMENT'
        ? 'Enter a non-negative whole-number physical stock count.'
        : 'Enter a positive whole-number unit quantity.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await AdminApi.adjustInventory({
        variantId: adjustingItem.variantId,
        quantity,
        type: adjustType,
        reference: adjustRef.trim() || `ADJ-${Date.now()}`,
        reason: adjustReason.trim() || 'Manual adjustment',
      });

      setAdjustingItem(null);
      setNotice(adjustType === 'ADJUSTMENT'
        ? `Physical stock for ${adjustingItem.sku} set to ${quantity}.`
        : `${adjustType} recorded for ${adjustingItem.sku}: ${quantity} unit(s).`);
      await fetchInventory();
    } catch (err: any) {
      setError(err.message || 'Adjustment failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-[#F2F0EB]">Inventory</h2>
          <p className="text-[11px] text-neutral-500">Physical, available, and reserved stock by variant.</p>
        </div>
        <button
          type="button"
          onClick={openRestockAll}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-xs font-bold font-mono uppercase text-white hover:bg-emerald-600 min-h-[42px]"
        >
          <Plus className="w-4 h-4" /> RESTOCK ALL
        </button>
      </div>
      {/* ------------------------------------------------------------- */}
      {/* 1. VIEW TABS */}
      {/* ------------------------------------------------------------- */}
      <div className="flex items-center gap-1.5 border-b border-[#242424] pb-2 text-xs font-mono overflow-x-auto scrollbar-none whitespace-nowrap">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
            activeTab === 'all'
              ? 'bg-[#F2F0EB] text-[#0A0A0A] font-bold'
              : 'text-[#A3A199] hover:text-[#F2F0EB] hover:bg-white/5'
          }`}
        >
          All Variants
        </button>
        <button
          onClick={() => setActiveTab('lowStock')}
          className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
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
          className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'ledger'
              ? 'bg-[#F2F0EB] text-[#0A0A0A] font-bold'
              : 'text-[#A3A199] hover:text-[#F2F0EB] hover:bg-white/5'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Audit Ledger Transactions</span>
        </button>
      </div>

      {notice && (
        <div role="status" className="rounded-lg border border-emerald-800 bg-emerald-950/30 px-4 py-3 text-xs text-emerald-200">
          {notice}
        </div>
      )}

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
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-[#F2F0EB] rounded-lg text-xs font-mono uppercase cursor-pointer shrink-0"
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
              <div>
                {/* MOBILE LEDGER CARDS (< md) */}
                <div className="md:hidden space-y-2.5">
                  {allLedger.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-3.5 rounded-xl bg-[#181818] border border-[#262626] font-mono text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#F2F0EB] text-[11px] truncate max-w-[160px]">
                          {tx.variantId}
                        </span>
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
                      </div>

                      <div className="flex items-center justify-between">
                        <span
                          className={`font-bold text-sm ${
                            tx.quantity > 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity} units
                        </span>
                        <span className="text-[10px] text-neutral-400 bg-white/5 px-2 py-0.5 rounded">
                          {tx.reference}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-[#242424] flex items-center justify-between text-[10px] text-neutral-500">
                        <span className="font-sans text-neutral-400 truncate max-w-[180px]">
                          {tx.reason || 'Atelier transaction'}
                        </span>
                        <span>{new Date(tx.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* DESKTOP LEDGER TABLE (>= md) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[620px]">
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
              <div>
                {/* MOBILE VARIANT CARDS (< md) */}
                <div className="md:hidden space-y-3">
                  {inventory.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl bg-[#181818] border border-[#262626] space-y-3"
                    >
                      {/* Top row: Title + SKU + Status */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-sm text-[#F2F0EB]">
                            {item.productName}
                          </h3>
                          <span className="text-[10px] font-mono text-neutral-400 block mt-0.5">
                            {item.sku}
                          </span>
                        </div>
                        <span
                          className={`text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded shrink-0 ${
                            item.status === 'IN_STOCK'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40'
                              : item.status === 'LOW_STOCK'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800/40'
                              : 'bg-rose-950 text-rose-300 border border-rose-800/40'
                          }`}
                        >
                          {(item.status || 'IN_STOCK').replace('_', ' ')}
                        </span>
                      </div>

                      {/* Variant Specs */}
                      <div className="flex items-center gap-3 text-xs">
                        <span className="font-mono bg-white/10 px-2 py-0.5 rounded font-bold text-[#F2F0EB]">
                          Size {item.size}
                        </span>
                        <div className="flex items-center gap-1.5 font-sans text-neutral-300">
                          {item.colourHex && (
                            <span
                              className="w-3 h-3 rounded-full border border-white/20 shrink-0"
                              style={{ backgroundColor: item.colourHex }}
                            />
                          )}
                          <span>{item.colour}</span>
                        </div>
                      </div>

                      {/* Stock counts */}
                      <div className="grid grid-cols-4 gap-2 p-2.5 rounded-lg bg-white/5 border border-white/5 text-center font-mono text-xs">
                        <div>
                          <span className="text-[9px] text-neutral-500 uppercase block">Physical</span>
                          <span className="text-[#F2F0EB]">{item.stockQuantity ?? item.availableStock + item.reservedStock}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-neutral-500 uppercase block">Available</span>
                          <span className={`text-base font-bold ${
                            item.availableStock <= 5 ? 'text-amber-400' : 'text-[#F2F0EB]'
                          }`}>
                            {item.availableStock}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] text-neutral-500 uppercase block">Reserved</span>
                          <span className="text-neutral-400">{item.reservedStock}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-neutral-500 uppercase block">Sold</span>
                          <span className="text-neutral-400">{item.soldStock}</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => {
                            setRestockingItem(item);
                            setRestockQty(10);
                            setNotice(null);
                          }}
                          className="flex-1 py-2.5 px-3 rounded-lg bg-[#F2F0EB] hover:bg-white text-[#0A0A0A] font-bold font-mono text-xs uppercase tracking-wider flex items-center justify-center cursor-pointer transition-colors min-h-[42px]"
                        >
                          RESTOCK
                        </button>
                        <button
                          onClick={() => {
                            setAdjustingItem(item);
                            setAdjustQty(item.stockQuantity ?? item.availableStock + item.reservedStock);
                            setAdjustType('ADJUSTMENT');
                            setError(null);
                            setNotice(null);
                          }}
                          className="flex-1 py-2.5 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-[#F2F0EB] font-mono text-xs uppercase font-bold flex items-center justify-center cursor-pointer transition-colors min-h-[42px]"
                        >
                          ADJUST
                        </button>
                        <button
                          onClick={() => handleOpenHistory(item)}
                          className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white flex items-center justify-center cursor-pointer min-h-[42px] min-w-[42px] shrink-0"
                          title="View Ledger History"
                          aria-label="View Ledger History"
                        >
                          <History className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* DESKTOP VARIANT TABLE (>= md) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[860px]">
                    <thead>
                      <tr className="border-b border-[#262626] text-[10px] font-mono text-[#A3A199] uppercase tracking-wider">
                        <th className="py-3 font-normal">Garment / Piece</th>
                        <th className="py-3 font-normal">SKU</th>
                        <th className="py-3 font-normal">Size</th>
                        <th className="py-3 font-normal">Color</th>
                        <th className="py-3 font-normal">Physical</th>
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

                          <td className="py-3.5 font-mono text-neutral-300">
                            {item.stockQuantity ?? item.availableStock + item.reservedStock}
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
                                setNotice(null);
                              }}
                              className="px-2 py-1 rounded bg-[#F2F0EB] text-[#0A0A0A] font-bold font-mono text-[10px] uppercase hover:bg-white cursor-pointer"
                            >
                              RESTOCK
                            </button>

                            <button
                              onClick={() => {
                                setAdjustingItem(item);
                                setAdjustQty(item.stockQuantity ?? item.availableStock + item.reservedStock);
                                setAdjustType('ADJUSTMENT');
                                setError(null);
                                setNotice(null);
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
              </div>
            )}
          </div>
        )}
      </div>

      {restockAllOpen && (
        <div role="dialog" aria-modal="true" aria-labelledby="restock-all-title" className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm font-sans">
          <div className="w-full max-w-lg bg-[#141414] border border-[#2D2D2D] rounded-t-2xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 text-[#F2F0EB] max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#242424] pb-3 mb-4">
              <div>
                <h3 id="restock-all-title" className="font-bold text-sm text-emerald-300">RESTOCK ALL VARIANTS</h3>
                <p className="text-[11px] text-neutral-400 mt-1">Add the same number of units to every inventory variant.</p>
              </div>
              <button
                type="button"
                onClick={() => { setRestockAllOpen(false); setError(null); }}
                disabled={submittingRestockAll}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 disabled:opacity-50"
                aria-label="Close restock all dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <p className="rounded-lg border border-amber-800/50 bg-amber-950/20 p-3 text-amber-100">
                This applies to every inventory record, ignoring the current search and tabs. It does not set stock to a target; it adds the entered quantity to each variant.
              </p>

              {error && (
                <div role="alert" className="rounded-lg border border-red-800 bg-red-950/30 p-3 text-red-200">{error}</div>
              )}

              <div>
                <label className="block text-[11px] font-mono text-[#A3A199] uppercase mb-1">Units to Add Per Variant *</label>
                <input
                  type="number"
                  min={1}
                  max={100_000}
                  step={1}
                  required
                  value={restockAllQuantity}
                  onChange={(e) => {
                    setRestockAllQuantity(Number(e.target.value));
                    setRestockAllPreview(null);
                    setError(null);
                  }}
                  className="w-full bg-[#0A0A0A] border border-[#2D2D2D] rounded-lg px-3 py-2.5 text-[#F2F0EB] outline-hidden font-mono text-lg font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#A3A199] uppercase mb-1">Batch Reference *</label>
                <input
                  type="text"
                  required
                  maxLength={120}
                  value={restockAllReference}
                  onChange={(e) => setRestockAllReference(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-[#2D2D2D] rounded-lg px-3 py-2 text-[#F2F0EB] outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#A3A199] uppercase mb-1">Reason / Source</label>
                <input
                  type="text"
                  maxLength={500}
                  value={restockAllReason}
                  onChange={(e) => setRestockAllReason(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-[#2D2D2D] rounded-lg px-3 py-2 text-[#F2F0EB] outline-hidden"
                />
              </div>

              <button
                type="button"
                onClick={handlePreviewRestockAll}
                disabled={previewingRestockAll || submittingRestockAll}
                className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 font-mono font-bold uppercase text-[#F2F0EB] hover:bg-white/10 disabled:opacity-50"
              >
                {previewingRestockAll ? 'CALCULATING PREVIEW…' : 'PREVIEW ALL VARIANTS'}
              </button>

              {restockAllPreview && (
                <div className="rounded-xl border border-emerald-800/60 bg-emerald-950/20 p-4 space-y-3">
                  {restockAllPreview.variantCount === 0 ? (
                    <p className="text-amber-200">No inventory records were found, so nothing can be restocked.</p>
                  ) : (
                    <>
                      <p className="font-bold text-emerald-200">
                        Preview: {restockAllPreview.variantCount.toLocaleString()} variants will each receive {restockAllPreview.quantityPerVariant} units ({restockAllPreview.totalUnitsAdded.toLocaleString()} units total).
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-neutral-300">
                        <span>Physical stock</span>
                        <span>{restockAllPreview.currentPhysicalStock.toLocaleString()} → {restockAllPreview.resultingPhysicalStock.toLocaleString()}</span>
                        <span>Available stock</span>
                        <span>{restockAllPreview.currentAvailableStock.toLocaleString()} → {restockAllPreview.resultingAvailableStock.toLocaleString()}</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRestockAllSubmit}
                        disabled={submittingRestockAll || previewingRestockAll}
                        className="w-full rounded-lg bg-emerald-700 px-4 py-3 font-mono font-bold uppercase text-white hover:bg-emerald-600 disabled:opacity-50"
                      >
                        {submittingRestockAll ? 'RESTOCKING…' : `CONFIRM: ADD ${restockAllPreview.totalUnitsAdded.toLocaleString()} UNITS TO ALL`}
                      </button>
                      <p className="text-[10px] text-neutral-400">Each variant receives its own inventory ledger entry under this batch reference.</p>
                    </>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={() => { setRestockAllOpen(false); setError(null); }}
                disabled={submittingRestockAll}
                className="w-full rounded-lg px-4 py-2.5 text-neutral-400 hover:text-white disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. RESTOCK MODAL */}
      {/* ------------------------------------------------------------- */}
      {restockingItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-xs font-sans">
          <div className="w-full max-w-md bg-[#141414] border border-[#2D2D2D] rounded-t-2xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 text-[#F2F0EB] max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
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
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center shrink-0"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRestockSubmit} className="space-y-4 text-xs">
              {error && <div role="alert" className="rounded-lg border border-red-800 bg-red-950/30 p-3 text-red-200">{error}</div>}
              <div className="p-3 rounded-lg bg-white/5 border border-white/10 flex justify-between font-mono">
                  <span className="text-neutral-400">Physical / Available</span>
                  <span className="font-bold text-emerald-400 text-sm">
                  {restockingItem.stockQuantity ?? restockingItem.availableStock + restockingItem.reservedStock} / {restockingItem.availableStock} units
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
                  className="w-full bg-[#0A0A0A] border border-[#2D2D2D] rounded-lg px-3 py-2 text-[#F2F0EB] outline-hidden font-mono text-base sm:text-lg font-bold min-h-[42px]"
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
                  className="w-full bg-[#0A0A0A] border border-[#2D2D2D] rounded-lg px-3 py-2 text-[#F2F0EB] outline-hidden font-mono text-sm sm:text-xs min-h-[42px]"
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
                  className="w-full bg-[#0A0A0A] border border-[#2D2D2D] rounded-lg px-3 py-2 text-[#F2F0EB] outline-hidden text-sm sm:text-xs min-h-[42px]"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2 border-t border-[#242424]">
                <button
                  type="button"
                  onClick={() => setRestockingItem(null)}
                  className="px-4 py-2.5 rounded-lg text-neutral-400 hover:text-white font-mono min-h-[42px] flex items-center justify-center cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold font-mono uppercase text-xs transition-all disabled:opacity-50 min-h-[42px] flex items-center justify-center cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-xs font-sans">
          <div className="w-full max-w-md bg-[#141414] border border-[#2D2D2D] rounded-t-2xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 text-[#F2F0EB] max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
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
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center shrink-0"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs">
              {error && <div role="alert" className="rounded-lg border border-red-800 bg-red-950/30 p-3 text-red-200">{error}</div>}
              <div className="p-3 rounded-lg bg-white/5 border border-white/10 flex justify-between font-mono">
                  <span className="text-neutral-400">Physical / Available Stock</span>
                  <span className="font-bold text-[#F2F0EB] text-sm">
                  {adjustingItem.stockQuantity ?? adjustingItem.availableStock + adjustingItem.reservedStock} / {adjustingItem.availableStock} units
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#A3A199] uppercase mb-1">
                  Adjustment Type *
                </label>
                <select
                  value={adjustType}
                  onChange={(e) => {
                    const nextType = e.target.value as typeof adjustType;
                    setAdjustType(nextType);
                    setAdjustQty(nextType === 'ADJUSTMENT'
                      ? (adjustingItem.stockQuantity ?? adjustingItem.availableStock + adjustingItem.reservedStock)
                      : 1);
                    setError(null);
                  }}
                  className="w-full bg-[#0A0A0A] border border-[#2D2D2D] rounded-lg px-3 py-2 text-[#F2F0EB] outline-hidden font-mono min-h-[42px]"
                >
                  <option value="ADJUSTMENT">ADJUSTMENT (Count correction)</option>
                  <option value="DAMAGE">DAMAGE (Write-off damaged pieces)</option>
                  <option value="RETURN">RETURN (Return to stock)</option>
                  <option value="SALE">SALE (Direct offline sale)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#A3A199] uppercase mb-1">
                  {adjustType === 'ADJUSTMENT' ? 'New Physical Stock Count *' : adjustType === 'RETURN' ? 'Units to Add *' : 'Units to Remove *'}
                </label>
                <input
                  type="number"
                  min={adjustType === 'ADJUSTMENT' ? 0 : 1}
                  step={1}
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Number(e.target.value))}
                  className="w-full bg-[#0A0A0A] border border-[#2D2D2D] rounded-lg px-3 py-2 text-[#F2F0EB] outline-hidden font-mono text-base sm:text-lg font-bold min-h-[42px]"
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
                  className="w-full bg-[#0A0A0A] border border-[#2D2D2D] rounded-lg px-3 py-2 text-[#F2F0EB] outline-hidden font-mono text-sm sm:text-xs min-h-[42px]"
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
                  className="w-full bg-[#0A0A0A] border border-[#2D2D2D] rounded-lg px-3 py-2 text-[#F2F0EB] outline-hidden text-sm sm:text-xs min-h-[42px]"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2 border-t border-[#242424]">
                <button
                  type="button"
                  onClick={() => setAdjustingItem(null)}
                  className="px-4 py-2.5 rounded-lg text-neutral-400 hover:text-white font-mono min-h-[42px] flex items-center justify-center cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold font-mono uppercase text-xs transition-all disabled:opacity-50 min-h-[42px] flex items-center justify-center cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-xs font-sans">
          <div className="w-full max-w-2xl bg-[#141414] border border-[#2D2D2D] rounded-t-2xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 text-[#F2F0EB] max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
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
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center shrink-0"
                aria-label="Close modal"
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
