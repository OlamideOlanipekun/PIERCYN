import { Product } from '../types';

export const WOMENS_PRODUCTS: Product[] = [
  {
    id: 'w-hoodie-01',
    name: 'Cropped 450 GSM Raw Hem Hoodie',
    category: 'hoodies',
    collection: 'essentials',
    priceNGN: 62000,
    priceUSD: 75,
    priceGBP: 60,
    priceEUR: 70,
    description: 'Sculpted from bespoke 450 GSM unbrushed loopback cotton with a dropped shoulder, structured boxy crop, raw laser-cut hemline, and dual-layer substantial hood. Engineered in Lagos for modern effortless drape.',
    gsm: '450 GSM',
    fit: 'Boxy Cropped Silhouette',
    fabric: '100% Heavyweight Nigerian Combed Cotton',
    origin: 'Hand-Finished in Lagos Atelier',
    colors: [
      {
        name: 'Bone / Raw Ecru',
        hex: '#E8E4DA',
        image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=85&w=1200&auto=format&fit=crop',
        altImage: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=85&w=1200&auto=format&fit=crop'
      },
      {
        name: 'Obsidian Noir',
        hex: '#181818',
        image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=85&w=1200&auto=format&fit=crop',
        altImage: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=85&w=1200&auto=format&fit=crop'
      },
      {
        name: 'Sun-Baked Terracotta',
        hex: '#9E5B42',
        image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=85&w=1200&auto=format&fit=crop',
        altImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=85&w=1200&auto=format&fit=crop'
      }
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    images: [
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=85&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=85&w=1200&auto=format&fit=crop'
    ],
    isNewDrop: true,
    isBestSeller: true,
    tag: 'SIGNATURE'
  },
  {
    id: 'w-trouser-01',
    name: 'Architectural Pleated Wide Trousers',
    category: 'trousers',
    collection: 'everyday',
    priceNGN: 54000,
    priceUSD: 66,
    priceGBP: 52,
    priceEUR: 61,
    description: 'High-waisted tailored trousers featuring deep inverted front pleats, fluid drape, and concealed side hook closure. Cut from a breathable summer wool-viscose blend suited for high heat and breezy evenings.',
    gsm: '280 GSM',
    fit: 'High-Rise Relaxed Fluid Leg',
    fabric: '65% Viscose, 35% Tropical Wool Blend',
    origin: 'Tailored on Lagos Island',
    colors: [
      {
        name: 'Dusk Charcoal',
        hex: '#282828',
        image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=85&w=1200&auto=format&fit=crop',
        altImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=85&w=1200&auto=format&fit=crop'
      },
      {
        name: 'Sand Ochre',
        hex: '#B89B72',
        image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=85&w=1200&auto=format&fit=crop'
      }
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    images: [
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=85&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=85&w=1200&auto=format&fit=crop'
    ],
    isNewDrop: true,
    tag: 'NEW SILHOUETTE'
  },
  {
    id: 'w-top-01',
    name: 'Sculpted Mockneck Ribbed Top',
    category: 'tees',
    collection: 'essentials',
    priceNGN: 32000,
    priceUSD: 39,
    priceGBP: 31,
    priceEUR: 36,
    description: 'Ultra-dense 2x2 elastane-cotton rib with a structured mini-mockneck, extended knuckle sleeves, and seamless tonal stitching. Designed to hold shape through endless wear and washing.',
    gsm: '290 GSM',
    fit: 'Second-Skin Form Fit',
    fabric: '92% Organic Combed Cotton, 8% Elastane',
    origin: 'Crafted in Lagos Atelier',
    colors: [
      {
        name: 'Raw Milk',
        hex: '#F0ECE1',
        image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=85&w=1200&auto=format&fit=crop',
        altImage: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=85&w=1200&auto=format&fit=crop'
      },
      {
        name: 'Deep Espresso',
        hex: '#3D2F28',
        image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=85&w=1200&auto=format&fit=crop'
      }
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    images: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=85&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=85&w=1200&auto=format&fit=crop'
    ],
    isBestSeller: true
  },
  {
    id: 'w-dress-01',
    name: 'Monolithic Heavyweight Column Maxi',
    category: 'trousers',
    collection: 'after-dark',
    priceNGN: 68000,
    priceUSD: 83,
    priceGBP: 65,
    priceEUR: 76,
    description: 'An architectural floor-skimming column dress cut from 340 GSM interlock jersey. Features a clean bateau neckline, deep side split for ease of movement, and subtle blind hem stitch.',
    gsm: '340 GSM',
    fit: 'Elongated Column Silhouette',
    fabric: '100% Mercerized Combed Cotton Jersey',
    origin: 'Hand-Cut in Lagos',
    colors: [
      {
        name: 'Pitch Black',
        hex: '#141414',
        image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=85&w=1200&auto=format&fit=crop',
        altImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=85&w=1200&auto=format&fit=crop'
      },
      {
        name: 'Olive Sage',
        hex: '#5E6351',
        image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=85&w=1200&auto=format&fit=crop'
      }
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    images: [
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=85&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=85&w=1200&auto=format&fit=crop'
    ],
    isNewDrop: true,
    tag: 'LIMITED RUN'
  },
  {
    id: 'w-jacket-01',
    name: 'Structured Canvas Atelier Trench',
    category: 'jackets',
    collection: 'the-drop',
    priceNGN: 89000,
    priceUSD: 108,
    priceGBP: 86,
    priceEUR: 100,
    description: 'An oversized, single-breasted mid-length coat in dense 12oz duck canvas with horn button closures, storm flap back detailing, and a removable self-tie waist cord. Unlined for breathable structure.',
    gsm: '380 GSM',
    fit: 'Oversized Tailored Cocoon',
    fabric: '100% Structured Duck Canvas Cotton',
    origin: 'Crafted on Lagos Island',
    colors: [
      {
        name: 'Raw Canvas Dune',
        hex: '#C8BAA0',
        image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=85&w=1200&auto=format&fit=crop',
        altImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=85&w=1200&auto=format&fit=crop'
      },
      {
        name: 'Asphalt Black',
        hex: '#1C1C1C',
        image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=85&w=1200&auto=format&fit=crop'
      }
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    images: [
      'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=85&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=85&w=1200&auto=format&fit=crop'
    ],
    isLimited: true,
    tag: 'RUNWAY'
  },
  {
    id: 'w-skirt-01',
    name: 'Pleated Raw Denim Midi Skirt',
    category: 'jeans',
    collection: 'everyday',
    priceNGN: 48000,
    priceUSD: 58,
    priceGBP: 46,
    priceEUR: 54,
    description: 'Articulated A-line midi skirt constructed from 13.5oz non-stretch Japanese selvedge denim. Sits at the natural waist with clean knife pleats and copper hardware.',
    gsm: '13.5oz',
    fit: 'High-Waisted A-Line Midi',
    fabric: '100% Selvedge Indigo Denim',
    origin: 'Lagos Atelier',
    colors: [
      {
        name: 'Raw Indigo',
        hex: '#1D2838',
        image: 'https://images.unsplash.com/photo-1542272604-780c96856592?q=85&w=1200&auto=format&fit=crop',
        altImage: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=85&w=1200&auto=format&fit=crop'
      },
      {
        name: 'Washed Stone',
        hex: '#697484',
        image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=85&w=1200&auto=format&fit=crop'
      }
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    images: [
      'https://images.unsplash.com/photo-1542272604-780c96856592?q=85&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=85&w=1200&auto=format&fit=crop'
    ],
    isNewDrop: true
  },
  {
    id: 'w-tee-01',
    name: 'Relaxed Monolith Heavyweight Tee',
    category: 't-shirts',
    collection: 'essentials',
    priceNGN: 28000,
    priceUSD: 34,
    priceGBP: 27,
    priceEUR: 31,
    description: 'A 260 GSM boxy tee with high tight neck collar, dropped shoulders, and clean blind hems. The definitive everyday building block engineered to endure.',
    gsm: '260 GSM',
    fit: 'Relaxed Boxy Drop-Shoulder',
    fabric: '100% Organic Ring-Spun Cotton',
    origin: 'Lagos Atelier',
    colors: [
      {
        name: 'Chalk White',
        hex: '#F7F6F2',
        image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=85&w=1200&auto=format&fit=crop',
        altImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=85&w=1200&auto=format&fit=crop'
      },
      {
        name: 'Faded Black',
        hex: '#2B2B2B',
        image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=85&w=1200&auto=format&fit=crop'
      },
      {
        name: 'Muted Khaki',
        hex: '#7A7969',
        image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=85&w=1200&auto=format&fit=crop'
      }
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    images: [
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=85&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=85&w=1200&auto=format&fit=crop'
    ],
    isBestSeller: true
  },
  {
    id: 'w-sweatshirt-01',
    name: 'Brutalist Wide-Neck Sweatshirt',
    category: 'sweatshirts',
    collection: 'essentials',
    priceNGN: 49000,
    priceUSD: 60,
    priceGBP: 47,
    priceEUR: 55,
    description: 'Substantial 400 GSM unbrushed loopback sweatshirt with a widened boat-inspired crewneck and subtle reverse-weave side ribbing. Seamlessly bridges lounge and tailored wear.',
    gsm: '400 GSM',
    fit: 'Relaxed Wide-Neck Silhouette',
    fabric: '100% Combed Cotton Loopback',
    origin: 'Crafted in Lagos',
    colors: [
      {
        name: 'Heather Sand',
        hex: '#D9D3C7',
        image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=85&w=1200&auto=format&fit=crop',
        altImage: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=85&w=1200&auto=format&fit=crop'
      },
      {
        name: 'Cocoa Brown',
        hex: '#4A3B32',
        image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=85&w=1200&auto=format&fit=crop'
      }
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    images: [
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=85&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=85&w=1200&auto=format&fit=crop'
    ],
    isNewDrop: true
  },
  {
    id: 'w-acc-01',
    name: 'Atelier Raw Canvas Carryall Tote',
    category: 'accessories',
    collection: 'essentials',
    priceNGN: 38000,
    priceUSD: 46,
    priceGBP: 36,
    priceEUR: 43,
    description: 'Heavyweight 18oz unbleached cotton duck canvas tote with bridle leather reinforced straps, inner zipped stash pouch, and matte black brass rivets.',
    fit: 'One Size (45cm x 38cm x 16cm)',
    fabric: '100% Unbleached Duck Canvas & Full Grain Leather',
    origin: 'Lagos Atelier',
    colors: [
      {
        name: 'Natural Ecru',
        hex: '#EBE5D8',
        image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?q=85&w=1200&auto=format&fit=crop',
        altImage: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=85&w=1200&auto=format&fit=crop'
      }
    ],
    sizes: ['M'],
    images: [
      'https://images.unsplash.com/photo-1544816155-12df9643f363?q=85&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=85&w=1200&auto=format&fit=crop'
    ],
    isBestSeller: true
  },
  {
    id: 'w-trouser-02',
    name: 'Selvedge Drawstring Cargo Pant',
    category: 'trousers',
    collection: 'everyday',
    priceNGN: 56000,
    priceUSD: 68,
    priceGBP: 54,
    priceEUR: 63,
    description: 'A relaxed mid-rise cargo pant with an internal grosgrain drawstring waist, gusseted minimal patch pockets, and articulated knee darting for organic fluid volume.',
    gsm: '270 GSM',
    fit: 'Relaxed Tapered Leg',
    fabric: '100% Ripstop Cotton',
    origin: 'Lagos Atelier',
    colors: [
      {
        name: 'Olive Drab',
        hex: '#4D5340',
        image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=85&w=1200&auto=format&fit=crop',
        altImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=85&w=1200&auto=format&fit=crop'
      },
      {
        name: 'Pitch Black',
        hex: '#141414',
        image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=85&w=1200&auto=format&fit=crop'
      }
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    images: [
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=85&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=85&w=1200&auto=format&fit=crop'
    ],
    isNewDrop: true
  },
  {
    id: 'w-top-02',
    name: 'Fine Knit Open-Back Bodysuit',
    category: 'tees',
    collection: 'after-dark',
    priceNGN: 36000,
    priceUSD: 44,
    priceGBP: 35,
    priceEUR: 41,
    description: 'Sculpted seamless knit bodysuit featuring an elegant low-scoop back, high-cut leg, and discreet snap fastening. Smooth second-skin layering under tailored trousers.',
    gsm: '240 GSM',
    fit: 'Form Contour Fit',
    fabric: '85% Micro-Modal, 15% Elastane',
    origin: 'Lagos Atelier',
    colors: [
      {
        name: 'Midnight Black',
        hex: '#121212',
        image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=85&w=1200&auto=format&fit=crop',
        altImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=85&w=1200&auto=format&fit=crop'
      },
      {
        name: 'Warm Stone',
        hex: '#C5BDB0',
        image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=85&w=1200&auto=format&fit=crop'
      }
    ],
    sizes: ['XS', 'S', 'M', 'L'],
    images: [
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=85&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=85&w=1200&auto=format&fit=crop'
    ],
    tag: 'AFTER DARK'
  },
  {
    id: 'w-hoodie-02',
    name: 'Oversized 450 GSM Zip-Front Hoodie',
    category: 'hoodies',
    collection: 'essentials',
    priceNGN: 66000,
    priceUSD: 80,
    priceGBP: 64,
    priceEUR: 74,
    description: 'Heavyweight loopback zipped hoodie with custom two-way brushed gunmetal YKK zipper, double-layered hood, and hidden kangaroo pockets.',
    gsm: '450 GSM',
    fit: 'Substantial Relaxed Boyfriend Cut',
    fabric: '100% Heavyweight Nigerian Combed Cotton',
    origin: 'Lagos Atelier',
    colors: [
      {
        name: 'Vintage Washed Grey',
        hex: '#4A4A48',
        image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=85&w=1200&auto=format&fit=crop',
        altImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=85&w=1200&auto=format&fit=crop'
      },
      {
        name: 'Raw Ecru',
        hex: '#E8E4DA',
        image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=85&w=1200&auto=format&fit=crop'
      }
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    images: [
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=85&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=85&w=1200&auto=format&fit=crop'
    ],
    isBestSeller: true
  }
];
