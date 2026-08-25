import { Product } from '../types';

export const PRODUCTS: Product[] = [
  {
    id: 'piercyn-sig-hoodie',
    name: 'PIERCYN SIGNATURE 450GSM HOODIE',
    category: 'hoodies',
    collection: 'essentials',
    priceNGN: 48000,
    priceUSD: 58,
    priceGBP: 46,
    priceEUR: 54,
    description: 'Heavyweight oversized essential designed for everyday presence. Cut from 450 GSM luxury brushed French terry with double-needle reverse stitching, a structured double-layer hood without drawstrings, and dropped shoulders.',
    gsm: '450 GSM',
    fit: 'Relaxed Architectural Oversize',
    fabric: '100% Organic Heavyweight Cotton',
    origin: 'Hand-finished in Lagos, Nigeria',
    isNewDrop: true,
    isBestSeller: true,
    tag: 'ICONIC',
    colors: [
      {
        name: 'Washed Charcoal',
        hex: '#232323',
        image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1200&auto=format&fit=crop',
        altImage: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?q=80&w=1200&auto=format&fit=crop'
      },
      {
        name: 'Raw Bone',
        hex: '#E8E4DA',
        image: 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?q=80&w=1200&auto=format&fit=crop',
        altImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200&auto=format&fit=crop'
      },
      {
        name: 'Earth Ochre',
        hex: '#8C6239',
        image: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?q=80&w=1200&auto=format&fit=crop',
        altImage: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=1200&auto=format&fit=crop'
      }
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    images: [
      'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1516257984-b1b4d707412e?q=80&w=1200&auto=format&fit=crop'
    ]
  },
  {
    id: 'brutalist-relaxed-cargo',
    name: 'BRUTALIST RELAXED CARGO TROUSERS',
    category: 'trousers',
    collection: 'everyday',
    priceNGN: 52000,
    priceUSD: 64,
    priceGBP: 50,
    priceEUR: 59,
    description: 'Articulated wide-leg cargo pants constructed in high-density cotton twill. Features deep origami cargo pockets, concealed snap hems, and an internal drawstring waistband for effortless drapery.',
    gsm: '320 GSM',
    fit: 'Wide Leg Articulated',
    fabric: '100% Compact Cotton Twill',
    origin: 'Crafted in Surulere Atelier, Lagos',
    isNewDrop: true,
    isBestSeller: true,
    tag: 'NEW SILHOUETTE',
    colors: [
      {
        name: 'Pitch Black',
        hex: '#111111',
        image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=1200&auto=format&fit=crop',
        altImage: 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?q=80&w=1200&auto=format&fit=crop'
      },
      {
        name: 'Concrete Grey',
        hex: '#8C8C88',
        image: 'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?q=80&w=1200&auto=format&fit=crop',
        altImage: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=1200&auto=format&fit=crop'
      }
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    images: [
      'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?q=80&w=1200&auto=format&fit=crop'
    ]
  },
  {
    id: 'lagos-arch-sweatshirt',
    name: 'LAGOS ARCHITECTURAL SWEATSHIRT',
    category: 'hoodies',
    collection: 'the-drop',
    priceNGN: 42000,
    priceUSD: 52,
    priceGBP: 40,
    priceEUR: 48,
    description: 'Boxy crewneck sweatshirt inspired by Lagos modernist brutalist architecture. Clean tonal micro-embroidery at the nape and thick ribbing at the neck and cuffs.',
    gsm: '400 GSM',
    fit: 'Boxy Dropped Shoulder',
    fabric: '100% Unbrushed Loopback Cotton',
    origin: 'Lagos, Nigeria',
    isNewDrop: true,
    tag: 'DROP 01',
    colors: [
      {
        name: 'Sandstone Ivory',
        hex: '#E3DEC3',
        image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1200&auto=format&fit=crop',
        altImage: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=1200&auto=format&fit=crop'
      },
      {
        name: 'Onyx Black',
        hex: '#1A1A1A',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1200&auto=format&fit=crop',
        altImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1200&auto=format&fit=crop'
      }
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    images: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=1200&auto=format&fit=crop'
    ]
  },
  {
    id: 'vi-boxy-mesh-polo',
    name: 'VICTORIA ISLAND BOXY MESH POLO',
    category: 'polos',
    collection: 'everyday',
    priceNGN: 38000,
    priceUSD: 46,
    priceGBP: 36,
    priceEUR: 42,
    description: 'Lightweight, high-breathability open-weave knit polo designed for equatorial heat. Camp collar with natural mother-of-pearl buttons and relaxed drape.',
    gsm: '260 GSM',
    fit: 'Relaxed Camp Fit',
    fabric: '70% Combed Cotton, 30% Linen Slub',
    origin: 'Lagos Atelier',
    isNewDrop: true,
    tag: 'LIMITED',
    colors: [
      {
        name: 'Off White Slub',
        hex: '#FAF6EE',
        image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=1200&auto=format&fit=crop',
        altImage: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=1200&auto=format&fit=crop'
      },
      {
        name: 'Midnight Navy',
        hex: '#151C28',
        image: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=1200&auto=format&fit=crop',
        altImage: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?q=80&w=1200&auto=format&fit=crop'
      }
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    images: [
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=1200&auto=format&fit=crop'
    ]
  },
  {
    id: 'piercyn-monolith-tee',
    name: 'PIERCYN MONOLITH 300GSM TEE',
    category: 'tees',
    collection: 'essentials',
    priceNGN: 28000,
    priceUSD: 34,
    priceGBP: 27,
    priceEUR: 31,
    description: 'Substantial, structured tee crafted from 300 GSM single jersey. Holds a sharp geometric drape that never clings. Finished with a dense 1.25" high neck rib.',
    gsm: '300 GSM',
    fit: 'Boxy Heavyweight Stance',
    fabric: '100% Carded Organic Cotton',
    origin: 'Lagos, Nigeria',
    isBestSeller: true,
    tag: 'CORE',
    colors: [
      {
        name: 'Raw Chalk',
        hex: '#EFECE6',
        image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1200&auto=format&fit=crop',
        altImage: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=1200&auto=format&fit=crop'
      },
      {
        name: 'Volcanic Ash',
        hex: '#2B2B2A',
        image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=1200&auto=format&fit=crop',
        altImage: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?q=80&w=1200&auto=format&fit=crop'
      }
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    images: [
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=1200&auto=format&fit=crop'
    ]
  },
  {
    id: 'subterrain-pleated-denim',
    name: 'SUBTERRAIN WIDE-LEG PLEATED DENIM',
    category: 'trousers',
    collection: 'everyday',
    priceNGN: 56000,
    priceUSD: 68,
    priceGBP: 54,
    priceEUR: 62,
    description: '14oz rigid Japanese selvedge denim tailored with deep front inward pleats, extended rise, and a raw stacked hem. Hand-washed in mineral-rich indigo baths.',
    gsm: '14 oz Denim',
    fit: 'Extended Rise Wide Stance',
    fabric: '100% Selvedge Cotton Denim',
    origin: 'Tailored in Lagos Atelier',
    isNewDrop: true,
    tag: 'EDITORIAL',
    colors: [
      {
        name: 'Mineral Washed Black',
        hex: '#282726',
        image: 'https://images.unsplash.com/photo-1542272604-780c96856592?q=80&w=1200&auto=format&fit=crop',
        altImage: 'https://images.unsplash.com/photo-1475178626620-a4d074967452?q=80&w=1200&auto=format&fit=crop'
      },
      {
        name: 'Raw Vintage Indigo',
        hex: '#2B394A',
        image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1200&auto=format&fit=crop',
        altImage: 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?q=80&w=1200&auto=format&fit=crop'
      }
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    images: [
      'https://images.unsplash.com/photo-1542272604-780c96856592?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1475178626620-a4d074967452?q=80&w=1200&auto=format&fit=crop'
    ]
  },
  {
    id: 'lekki-afterdark-bomber',
    name: 'LEKKI AFTER DARK REVERSIBLE BOMBER',
    category: 'outerwear',
    collection: 'after-dark',
    priceNGN: 68000,
    priceUSD: 82,
    priceGBP: 66,
    priceEUR: 76,
    description: 'Sleek luxury bomber featuring a matte technical twill shell on one side and lustrous washed cupro lining on the reverse. Fitted with heavy custom gunmetal two-way Riri zips.',
    gsm: 'Heavy Outerwear',
    fit: 'Cropped Oversize Volume',
    fabric: 'Matte Nylon / Cupro Silk Blend',
    origin: 'Crafted in Lagos',
    isNewDrop: true,
    tag: 'RUNWAY',
    colors: [
      {
        name: 'Deep Caviar Black',
        hex: '#0D0D0E',
        image: 'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1200&auto=format&fit=crop',
        altImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200&auto=format&fit=crop'
      }
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    images: [
      'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200&auto=format&fit=crop'
    ]
  },
  {
    id: 'contemporary-drape-coat',
    name: 'CONTEMPORARY TAILORED DRAPE OVERCOAT',
    category: 'outerwear',
    collection: 'the-drop',
    priceNGN: 85000,
    priceUSD: 105,
    priceGBP: 82,
    priceEUR: 95,
    description: 'Unstructured floor-length overcoat in double-faced virgin wool blend. Features a high back vent, horn button closures, and unpadded shoulders for an effortless, confident stride.',
    gsm: '520 GSM',
    fit: 'Fluid Floor-Length Stance',
    fabric: '85% Virgin Wool, 15% Cashmere',
    origin: 'Lagos Atelier Bespoke',
    tag: 'COLLECTION 01',
    colors: [
      {
        name: 'Warm Concrete Camel',
        hex: '#A48B71',
        image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1200&auto=format&fit=crop',
        altImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1200&auto=format&fit=crop'
      }
    ],
    sizes: ['S', 'M', 'L'],
    images: [
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1200&auto=format&fit=crop'
    ]
  }
];

export const COLLECTIONS = [
  {
    id: 'everyday',
    title: 'EVERYDAY',
    subtitle: 'MODERN SILHOUETTES FOR DAILY PRESENCE',
    image: 'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?q=80&w=1200&auto=format&fit=crop',
    itemCount: '12 PIECES',
    description: 'Substantial cottons, relaxed cargo shapes, and architectural cuts refined for morning until evening.'
  },
  {
    id: 'after-dark',
    title: 'AFTER DARK',
    subtitle: 'NIGHT VISIONS IN LAGOS',
    image: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?q=80&w=1200&auto=format&fit=crop',
    itemCount: '8 PIECES',
    description: 'Lustrous textures, heavy satin bombers, deep midnight palettes crafted for the nocturnal pulse.'
  },
  {
    id: 'essentials',
    title: 'ESSENTIALS',
    subtitle: 'THE 450 GSM HEAVYWEIGHT FOUNDATION',
    image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1200&auto=format&fit=crop',
    itemCount: '6 PIECES',
    description: 'Permanent icons that define our aesthetic. Pure form, heavy drape, uncompromising longevity.'
  },
  {
    id: 'the-drop',
    title: 'THE DROP',
    subtitle: 'SEASON 01 — ARCHITECTURAL CODE',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1200&auto=format&fit=crop',
    itemCount: 'LIMITED RUN',
    description: 'Strictly numbered experimental silhouettes blending Lagos street culture and brutalist tailoring.'
  }
];
