import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Edit2, Loader2, Plus, RefreshCw, Search, X } from 'lucide-react';
import { AdminApi } from '../api';
import { AdminProduct, AdminVariantRecord } from '../types';

type VariantDraft = {
  productId: string; sku: string; size: string; colour: string; colourHex: string;
  priceNGN: string; priceUSD: string; priceGBP: string; priceEUR: string; costPriceNGN: string; image: string; altImage: string; initialStock: string;
};

const emptyDraft: VariantDraft = {
  productId: '', sku: '', size: 'M', colour: 'Onyx Black', colourHex: '#121212',
  priceNGN: '', priceUSD: '', priceGBP: '', priceEUR: '', costPriceNGN: '', image: '', altImage: '', initialStock: '0',
};

export const VariantsView: React.FC = () => {
  const [variants, setVariants] = useState<AdminVariantRecord[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [includeInactive, setIncludeInactive] = useState(true);
  const [editing, setEditing] = useState<AdminVariantRecord | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState<VariantDraft>(emptyDraft);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [variantData, productData] = await Promise.all([AdminApi.getVariants(), AdminApi.getProducts()]);
      setVariants(variantData); setProducts(productData);
    } catch (err: any) { setError(err?.message || 'Unable to load product variants.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setDraft({ ...emptyDraft, productId: products[0]?.id || '' });
    setModalOpen(true); setError(null); setNotice(null);
  };

  const openEdit = (variant: AdminVariantRecord) => {
    setEditing(variant);
    setDraft({
      productId: variant.productId, sku: variant.sku, size: variant.size, colour: variant.colour,
      colourHex: variant.colourHex || '#111111', priceNGN: variant.priceNGN == null ? '' : String(variant.priceNGN),
      priceUSD: variant.priceUSD == null ? '' : String(variant.priceUSD),
      priceGBP: variant.priceGBP == null ? '' : String(variant.priceGBP),
      priceEUR: variant.priceEUR == null ? '' : String(variant.priceEUR),
      costPriceNGN: variant.costPriceNGN == null ? '' : String(variant.costPriceNGN),
      image: variant.image || '', altImage: variant.altImage || '', initialStock: '0',
    });
    setModalOpen(true); setError(null); setNotice(null);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.size.trim() || !draft.colour.trim() || (!editing && !draft.productId)) {
      setError('Choose a product and enter a size and colour.'); return;
    }
    setSaving(true); setError(null); setNotice(null);
    try {
      const numericPrice = draft.priceNGN.trim() ? Number(draft.priceNGN) : undefined;
      const numericUSD = draft.priceUSD.trim() ? Number(draft.priceUSD) : undefined;
      const numericGBP = draft.priceGBP.trim() ? Number(draft.priceGBP) : undefined;
      const numericEUR = draft.priceEUR.trim() ? Number(draft.priceEUR) : undefined;
      const numericCost = draft.costPriceNGN.trim() ? Number(draft.costPriceNGN) : undefined;
      if (numericPrice !== undefined && (!Number.isInteger(numericPrice) || numericPrice <= 0)) throw new Error('Variant price must be a positive whole number.');
      for (const [currency, value] of [['USD', numericUSD], ['GBP', numericGBP], ['EUR', numericEUR]] as const) {
        if (value !== undefined && (!Number.isInteger(value) || value <= 0)) throw new Error(`${currency} variant price must be a positive whole number.`);
      }
      if (numericCost !== undefined && (!Number.isInteger(numericCost) || numericCost < 0)) throw new Error('Variant cost must be zero or a positive whole number.');
      if (editing) {
        await AdminApi.updateVariant(editing.id, {
          sku: draft.sku.trim(), size: draft.size.trim(), colour: draft.colour.trim(),
          colourHex: draft.colourHex, priceNGN: numericPrice ?? null,
          priceUSD: numericUSD ?? null, priceGBP: numericGBP ?? null, priceEUR: numericEUR ?? null,
          costPriceNGN: numericCost ?? null, image: draft.image.trim() || null, altImage: draft.altImage.trim() || null,
        });
      } else {
        const stock = Number(draft.initialStock || 0);
        if (!Number.isInteger(stock) || stock < 0) throw new Error('Initial stock must be a non-negative whole number.');
        await AdminApi.createVariant({
          productId: draft.productId, sku: draft.sku.trim() || undefined, size: draft.size.trim(),
          colour: draft.colour.trim(), colourHex: draft.colourHex, priceNGN: numericPrice,
          priceUSD: numericUSD, priceGBP: numericGBP, priceEUR: numericEUR,
          costPriceNGN: numericCost, image: draft.image.trim() || undefined, altImage: draft.altImage.trim() || undefined, initialStock: stock,
        });
      }
      setModalOpen(false); setNotice(editing ? 'Variant updated.' : 'Variant created.');
      await load();
    } catch (err: any) { setError(err?.message || 'Unable to save variant.'); }
    finally { setSaving(false); }
  };

  const toggleActive = async (variant: AdminVariantRecord) => {
    setError(null); setNotice(null);
    try {
      if (variant.active && !window.confirm('Deactivate this variant? It will no longer be available for new sales, and existing order history will be preserved.')) return;
      if (!variant.active && !window.confirm('Reactivate this variant for new sales?')) return;
      await AdminApi.updateVariant(variant.id, { isActive: !variant.active });
      setNotice(variant.active ? 'Variant deactivated.' : 'Variant reactivated.');
      await load();
    } catch (err: any) { setError(err?.message || 'Unable to change variant status.'); }
  };

  const filtered = variants.filter((variant) => (includeInactive || variant.active) && `${variant.productName} ${variant.sku} ${variant.size} ${variant.colour}`.toLowerCase().includes(search.trim().toLowerCase()));

  const fieldClass = 'w-full rounded-lg border border-[#303030] bg-[#0A0A0A] px-3 py-2.5 text-sm text-[#F2F0EB] outline-none focus:border-[#777]';
  const field = (label: string, key: keyof VariantDraft, props: { type?: string; required?: boolean; placeholder?: string; min?: number; step?: number } = {}) => (
    <label className="block space-y-1.5"><span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">{label}</span>
      <input className={fieldClass} type={props.type || 'text'} required={props.required} min={props.min} step={props.step} placeholder={props.placeholder} value={draft[key]} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} />
    </label>
  );

  return <section className="space-y-6">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="mb-1 text-[10px] font-mono uppercase tracking-[0.2em] text-[#A3A199]">Catalog controls</p><h2 className="text-xl font-bold">Product Variants</h2><p className="mt-1 text-sm text-neutral-400">Manage size, colour, SKU, variant price and activation. Stock movements remain in Inventory.</p></div>
      <button onClick={openCreate} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#F2F0EB] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#0A0A0A]"><Plus className="h-4 w-4" />Add variant</button>
    </header>
    {error && <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-900/70 bg-red-950/30 p-3 text-sm text-red-200"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
    {notice && !error && <div role="status" className="rounded-lg border border-emerald-900/60 bg-emerald-950/20 p-3 text-sm text-emerald-200">{notice}</div>}
    <div className="flex flex-col gap-3 rounded-xl border border-[#262626] bg-[#141414] p-4 sm:flex-row sm:items-center">
      <label className="relative block flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search product, SKU, size, colour…" className={fieldClass + ' pl-9'} /></label>
      <label className="flex items-center gap-2 text-xs text-neutral-300"><input type="checkbox" checked={includeInactive} onChange={(e) => setIncludeInactive(e.target.checked)} />Show inactive</label>
      <button onClick={() => void load()} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#353535] px-3 py-2.5 text-xs font-bold disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Refresh</button>
    </div>
    <div className="overflow-hidden rounded-xl border border-[#292929] bg-[#141414]">
      {loading ? <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-neutral-400"><Loader2 className="h-5 w-5 animate-spin" />Loading variants…</div>
      : <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-xs"><thead className="bg-[#101010] text-[10px] uppercase tracking-wider text-neutral-400"><tr>{['Product / SKU','Size','Colour','Price','Available stock','Status','Actions'].map((label) => <th key={label} className="px-4 py-3 font-medium">{label}</th>)}</tr></thead>
        <tbody className="divide-y divide-[#292929]">{filtered.map((v) => <tr key={v.id} className="hover:bg-white/[0.02]"><td className="px-4 py-3"><p className="font-semibold">{v.productName}</p><p className="mt-1 font-mono text-[10px] text-neutral-500">{v.sku}</p></td><td className="px-4 py-3">{v.size}</td><td className="px-4 py-3"><span className="mr-2 inline-block h-3 w-3 rounded-full border border-white/20 align-middle" style={{ backgroundColor: v.colourHex || '#111' }} />{v.colour}</td><td className="px-4 py-3 font-mono">{v.priceNGN == null ? 'Product price' : `₦${v.priceNGN.toLocaleString()}`}</td><td className="px-4 py-3 font-mono">{v.availableStock} <span className="text-neutral-500">({v.reservedQuantity} reserved)</span></td><td className="px-4 py-3"><span className={`rounded px-2 py-1 text-[10px] font-bold ${v.active ? 'bg-emerald-950 text-emerald-300' : 'bg-neutral-800 text-neutral-400'}`}>{v.active ? 'ACTIVE' : 'INACTIVE'}</span></td><td className="px-4 py-3"><div className="flex gap-2"><button onClick={() => openEdit(v)} className="inline-flex items-center gap-1 rounded border border-[#383838] px-2.5 py-1.5 hover:bg-white/5"><Edit2 className="h-3 w-3" />Edit</button><button onClick={() => void toggleActive(v)} className="rounded border border-[#383838] px-2.5 py-1.5 hover:bg-white/5">{v.active ? 'Deactivate' : 'Reactivate'}</button></div></td></tr>)}</tbody>
      </table>{filtered.length === 0 && <p className="p-8 text-center text-sm text-neutral-500">No matching variants.</p>}</div>}
    </div>

    {modalOpen && <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/80 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <form onSubmit={save} className="max-h-[92vh] w-full max-w-xl space-y-4 overflow-y-auto rounded-t-2xl border border-[#303030] bg-[#151515] p-5 sm:rounded-2xl">
        <div className="flex items-center justify-between"><div><h3 className="text-lg font-bold">{editing ? 'Edit variant' : 'Create variant'}</h3><p className="mt-1 text-xs text-neutral-400">{editing ? 'Changes apply to future sales; order history remains intact.' : 'Creates a new variant and its inventory record.'}</p></div><button type="button" onClick={() => setModalOpen(false)} className="rounded p-2 hover:bg-white/10"><X className="h-4 w-4" /></button></div>
        {!editing && <label className="block space-y-1.5"><span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">Product</span><select required value={draft.productId} onChange={(e) => setDraft({ ...draft, productId: e.target.value })} className={fieldClass}><option value="">Choose product…</option>{products.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.status}</option>)}</select></label>}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{field('Size', 'size', { required: true, placeholder: 'XS, S, M, L, XL' })}{field('Colour', 'colour', { required: true, placeholder: 'Onyx Black' })}{field('SKU (auto if blank)', 'sku', { placeholder: 'PCY-TEE-BLK-M' })}{field('Colour hex', 'colourHex', { required: true, placeholder: '#121212' })}{field('Variant price (NGN)', 'priceNGN', { type: 'number', min: 1 })}{field('Variant price (USD)', 'priceUSD', { type: 'number', min: 1 })}{field('Variant price (GBP)', 'priceGBP', { type: 'number', min: 1 })}{field('Variant price (EUR)', 'priceEUR', { type: 'number', min: 1 })}{field('Unit cost (NGN)', 'costPriceNGN', { type: 'number', min: 0 })}{field('Primary image URL', 'image', { type: 'url', placeholder: 'https://…' })}{field('Alternate image URL', 'altImage', { type: 'url', placeholder: 'https://…' })}{!editing && field('Initial stock', 'initialStock', { type: 'number', min: 0, required: true })}</div>
        <div className="flex flex-col-reverse gap-2 border-t border-[#292929] pt-4 sm:flex-row sm:justify-end"><button type="button" onClick={() => setModalOpen(false)} className="rounded-lg px-4 py-2.5 text-sm text-neutral-300 hover:bg-white/5">Cancel</button><button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#F2F0EB] px-5 py-2.5 text-sm font-bold text-[#0A0A0A] disabled:opacity-50">{saving && <Loader2 className="h-4 w-4 animate-spin" />}{editing ? 'Save changes' : 'Create variant'}</button></div>
      </form>
    </div>}
  </section>;
};
