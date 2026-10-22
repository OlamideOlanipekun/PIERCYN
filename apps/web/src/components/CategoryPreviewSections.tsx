import React, { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';

interface CategoryPreviewSectionsProps {
  products: Product[];
  onViewProduct: (product: Product) => void;
}

const slugify = (value: string) =>
  value.toLowerCase().trim().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const categoryLabel = (value: string) =>
  value.split(/[-_\s]+/).filter(Boolean).map((part) => part.toUpperCase()).join(' ');

export const CategoryPreviewSections: React.FC<CategoryPreviewSectionsProps> = ({ products, onViewProduct }) => {
  const groups = useMemo(() => {
    const published = products.filter((product) => product.status !== 'draft' && product.status !== 'archived');
    const categoryMap = new Map<string, Product[]>();

    published.forEach((product) => {
      const category = String(product.category || '').trim();
      if (!category) return;
      const key = slugify(category);
      if (!key) return;
      const existing = categoryMap.get(key) || [];
      existing.push(product);
      categoryMap.set(key, existing);
    });

    return Array.from(categoryMap.entries())
      .map(([slug, items]) => ({
        slug,
        title: categoryLabel(String(items[0].category)),
        products: [...items].sort((a, b) =>
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        ),
      }))
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [products]);

  if (!groups.length) return null;

  return (
    <div className="bg-[#F2F0EB] text-[#141414]">
      {groups.map((group, groupIndex) => (
        <section
          key={group.slug}
          className="w-full border-b border-[#DAD8D1] py-10 sm:py-14 lg:py-16"
          aria-labelledby={`home-category-${group.slug}`}
        >
          <div className="piercyn-container">
            <div className="mb-5 flex items-end justify-between gap-4 border-b border-[#DAD8D1]/80 pb-4 sm:mb-7">
              <div>
                <p className="mb-1 text-[10px] font-mono uppercase tracking-[0.22em] text-[#77736B]">
                  {String(groupIndex + 1).padStart(2, '0')} / SHOP BY CATEGORY
                </p>
                <h2 id={`home-category-${group.slug}`} className="font-editorial text-2xl uppercase leading-tight tracking-[-0.03em] sm:text-4xl lg:text-5xl">
                  {group.title}
                </h2>
              </div>
              <a
                href={`/shop?category=${encodeURIComponent(group.slug)}`}
                onClick={(event) => {
                  event.preventDefault();
                  window.history.pushState({ page: 'shop', category: group.slug }, '', `/shop?category=${encodeURIComponent(group.slug)}`);
                  window.dispatchEvent(new PopStateEvent('popstate'));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="group inline-flex min-h-11 shrink-0 items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] transition-opacity hover:opacity-60 sm:text-xs"
                aria-label={`View all ${group.title} products`}
              >
                VIEW ALL <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </a>
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-5 sm:gap-y-8 lg:grid-cols-4">
              {group.products.slice(0, 4).map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onViewProduct={onViewProduct}
                  priority={groupIndex === 0 && index < 2}
                />
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
};
