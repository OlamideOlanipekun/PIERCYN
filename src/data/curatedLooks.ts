export interface LookItem {
  id: string;
  name: string;
  priceNGN: number;
  category: string;
  image: string;
  size: string;
  color: string;
}

export interface CuratedOutfit {
  id: string;
  title: string;
  subtitle: string;
  modelImage: string;
  totalPriceNGN: number;
  items: LookItem[];
}

export const CURATED_LOOKS: CuratedOutfit[] = [
  {
    id: 'look-urban-monochrome',
    title: 'BUILD THE LOOK',
    subtitle: 'THE LAGOS MONOCHROME UNIFORM',
    modelImage: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?q=80&w=1200&auto=format&fit=crop',
    totalPriceNGN: 91000,
    items: [
      {
        id: 'graphic-hoodie',
        name: 'Oversized Hoodie',
        priceNGN: 38000,
        category: 'hoodies',
        image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=600&auto=format&fit=crop',
        size: 'L',
        color: 'Pitch Black',
      },
      {
        id: 'straight-leg-trousers',
        name: 'Straight-Leg Trousers',
        priceNGN: 35000,
        category: 'trousers',
        image: 'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?q=80&w=600&auto=format&fit=crop',
        size: '32',
        color: 'Pitch Black',
      },
      {
        id: 'oversized-tee',
        name: 'T-Shirt',
        priceNGN: 18000,
        category: 'tees',
        image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=600&auto=format&fit=crop',
        size: 'M',
        color: 'Raw Chalk',
      },
    ],
  },
  {
    id: 'look-street-tactical',
    title: 'STREET TACTICAL',
    subtitle: 'MODULAR CARGO & UTILITY CANVAS',
    modelImage: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=1200&auto=format&fit=crop',
    totalPriceNGN: 103400,
    items: [
      {
        id: 'utility-jacket',
        name: 'Utility Jacket',
        priceNGN: 45200,
        category: 'jackets',
        image: 'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=600&auto=format&fit=crop',
        size: 'L',
        color: 'Waxed Onyx Black',
      },
      {
        id: 'cargo-pant',
        name: 'Cargo Pant',
        priceNGN: 35000,
        category: 'trousers',
        image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=600&auto=format&fit=crop',
        size: '32L',
        color: 'Pitch Black',
      },
      {
        id: 'heavyweight-tee',
        name: 'Heavyweight Tee',
        priceNGN: 23200,
        category: 'tees',
        image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=600&auto=format&fit=crop',
        size: 'L',
        color: 'Heavy Obsidian',
      },
    ],
  },
];
