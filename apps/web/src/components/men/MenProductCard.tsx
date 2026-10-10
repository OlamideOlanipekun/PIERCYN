import React from 'react';
import { Product } from '../../types';
import { ProductCard } from '../ProductCard';

interface MenProductCardProps {
  product: Product;
  onViewProduct: (product: Product) => void;
  priority?: boolean;
}

export const MenProductCard: React.FC<MenProductCardProps> = ({
  product,
  onViewProduct,
  priority = false,
}) => {
  return (
    <ProductCard
      product={product}
      onViewProduct={onViewProduct}
      priority={priority}
    />
  );
};

