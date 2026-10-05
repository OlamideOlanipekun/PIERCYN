import { Product } from '../types';

export const MENS_PRODUCTS: Product[] = [
  // 01: Hero Product
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

  // 02: Signature Piece
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
    tag: 'SIGNATURE',
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

  // 03: New Arrival
  {
    id: 'lagos-arch-sweatshirt',
    name: 'LAGOS ARCHITECTURAL SWEATSHIRT',
    category: 'sweatshirts',
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
    tag: 'NEW',
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

  // 04: Strong Everyday Piece
  {
    id: 'piercyn-monolith-tee',
    name: 'PIERCYN MONOLITH 300GSM TEE',
    category: 't-shirts',
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

  // 05: Victoria Island Boxy Mesh Polo
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

  // 06: Subterrain Wide-Leg Pleated Denim
  {
    id: 'subterrain-pleated-denim',
    name: 'SUBTERRAIN WIDE-LEG PLEATED DENIM',
    category: 'jeans',
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

  // 07: Lekki After Dark Reversible Bomber
  {
    id: 'lekki-afterdark-bomber',
    name: 'LEKKI AFTER DARK REVERSIBLE BOMBER',
    category: 'jackets',
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

  // 08: Contemporary Tailored Drape Overcoat
  {
    id: 'contemporary-drape-coat',
    name: 'CONTEMPORARY TAILORED DRAPE OVERCOAT',
    category: 'jackets',
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
  },

  // 09: Surulere Vintage Wash Cropped Hoodie
  {
    id: 'surulere-vintage-hoodie',
    name: 'SURULERE VINTAGE WASH CROPPED HOODIE',
    category: 'hoodies',
    collection: 'essentials',
    priceNGN: 46000,
    priceUSD: 56,
    priceGBP: 44,
    priceEUR: 52,
    description: 'Sun-faded pigment dyed heavy hoodie cut with a boxy torso and shortened waist ribbing for a relaxed proportion over trousers. Ultra-plush brushed interior.',
    gsm: '450 GSM',
    fit: 'Boxy Cropped Silhouette',
    fabric: '100% Sun-Washed French Terry',
    origin: 'Hand-dyed in Surulere, Lagos',
    isNewDrop: true,
    tag: 'NEW',
    colors: [
      {
        name: 'Sun-Dusted Olive',
        hex: '#5A5F4B',
        image: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?q=80&w=1200&auto=format&fit=crop',
        altImage: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=1200&auto=format&fit=crop'
      },
      {
        name: 'Aged Slate',
        hex: '#3E424B',
        image: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?q=80&w=1200&auto=format&fit=crop',
        altImage: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1200&auto=format&fit=crop'
      }
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    images: [
      'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?q=80&w=1200&auto=format&fit=crop'
    ]
  },

  // 10: Ikoyi Atelier Relaxed Knit Polo
  {
    id: 'ikoyi-knit-polo',
    name: 'IKOYI ATELIER RELAXED KNIT POLO',
    category: 'polos',
    collection: 'everyday',
    priceNGN: 40000,
    priceUSD: 49,
    priceGBP: 38,
    priceEUR: 45,
    description: 'Fine gauge organic cotton knit polo featuring a seamless placket and relaxed silhouette. Breathable micro-gauge yarn spun for warm humid evenings.',
    gsm: '280 GSM',
    fit: 'Relaxed Tailored Stance',
    fabric: '100% Long-Staple Combed Cotton Knit',
    origin: 'Lagos Atelier',
    isBestSeller: true,
    colors: [
      {
        name: 'Desert Clay',
        hex: '#B87D56',
        image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=1200&auto=format&fit=crop',
        altImage: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=1200&auto=format&fit=crop'
      },
      {
        name: 'Bone White',
        hex: '#F2EFE9',
        image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1200&auto=format&fit=crop',
        altImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1200&auto=format&fit=crop'
      }
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    images: [
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1200&auto=format&fit=crop'
    ]
  },

  // 11: Marina Structural Oversized Jacket
  {
    id: 'marina-structural-jacket',
    name: 'MARINA STRUCTURAL OVERSIZED JACKET',
    category: 'jackets',
    collection: 'the-drop',
    priceNGN: 72000,
    priceUSD: 88,
    priceGBP: 69,
    priceEUR: 80,
    description: 'Architectural zip-front jacket inspired by the shipping containers and modern harbor cranes of Marina Lagos. Angular chest gusset pockets and storm flap collar.',
    gsm: '380 GSM',
    fit: 'Structured Boxy Cut',
    fabric: 'Heavyweight Weather-Resistant Twill',
    origin: 'Crafted in Lagos Atelier',
    isNewDrop: true,
    tag: 'LIMITED',
    colors: [
      {
        name: 'Harbor Grey',
        hex: '#6B7175',
        image: 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?q=80&w=1200&auto=format&fit=crop',
        altImage: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=1200&auto=format&fit=crop'
      },
      {
        name: 'Nocturnal Black',
        hex: '#141414',
        image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=1200&auto=format&fit=crop',
        altImage: 'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1200&auto=format&fit=crop'
      }
    ],
    sizes: ['M', 'L', 'XL'],
    images: [
      'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=1200&auto=format&fit=crop'
    ]
  },

  // 12: Badagry Raw Selvedge Relaxed Jeans
  {
    id: 'badagry-selvedge-jeans',
    name: 'BADAGRY RAW SELVEDGE RELAXED JEANS',
    category: 'jeans',
    collection: 'everyday',
    priceNGN: 54000,
    priceUSD: 66,
    priceGBP: 52,
    priceEUR: 60,
    description: 'Unwashed 15oz red-line selvedge denim designed to mold uniquely to your silhouette. Straight wide drape with copper rivets and reinforced belt loops.',
    gsm: '15 oz Selvedge',
    fit: 'Relaxed Straight Stance',
    fabric: '100% Unsanforized Raw Cotton Denim',
    origin: 'Handmade in Lagos Atelier',
    isBestSeller: true,
    colors: [
      {
        name: 'Deep Indigo Raw',
        hex: '#1E2C3D',
        image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1200&auto=format&fit=crop',
        altImage: 'https://images.unsplash.com/photo-1542272604-780c96856592?q=80&w=1200&auto=format&fit=crop'
      }
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    images: [
      'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1542272604-780c96856592?q=80&w=1200&auto=format&fit=crop'
    ]
  },

  // 13: Eko Minimalist Waffle Long-Sleeve
  {
    id: 'eko-waffle-longsleeve',
    name: 'EKO MINIMALIST WAFFLE LONG-SLEEVE TEE',
    category: 't-shirts',
    collection: 'essentials',
    priceNGN: 32000,
    priceUSD: 39,
    priceGBP: 30,
    priceEUR: 35,
    description: 'Thermal micro-waffle knit long-sleeve engineered with thumbhole cuffs, ergonomic curved side hems, and a relaxed boxy chest drape.',
    gsm: '320 GSM',
    fit: 'Elongated Boxy Drape',
    fabric: '100% Waffle Spun Cotton',
    origin: 'Lagos, Nigeria',
    colors: [
      {
        name: 'Washed Ash',
        hex: '#7E8184',
        image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=1200&auto=format&fit=crop',
        altImage: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1200&auto=format&fit=crop'
      },
      {
        name: 'Smoked Vanilla',
        hex: '#E2DFD2',
        image: 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?q=80&w=1200&auto=format&fit=crop',
        altImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1200&auto=format&fit=crop'
      }
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    images: [
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?q=80&w=1200&auto=format&fit=crop'
    ]
  },

  // 14: Atlantic Textured Heavyweight Overshirt
  {
    id: 'atlantic-heavy-overshirt',
    name: 'ATLANTIC TEXTURED HEAVYWEIGHT OVERSHIRT',
    category: 'jackets',
    collection: 'everyday',
    priceNGN: 58000,
    priceUSD: 70,
    priceGBP: 56,
    priceEUR: 64,
    description: 'Substantial button-up overshirt in heavy cotton herringbone canvas. Features twin 3D chest cargo pockets, horn buttons, and a straight boxy hem designed to be worn over tees or hoodies.',
    gsm: '360 GSM',
    fit: 'Layering Boxy Stance',
    fabric: '100% Herringbone Cotton Canvas',
    origin: 'Crafted in Lagos Atelier',
    isNewDrop: true,
    colors: [
      {
        name: 'Ochre Sand',
        hex: '#C29864',
        image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1200&auto=format&fit=crop',
        altImage: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?q=80&w=1200&auto=format&fit=crop'
      },
      {
        name: 'Midnight Coal',
        hex: '#1F2022',
        image: 'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1200&auto=format&fit=crop',
        altImage: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=1200&auto=format&fit=crop'
      }
    ],
    sizes: ['M', 'L', 'XL'],
    images: [
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1200&auto=format&fit=crop'
    ]
  },

  // 15: Brutalist Pleated Casual Trouser
  {
    id: 'brutalist-pleated-trouser',
    name: 'VICTORIA BRUTALIST PLEATED TROUSERS',
    category: 'trousers',
    collection: 'everyday',
    priceNGN: 49000,
    priceUSD: 60,
    priceGBP: 47,
    priceEUR: 55,
    description: 'High-rise tailored trousers with double deep front pleats and a relaxed taper. Hand-finished blind hem and internal cotton waistband piping.',
    gsm: '290 GSM',
    fit: 'High-Rise Relaxed Taper',
    fabric: 'Cotton-Viscose Tailoring Blend',
    origin: 'Victoria Island Atelier, Lagos',
    colors: [
      {
        name: 'Charcoal Black',
        hex: '#1D1D1F',
        image: 'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?q=80&w=1200&auto=format&fit=crop',
        altImage: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=1200&auto=format&fit=crop'
      }
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    images: [
      'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=1200&auto=format&fit=crop'
    ]
  },

  // 16: Accessories - PIERCYN Leather Carabiner Tote
  {
    id: 'piercyn-leather-tote',
    name: 'PIERCYN FULL-GRAIN LEATHER CARABINER TOTE',
    category: 'accessories',
    collection: 'essentials',
    priceNGN: 64000,
    priceUSD: 78,
    priceGBP: 62,
    priceEUR: 72,
    description: 'Heavyweight full-grain vegetable-tanned Nigerian leather tote bag. Features raw edge construction, matte black custom hardware, and interior laptop compartment.',
    gsm: 'Bespoke Leather',
    fit: 'Structured Carryall',
    fabric: '100% Full-Grain Nigerian Bovine Leather',
    origin: 'Handmade in Lagos',
    isNewDrop: true,
    tag: 'HANDCRAFTED',
    colors: [
      {
        name: 'Onyx Noir',
        hex: '#111111',
        image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=1200&auto=format&fit=crop',
        altImage: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=1200&auto=format&fit=crop'
      }
    ],
    sizes: ['M'],
    images: [
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=1200&auto=format&fit=crop'
    ]
  },

  // 17: Accessories - PIERCYN Monogram Jacquard Scarf
  {
    id: 'piercyn-jacquard-scarf',
    name: 'PIERCYN MONOGRAM JACQUARD SCARF',
    category: 'accessories',
    collection: 'the-drop',
    priceNGN: 26000,
    priceUSD: 32,
    priceGBP: 25,
    priceEUR: 29,
    description: 'Double-sided heavy knit scarf featuring subtle tonal PIERCYN architectural geometry. Extra long 200cm length with raw fringe ends.',
    gsm: '420 GSM',
    fit: '200cm × 40cm Oversize',
    fabric: '80% Lambswool, 20% Organic Cotton',
    origin: 'Lagos Atelier',
    colors: [
      {
        name: 'Ivory & Charcoal',
        hex: '#E3DEC3',
        image: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?q=80&w=1200&auto=format&fit=crop',
        altImage: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?q=80&w=1200&auto=format&fit=crop'
      }
    ],
    sizes: ['M'],
    images: [
      'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1516257984-b1b4d707412e?q=80&w=1200&auto=format&fit=crop'
    ]
  },

  // 18: Accessories - PIERCYN Structured Cotton Cap
  {
    id: 'piercyn-structured-cap',
    name: 'PIERCYN STRUCTURED COTTON TWILL CAP',
    category: 'accessories',
    collection: 'essentials',
    priceNGN: 22000,
    priceUSD: 27,
    priceGBP: 21,
    priceEUR: 24,
    description: 'Low-profile 6-panel dad cap in heavyweight brushed cotton twill. Custom brass buckle clasp with debossed PIERCYN seal.',
    gsm: 'Heavy Twill',
    fit: 'Adjustable Low-Profile',
    fabric: '100% Brushed Cotton Twill',
    origin: 'Lagos, Nigeria',
    isBestSeller: true,
    colors: [
      {
        name: 'Washed Black',
        hex: '#1A1A1A',
        image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=1200&auto=format&fit=crop',
        altImage: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?q=80&w=1200&auto=format&fit=crop'
      },
      {
        name: 'Bone Beige',
        hex: '#E5DFD1',
        image: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?q=80&w=1200&auto=format&fit=crop',
        altImage: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=1200&auto=format&fit=crop'
      }
    ],
    sizes: ['M'],
    images: [
      'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?q=80&w=1200&auto=format&fit=crop'
    ]
  }
];
