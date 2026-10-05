import { Collection, ArchiveCollection } from '../types';

export const COLLECTIONS: Collection[] = [
  {
    id: 'col-everyday',
    name: 'THE EVERYDAY',
    slug: 'the-everyday',
    tagline: 'Pieces designed for the way you actually move.',
    editorialSubhead: 'MODERN ESSENTIALS WITHOUT THE ORDINARY',
    description: 'Sculpted for daytime Lagos rhythm and global movement. Cut from heavyweight 450 GSM organic terry with structural drape, double-needle reverse stitching, and relaxed architectural silhouettes built to endure.',
    heroImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=85&w=1600&auto=format&fit=crop',
    mobileHeroImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=85&w=1000&auto=format&fit=crop',
    secondaryImages: [
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=85&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=85&w=1000&auto=format&fit=crop'
    ],
    featuredProductIds: ['piercyn-sig-hoodie', 'lagos-arch-sweatshirt', 'w-hoodie-01', 'w-tee-01'],
    category: 'everyday',
    season: 'Permanent',
    year: '2026',
    status: 'active',
    ctaLabel: 'SHOP THE EVERYDAY →',
    sortOrder: 1,
    theme: 'light',
    detailStory: 'The Everyday is the foundation of the PIERCYN wardrobe. Built in Lagos from 450 GSM combed cotton that balances extreme structure with fluid movement. Each piece is designed to be lived in, washed, and worn continuously without losing its architectural volume.',
    detailQuotes: [
      'Form without rigidity. Luxury without ostentation.',
      'Crafted for the streets of Victoria Island and the avenues of Paris.'
    ]
  },
  {
    id: 'col-after-dark',
    name: 'AFTER DARK',
    slug: 'after-dark',
    tagline: "For nights that don't feel ordinary.",
    editorialSubhead: 'THE NIGHTTIME LAGOS EDIT',
    description: 'Low-key urban lighting. Dark tonal palettes. Reversible high-density bombers, pleated raw denim, and weighted outerwear designed for atmospheric nightfall.',
    heroImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=85&w=1600&auto=format&fit=crop',
    mobileHeroImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=85&w=1000&auto=format&fit=crop',
    secondaryImages: [
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=85&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?q=85&w=1000&auto=format&fit=crop'
    ],
    featuredProductIds: ['lekki-afterdark-bomber', 'surulere-cargo-pants', 'w-outerwear-01', 'w-dress-01'],
    category: 'after-dark',
    season: 'Drop 26.1',
    year: '2026',
    status: 'active',
    ctaLabel: 'SHOP AFTER DARK →',
    sortOrder: 2,
    theme: 'dark',
    detailStory: 'After Dark captures the nocturnal energy of Lagos. When the city cools down, PIERCYN outerwear comes alive. Deep pitch blacks, midnight navy, and iridescent metallic details crafted for rooftop gatherings, underground art shows, and late-night atelier hours.',
    detailQuotes: [
      'Nightfall in Victoria Island demands a different silhouette.',
      'Low lighting, high density.'
    ]
  },
  {
    id: 'col-essentials',
    name: 'ESSENTIALS',
    slug: 'essentials',
    tagline: 'The pieces that become part of your uniform.',
    editorialSubhead: 'PURE TEXTILE & SILHOUETTE FOCUS',
    description: 'A minimalist exploration of pure cotton density, meticulous stitch counts, raw selvedge edges, and uncompromised ribbing. Unbranded, powerful, and timeless.',
    heroImage: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=85&w=1600&auto=format&fit=crop',
    mobileHeroImage: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=85&w=1000&auto=format&fit=crop',
    secondaryImages: [
      'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?q=85&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=85&w=1000&auto=format&fit=crop'
    ],
    featuredProductIds: ['essential-crewneck-tee', 'piercyn-sig-hoodie', 'm-polo-01', 'w-crop-01'],
    category: 'essentials',
    season: 'Core Collection',
    year: '2026',
    status: 'active',
    ctaLabel: 'EXPLORE ESSENTIALS →',
    sortOrder: 3,
    theme: 'studio',
    detailStory: 'Stripped of all distraction. Essentials is a masterclass in garment construction. We spent 14 months refining the shoulder drop angle, double-needle seam strength, and collar rib elasticity so your everyday uniform maintains its brand-new structure after hundreds of wears.',
    detailQuotes: [
      'The luxury of uncompromised simplicity.',
      '450 GSM French Terry. 280 GSM Heavyweight Jersey.'
    ]
  },
  {
    id: 'col-the-drop',
    name: 'THE DROP',
    slug: 'the-drop',
    tagline: 'New pieces. New energy.',
    editorialSubhead: 'LIMITED RUN LAGOS ATELIER EDITION',
    description: 'Experimental cuts, hand-finished embroidery, and limited architectural pieces released in strictly numbered quantities. Once sold out, archived forever.',
    heroImage: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=85&w=1600&auto=format&fit=crop',
    mobileHeroImage: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=85&w=1000&auto=format&fit=crop',
    secondaryImages: [
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=85&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=85&w=1000&auto=format&fit=crop'
    ],
    featuredProductIds: ['m-jacket-01', 'w-skirt-01', 'm-pants-02', 'w-top-02'],
    category: 'the-drop',
    season: 'Release 26.1',
    year: '2026',
    status: 'active',
    ctaLabel: 'SHOP THE DROP →',
    sortOrder: 4,
    theme: 'vibrant',
    detailStory: 'The Drop represents PIERCYN’s continuous artistic evolution. Each capsule release explores bold sculptural shapes, local Nigerian textile techniques, and unexpected color palettes crafted in small batches at our Surulere atelier.',
    detailQuotes: [
      'Limited quantities. Unlimited presence.',
      'Archived upon sell-out.'
    ]
  },
  {
    id: 'col-featured',
    name: 'THE NEXT CHAPTER',
    slug: 'featured-next-chapter',
    tagline: 'Configurable seasonal curation.',
    editorialSubhead: 'FUTURE ARCHITECTURAL DIRECTIONS',
    description: 'A flexible, CMS-driven showcase featuring upcoming textile innovations, runway capsules, and collaborative projects connecting West Africa to global fashion capitals.',
    heroImage: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=85&w=1600&auto=format&fit=crop',
    mobileHeroImage: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=85&w=1000&auto=format&fit=crop',
    secondaryImages: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=85&w=1000&auto=format&fit=crop'
    ],
    featuredProductIds: ['piercyn-sig-hoodie', 'lekki-afterdark-bomber', 'w-hoodie-01'],
    category: 'featured',
    season: 'Forward 2026/27',
    year: '2026',
    status: 'active',
    ctaLabel: 'DISCOVER THE NEXT CHAPTER →',
    sortOrder: 5,
    theme: 'light',
    detailStory: 'The Next Chapter is where we preview upcoming design directions. It allows PIERCYN to publish flexible seasonal editorial capsules directly from our Lagos design studio without restructuring the storefront.',
    detailQuotes: [
      'The evolution of contemporary West African luxury.'
    ]
  }
];

export const ARCHIVE_COLLECTIONS: ArchiveCollection[] = [
  {
    id: 'arch-summer-26',
    name: 'SUMMER / 2026',
    year: '2026',
    season: 'Summer',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=800&auto=format&fit=crop',
    slug: 'summer-2026',
    pieceCount: 18
  },
  {
    id: 'arch-winter-26',
    name: 'WINTER / 2026',
    year: '2026',
    season: 'Winter',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop',
    slug: 'winter-2026',
    pieceCount: 22
  },
  {
    id: 'arch-col-01',
    name: 'COLLECTION 01 — LAGOS INCEPTION',
    year: '2025',
    season: 'Fall/Winter',
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=800&auto=format&fit=crop',
    slug: 'collection-01',
    pieceCount: 14
  },
  {
    id: 'arch-col-02',
    name: 'COLLECTION 02 — ARCHITECTURAL SILHOUETTES',
    year: '2025',
    season: 'Spring/Summer',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=800&auto=format&fit=crop',
    slug: 'collection-02',
    pieceCount: 16
  }
];
