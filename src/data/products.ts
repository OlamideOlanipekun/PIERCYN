import { Product } from '../types';

export const PRODUCTS: Product[] = [
  {
    id: 'oversized-tee',
    slug: 'oversized-tee',
    name: 'OVERSIZED TEE',
    category: 'tees',
    collection: 'essentials',
    priceNGN: 23200,
    priceUSD: 30,
    priceGBP: 24,
    priceEUR: 28,
    description: 'Signature drop-shoulder oversized streetwear tee cut from 280 GSM heavyweight organic cotton. Designed with structured silhouette, dense high-rib collar, and relaxed boxy drape.',
    gsm: '280 GSM',
    fit: 'Boxy Oversized Fit',
    fabric: '100% Combed Heavy Cotton',
    origin: 'Handmade in Lagos, Nigeria',
    stock: 45,
    status: 'active',
    createdAt: '2026-03-01T00:00:00.000Z',
    isNewDrop: true,
    isBestSeller: true,
    tag: 'NEW IN',
    colors: [
      {
        name: 'Pitch Black',
        hex: '#111111',
        image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=1200&auto=format&fit=crop',
        altImage: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1200&auto=format&fit=crop'
      },
      {
        name: 'Washed Sand',
        hex: '#D7CFC0',
        image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=1200&auto=format&fit=crop',
        altImage: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?q=80&w=1200&auto=format&fit=crop'
      },
      {
        name: 'Raw Bone',
        hex: '#EBE7DF',
        image: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?q=80&w=1200&auto=format&fit=crop',
        altImage: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=1200&auto=format&fit=crop'
      },
      {
        name: 'Slate Grey',
        hex: '#696E75',
        image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=1200&auto=format&fit=crop',
        altImage: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?q=80&w=1200&auto=format&fit=crop'
      }
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    images: [
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1581655353564-df123a1eb820?q=80&w=1200&auto=format&fit=crop'
    ]
  },
  {
    id: 'cargo-pant',
    slug: 'cargo-pant',
    name: 'CARGO PANT',
    category: 'trousers',
    collection: 'everyday',
    priceNGN: 35000,
    priceUSD: 45,
    priceGBP: 36,
    priceEUR: 42,
    description: 'Brutalist relaxed wide-leg cargo pants tailored in ultra-durable high-density structured cotton twill. Features origami cargo utility pockets, concealed snap hems, and adjustable waist tabs for versatile silhouettes.',
    gsm: '340 GSM',
    fit: 'Relaxed Wide-Leg Stance',
    fabric: '100% High-Density Cotton Twill',
    origin: 'Crafted in Lagos Atelier',
    stock: 32,
    status: 'active',
    createdAt: '2026-03-01T00:00:00.000Z',
    isNewDrop: true,
    isBestSeller: true,
    tag: 'NEW IN',
    colors: [
      {
        name: 'Pitch Black',
        hex: '#121212',
        image: 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?q=80&w=1200&auto=format&fit=crop',
        altImage: 'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?q=80&w=1200&auto=format&fit=crop'
      },
      {
        name: 'Washed Olive',
        hex: '#4A5340',
        image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=1200&auto=format&fit=crop',
        altImage: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=1200&auto=format&fit=crop'
      },
      {
        name: 'Cement Stone',
        hex: '#A6A29A',
        image: 'https://images.unsplash.com/photo-1542272604-780c96856592?q=80&w=1200&auto=format&fit=crop',
        altImage: 'https://images.unsplash.com/photo-1475178626620-a4d074967452?q=80&w=1200&auto=format&fit=crop'
      }
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    images: [
      'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1542272604-780c96856592?q=80&w=1200&auto=format&fit=crop'
    ]
  },
  {
    id: 'graphic-hoodie',
    slug: 'graphic-hoodie',
    name: 'GRAPHIC HOODIE',
    category: 'hoodies',
    collection: 'the-drop',
    priceNGN: 38200,
    priceUSD: 49,
    priceGBP: 39,
    priceEUR: 45,
    description: 'Architectural 450 GSM luxury brushed heavyweight hoodie featuring subtle tonal PIERCYN screenprint typography on the back. Double-layered crossover hood without drawstrings for a clean architectural neckline.',
    gsm: '450 GSM',
    fit: 'Architectural Oversized',
    fabric: '100% French Terry Cotton',
    origin: 'Lagos, Nigeria',
    stock: 20,
    status: 'active',
    createdAt: '2026-03-01T00:00:00.000Z',
    isNewDrop: true,
    tag: 'NEW IN',
    colors: [
      {
        name: 'Washed Obsidian',
        hex: '#1A1A1A',
        image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1200&auto=format&fit=crop',
        altImage: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?q=80&w=1200&auto=format&fit=crop'
      }
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    images: [
      'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1516257984-b1b4d707412e?q=80&w=1200&auto=format&fit=crop'
    ]
  },
  {
    id: 'utility-jacket',
    slug: 'utility-jacket',
    name: 'UTILITY JACKET',
    category: 'jackets',
    collection: 'everyday',
    priceNGN: 45200,
    priceUSD: 58,
    priceGBP: 46,
    priceEUR: 54,
    description: 'Modular heavy canvas utility jacket equipped with 4 3D flap cargo pockets, hidden internal storm placket, gunmetal two-way zipper, and reinforced elbow patches.',
    gsm: '380 GSM Canvas',
    fit: 'Relaxed Structured Box Cut',
    fabric: '100% Waxed Heavy Canvas',
    origin: 'Crafted in Lagos Atelier',
    stock: 18,
    status: 'active',
    createdAt: '2026-03-01T00:00:00.000Z',
    isNewDrop: true,
    tag: 'NEW IN',
    colors: [
      {
        name: 'Waxed Onyx Black',
        hex: '#131313',
        image: 'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1200&auto=format&fit=crop',
        altImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200&auto=format&fit=crop'
      },
      {
        name: 'Raw Umber Brown',
        hex: '#4E382A',
        image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1200&auto=format&fit=crop',
        altImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1200&auto=format&fit=crop'
      }
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    images: [
      'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1200&auto=format&fit=crop'
    ]
  },
  {
    id: 'denim-shirt',
    slug: 'denim-shirt',
    name: 'DENIM SHIRT',
    category: 'jackets',
    collection: 'everyday',
    priceNGN: 38000,
    priceUSD: 49,
    priceGBP: 39,
    priceEUR: 45,
    description: 'Heavyweight 10oz washed indigo overshirt with double chest patch pockets, tonal pearl snaps, and an articulated relaxed collar.',
    gsm: '10 oz Denim',
    fit: 'Overshirt Relaxed Fit',
    fabric: '100% Selvedge Indigo Denim',
    origin: 'Lagos Atelier',
    stock: 24,
    status: 'active',
    createdAt: '2026-03-01T00:00:00.000Z',
    isNewDrop: true,
    tag: 'TRENDING',
    colors: [
      {
        name: 'Raw Indigo',
        hex: '#2B394A',
        image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1200&auto=format&fit=crop',
        altImage: 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?q=80&w=1200&auto=format&fit=crop'
      }
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    images: [
      'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1200&auto=format&fit=crop'
    ]
  },
  {
    id: 'heavyweight-tee',
    slug: 'heavyweight-tee',
    name: 'HEAVYWEIGHT TEE',
    category: 'tees',
    collection: 'essentials',
    priceNGN: 22000,
    priceUSD: 28,
    priceGBP: 22,
    priceEUR: 26,
    description: '300 GSM dense organic cotton tee featuring sharp boxy drape, thick reinforced 1.5" collar, and blind-stitched hem.',
    gsm: '300 GSM',
    fit: 'Boxy Heavy Stance',
    fabric: '100% Ring-spun Heavy Cotton',
    origin: 'Lagos, Nigeria',
    stock: 40,
    status: 'active',
    createdAt: '2026-03-01T00:00:00.000Z',
    isBestSeller: true,
    tag: 'TRENDING',
    colors: [
      {
        name: 'Heavy Obsidian',
        hex: '#111111',
        image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=1200&auto=format&fit=crop',
        altImage: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?q=80&w=1200&auto=format&fit=crop'
      }
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    images: [
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=1200&auto=format&fit=crop'
    ]
  },
  {
    id: 'straight-leg-trousers',
    slug: 'straight-leg-trousers',
    name: 'STRAIGHT-LEG TROUSERS',
    category: 'trousers',
    collection: 'everyday',
    priceNGN: 35000,
    priceUSD: 45,
    priceGBP: 36,
    priceEUR: 42,
    description: 'Minimalist clean-crease straight-leg trousers tailored in premium fluid wool-cotton blend with hidden waistband adjuster.',
    gsm: '290 GSM',
    fit: 'Clean Straight Cut',
    fabric: '70% Cotton, 30% Virgin Wool',
    origin: 'Lagos Atelier',
    stock: 25,
    status: 'active',
    createdAt: '2026-03-01T00:00:00.000Z',
    tag: 'BUILD THE LOOK',
    colors: [
      {
        name: 'Pitch Black',
        hex: '#141414',
        image: 'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?q=80&w=1200&auto=format&fit=crop',
        altImage: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=1200&auto=format&fit=crop'
      }
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    images: [
      'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?q=80&w=1200&auto=format&fit=crop'
    ]
  },
  {
    id: 'piercyn-sig-hoodie',
    slug: 'piercyn-signature-450gsm-hoodie',
    name: 'PIERCYN SIGNATURE 450GSM HOODIE',
    category: 'hoodies',
    collection: 'essentials',
    priceNGN: 24500,
    priceUSD: 32,
    priceGBP: 25,
    priceEUR: 29,
    description: 'Heavyweight oversized essential designed for everyday presence. Cut from 450 GSM luxury brushed French terry with double-needle reverse stitching, a structured double-layer hood without drawstrings, and dropped shoulders.',
    gsm: '450 GSM',
    fit: 'Relaxed Architectural Oversize',
    fabric: '100% Organic Heavyweight Cotton',
    origin: 'Hand-finished in Lagos, Nigeria',
    stock: 42,
    status: 'active',
    createdAt: '2026-01-15T00:00:00.000Z',
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
    slug: 'brutalist-relaxed-cargo-trousers',
    name: 'BRUTALIST RELAXED CARGO TROUSERS',
    category: 'trousers',
    collection: 'everyday',
    priceNGN: 18500,
    priceUSD: 24,
    priceGBP: 19,
    priceEUR: 22,
    description: 'Articulated wide-leg cargo pants constructed in high-density cotton twill. Features deep origami cargo pockets, concealed snap hems, and an internal drawstring waistband for effortless drapery.',
    gsm: '320 GSM',
    fit: 'Wide Leg Articulated',
    fabric: '100% Compact Cotton Twill',
    origin: 'Crafted in Surulere Atelier, Lagos',
    stock: 28,
    status: 'active',
    createdAt: '2026-02-01T00:00:00.000Z',
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
    slug: 'lagos-architectural-sweatshirt',
    name: 'LAGOS ARCHITECTURAL SWEATSHIRT',
    category: 'hoodies',
    collection: 'the-drop',
    priceNGN: 16500,
    priceUSD: 21,
    priceGBP: 17,
    priceEUR: 20,
    description: 'Boxy crewneck sweatshirt inspired by Lagos modernist brutalist architecture. Clean tonal micro-embroidery at the nape and thick ribbing at the neck and cuffs.',
    gsm: '400 GSM',
    fit: 'Boxy Dropped Shoulder',
    fabric: '100% Unbrushed Loopback Cotton',
    origin: 'Lagos, Nigeria',
    stock: 19,
    status: 'active',
    createdAt: '2026-02-10T00:00:00.000Z',
    isNewDrop: true,
    tag: 'DROP 01',
    colors: [
      {
        name: 'Sandstone Ivory',
        hex: '#E3DEC3',
        image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=1200&auto=format&fit=crop',
        altImage: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=1200&auto=format&fit=crop'
      },
      {
        name: 'Onyx Black',
        hex: '#1A1A1A',
        image: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?q=80&w=1200&auto=format&fit=crop',
        altImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1200&auto=format&fit=crop'
      }
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    images: [
      'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=1200&auto=format&fit=crop'
    ]
  },
  {
    id: 'vi-boxy-mesh-polo',
    slug: 'victoria-island-boxy-mesh-polo',
    name: 'VICTORIA ISLAND BOXY MESH POLO',
    category: 'polos',
    collection: 'everyday',
    priceNGN: 12500,
    priceUSD: 16,
    priceGBP: 13,
    priceEUR: 15,
    description: 'Lightweight, high-breathability open-weave knit polo designed for equatorial heat. Camp collar with natural mother-of-pearl buttons and relaxed drape.',
    gsm: '260 GSM',
    fit: 'Relaxed Camp Fit',
    fabric: '70% Combed Cotton, 30% Linen Slub',
    origin: 'Lagos Atelier',
    stock: 35,
    status: 'active',
    createdAt: '2026-02-14T00:00:00.000Z',
    isNewDrop: true,
    tag: 'LIMITED',
    colors: [
      {
        name: 'Off White Slub',
        hex: '#FAF6EE',
        image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=1200&auto=format&fit=crop',
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
      'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=1200&auto=format&fit=crop'
    ]
  },
  {
    id: 'piercyn-monolith-tee',
    slug: 'piercyn-monolith-300gsm-tee',
    name: 'PIERCYN MONOLITH 300GSM TEE',
    category: 'tees',
    collection: 'essentials',
    priceNGN: 8500,
    priceUSD: 11,
    priceGBP: 9,
    priceEUR: 10,
    description: 'Substantial, structured tee crafted from 300 GSM single jersey. Holds a sharp geometric drape that never clings. Finished with a dense 1.25" high neck rib.',
    gsm: '300 GSM',
    fit: 'Boxy Heavyweight Stance',
    fabric: '100% Carded Organic Cotton',
    origin: 'Lagos, Nigeria',
    stock: 65,
    status: 'active',
    createdAt: '2026-01-10T00:00:00.000Z',
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
        image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=1200&auto=format&fit=crop',
        altImage: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?q=80&w=1200&auto=format&fit=crop'
      }
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    images: [
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=1200&auto=format&fit=crop'
    ]
  },
  {
    id: 'piercyn-ribbed-tank',
    slug: 'piercyn-320gsm-heavy-ribbed-tank',
    name: 'PIERCYN 320GSM HEAVY RIBBED TANK',
    category: 'tees',
    collection: 'essentials',
    priceNGN: 11500,
    priceUSD: 14,
    priceGBP: 11,
    priceEUR: 13,
    description: 'Sculpted 320 GSM 2x2 rib cotton tank with wide shoulder straps, deep armholes, and clean double-stitched hems. Perfect standalone or layered piece.',
    gsm: '320 GSM',
    fit: 'Athletic Form Fit',
    fabric: '95% Combed Cotton, 5% Elastane Rib',
    origin: 'Lagos, Nigeria',
    stock: 40,
    status: 'active',
    createdAt: '2026-02-20T00:00:00.000Z',
    isNewDrop: true,
    tag: 'ESSENTIAL',
    colors: [
      {
        name: 'Washed Obsidian',
        hex: '#181818',
        image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=1200&auto=format&fit=crop',
        altImage: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1200&auto=format&fit=crop'
      },
      {
        name: 'Bone Ivory',
        hex: '#EBE7DF',
        image: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?q=80&w=1200&auto=format&fit=crop',
        altImage: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=1200&auto=format&fit=crop'
      }
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    images: [
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1581655353564-df123a1eb820?q=80&w=1200&auto=format&fit=crop'
    ]
  },
  {
    id: 'piercyn-canvas-tote',
    slug: 'piercyn-16oz-structured-canvas-tote',
    name: 'PIERCYN 16OZ STRUCTURED CANVAS TOTE',
    category: 'accessories',
    collection: 'essentials',
    priceNGN: 9500,
    priceUSD: 12,
    priceGBP: 10,
    priceEUR: 11,
    description: 'Heavy 16oz raw duck cotton canvas tote with reinforced webbing handles, internal utility pocket, and subtle tonal PIERCYN screenprint.',
    gsm: '16 oz Canvas',
    fit: 'One Size (38cm x 42cm)',
    fabric: '100% Raw Cotton Duck Canvas',
    origin: 'Lagos Atelier',
    stock: 50,
    status: 'active',
    createdAt: '2026-02-15T00:00:00.000Z',
    isBestSeller: true,
    tag: 'CARRY',
    colors: [
      {
        name: 'Natural Ecru',
        hex: '#EAE5D9',
        image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=1200&auto=format&fit=crop',
        altImage: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=1200&auto=format&fit=crop'
      }
    ],
    sizes: ['M'],
    images: [
      'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=1200&auto=format&fit=crop'
    ]
  },
  {
    id: 'piercyn-arch-cap',
    slug: 'piercyn-low-profile-cotton-twill-cap',
    name: 'PIERCYN LOW-PROFILE COTTON TWILL CAP',
    category: 'accessories',
    collection: 'essentials',
    priceNGN: 13500,
    priceUSD: 17,
    priceGBP: 14,
    priceEUR: 16,
    description: 'Unstructured 6-panel washed cotton twill cap with curved brim, antique brass buckle strapback, and tonal monogram embroidery.',
    fit: 'Adjustable One Size',
    fabric: '100% Washed Cotton Twill',
    origin: 'Lagos, Nigeria',
    stock: 45,
    status: 'active',
    createdAt: '2026-02-10T00:00:00.000Z',
    isNewDrop: true,
    tag: 'HEADWEAR',
    colors: [
      {
        name: 'Pitch Black',
        hex: '#111111',
        image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=1200&auto=format&fit=crop',
        altImage: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1200&auto=format&fit=crop'
      }
    ],
    sizes: ['M'],
    images: [
      'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=1200&auto=format&fit=crop'
    ]
  },
  {
    id: 'subterrain-pleated-denim',
    slug: 'subterrain-wide-leg-pleated-denim',
    name: 'SUBTERRAIN WIDE-LEG PLEATED DENIM',
    category: 'trousers',
    collection: 'everyday',
    priceNGN: 22000,
    priceUSD: 28,
    priceGBP: 22,
    priceEUR: 26,
    description: '14oz rigid Japanese selvedge denim tailored with deep front inward pleats, extended rise, and a raw stacked hem. Hand-washed in mineral-rich indigo baths.',
    gsm: '14 oz Denim',
    fit: 'Extended Rise Wide Stance',
    fabric: '100% Selvedge Cotton Denim',
    origin: 'Tailored in Lagos Atelier',
    stock: 22,
    status: 'active',
    createdAt: '2026-02-18T00:00:00.000Z',
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
    slug: 'lekki-after-dark-reversible-bomber',
    name: 'LEKKI AFTER DARK REVERSIBLE BOMBER',
    category: 'outerwear',
    collection: 'after-dark',
    priceNGN: 29500,
    priceUSD: 38,
    priceGBP: 30,
    priceEUR: 35,
    description: 'Sleek luxury bomber featuring a matte technical twill shell on one side and lustrous washed cupro lining on the reverse. Fitted with heavy custom gunmetal two-way Riri zips.',
    gsm: 'Heavy Outerwear',
    fit: 'Cropped Oversize Volume',
    fabric: 'Matte Nylon / Cupro Silk Blend',
    origin: 'Crafted in Lagos',
    stock: 14,
    status: 'active',
    createdAt: '2026-02-20T00:00:00.000Z',
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
    slug: 'contemporary-tailored-drape-overcoat',
    name: 'CONTEMPORARY TAILORED DRAPE OVERCOAT',
    category: 'outerwear',
    collection: 'the-drop',
    priceNGN: 34000,
    priceUSD: 44,
    priceGBP: 35,
    priceEUR: 40,
    description: 'Unstructured floor-length overcoat in double-faced virgin wool blend. Features a high back vent, horn button closures, and unpadded shoulders for an effortless, confident stride.',
    gsm: '520 GSM',
    fit: 'Fluid Floor-Length Stance',
    fabric: '85% Virgin Wool, 15% Cashmere',
    origin: 'Lagos Atelier Bespoke',
    stock: 10,
    status: 'active',
    createdAt: '2026-03-01T00:00:00.000Z',
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
