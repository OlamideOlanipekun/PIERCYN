import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Edit2, Loader2, Plus, RefreshCw, Tags, X } from 'lucide-react';
import { AdminApi } from '../api';
import { AdminCategory } from '../types';

export const CategoriesView: React.FC = () => {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(true);
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState('0');

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setCategories(await AdminApi.getCategories(true)); }
    catch (err: any) { setError(err?.message || 'Unable to load categories.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const openCreate = () => {
    setEditing(null); setName(''); setSlug(''); setDescription(''); setSortOrder(String(categories.length));
    setModalOpen(true); setError(null); setNotice(null);
  };
  const openEdit = (category: AdminCategory) => {
    setEditing(category); setName(category.name); setSlug(category.slug);
    setDescription(category.description || ''); setSortOrder(String(category.sortOrder));
    setModalOpen(true); setError(null); setNotice(null);
  };
  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setError(null); setNotice(null);
    try {
      const order = Number(sortOrder);
      if (!Number.isInteger(order) || order < 0) throw new Error('Sort order must be a non-negative whole number.');
      const payload = { name: name.trim(), slug: slug.trim() || undefined, description: description.trim(), sortOrder: order };
      if (editing) await AdminApi.updateCategory(editing.id, payload);
      else await AdminApi.createCategory(payload);
      setModalOpen(false); setNotice(editing ? 'Category updated.' : 'Category created.');
      await load();
    } catch (err: any) { setError(err?.message || 'Unable to save category.'); }
    finally { setSaving(false); }
  };
  const toggleActive = async (category: AdminCategory) => {
    if (category.isActive && !window.confirm('Deactivate this category? Active products must be moved or archived first.')) return;
    if (!category.isActive && !window.confirm('Reactivate this category for use in the storefront?')) return;
    setError(null); setNotice(null);
    try {
      if (category.isActive) await AdminApi.archiveCategory(category.id);
      else await AdminApi.updateCategory(category.id, { isActive: true });
      setNotice(category.isActive ? 'Category deactivated.' : 'Category reactivated.');
      await load();
    } catch (err: any) { setError(err?.message || 'Unable to change category status.'); }
  };
  const visible = categories.filter((category) => showInactive || category.isActive);
  const fieldClass = 'w-full rounded-lg border border-[#303030] bg-[#0A0A0A] px-3 py-2.5 text-sm text-[#F2F0EB] outline-none focus:border-[#777]';

  return <section className="space-y-6">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="mb-1 text-[10px] font-mono uppercase tracking-[0.2em] text-[#A3A199]">Store taxonomy</p><h2 className="text-xl font-bold">Categories</h2><p className="mt-1 text-sm text-neutral-400">Create, edit, sort, and deactivate product categories. Existing product references are preserved.</p></div>
      <button onClick={openCreate} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#F2F0EB] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#0A0A0A]"><Plus className="h-4 w-4" />Add category</button>
    </header>
    {error && <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-900/70 bg-red-950/30 p-3 text-sm text-red-200"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
    {notice && !error && <div role="status" className="rounded-lg border border-emerald-900/60 bg-emerald-950/20 p-3 text-sm text-emerald-200">{notice}</div>}
    <div className="flex items-center justify-between rounded-xl border border-[#262626] bg-[#141414] p-4"><label className="flex items-center gap-2 text-xs text-neutral-300"><input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />Show inactive categories</label><button onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-[#353535] px-3 py-2 text-xs font-bold disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Refresh</button></div>
    <div className="overflow-hidden rounded-xl border border-[#292929] bg-[#141414]">
      {loading ? <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-neutral-400"><Loader2 className="h-5 w-5 animate-spin" />Loading categories…</div>
      : visible.length === 0 ? <div className="p-10 text-center text-sm text-neutral-500"><Tags className="mx-auto mb-3 h-7 w-7" />No categories found.</div>
      : <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-xs"><thead className="bg-[#101010] text-[10px] uppercase tracking-wider text-neutral-400"><tr>{['Category','Slug','Products','Order','Status','Actions'].map((label) => <th key={label} className="px-4 py-3 font-medium">{label}</th>)}</tr></thead><tbody className="divide-y divide-[#292929]">
        {visible.map((category) => <tr key={category.id} className="hover:bg-white/[0.02]"><td className="px-4 py-3"><p className="font-semibold">{category.name}</p><p className="mt-1 text-[10px] text-neutral-500">{category.description || 'No description'}</p></td><td className="px-4 py-3 font-mono text-neutral-300">{category.slug}</td><td className="px-4 py-3">{category._count?.products ?? '—'}</td><td className="px-4 py-3 font-mono">{category.sortOrder}</td><td className="px-4 py-3"><span className={`rounded px-2 py-1 text-[10px] font-bold ${category.isActive ? 'bg-emerald-950 text-emerald-300' : 'bg-neutral-800 text-neutral-400'}`}>{category.isActive ? 'ACTIVE' : 'INACTIVE'}</span></td><td className="px-4 py-3"><div className="flex gap-2"><button onClick={() => openEdit(category)} className="inline-flex items-center gap-1 rounded border border-[#383838] px-2.5 py-1.5 hover:bg-white/5"><Edit2 className="h-3 w-3" />Edit</button><button onClick={() => void toggleActive(category)} className="rounded border border-[#383838] px-2.5 py-1.5 hover:bg-white/5">{category.isActive ? 'Deactivate' : 'Reactivate'}</button></div></td></tr>)}
      </tbody></table></div>}
    </div>
    {modalOpen && <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/80 p-0 backdrop-blur-sm sm:items-center sm:p-4"><form onSubmit={save} className="max-h-[92vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-t-2xl border border-[#303030] bg-[#151515] p-5 sm:rounded-2xl">
      <div className="flex items-center justify-between"><div><h3 className="text-lg font-bold">{editing ? 'Edit category' : 'Create category'}</h3><p className="mt-1 text-xs text-neutral-400">Names and slugs must be unique.</p></div><button type="button" onClick={() => setModalOpen(false)} className="rounded p-2 hover:bg-white/10"><X className="h-4 w-4" /></button></div>
      <label className="block space-y-1.5"><span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">Name</span><input required minLength={2} value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} placeholder="Graphic Tees" /></label>
      <label className="block space-y-1.5"><span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">Slug (auto-generated if blank)</span><input value={slug} onChange={(e) => setSlug(e.target.value)} className={fieldClass} placeholder="graphic-tees" /></label>
      <label className="block space-y-1.5"><span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">Description</span><textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className={fieldClass} /></label>
      <label className="block space-y-1.5"><span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">Sort order</span><input type="number" min={0} step={1} required value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className={fieldClass} /></label>
      <div className="flex flex-col-reverse gap-2 border-t border-[#292929] pt-4 sm:flex-row sm:justify-end"><button type="button" onClick={() => setModalOpen(false)} className="rounded-lg px-4 py-2.5 text-sm text-neutral-300 hover:bg-white/5">Cancel</button><button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#F2F0EB] px-5 py-2.5 text-sm font-bold text-[#0A0A0A] disabled:opacity-50">{saving && <Loader2 className="h-4 w-4 animate-spin" />}{editing ? 'Save changes' : 'Create category'}</button></div>
    </form></div>}
  </section>;
};
