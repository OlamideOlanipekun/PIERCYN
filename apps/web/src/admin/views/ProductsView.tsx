import React, { useState, useEffect } from 'react';
import { AdminProduct } from '../types';
import { AdminApi } from '../api';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Archive,
  CheckCircle,
  Eye,
  Loader2,
  X,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

export const ProductsView: React.FC = () => {
  const [products, setProducts] = useState<AdminProduct[]>([]);
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
  const [formCategory, setFormCategory] = useState('cat-tees');
  const [formPriceNGN, setFormPriceNGN] = useState<number>(35000);
  const [formCostPriceNGN, setFormCostPriceNGN] = useState<number>(14000);
  const [formImage, setFormImage] = useState('');
  const [formImages, setFormImages] = useState<File[]>([]);
  const [formImagePreviews, setFormImagePreviews] = useState<string[]>([]);
  const [formGsm, setFormGsm] = useState('280 GSM');
  const [formFit, setFormFit] = useState('Relaxed Boxy Cut');
  const [formFabric, setFormFabric] = useState('100% Heavyweight Cotton');

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
    const previews = formImages.map((file) => URL.createObjectURL(file));
    setFormImagePreviews(previews);

    return () => previews.forEach((preview) => URL.revokeObjectURL(preview));
  }, [formImages]);

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

    try {
      setSaving(true);
      setError(null);

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

      const uploadedImages = await Promise.all(formImages.map((file) => AdminApi.uploadProductImage(file)));
      const imageUrls = [
        ...uploadedImages.map((image) => image.publicUrl),
        ...(formImage.trim() ? [formImage.trim()] : []),
      ];

      await AdminApi.createProduct({
        name: formName,
        description: formDescription,
        categoryId: formCategory,
        priceNGN: Number(formPriceNGN),
        costPriceNGN: Number(formCostPriceNGN),
        images: imageUrls.length > 0
          ? imageUrls
          : ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80'],
        gsm: formGsm,
        fit: formFit,
        fabric: formFabric,
        status: 'ACTIVE',
        variants: defaultVariants as any,
      });

      setIsAddModalOpen(false);
      setFormName('');
      setFormDescription('');
      setFormImage('');
      setFormImages([]);
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

    try {
      setSaving(true);
      setError(null);
      await AdminApi.updateProduct(editingProduct.id, {
        name: editingProduct.name,
        priceNGN: Number(editingProduct.priceNGN),
        costPriceNGN: Number(editingProduct.costPriceNGN || 0),
        status: editingProduct.status,
        description: editingProduct.description,
      });

      setEditingProduct(null);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#A3A199] block mb-0.5">
            ATELIER CATALOG
          </span>
          <h2 className="text-xl font-bold text-[#F2F0EB]">Garments & Collections</h2>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#F2F0EB] hover:bg-white text-[#0A0A0A] font-bold text-xs uppercase tracking-widest rounded-lg transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>ADD NEW PRODUCT</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. SEARCH & CATEGORY FILTER */}
      {/* ------------------------------------------------------------- */}
      <div className="p-4 rounded-xl bg-[#141414] border border-[#262626] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by title, category, or SKU..."
            className="w-full bg-[#0A0A0A] border border-[#2D2D2D] rounded-lg pl-9 pr-3 py-2 text-[#F2F0EB] placeholder:text-neutral-600 outline-hidden font-sans"
          />
        </form>

        <div className="flex items-center gap-2 font-mono">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#0A0A0A] border border-[#2D2D2D] rounded-lg px-3 py-2 text-[#F2F0EB] outline-hidden"
          >
            <option value="ALL">All Categories</option>
            <option value="cat-tees">Tees</option>
            <option value="cat-hoodies">Hoodies</option>
            <option value="cat-sweatshirts">Sweatshirts</option>
            <option value="cat-jackets">Jackets</option>
            <option value="cat-trousers">Trousers</option>
            <option value="cat-accessories">Accessories</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#0A0A0A] border border-[#2D2D2D] rounded-lg px-3 py-2 text-[#F2F0EB] outline-hidden"
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
      <div className="p-5 sm:p-6 rounded-2xl bg-[#141414] border border-[#262626]">
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
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#262626] text-[10px] font-mono text-[#A3A199] uppercase tracking-wider">
                  <th className="py-3 font-normal">Garment</th>
                  <th className="py-3 font-normal">Category</th>
                  <th className="py-3 font-normal">Retail Price</th>
                  <th className="py-3 font-normal">Unit Cost</th>
                  <th className="py-3 font-normal">Margin %</th>
                  <th className="py-3 font-normal">Variants / Stock</th>
                  <th className="py-3 font-normal">Status</th>
                  <th className="py-3 font-normal text-right">Actions</th>
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
                        ₦{p.priceNGN.toLocaleString()}
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
                          onClick={() => setEditingProduct(p)}
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
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. ADD PRODUCT MODAL */}
      {/* ------------------------------------------------------------- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-sans">
          <div className="w-full max-w-xl bg-[#141414] border border-[#2D2D2D] rounded-2xl shadow-2xl p-6 text-[#F2F0EB] max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#242424] pb-4 mb-4">
              <h3 className="font-bold text-base text-[#F2F0EB] flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>ADD NEW ATELIER PIECE</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-[#A3A199] uppercase mb-1">
                    Category *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-[#0A0A0A] border border-[#2D2D2D] rounded-lg px-3 py-2 text-[#F2F0EB] outline-hidden font-mono"
                  >
                    <option value="cat-tees">Tees</option>
                    <option value="cat-hoodies">Hoodies</option>
                    <option value="cat-sweatshirts">Sweatshirts</option>
                    <option value="cat-jackets">Jackets</option>
                    <option value="cat-trousers">Trousers</option>
                    <option value="cat-accessories">Accessories</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-[#A3A199] uppercase mb-1">
                    Backup Image URL
                  </label>
                  <input
                    type="url"
                    value={formImage}
                    onChange={(e) => setFormImage(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-[#0A0A0A] border border-[#2D2D2D] rounded-lg px-3 py-2 text-[#F2F0EB] outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#A3A199] uppercase mb-1">
                  Product Images
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  onChange={(e) => setFormImages(Array.from(e.target.files || []))}
                  className="w-full bg-[#0A0A0A] border border-[#2D2D2D] rounded-lg px-3 py-2 text-[#F2F0EB] file:mr-3 file:border-0 file:bg-white/10 file:px-2 file:py-1 file:text-xs file:text-[#F2F0EB]"
                />
                <p className="mt-1 text-[10px] text-neutral-500">
                  JPEG, PNG, WebP, or GIF. Up to 3 MB per image. {formImages.length > 0 ? `${formImages.length} selected.` : ''}
                </p>
                {formImages.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formImagePreviews.map((preview, index) => (
                      <img
                        key={`${formImages[index].name}-${formImages[index].lastModified}`}
                        src={preview}
                        alt={formImages[index].name}
                        className="h-16 w-16 rounded object-cover border border-[#2D2D2D]"
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
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

              <div className="grid grid-cols-3 gap-3">
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

              <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-neutral-400 text-[11px]">
                ℹ️ Initial variants (Onyx Black M/L, Bone White M) with 40 total pieces will be automatically generated with SKU format PCY-[SLUG]-[COLOR]-[SIZE].
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#242424]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded text-neutral-400 hover:text-white font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded bg-[#F2F0EB] text-[#0A0A0A] font-bold font-mono uppercase text-xs hover:bg-white transition-all disabled:opacity-50"
                >
                  {saving ? 'CREATING...' : 'PUBLISH PIECE'}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-sans">
          <div className="w-full max-w-lg bg-[#141414] border border-[#2D2D2D] rounded-2xl shadow-2xl p-6 text-[#F2F0EB] animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#242424] pb-4 mb-4">
              <h3 className="font-bold text-base text-[#F2F0EB] flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-400" />
                <span>EDIT ATELIER PIECE</span>
              </h3>
              <button
                onClick={() => setEditingProduct(null)}
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

              <div className="grid grid-cols-2 gap-3">
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

              <div className="flex justify-end gap-2 pt-2 border-t border-[#242424]">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 rounded text-neutral-400 hover:text-white font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded bg-[#F2F0EB] text-[#0A0A0A] font-bold font-mono uppercase text-xs hover:bg-white transition-all disabled:opacity-50"
                >
                  {saving ? 'SAVING...' : 'SAVE CHANGES'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
