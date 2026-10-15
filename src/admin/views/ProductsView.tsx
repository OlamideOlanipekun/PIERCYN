import React, { useState, useEffect, useRef } from 'react';
import { AdminProduct, AdminCategory } from '../types';
import { AdminApi } from '../api';
import { uploadImageToSupabase } from '../utils/uploadImage';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Archive,
  Loader2,
  X,
  Upload,
  ImagePlus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Star,
} from 'lucide-react';

// ─── Image Upload Zone ─────────────────────────────────────────────────────

interface ImageSlot {
  url: string;        // final URL (remote or object URL for preview)
  originalUrl?: string;
  file?: File;        // pending file to upload
  uploading?: boolean;
  error?: string;
}

function gallerySlotsForProduct(product: AdminProduct): ImageSlot[] {
  const urls = [
    ...(product.images || []),
    ...(product.variants || []).flatMap((variant) => [variant.image, variant.altImage]),
  ].filter((url): url is string => Boolean(url));

  return Array.from(new Set(urls)).map((url) => ({ url, originalUrl: url }));
}

interface ImageUploadRowProps {
  slots: ImageSlot[];
  onChange: (slots: ImageSlot[]) => void;
  bucket?: string;
}

const MAX_IMAGE_SIZE_BYTES = 3 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

function validateImageFile(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.has(file.type)) return 'Use a JPEG, PNG, WebP, or GIF image.';
  if (file.size === 0 || file.size > MAX_IMAGE_SIZE_BYTES) return 'Each image must be between 1 byte and 3 MB.';
  return null;
}

const ImageUploadRow: React.FC<ImageUploadRowProps> = ({ slots, onChange, bucket = 'products' }) => {
  const addInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Upload files — optionally replace a specific slot index in-place
  const uploadFiles = async (files: FileList | null, replaceIdx?: number) => {
    if (!files || files.length === 0) return;
    const selectedFiles = Array.from(files);
    const invalidFile = selectedFiles.map(validateImageFile).find(Boolean);
    if (invalidFile) {
      window.alert(invalidFile);
      return;
    }

    if (replaceIdx !== undefined) {
      // Replace single slot in-place
      const file = selectedFiles[0];
      const previewUrl = URL.createObjectURL(file);
      const updated = [...slots];
      const oldSlot = updated[replaceIdx];
      const oldUrl = oldSlot?.url;
      const originalUrl = oldSlot?.originalUrl || oldUrl;
      if (oldUrl?.startsWith('blob:')) URL.revokeObjectURL(oldUrl);
      updated[replaceIdx] = { url: previewUrl, originalUrl, file, uploading: true };
      onChange([...updated]);
      try {
        const publicUrl = await uploadImageToSupabase(file, bucket);
        if (previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
        updated[replaceIdx] = { url: publicUrl, originalUrl, uploading: false };
        onChange([...updated]);
      } catch (err: any) {
        if (previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
        updated[replaceIdx] = { ...oldSlot, uploading: false, error: err.message };
        onChange([...updated]);
      }
    } else {
      // Append new slots
      const existingFiles = new Set(slots.map((slot) => slot.file ? `${slot.file.name}:${slot.file.size}:${slot.file.lastModified}` : slot.url));
      const uniqueFiles = selectedFiles.filter((file) => {
        const key = `${file.name}:${file.size}:${file.lastModified}`;
        if (existingFiles.has(key)) return false;
        existingFiles.add(key);
        return true;
      });
      if (uniqueFiles.length === 0) return;
      const newSlots: ImageSlot[] = uniqueFiles.map((file) => ({
        url: URL.createObjectURL(file),
        file,
        uploading: true,
      }));
      const updated = [...slots, ...newSlots];
      onChange(updated);
      for (let i = 0; i < newSlots.length; i++) {
        const slot = newSlots[i];
        const idx = slots.length + i;
        try {
          const publicUrl = await uploadImageToSupabase(slot.file!, bucket);
          if (slot.url.startsWith('blob:')) URL.revokeObjectURL(slot.url);
          updated[idx] = { url: publicUrl, uploading: false };
          onChange([...updated]);
        } catch (err: any) {
          if (slot.url.startsWith('blob:')) URL.revokeObjectURL(slot.url);
          updated[idx] = { url: '', uploading: false, error: err.message };
          onChange([...updated]);
        }
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    uploadFiles(e.dataTransfer.files);
  };

  const removeSlot = (idx: number) => {
    const slot = slots[idx];
    if (slot?.url.startsWith('blob:')) URL.revokeObjectURL(slot.url);
    onChange(slots.filter((_, i) => i !== idx));
  };

  const moveSlot = (idx: number, delta: number) => {
    const target = idx + delta;
    if (target < 0 || target >= slots.length) return;
    const next = [...slots];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };

  const setPrimary = (idx: number) => {
    if (idx === 0) return;
    const next = [...slots];
    const [selected] = next.splice(idx, 1);
    next.unshift(selected);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {/* Existing slots */}
      {slots.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {slots.map((slot, idx) => (
            <div
              key={idx}
              className="relative aspect-square rounded-lg overflow-hidden bg-[#0A0A0A] border border-[#2D2D2D] group"
            >
              {slot.uploading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/60">
                  <Loader2 className="w-5 h-5 animate-spin text-[#F2F0EB]" />
                  <span className="text-[9px] font-mono text-neutral-400 uppercase">Uploading…</span>
                </div>
              ) : slot.error ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-red-950/60 p-2">
                  <X className="w-4 h-4 text-red-400" />
                  <span className="text-[9px] font-mono text-red-300 text-center leading-tight">{slot.error}</span>
                  <button
                    type="button"
                    onClick={() => replaceInputRefs.current[idx]?.click()}
                    className="mt-1 text-[9px] font-mono uppercase bg-white/10 hover:bg-white/20 text-white rounded px-1.5 py-0.5 cursor-pointer"
                  >Retry</button>
                </div>
              ) : (
                <img src={slot.url} alt={`Image ${idx + 1}`} className="w-full h-full object-cover" />
              )}

              {/* Primary badge */}
              {idx === 0 && !slot.uploading && !slot.error && (
                <span className="absolute top-1 left-1 text-[8px] font-mono uppercase bg-emerald-900/80 text-emerald-300 px-1.5 py-0.5 rounded pointer-events-none">
                  Primary
                </span>
              )}

              {/* Action bar — visible on hover */}
              {!slot.uploading && (
                <div className="absolute bottom-0 inset-x-0 flex items-center gap-1 px-1 py-1 bg-black/80 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity">
                  {/* Replace this image */}
                  <button
                    type="button"
                    onClick={() => replaceInputRefs.current[idx]?.click()}
                    className="flex-1 flex items-center justify-center gap-1 rounded bg-white/10 hover:bg-white/25 py-1 text-white cursor-pointer"
                    title="Replace this image"
                  >
                    <Upload className="h-3 w-3" />
                    <span className="text-[8px] font-mono uppercase">Replace</span>
                  </button>
                  {!slot.error && idx !== 0 && (
                    <button
                      type="button"
                      onClick={() => setPrimary(idx)}
                      className="rounded bg-white/10 hover:bg-white/25 p-1 text-white cursor-pointer"
                      title="Make primary image"
                      aria-label={`Make image ${idx + 1} the primary image`}
                    ><Star className="h-3 w-3" /></button>
                  )}
                  {/* Reorder buttons */}
                  {!slot.error && slots.length > 1 && (
                    <>
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveSlot(idx, -1)}
                        className="rounded bg-white/10 hover:bg-white/25 p-1 text-white disabled:opacity-30 cursor-pointer"
                        title="Move earlier"
                      ><ChevronLeft className="h-3 w-3" /></button>
                      <button
                        type="button"
                        disabled={idx === slots.length - 1}
                        onClick={() => moveSlot(idx, 1)}
                        className="rounded bg-white/10 hover:bg-white/25 p-1 text-white disabled:opacity-30 cursor-pointer"
                        title="Move later"
                      ><ChevronRight className="h-3 w-3" /></button>
                    </>
                  )}
                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => removeSlot(idx)}
                    className="rounded bg-red-900/60 hover:bg-red-900 p-1 text-white cursor-pointer"
                    title="Remove image"
                  ><Trash2 className="h-3 w-3" /></button>
                </div>
              )}

              {/* Hidden per-slot replace input */}
              <input
                ref={(el) => { replaceInputRefs.current[idx] = el; }}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  uploadFiles(e.target.files, idx);
                  e.target.value = '';
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Drop zone — add more images */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => addInputRef.current?.click()}
        className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[#2D2D2D] rounded-xl py-6 px-4 cursor-pointer hover:border-[#F2F0EB]/30 hover:bg-white/5 transition-all group"
      >
        <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
          <ImagePlus className="w-5 h-5 text-neutral-500 group-hover:text-neutral-300 transition-colors" />
        </div>
        <div className="text-center">
          <p className="text-[11px] font-semibold text-neutral-400 group-hover:text-neutral-200 transition-colors">
            {slots.length > 0 ? 'Add more images or ' : 'Drop images here or '}
            <span className="text-[#F2F0EB] underline underline-offset-2">browse</span>
          </p>
          <p className="text-[10px] font-mono text-neutral-600 mt-0.5">
            JPG, PNG, WEBP, GIF — max 3 MB each
          </p>
        </div>
        <input
          ref={addInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={(e) => {
            uploadFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────

export const ProductsView: React.FC = () => {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [saving, setSaving] = useState(false);

  // Add Product Form State
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formPriceNGN, setFormPriceNGN] = useState<number>(35000);
  const [formCostPriceNGN, setFormCostPriceNGN] = useState<number>(14000);
  const [formGsm, setFormGsm] = useState('280 GSM');
  const [formFit, setFormFit] = useState('Relaxed Boxy Cut');
  const [formFabric, setFormFabric] = useState('100% Heavyweight Cotton');
  const [formShortDescription, setFormShortDescription] = useState('');
  const [formCollection, setFormCollection] = useState('essentials');
  const [formOrigin, setFormOrigin] = useState('');
  const [formCareInstructions, setFormCareInstructions] = useState('');
  const [formProductStory, setFormProductStory] = useState('');
  const [formTag, setFormTag] = useState('');
  const [formVideoUrl, setFormVideoUrl] = useState('');
  const [formPriceUSD, setFormPriceUSD] = useState<number | ''>('');
  const [formPriceGBP, setFormPriceGBP] = useState<number | ''>('');
  const [formPriceEUR, setFormPriceEUR] = useState<number | ''>('');
  const [formIsNewDrop, setFormIsNewDrop] = useState(false);
  const [formIsBestSeller, setFormIsBestSeller] = useState(false);
  const [formIsLimited, setFormIsLimited] = useState(false);

  // Image slot state (for both add & edit)
  const [addImageSlots, setAddImageSlots] = useState<ImageSlot[]>([]);
  const [editImageSlots, setEditImageSlots] = useState<ImageSlot[]>([]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await AdminApi.getProducts({
        category: categoryFilter,
        status: statusFilter,
        search: search.trim() || undefined,
      });
      setProducts(data);
    } catch (err: any) {
      setError(err.message || 'Unable to load products.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [categoryFilter, statusFilter]);

  useEffect(() => {
    AdminApi.getCategories().then((data) => {
      setCategories(data);
      setFormCategory((current) => data.some((category) => category.id === current) ? current : (data[0]?.id || ''));
    }).catch((err: any) => setError(err?.message || 'Unable to load categories.'));
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formDescription || !formPriceNGN) {
      setError('Please provide product name, description, and price.');
      return;
    }

    // Check no images are still uploading
    if (addImageSlots.some((s) => s.uploading)) {
      setError('Please wait for all images to finish uploading.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const validImages = addImageSlots
        .map((s) => s.url)
        .filter((u) => u && !u.startsWith('blob:'));

      if (validImages.length === 0) {
        setError('Upload at least one product image before creating the product.');
        return;
      }

      const defaultVariants = [
        {
          sku: `PCY-${formName.replace(/\s+/g, '-').toUpperCase()}-BLK-M`,
          size: 'M',
          colour: 'Onyx Black',
          colourHex: '#121212',
          priceNGN: formPriceNGN,
          costPriceNGN: formCostPriceNGN,
          initialStock: 15,
        },
        {
          sku: `PCY-${formName.replace(/\s+/g, '-').toUpperCase()}-BLK-L`,
          size: 'L',
          colour: 'Onyx Black',
          colourHex: '#121212',
          priceNGN: formPriceNGN,
          costPriceNGN: formCostPriceNGN,
          initialStock: 15,
        },
        {
          sku: `PCY-${formName.replace(/\s+/g, '-').toUpperCase()}-WHT-M`,
          size: 'M',
          colour: 'Bone White',
          colourHex: '#F2F0EB',
          priceNGN: formPriceNGN,
          costPriceNGN: formCostPriceNGN,
          initialStock: 10,
        },
      ];

      await AdminApi.createProduct({
        name: formName,
        description: formDescription,
        categoryId: formCategory,
        priceNGN: Number(formPriceNGN),
        costPriceNGN: Number(formCostPriceNGN),
        images: validImages,
        gsm: formGsm,
        fit: formFit,
        fabric: formFabric,
        shortDescription: formShortDescription,
        collection: formCollection || 'essentials',
        origin: formOrigin,
        careInstructions: formCareInstructions,
        productStory: formProductStory,
        tag: formTag,
        videoUrl: formVideoUrl || undefined,
        priceUSD: formPriceUSD === '' ? undefined : Number(formPriceUSD),
        priceGBP: formPriceGBP === '' ? undefined : Number(formPriceGBP),
        priceEUR: formPriceEUR === '' ? undefined : Number(formPriceEUR),
        isNewDrop: formIsNewDrop,
        isBestSeller: formIsBestSeller,
        isLimited: formIsLimited,
        status: 'ACTIVE',
        variants: defaultVariants as any,
      });

      setIsAddModalOpen(false);
      setFormName('');
      setFormDescription('');
      setFormShortDescription(''); setFormCollection('essentials'); setFormOrigin(''); setFormCareInstructions('');
      setFormProductStory(''); setFormTag(''); setFormVideoUrl(''); setFormPriceUSD(''); setFormPriceGBP(''); setFormPriceEUR('');
      setFormIsNewDrop(false); setFormIsBestSeller(false); setFormIsLimited(false);
      setAddImageSlots([]);
      await fetchProducts();
    } catch (err: any) {
      setError(err.message || 'Failed to create product.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    if (editImageSlots.some((s) => s.uploading)) {
      setError('Please wait for all images to finish uploading.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const validImages = editImageSlots
        .map((s) => s.url)
        .filter((u) => u && !u.startsWith('blob:'));

      if (validImages.length === 0) {
        setError('A product must retain at least one image.');
        return;
      }

      const newPrimary = validImages[0] || null;
      // Track old primary so we can detect which variants need updating
      const oldPrimary = (editingProduct.images || [])[0] || null;

      await AdminApi.updateProduct(editingProduct.id, {
        name: editingProduct.name,
        priceNGN: Number(editingProduct.priceNGN),
        costPriceNGN: Number(editingProduct.costPriceNGN || 0),
        status: editingProduct.status,
        description: editingProduct.description,
        images: validImages,
        categoryId: editingProduct.categoryId,
        shortDescription: editingProduct.shortDescription || '',
        collection: editingProduct.collection || 'essentials',
        priceUSD: Number(editingProduct.priceUSD || 0),
        priceGBP: Number(editingProduct.priceGBP || 0),
        priceEUR: Number(editingProduct.priceEUR || 0),
        videoUrl: editingProduct.videoUrl || '',
        gsm: editingProduct.gsm || '',
        fit: editingProduct.fit || '',
        fabric: editingProduct.fabric || '',
        origin: editingProduct.origin || '',
        careInstructions: editingProduct.careInstructions || '',
        productStory: editingProduct.productStory || '',
        tag: editingProduct.tag || '',
        isNewDrop: Boolean(editingProduct.isNewDrop),
        isBestSeller: Boolean(editingProduct.isBestSeller),
        isLimited: Boolean(editingProduct.isLimited),
      });

      const replacements = new Map(
        editImageSlots
          .filter((slot) => slot.originalUrl && slot.url && slot.originalUrl !== slot.url)
          .map((slot) => [slot.originalUrl as string, slot.url])
      );
      if (replacements.size > 0) {
        await Promise.allSettled(
          (editingProduct.variants || []).flatMap((variant) => {
            const image = variant.image ? replacements.get(variant.image) : undefined;
            const altImage = variant.altImage ? replacements.get(variant.altImage) : undefined;
            return image || altImage
              ? [AdminApi.updateVariant(variant.id, { ...(image ? { image } : {}), ...(altImage ? { altImage } : {}) })]
              : [];
          })
        );
      }

      // Sync primary image to variants that were using the old primary image
      // (i.e. variants without a custom image of their own)
      if (newPrimary && newPrimary !== oldPrimary) {
        const variantsToSync = (editingProduct.variants || []).filter(
          (v) => !v.image || v.image === oldPrimary
        );
        await Promise.allSettled(
          variantsToSync.map((v) =>
            AdminApi.updateVariant(v.id, { image: newPrimary })
          )
        );
      }

      setEditingProduct(null);
      setEditImageSlots([]);
      await fetchProducts();
    } catch (err: any) {
      setError(err.message || 'Failed to update product.');
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async (id: string) => {
    if (!window.confirm('Are you sure you want to archive this product?')) return;
    try {
      await AdminApi.archiveProduct(id);
      await fetchProducts();
    } catch (err: any) {
      setError(err.message || 'Failed to archive product.');
    }
  };

  const handleToggleStatus = async (product: AdminProduct) => {
    const nextStatus = product.status === 'ACTIVE' ? 'DRAFT' : 'ACTIVE';
    try {
      await AdminApi.updateProduct(product.id, { status: nextStatus });
      await fetchProducts();
    } catch (err: any) {
      setError(err.message || 'Failed to toggle status.');
    }
  };

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP HEADER & ACTION */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 min-w-0">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#A3A199] block mb-0.5">
            ATELIER CATALOG
          </span>
          <h2 className="text-xl font-bold text-[#F2F0EB]">Garments &amp; Collections</h2>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#F2F0EB] hover:bg-white text-[#0A0A0A] font-bold text-xs uppercase tracking-widest rounded-lg transition-all cursor-pointer shadow-sm active:scale-95 w-full sm:w-auto min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          <span>ADD NEW PRODUCT</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. SEARCH & CATEGORY FILTER */}
      {/* ------------------------------------------------------------- */}
      <div className="p-3.5 sm:p-4 rounded-xl bg-[#141414] border border-[#262626] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 sm:gap-3 text-xs min-w-0">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative min-w-0">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by title, category, or SKU..."
            className="w-full bg-[#0A0A0A] border border-[#2D2D2D] rounded-lg pl-9 pr-3 py-2 text-xs text-[#F2F0EB] placeholder:text-neutral-600 outline-hidden font-sans min-h-[40px]"
          />
        </form>

        <div className="grid grid-cols-2 sm:flex sm:flex-nowrap items-center gap-2 font-mono w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#0A0A0A] border border-[#2D2D2D] rounded-lg px-2.5 sm:px-3 py-2 text-[#F2F0EB] outline-hidden min-h-[40px] text-xs min-w-0"
          >
            <option value="ALL">All Categories</option>
            {categories.map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#0A0A0A] border border-[#2D2D2D] rounded-lg px-2.5 sm:px-3 py-2 text-[#F2F0EB] outline-hidden min-h-[40px] text-xs min-w-0"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. PRODUCTS TABLE */}
      {/* ------------------------------------------------------------- */}
      <div className="p-4 sm:p-6 rounded-2xl bg-[#141414] border border-[#262626] min-w-0">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-6 h-6 animate-spin text-[#F2F0EB]" />
            <span className="text-xs font-mono text-neutral-400">LOADING CATALOG...</span>
          </div>
        ) : error ? (
          <div className="p-4 rounded-lg bg-red-950/30 border border-red-800 text-red-200 text-xs text-center">
            {error}
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Package className="w-8 h-8 text-neutral-600 mx-auto" />
            <p className="text-sm font-semibold text-[#F2F0EB]">No products found</p>
            <p className="text-xs text-neutral-500 font-sans">
              Create your first atelier product to begin.
            </p>
          </div>
        ) : (
          <div>
            {/* MOBILE PRODUCT CARDS (< md) */}
            <div className="md:hidden space-y-3">
              {products.map((p) => {
                const totalStock = p.variants?.reduce(
                  (sum, v) => sum + (v.stock?.availableStock || 0),
                  0
                ) || 0;
                const grossProfit = p.priceNGN - (p.costPriceNGN || 0);
                const marginPercent = p.priceNGN > 0 ? Math.round((grossProfit / p.priceNGN) * 100) : 0;

                return (
                  <div
                    key={p.id}
                    className="p-4 rounded-xl bg-[#181818] border border-[#262626] space-y-3"
                  >
                    {/* Header: Image, Title, Category */}
                    <div className="flex items-start gap-3">
                      <img
                        src={p.images?.[0] || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80'}
                        alt={p.name}
                        className="w-16 h-16 object-cover rounded-lg bg-neutral-800 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <h3 className="font-semibold text-sm text-[#F2F0EB] leading-tight">
                            {p.name}
                          </h3>
                        </div>
                        <span className="text-[10px] font-mono text-neutral-400 uppercase block mt-1">
                          {p.categoryId.replace('cat-', '')} • {p.slug}
                        </span>
                        <div className="flex items-center gap-2 mt-1.5">
                          <button
                            onClick={() => handleToggleStatus(p)}
                            className={`text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded cursor-pointer transition-colors ${
                              p.status === 'ACTIVE'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40'
                                : p.status === 'DRAFT'
                                ? 'bg-amber-950 text-amber-300 border border-amber-800/40'
                                : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                            }`}
                          >
                            {p.status}
                          </button>
                          <span className="text-[10px] font-mono text-neutral-400">
                            {totalStock} in stock ({p.variants?.length || 0} vars)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Financial Metrics */}
                    <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-white/5 border border-white/5 text-center font-mono text-xs">
                      <div>
                        <span className="text-[9px] text-neutral-500 uppercase block">Retail</span>
                        <span className="font-bold text-[#F2F0EB]">₦{(p.priceNGN || 0).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-neutral-500 uppercase block">COGS</span>
                        <span className="text-neutral-400">₦{(p.costPriceNGN || 0).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-neutral-500 uppercase block">Margin</span>
                        <span className="font-bold text-emerald-400">{marginPercent}%</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => {
                          setEditingProduct(p);
                          setEditImageSlots(gallerySlotsForProduct(p));
                        }}
                        className="flex-1 py-2.5 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-[#F2F0EB] font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-colors min-h-[42px]"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit Product</span>
                      </button>

                      {p.status !== 'ARCHIVED' && (
                        <button
                          onClick={() => handleArchive(p.id)}
                          className="py-2.5 px-3 rounded-lg bg-red-950/30 hover:bg-red-950/60 border border-red-900/40 text-red-300 font-mono text-xs font-bold uppercase flex items-center justify-center gap-1.5 cursor-pointer transition-colors min-h-[42px] shrink-0"
                          title="Archive"
                        >
                          <Archive className="w-3.5 h-3.5" />
                          <span>Archive</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* DESKTOP TABLE VIEW (>= md) */}
            <div className="hidden md:block overflow-x-auto rounded-lg border border-[#202020]">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead>
                  <tr className="border-b border-[#262626] bg-[#0E0E0E] text-[10px] font-mono text-[#A3A199] uppercase tracking-wider">
                    <th className="py-3 px-3 font-normal">Garment</th>
                    <th className="py-3 px-3 font-normal">Category</th>
                    <th className="py-3 px-3 font-normal">Retail Price</th>
                    <th className="py-3 px-3 font-normal">Unit Cost</th>
                    <th className="py-3 px-3 font-normal">Margin %</th>
                    <th className="py-3 px-3 font-normal">Variants / Stock</th>
                    <th className="py-3 px-3 font-normal">Status</th>
                    <th className="py-3 px-3 font-normal text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#202020]">
                {products.map((p) => {
                  const totalStock = p.variants?.reduce(
                    (sum, v) => sum + (v.stock?.availableStock || 0),
                    0
                  ) || 0;
                  const grossProfit = p.priceNGN - (p.costPriceNGN || 0);
                  const marginPercent = p.priceNGN > 0 ? Math.round((grossProfit / p.priceNGN) * 100) : 0;

                  return (
                    <tr key={p.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.images?.[0] || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80'}
                            alt={p.name}
                            className="w-10 h-10 object-cover rounded bg-neutral-800"
                          />
                          <div>
                            <span className="font-semibold text-[#F2F0EB] block">{p.name}</span>
                            <span className="text-[10px] font-mono text-neutral-500 truncate max-w-[160px] block">
                              {p.slug}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 font-mono text-neutral-300 uppercase">
                        {p.categoryId.replace('cat-', '')}
                      </td>

                      <td className="py-3.5 font-mono font-bold text-[#F2F0EB]">
                        ₦{(p.priceNGN || 0).toLocaleString()}
                      </td>

                      <td className="py-3.5 font-mono text-neutral-400">
                        ₦{(p.costPriceNGN || 0).toLocaleString()}
                      </td>

                      <td className="py-3.5 font-mono text-emerald-400 font-semibold">
                        {marginPercent}%
                      </td>

                      <td className="py-3.5 font-mono">
                        <span className="font-bold text-[#F2F0EB]">{totalStock} units</span>
                        <span className="text-[10px] text-neutral-500 block">
                          ({p.variants?.length || 0} variants)
                        </span>
                      </td>

                      <td className="py-3.5">
                        <button
                          onClick={() => handleToggleStatus(p)}
                          title="Click to toggle status"
                          className={`text-[9px] font-mono uppercase font-bold px-2.5 py-0.5 rounded cursor-pointer transition-colors ${
                            p.status === 'ACTIVE'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40 hover:bg-emerald-900/60'
                              : p.status === 'DRAFT'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800/40 hover:bg-amber-900/60'
                              : 'bg-neutral-800 text-neutral-400 border border-neutral-700 hover:bg-neutral-700'
                          }`}
                        >
                          {p.status}
                        </button>
                      </td>

                      <td className="py-3.5 text-right space-x-1">
                        <button
                          onClick={() => {
                            setEditingProduct(p);
                            setEditImageSlots(gallerySlotsForProduct(p));
                          }}
                          className="p-1.5 rounded hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                          title="Edit Product"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {p.status !== 'ARCHIVED' && (
                          <button
                            onClick={() => handleArchive(p.id)}
                            className="p-1.5 rounded hover:bg-red-950/40 text-neutral-500 hover:text-red-400 transition-colors cursor-pointer"
                            title="Archive Product"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. ADD PRODUCT MODAL */}
      {/* ------------------------------------------------------------- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-xs font-sans">
          <div className="w-full max-w-xl bg-[#141414] border border-[#2D2D2D] rounded-t-2xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 text-[#F2F0EB] max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#242424] pb-4 mb-4">
              <h3 className="font-bold text-base text-[#F2F0EB] flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>ADD NEW ATELIER PIECE</span>
              </h3>
              <button
                onClick={() => { setIsAddModalOpen(false); setAddImageSlots([]); }}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-mono text-[#A3A199] uppercase mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Heavyweight Minimalist Tee"
                  className="w-full bg-[#0A0A0A] border border-[#2D2D2D] rounded-lg px-3 py-2 text-[#F2F0EB] outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#A3A199] uppercase mb-1">
                  Category *
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-[#2D2D2D] rounded-lg px-3 py-2 text-[#F2F0EB] outline-hidden font-mono"
                >
                  {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
              </div>

              {/* ── Supabase Image Upload ── */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-mono text-[#A3A199] uppercase">
                    Product Images
                  </label>
                  {addImageSlots.length > 0 && (
                    <span className="text-[10px] font-mono text-neutral-500">
                      {addImageSlots.filter((s) => !s.uploading && !s.error).length} uploaded
                    </span>
                  )}
                </div>
                <ImageUploadRow
                  slots={addImageSlots}
                  onChange={setAddImageSlots}
                  bucket="products"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-[#A3A199] uppercase mb-1">
                    Retail Price (NGN ₦) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1000}
                    step={500}
                    value={formPriceNGN}
                    onChange={(e) => setFormPriceNGN(Number(e.target.value))}
                    className="w-full bg-[#0A0A0A] border border-[#2D2D2D] rounded-lg px-3 py-2 text-[#F2F0EB] outline-hidden font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-[#A3A199] uppercase mb-1">
                    Unit Cost Price (COGS ₦)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    value={formCostPriceNGN}
                    onChange={(e) => setFormCostPriceNGN(Number(e.target.value))}
                    className="w-full bg-[#0A0A0A] border border-[#2D2D2D] rounded-lg px-3 py-2 text-[#F2F0EB] outline-hidden font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#A3A199] uppercase mb-1">
                  Description *
                </label>
                <textarea
                  rows={3}
                  required
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Tailored from luxury cotton with dropped shoulders and relaxed silhouette..."
                  className="w-full bg-[#0A0A0A] border border-[#2D2D2D] rounded-lg px-3 py-2 text-[#F2F0EB] outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">
                    Fabric
                  </label>
                  <input
                    type="text"
                    value={formFabric}
                    onChange={(e) => setFormFabric(e.target.value)}
                    className="w-full bg-[#0A0A0A] border border-[#2D2D2D] rounded px-2.5 py-1.5 text-[#F2F0EB] outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">
                    Fit
                  </label>
                  <input
                    type="text"
                    value={formFit}
                    onChange={(e) => setFormFit(e.target.value)}
                    className="w-full bg-[#0A0A0A] border border-[#2D2D2D] rounded px-2.5 py-1.5 text-[#F2F0EB] outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">
                    Weight / GSM
                  </label>
                  <input
                    type="text"
                    value={formGsm}
                    onChange={(e) => setFormGsm(e.target.value)}
                    className="w-full bg-[#0A0A0A] border border-[#2D2D2D] rounded px-2.5 py-1.5 text-[#F2F0EB] outline-hidden"
                  />
                </div>
              </div>

              <details className="rounded-lg border border-[#2D2D2D] bg-[#101010] p-3">
                <summary className="cursor-pointer text-[11px] font-mono uppercase tracking-wider text-[#F2F0EB]">Additional catalog fields · optional</summary>
                <div className="mt-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="block"><span className="mb-1 block text-[10px] uppercase text-neutral-400">Short description</span><textarea rows={2} value={formShortDescription} onChange={(e) => setFormShortDescription(e.target.value)} className="w-full rounded border border-[#2D2D2D] bg-[#0A0A0A] px-3 py-2 text-[#F2F0EB]" /></label>
                    <label className="block"><span className="mb-1 block text-[10px] uppercase text-neutral-400">Collection</span><input value={formCollection} onChange={(e) => setFormCollection(e.target.value)} placeholder="essentials" className="w-full rounded border border-[#2D2D2D] bg-[#0A0A0A] px-3 py-2 text-[#F2F0EB]" /></label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <label className="block"><span className="mb-1 block text-[10px] uppercase text-neutral-400">Price USD</span><input type="number" min={1} value={formPriceUSD} onChange={(e) => setFormPriceUSD(e.target.value === '' ? '' : Number(e.target.value))} className="w-full rounded border border-[#2D2D2D] bg-[#0A0A0A] px-3 py-2 text-[#F2F0EB]" /></label>
                    <label className="block"><span className="mb-1 block text-[10px] uppercase text-neutral-400">Price GBP</span><input type="number" min={1} value={formPriceGBP} onChange={(e) => setFormPriceGBP(e.target.value === '' ? '' : Number(e.target.value))} className="w-full rounded border border-[#2D2D2D] bg-[#0A0A0A] px-3 py-2 text-[#F2F0EB]" /></label>
                    <label className="block"><span className="mb-1 block text-[10px] uppercase text-neutral-400">Price EUR</span><input type="number" min={1} value={formPriceEUR} onChange={(e) => setFormPriceEUR(e.target.value === '' ? '' : Number(e.target.value))} className="w-full rounded border border-[#2D2D2D] bg-[#0A0A0A] px-3 py-2 text-[#F2F0EB]" /></label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="block"><span className="mb-1 block text-[10px] uppercase text-neutral-400">Country / origin</span><input value={formOrigin} onChange={(e) => setFormOrigin(e.target.value)} className="w-full rounded border border-[#2D2D2D] bg-[#0A0A0A] px-3 py-2 text-[#F2F0EB]" /></label>
                    <label className="block"><span className="mb-1 block text-[10px] uppercase text-neutral-400">Product tag</span><input value={formTag} onChange={(e) => setFormTag(e.target.value)} placeholder="graphic, limited…" className="w-full rounded border border-[#2D2D2D] bg-[#0A0A0A] px-3 py-2 text-[#F2F0EB]" /></label>
                  </div>
                  <label className="block"><span className="mb-1 block text-[10px] uppercase text-neutral-400">Video URL</span><input type="url" value={formVideoUrl} onChange={(e) => setFormVideoUrl(e.target.value)} placeholder="https://…" className="w-full rounded border border-[#2D2D2D] bg-[#0A0A0A] px-3 py-2 text-[#F2F0EB]" /></label>
                  <label className="block"><span className="mb-1 block text-[10px] uppercase text-neutral-400">Care instructions</span><textarea rows={2} value={formCareInstructions} onChange={(e) => setFormCareInstructions(e.target.value)} className="w-full rounded border border-[#2D2D2D] bg-[#0A0A0A] px-3 py-2 text-[#F2F0EB]" /></label>
                  <label className="block"><span className="mb-1 block text-[10px] uppercase text-neutral-400">Product story</span><textarea rows={3} value={formProductStory} onChange={(e) => setFormProductStory(e.target.value)} className="w-full rounded border border-[#2D2D2D] bg-[#0A0A0A] px-3 py-2 text-[#F2F0EB]" /></label>
                  <div className="flex flex-wrap gap-4 text-xs">
                    <label className="flex items-center gap-2"><input type="checkbox" checked={formIsNewDrop} onChange={(e) => setFormIsNewDrop(e.target.checked)} />New drop</label>
                    <label className="flex items-center gap-2"><input type="checkbox" checked={formIsBestSeller} onChange={(e) => setFormIsBestSeller(e.target.checked)} />Best seller</label>
                    <label className="flex items-center gap-2"><input type="checkbox" checked={formIsLimited} onChange={(e) => setFormIsLimited(e.target.checked)} />Limited</label>
                  </div>
                </div>
              </details>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-neutral-400 text-[11px]">
                ℹ️ Initial variants (Onyx Black M/L, Bone White M) with 40 total pieces will be automatically generated with SKU format PCY-[SLUG]-[COLOR]-[SIZE].
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2 border-t border-[#242424]">
                <button
                  type="button"
                  onClick={() => { setIsAddModalOpen(false); setAddImageSlots([]); }}
                  className="px-4 py-2.5 rounded text-neutral-400 hover:text-white font-mono min-h-[42px] flex items-center justify-center cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || addImageSlots.some((s) => s.uploading)}
                  className="px-5 py-2.5 rounded bg-[#F2F0EB] text-[#0A0A0A] font-bold font-mono uppercase text-xs hover:bg-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 min-h-[42px] cursor-pointer"
                >
                  {saving ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> CREATING...</>
                  ) : addImageSlots.some((s) => s.uploading) ? (
                    <><Upload className="w-3.5 h-3.5 animate-bounce" /> UPLOADING...</>
                  ) : (
                    'PUBLISH PIECE'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. EDIT PRODUCT MODAL */}
      {/* ------------------------------------------------------------- */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-xs font-sans">
          <div className="w-full max-w-lg bg-[#141414] border border-[#2D2D2D] rounded-t-2xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 text-[#F2F0EB] max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#242424] pb-4 mb-4">
              <h3 className="font-bold text-base text-[#F2F0EB] flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-400" />
                <span>EDIT ATELIER PIECE</span>
              </h3>
              <button
                onClick={() => { setEditingProduct(null); setEditImageSlots([]); }}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateProduct} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-mono text-[#A3A199] uppercase mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  required
                  value={editingProduct.name}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, name: e.target.value })
                  }
                  className="w-full bg-[#0A0A0A] border border-[#2D2D2D] rounded-lg px-3 py-2 text-[#F2F0EB] outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-[#A3A199] uppercase mb-1">
                    Retail Price (NGN ₦)
                  </label>
                  <input
                    type="number"
                    required
                    value={editingProduct.priceNGN}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        priceNGN: Number(e.target.value),
                      })
                    }
                    className="w-full bg-[#0A0A0A] border border-[#2D2D2D] rounded-lg px-3 py-2 text-[#F2F0EB] outline-hidden font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-[#A3A199] uppercase mb-1">
                    Cost Price (COGS ₦)
                  </label>
                  <input
                    type="number"
                    value={editingProduct.costPriceNGN || 0}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        costPriceNGN: Number(e.target.value),
                      })
                    }
                    className="w-full bg-[#0A0A0A] border border-[#2D2D2D] rounded-lg px-3 py-2 text-[#F2F0EB] outline-hidden font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#A3A199] uppercase mb-1">
                  Publishing Status
                </label>
                <select
                  value={editingProduct.status}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      status: e.target.value as any,
                    })
                  }
                  className="w-full bg-[#0A0A0A] border border-[#2D2D2D] rounded-lg px-3 py-2 text-[#F2F0EB] outline-hidden font-mono"
                >
                  <option value="ACTIVE">ACTIVE (Published in Storefront)</option>
                  <option value="DRAFT">DRAFT (Hidden from Storefront)</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-[#A3A199] uppercase mb-1">Category ID</label>
                  <select value={editingProduct.categoryId} onChange={(e) => setEditingProduct({ ...editingProduct, categoryId: e.target.value })} className="w-full bg-[#0A0A0A] border border-[#2D2D2D] rounded-lg px-3 py-2 text-[#F2F0EB]">
                    {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-[#A3A199] uppercase mb-1">Collection</label>
                  <input value={editingProduct.collection || ''} onChange={(e) => setEditingProduct({ ...editingProduct, collection: e.target.value })} className="w-full bg-[#0A0A0A] border border-[#2D2D2D] rounded-lg px-3 py-2 text-[#F2F0EB]" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-mono text-[#A3A199] uppercase mb-1">Short Description</label>
                <textarea rows={2} value={editingProduct.shortDescription || ''} onChange={(e) => setEditingProduct({ ...editingProduct, shortDescription: e.target.value })} className="w-full bg-[#0A0A0A] border border-[#2D2D2D] rounded-lg px-3 py-2 text-[#F2F0EB]" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div><label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">GSM / Weight</label><input value={editingProduct.gsm || ''} onChange={(e) => setEditingProduct({ ...editingProduct, gsm: e.target.value })} className="w-full bg-[#0A0A0A] border border-[#2D2D2D] rounded px-2.5 py-2 text-[#F2F0EB]" /></div>
                <div><label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">Fit</label><input value={editingProduct.fit || ''} onChange={(e) => setEditingProduct({ ...editingProduct, fit: e.target.value })} className="w-full bg-[#0A0A0A] border border-[#2D2D2D] rounded px-2.5 py-2 text-[#F2F0EB]" /></div>
                <div><label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">Fabric</label><input value={editingProduct.fabric || ''} onChange={(e) => setEditingProduct({ ...editingProduct, fabric: e.target.value })} className="w-full bg-[#0A0A0A] border border-[#2D2D2D] rounded px-2.5 py-2 text-[#F2F0EB]" /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">Country / Origin</label><input value={editingProduct.origin || ''} onChange={(e) => setEditingProduct({ ...editingProduct, origin: e.target.value })} className="w-full bg-[#0A0A0A] border border-[#2D2D2D] rounded px-2.5 py-2 text-[#F2F0EB]" /></div>
                <div><label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">Product Tag</label><input value={editingProduct.tag || ''} onChange={(e) => setEditingProduct({ ...editingProduct, tag: e.target.value })} className="w-full bg-[#0A0A0A] border border-[#2D2D2D] rounded px-2.5 py-2 text-[#F2F0EB]" /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">Video URL</label><input type="url" value={editingProduct.videoUrl || ''} onChange={(e) => setEditingProduct({ ...editingProduct, videoUrl: e.target.value })} className="w-full bg-[#0A0A0A] border border-[#2D2D2D] rounded px-2.5 py-2 text-[#F2F0EB]" /></div>
                <div><label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">Care Instructions</label><input value={editingProduct.careInstructions || ''} onChange={(e) => setEditingProduct({ ...editingProduct, careInstructions: e.target.value })} className="w-full bg-[#0A0A0A] border border-[#2D2D2D] rounded px-2.5 py-2 text-[#F2F0EB]" /></div>
              </div>
              <div>
                <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">Product Story</label>
                <textarea rows={3} value={editingProduct.productStory || ''} onChange={(e) => setEditingProduct({ ...editingProduct, productStory: e.target.value })} className="w-full bg-[#0A0A0A] border border-[#2D2D2D] rounded px-2.5 py-2 text-[#F2F0EB]" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div><label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">Price USD</label><input type="number" min={0} value={editingProduct.priceUSD || 0} onChange={(e) => setEditingProduct({ ...editingProduct, priceUSD: Number(e.target.value) })} className="w-full bg-[#0A0A0A] border border-[#2D2D2D] rounded px-2.5 py-2 text-[#F2F0EB]" /></div>
                <div><label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">Price GBP</label><input type="number" min={0} value={editingProduct.priceGBP || 0} onChange={(e) => setEditingProduct({ ...editingProduct, priceGBP: Number(e.target.value) })} className="w-full bg-[#0A0A0A] border border-[#2D2D2D] rounded px-2.5 py-2 text-[#F2F0EB]" /></div>
                <div><label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">Price EUR</label><input type="number" min={0} value={editingProduct.priceEUR || 0} onChange={(e) => setEditingProduct({ ...editingProduct, priceEUR: Number(e.target.value) })} className="w-full bg-[#0A0A0A] border border-[#2D2D2D] rounded px-2.5 py-2 text-[#F2F0EB]" /></div>
              </div>
              <div className="flex flex-wrap gap-4 rounded-lg border border-[#292929] p-3">
                <label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(editingProduct.isNewDrop)} onChange={(e) => setEditingProduct({ ...editingProduct, isNewDrop: e.target.checked })} />New drop</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(editingProduct.isBestSeller)} onChange={(e) => setEditingProduct({ ...editingProduct, isBestSeller: e.target.checked })} />Best seller</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(editingProduct.isLimited)} onChange={(e) => setEditingProduct({ ...editingProduct, isLimited: e.target.checked })} />Limited</label>
              </div>

              {/* ── Supabase Image Upload (Edit) ── */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-mono text-[#A3A199] uppercase">
                    Product Images
                  </label>
                  {editImageSlots.length > 0 && (
                    <span className="text-[10px] font-mono text-neutral-500">
                      {editImageSlots.filter((s) => !s.uploading && !s.error).length} image(s)
                    </span>
                  )}
                </div>
                <ImageUploadRow
                  slots={editImageSlots}
                  onChange={setEditImageSlots}
                  bucket="products"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#A3A199] uppercase mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editingProduct.description}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, description: e.target.value })
                  }
                  className="w-full bg-[#0A0A0A] border border-[#2D2D2D] rounded-lg px-3 py-2 text-[#F2F0EB] outline-hidden"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2 border-t border-[#242424]">
                <button
                  type="button"
                  onClick={() => { setEditingProduct(null); setEditImageSlots([]); }}
                  className="px-4 py-2.5 rounded text-neutral-400 hover:text-white font-mono min-h-[42px] flex items-center justify-center cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || editImageSlots.some((s) => s.uploading)}
                  className="px-5 py-2.5 rounded bg-[#F2F0EB] text-[#0A0A0A] font-bold font-mono uppercase text-xs hover:bg-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 min-h-[42px] cursor-pointer"
                >
                  {saving ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> SAVING...</>
                  ) : editImageSlots.some((s) => s.uploading) ? (
                    <><Upload className="w-3.5 h-3.5 animate-bounce" /> UPLOADING...</>
                  ) : (
                    'SAVE CHANGES'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
