const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const getItemPricing = (item) => {
  const currentPrice = toNumber(item?.price);
  const originalPrice = toNumber(item?.originalPrice) || currentPrice;
  const finalPrice = currentPrice > 0 && currentPrice < originalPrice ? currentPrice : originalPrice;
  const discountAmount = Math.max(originalPrice - finalPrice, 0);
  const discountPercent = originalPrice > 0 && discountAmount > 0
    ? Math.round((discountAmount / originalPrice) * 100)
    : 0;

  return {
    originalPrice,
    finalPrice,
    discountAmount,
    discountPercent,
    hasDiscount: discountAmount > 0,
  };
};

export const getCartPricing = (products = []) => {
  return products.reduce(
    (totals, item) => {
      const pricing = getItemPricing(item);
      const quantity = toNumber(item?.quantity) || 1;

      totals.originalSubtotal += pricing.originalPrice * quantity;
      totals.finalSubtotal += pricing.finalPrice * quantity;
      totals.totalDiscount += pricing.discountAmount * quantity;

      return totals;
    },
    {
      originalSubtotal: 0,
      finalSubtotal: 0,
      totalDiscount: 0,
    }
  );
};
