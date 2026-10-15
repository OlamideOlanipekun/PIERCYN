import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Edit2,
  FolderOpen,
  Image,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  Search,
  Tags,
  X,
} from 'lucide-react';
import { AdminApi } from '../api';
import { AdminCategory } from '../types';

// ─── Auto-slugify helper ──────────────────────────────────────────────────
const toSlug = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

// ─── Field class ──────────────────────────────────────────────────────────
const fieldClass =
  'w-full rounded-lg border border-[#303030] bg-[#0A0A0A] px-3 py-2.5 text-sm text-[#F2F0EB] outline-none focus:border-[#777] placeholder:text-neutral-600';

// ─── Empty state ──────────────────────────────────────────────────────────
const EmptyState: React.FC<{ search: string }> = ({ search }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
    <Tags className="h-10 w-10 text-neutral-600" />
    <p className="text-sm font-medium text-neutral-400">
      {search ? `No categories match "${search}"` : 'No categories yet.'}
    </p>
    {!search && (
      <p className="text-xs text-neutral-600">
        Create your first category using the button above.
      </p>
    )}
  </div>
);

export const CategoriesView: React.FC = () => {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [search, setSearch] = useState('');

  // Form state
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [sortOrder, setSortOrder] = useState('0');

  // Load
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setCategories(await AdminApi.getCategories(true));
    } catch (err: any) {
      setError(err?.message || 'Unable to load categories.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  // Open create modal
  const openCreate = () => {
    setEditing(null);
    setName(''); setSlug(''); setSlugManuallyEdited(false);
    setDescription(''); setImageUrl('');
    setSortOrder(String(categories.length));
    setModalOpen(true); setError(null); setNotice(null);
  };

  // Open edit modal
  const openEdit = (cat: AdminCategory) => {
    setEditing(cat);
    setName(cat.name); setSlug(cat.slug); setSlugManuallyEdited(true);
    setDescription(cat.description || ''); setImageUrl(cat.imageUrl || '');
    setSortOrder(String(cat.sortOrder));
    setModalOpen(true); setError(null); setNotice(null);
  };

  // Auto-slug from name in create mode
  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugManuallyEdited) setSlug(toSlug(value));
  };

  const handleSlugChange = (value: string) => {
    setSlug(value);
    setSlugManuallyEdited(true);
  };

  // Save
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true); setError(null); setNotice(null);
    try {
      const order = Number(sortOrder);
      if (!Number.isInteger(order) || order < 0) throw new Error('Sort order must be a non-negative whole number.');
      const payload = {
        name: name.trim(),
        slug: slug.trim() || undefined,
        description: description.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
        sortOrder: order,
      };
      if (editing) {
        await AdminApi.updateCategory(editing.id, payload);
        setNotice('Category updated successfully.');
      } else {
        await AdminApi.createCategory(payload);
        setNotice('Category created successfully.');
      }
      setModalOpen(false);
      await load();
    } catch (err: any) {
      setError(err?.message || 'Unable to save category.');
    } finally {
      setSaving(false);
    }
  };

  // Toggle active / inactive
  const toggleActive = async (cat: AdminCategory) => {
    setError(null); setNotice(null);
    if (cat.isActive) {
      const count = cat._count?.products ?? 0;
      const msg = count > 0
        ? `"${cat.name}" has ${count} active product(s). Deactivating will hide them from the storefront category filter. Continue?`
        : `Deactivate "${cat.name}"? It will be hidden from the storefront.`;
      if (!window.confirm(msg)) return;
    } else {
      if (!window.confirm(`Reactivate "${cat.name}"? It will appear on the storefront.`)) return;
    }
    try {
      if (cat.isActive) {
        await AdminApi.archiveCategory(cat.id);
        setNotice(`"${cat.name}" deactivated.`);
      } else {
        await AdminApi.updateCategory(cat.id, { isActive: true });
        setNotice(`"${cat.name}" reactivated.`);
      }
      await load();
    } catch (err: any) {
      setError(err?.message || 'Unable to change category status.');
    }
  };

  // Filtered list
  const visible = useMemo(() => {
    return categories.filter((cat) => {
      if (!showInactive && !cat.isActive) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          cat.name.toLowerCase().includes(q) ||
          cat.slug.toLowerCase().includes(q) ||
          (cat.description || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [categories, showInactive, search]);

  const activeCount = categories.filter((c) => c.isActive).length;
  const totalProducts = categories.reduce((sum, c) => sum + (c._count?.products ?? 0), 0);

  return (
    <section className="space-y-6">
      {/* ── Header ── */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-[10px] font-mono uppercase tracking-[0.2em] text-[#A3A199]">Store taxonomy</p>
          <h2 className="text-xl font-bold">Categories</h2>
          <p className="mt-1 text-sm text-neutral-400">Create, edit, sort, and control category visibility on the storefront. Existing product references are preserved.</p>
        </div>
        <button
          id="btn-add-category"
          onClick={openCreate}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#F2F0EB] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#0A0A0A] hover:bg-white transition-colors"
        >
          <Plus className="h-4 w-4" />Add category
        </button>
      </header>

      {/* ── Alerts ── */}
      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-900/70 bg-red-950/30 p-3 text-sm text-red-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{error}
        </div>
      )}
      {notice && !error && (
        <div role="status" className="rounded-lg border border-emerald-900/60 bg-emerald-950/20 p-3 text-sm text-emerald-200">{notice}</div>
      )}

      {/* ── Stats bar ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { label: 'Total categories', value: categories.length, icon: Tags },
          { label: 'Active categories', value: activeCount, icon: FolderOpen },
          { label: 'Products categorised', value: totalProducts, icon: Package },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="flex items-center gap-3 rounded-xl border border-[#262626] bg-[#141414] p-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1E1E1E]">
              <Icon className="h-4 w-4 text-neutral-400" />
            </div>
            <div>
              <p className="text-[10px] text-neutral-500">{label}</p>
              <p className="text-lg font-bold leading-tight">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Controls ── */}
      <div className="flex flex-col gap-3 rounded-xl border border-[#262626] bg-[#141414] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories…"
            className="w-full rounded-lg border border-[#303030] bg-[#0A0A0A] py-2 pl-9 pr-3 text-sm text-[#F2F0EB] outline-none focus:border-[#777] placeholder:text-neutral-600"
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-xs text-neutral-300 select-none">
            <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} className="accent-[#F2F0EB]" />
            Show inactive
          </label>
          <button onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-[#353535] px-3 py-2 text-xs font-bold disabled:opacity-50 hover:bg-white/5 transition-colors">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Refresh
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="overflow-hidden rounded-xl border border-[#292929] bg-[#141414]">
        {loading ? (
          <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-neutral-400">
            <Loader2 className="h-5 w-5 animate-spin" />Loading categories…
          </div>
        ) : visible.length === 0 ? (
          <EmptyState search={search} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-xs">
              <thead className="border-b border-[#292929] bg-[#101010] text-[10px] uppercase tracking-wider text-neutral-400">
                <tr>
                  {['Category', 'Slug', 'Products', 'Order', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#292929]">
                {visible.map((cat) => (
                  <tr key={cat.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* Name + image + description */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        {cat.imageUrl ? (
                          <img src={cat.imageUrl} alt={cat.name} className="h-8 w-8 rounded-md object-cover shrink-0" />
                        ) : (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#1E1E1E]">
                            <Image className="h-3.5 w-3.5 text-neutral-600" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-[#F2F0EB]">{cat.name}</p>
                          {cat.description && (
                            <p className="mt-0.5 max-w-[200px] truncate text-[10px] text-neutral-500">{cat.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    {/* Slug */}
                    <td className="px-4 py-3 font-mono text-neutral-400">/{cat.slug}</td>
                    {/* Product count */}
                    <td className="px-4 py-3">
                      <span className={(cat._count?.products ?? 0) > 0 ? 'font-semibold text-[#F2F0EB]' : 'text-neutral-600'}>
                        {cat._count?.products ?? 0}
                      </span>
                    </td>
                    {/* Sort order */}
                    <td className="px-4 py-3 font-mono text-neutral-400">{cat.sortOrder}</td>
                    {/* Status badge */}
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${cat.isActive ? 'bg-emerald-950/80 text-emerald-300' : 'bg-neutral-800 text-neutral-500'}`}>
                        {cat.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(cat)}
                          className="inline-flex items-center gap-1.5 rounded border border-[#383838] px-2.5 py-1.5 hover:bg-white/5 transition-colors"
                        >
                          <Edit2 className="h-3 w-3" />Edit
                        </button>
                        <button
                          onClick={() => void toggleActive(cat)}
                          className={`rounded border px-2.5 py-1.5 transition-colors ${cat.isActive ? 'border-red-900/60 text-red-400 hover:bg-red-950/30' : 'border-[#383838] text-neutral-400 hover:bg-white/5'}`}
                        >
                          {cat.isActive ? 'Deactivate' : 'Reactivate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Create / Edit Modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/80 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <form
            onSubmit={save}
            className="max-h-[92vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-t-2xl border border-[#303030] bg-[#151515] p-5 sm:rounded-2xl"
          >
            {/* Modal header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold">{editing ? 'Edit category' : 'Create category'}</h3>
                <p className="mt-1 text-xs text-neutral-400">Names and slugs must be unique across all categories.</p>
              </div>
              <button type="button" onClick={() => setModalOpen(false)} className="rounded p-2 hover:bg-white/10 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Inline error in modal */}
            {error && modalOpen && (
              <div className="flex items-start gap-2 rounded-lg border border-red-900/70 bg-red-950/30 p-3 text-sm text-red-200">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{error}
              </div>
            )}

            {/* Name */}
            <label className="block space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">Name *</span>
              <input
                required minLength={2}
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className={fieldClass}
                placeholder="Graphic Tees"
              />
            </label>

            {/* Slug */}
            <label className="block space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                Slug <span className="normal-case text-neutral-500">(auto-generated from name if blank)</span>
              </span>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500">/</span>
                <input
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  className={`${fieldClass} pl-6`}
                  placeholder="graphic-tees"
                  pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                  title="Lowercase letters, numbers, and hyphens only"
                />
              </div>
            </label>

            {/* Description */}
            <label className="block space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                Description <span className="normal-case text-neutral-500">(optional)</span>
              </span>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={fieldClass}
                placeholder="A short description of this category…"
              />
            </label>

            {/* Image URL */}
            <label className="block space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                Category image URL <span className="normal-case text-neutral-500">(optional)</span>
              </span>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className={fieldClass}
                placeholder="https://…"
              />
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="mt-2 h-20 w-full rounded-lg object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              )}
            </label>

            {/* Sort order */}
            <label className="block space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                Display order <span className="normal-case text-neutral-500">(lower = shown first)</span>
              </span>
              <input
                type="number" min={0} step={1} required
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className={fieldClass}
              />
            </label>

            {/* Footer actions */}
            <div className="flex flex-col-reverse gap-2 border-t border-[#292929] pt-4 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg px-4 py-2.5 text-sm text-neutral-300 hover:bg-white/5 transition-colors">
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#F2F0EB] px-5 py-2.5 text-sm font-bold text-[#0A0A0A] disabled:opacity-50 hover:bg-white transition-colors"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing ? 'Save changes' : 'Create category'}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
};


