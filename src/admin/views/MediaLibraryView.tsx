import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Check, Copy, ExternalLink, Image as ImageIcon, Loader2, RefreshCw, Search, Trash2 } from 'lucide-react';
import { AdminApi } from '../api';
import { AdminMediaAsset } from '../types';

const formatBytes = (bytes: number | null) => {
  if (bytes == null) return 'Size unavailable';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export const MediaLibraryView: React.FC = () => {
  const [assets, setAssets] = useState<AdminMediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyPath, setBusyPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const pageSize = 100;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try { setAssets(await AdminApi.getMedia({ limit: pageSize, offset })); }
    catch (err: any) { setError(err?.message || 'Unable to load stored images.'); }
    finally { setLoading(false); }
  }, [offset]);

  useEffect(() => { void load(); }, [load]);

  const copyUrl = async (asset: AdminMediaAsset) => {
    try {
      await navigator.clipboard.writeText(asset.publicUrl);
      setCopiedPath(asset.path);
      setNotice('Image URL copied to clipboard.');
    } catch {
      setError('Clipboard access was blocked. Open the image and copy its URL from the address bar.');
    }
  };

  const deleteAsset = async (asset: AdminMediaAsset) => {
    if (!window.confirm('Permanently delete this image from storage? This cannot be undone. Images referenced by products are protected automatically.')) return;
    setBusyPath(asset.path); setError(null); setNotice(null);
    try {
      await AdminApi.deleteMedia(asset.path);
      setAssets((current) => current.filter((item) => item.path !== asset.path));
      if (assets.length === 1 && offset > 0) setOffset((current) => Math.max(0, current - pageSize));
      setNotice('Image permanently deleted from storage.');
    } catch (err: any) { setError(err?.message || 'Unable to delete this image.'); }
    finally { setBusyPath(null); }
  };

  const filtered = assets.filter((asset) => `${asset.name} ${asset.publicUrl} ${asset.contentType || ''}`.toLowerCase().includes(search.trim().toLowerCase()));
  const hasPrevious = offset > 0;
  const hasNext = assets.length === pageSize;

  return <section className="space-y-6">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="mb-1 text-[10px] font-mono uppercase tracking-[0.2em] text-[#A3A199]">Store assets</p>
        <h2 className="text-xl font-bold text-[#F2F0EB]">Media Library</h2>
        <p className="mt-1 max-w-2xl text-sm text-neutral-400">Browse uploaded product images, copy their URLs, and permanently delete unused files.</p>
      </div>
      <button onClick={() => void load()} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#343434] px-4 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-[#202020] disabled:opacity-50">
        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
      </button>
    </header>
    <div className="flex flex-col gap-3 rounded-xl border border-[#262626] bg-[#141414] p-4 sm:flex-row sm:items-center sm:justify-between">
      <label className="relative block w-full sm:max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search filenames or image URLs…" className="w-full rounded-lg border border-[#333] bg-[#0E0E0E] py-2.5 pl-9 pr-3 text-sm text-[#F2F0EB] outline-none focus:border-[#777]" />
      </label>
      <p className="text-xs text-neutral-400">{filtered.length} image{filtered.length === 1 ? '' : 's'} on this page · newest first</p>
    </div>
    {error && <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-900/70 bg-red-950/30 p-3 text-sm text-red-200"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
    {notice && !error && <div role="status" className="rounded-lg border border-emerald-900/60 bg-emerald-950/20 p-3 text-sm text-emerald-200">{notice}</div>}
    {loading ? <div className="flex min-h-48 items-center justify-center gap-3 text-sm text-neutral-400"><Loader2 className="h-5 w-5 animate-spin" />Loading stored images…</div>
      : filtered.length === 0 ? <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-[#333] p-8 text-center"><ImageIcon className="mb-3 h-8 w-8 text-neutral-500" /><p className="font-semibold">No images found</p><p className="mt-1 text-sm text-neutral-400">{search ? 'Try a different search.' : 'Images uploaded through the admin will appear here.'}</p></div>
      : <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {filtered.map((asset) => <article key={asset.path} className="overflow-hidden rounded-xl border border-[#292929] bg-[#141414]">
          <a href={asset.publicUrl} target="_blank" rel="noreferrer" className="group relative block aspect-[4/3] bg-[#0b0b0b]"><img src={asset.publicUrl} alt={asset.name} loading="lazy" className="h-full w-full object-contain transition-transform group-hover:scale-[1.02]" /><span className="absolute bottom-2 right-2 rounded-md bg-black/75 p-2 text-white"><ExternalLink className="h-4 w-4" /></span></a>
          <div className="space-y-3 p-3"><div className="min-w-0"><p className="truncate text-sm font-semibold" title={asset.name}>{asset.name}</p><p className="mt-1 text-[11px] text-neutral-500">{asset.contentType || 'Image'} · {formatBytes(asset.sizeBytes)}</p><p className="mt-1 text-[11px] text-neutral-500">{asset.createdAt ? new Date(asset.createdAt).toLocaleDateString() : 'Date unavailable'}</p></div>
            <div className="grid grid-cols-2 gap-2"><button onClick={() => void copyUrl(asset)} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#353535] px-2 py-2 text-xs font-semibold hover:bg-[#242424]">{copiedPath === asset.path ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{copiedPath === asset.path ? 'Copied' : 'Copy URL'}</button><button onClick={() => void deleteAsset(asset)} disabled={busyPath === asset.path} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-900/70 px-2 py-2 text-xs font-semibold text-red-300 hover:bg-red-950/40 disabled:opacity-50">{busyPath === asset.path ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}Delete</button></div>
          </div>
        </article>)}
      </div>}
    <div className="flex flex-col gap-3 border-t border-[#292929] pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-neutral-500">Showing files {assets.length ? offset + 1 : 0}–{offset + assets.length}. Images referenced by products or variants cannot be deleted.</p>
      <div className="flex gap-2"><button type="button" disabled={!hasPrevious || loading} onClick={() => setOffset((current) => Math.max(0, current - pageSize))} className="rounded-lg border border-[#353535] px-4 py-2 text-xs font-semibold disabled:opacity-40">Previous</button><button type="button" disabled={!hasNext || loading} onClick={() => setOffset((current) => current + pageSize)} className="rounded-lg border border-[#353535] px-4 py-2 text-xs font-semibold disabled:opacity-40">Next</button></div>
    </div>
    <p className="text-xs leading-relaxed text-neutral-500">Upload new images through product create/edit. To update an image, replace it or reorder it on the product; remove unused uploads here.</p>
  </section>;
};
