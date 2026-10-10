import React from 'react';
import { Product } from '../../types';
import { ProductCard } from '../ProductCard';

interface WomenProductCardProps {
  product: Product;
  onViewProduct: (product: Product) => void;
  priority?: boolean;
}

export const WomenProductCard: React.FC<WomenProductCardProps> = ({
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

