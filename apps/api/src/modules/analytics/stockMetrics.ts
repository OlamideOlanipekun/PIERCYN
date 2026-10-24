export function isLowStockAvailable(available: number, threshold: number): boolean {
  return available > 0 && available <= threshold;
}
