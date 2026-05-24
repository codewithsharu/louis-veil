import React from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { addToWishlist, removeFromWishlist } from '../../redux/slices/productSlice';
import { addToCart } from '../../redux/slices/cartSlice';

const ProductGrid = ({ products, loading, error, oneRowOnMobile = false }) => {
  const dispatch = useDispatch();
  const { user, guestId } = useSelector((state) => state.auth);
  const wishlistItems = useSelector((state) => state.products.wishlistItems) || [];

  const layoutClassName = oneRowOnMobile
    ? 'flex w-full snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-3 pr-2 md:grid md:grid-cols-3 lg:grid-cols-4 md:gap-4 md:overflow-visible md:px-0 md:pb-0 md:pr-0'
    : 'grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1 md:gap-4 md:w-full';

  // Mobile: smaller fixed width cards; md+ bigger with more padding
  const cardClassName = oneRowOnMobile
    ? 'group block flex-shrink-0 w-[42vw] min-w-[152px] max-w-[184px] snap-start bg-white rounded-xl p-1.5 md:w-full md:min-w-0 md:max-w-none md:rounded-2xl md:p-3'
    : 'group block w-full bg-white rounded-xl p-1.5 md:rounded-2xl md:p-3';

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="animate-pulse bg-white rounded-2xl p-2.5 border border-gray-100">
            <div className="aspect-square bg-gray-100 rounded-xl" />
            <div className="pt-2.5 space-y-1.5">
              <div className="h-3.5 bg-gray-100 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 font-medium">Error: {error}</p>
      </div>
    );
  }

  const getPricing = (product) => {
    const originalPrice = Number(product?.originalPrice ?? product?.price ?? product?.mrp ?? 0);
    const sellingPrice = Number(product?.sellingPrice ?? product?.discountPrice ?? product?.price ?? 0);
    const hasDiscount = Number.isFinite(originalPrice)
      && Number.isFinite(sellingPrice)
      && originalPrice > 0
      && sellingPrice > 0
      && originalPrice > sellingPrice;

    const discountValue = hasDiscount ? ((originalPrice - sellingPrice) / originalPrice) * 100 : null;

    return {
      originalPrice: hasDiscount ? originalPrice : sellingPrice,
      sellingPrice: hasDiscount ? sellingPrice : originalPrice,
      discount: discountValue === null ? null : (discountValue >= 1 ? Math.round(discountValue) : Number(discountValue.toFixed(1))),
    };
  };

  const isWishlisted = (productId) =>
    wishlistItems.some((item) => String(item.productId) === String(productId));

  const handleWishlistClick = async (event, productId) => {
    event.preventDefault();
    event.stopPropagation();
    if (!user?._id) {
      toast.error('Please login to use wishlist');
      return;
    }
    try {
      if (isWishlisted(productId)) {
        await dispatch(removeFromWishlist({ userId: user._id, productId }));
        toast.success('Removed from wishlist');
      } else {
        await dispatch(addToWishlist({ userId: user._id, productId }));
        toast.success('Added to wishlist');
      }
    } catch {
      toast.error('Wishlist action failed');
    }
  };

  const handleCartClick = async (event, productId) => {
    event.preventDefault();
    event.stopPropagation();
    try {
      await dispatch(addToCart({ productId, quantity: 1, guestId, userId: user?._id }));
      toast.success('Added to cart');
    } catch {
      toast.error('Failed to add to cart');
    }
  };

  return (
    <>
      {/* Bucket clip-path definition */}
      <svg width="0" height="0" style={{ position: 'absolute', overflow: 'hidden' }}>
        <defs>
          <clipPath id="bucketClip" clipPathUnits="objectBoundingBox">
            <path d="
              M 0.06,0
              Q 0,0 0,0.06
              L 0.03,0.93
              C 0.04,0.99 0.22,1 0.5,1
              C 0.78,1 0.96,0.99 0.97,0.93
              L 1,0.06
              Q 1,0 0.94,0
              Z
            " />
          </clipPath>
        </defs>
      </svg>

      <div className="w-full">
      <div className={layoutClassName} style={oneRowOnMobile ? { scrollSnapType: 'x proximity' } : undefined}>
        {products.map((product, index) => {
          const { originalPrice, sellingPrice, discount } = getPricing(product);
          const displayRating = Number(product.rating) > 0 ? product.rating : 5;
          return (
            <Link
              key={product._id || index}
              to={`/product/${product._id}`}
              className={cardClassName}
              style={{
                border: '1px solid #f0ece6',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              }}
            >
              {/* Square + bucket-clipped image frame */}
              <div
                className="relative aspect-square overflow-hidden bg-[#f5f5f5]"
                style={{ clipPath: 'url(#bucketClip)' }}
              >
                <img
                  className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500 group-hover:opacity-0"
                  src={product.images?.[0]?.url}
                  alt={product.name}
                />
                {product.images?.[1]?.url && (
                  <img
                    className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    src={product.images[1].url}
                    alt={`${product.name} alternate view`}
                  />
                )}

                {/* Wishlist button — top right */}
                <button
                  type="button"
                  aria-label="Add to wishlist"
                  className={`absolute top-1.5 right-1.5 md:top-3 md:right-3 flex h-6 w-6 md:h-9 md:w-9 items-center justify-center rounded-full transition-transform duration-200 hover:scale-110 ${isWishlisted(product._id) ? 'bg-white/95 shadow-[0_2px_10px_rgba(0,0,0,0.16)]' : 'bg-white/80 shadow-[0_2px_8px_rgba(0,0,0,0.12)]'}`}
                  onClick={(event) => handleWishlistClick(event, product._id)}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="14"
                    height="14"
                    className="md:!w-[22px] md:!h-[22px]"
                    stroke={isWishlisted(product._id) ? '#d64545' : '#4b3a2b'}
                    strokeWidth="2"
                    fill={isWishlisted(product._id) ? '#d64545' : 'none'}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray={isWishlisted(product._id) ? 'none' : '1.5 2.5'}
                    aria-hidden="true"
                    style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.25))' }}
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </button>

                {/* Cart button — bottom right */}
                <button
                  type="button"
                  aria-label="Add to cart"
                  className="absolute bottom-1.5 right-1.5 md:bottom-3.5 md:right-3.5 flex h-7 w-7 md:h-11 md:w-11 items-center justify-center rounded-full transition-transform duration-200 hover:scale-110"
                  onClick={(event) => handleCartClick(event, product._id)}
                >
                  <svg xmlnsXlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg" width="28" height="28" className="md:!w-[44px] md:!h-[44px]" viewBox="0 0 36 36" fill="none" aria-hidden="true">
                    <rect width="36" height="36" rx="18" fill="#D4A017" />
                    <path d="M16.9092 19.5679C16.7464 19.5679 16.5903 19.6325 16.4753 19.7476C16.3602 19.8627 16.2955 20.0188 16.2955 20.1815C16.2955 20.3443 16.3602 20.5003 16.4753 20.6154C16.5903 20.7305 16.7464 20.7951 16.9092 20.7951H20.1819C20.3446 20.7951 20.5007 20.7305 20.6158 20.6154C20.7309 20.5003 20.7955 20.3443 20.7955 20.1815C20.7955 20.0188 20.7309 19.8627 20.6158 19.7476C20.5007 19.6325 20.3446 19.5679 20.1819 19.5679H16.9092Z" fill="white" />
                    <path fillRule="evenodd" clipRule="evenodd" d="M20.726 10.6336C20.8715 10.5609 21.0399 10.5489 21.1943 10.6003C21.3486 10.6517 21.4762 10.7623 21.5491 10.9077L23.0324 13.8744C23.3821 13.8914 23.7012 13.9203 23.9897 13.9612C24.8537 14.0847 25.5688 14.3514 26.0769 14.9798C26.585 15.6082 26.6962 16.3634 26.6365 17.2339C26.5792 18.0774 26.3502 19.1419 26.0654 20.4714L25.6964 22.1954C25.5042 23.0929 25.3479 23.8203 25.1515 24.3881C24.947 24.9813 24.677 25.4681 24.2172 25.8404C23.7573 26.2126 23.2239 26.3738 22.6021 26.4499C22.0048 26.5227 21.2602 26.5227 20.3439 26.5227H16.7472C15.8292 26.5227 15.0854 26.5227 14.4882 26.4499C13.8663 26.3738 13.3329 26.2126 12.8731 25.8404C12.4132 25.4681 12.1432 24.9813 11.9387 24.3889C11.7423 23.8203 11.5869 23.0929 11.3938 22.1962L11.0248 20.4723C10.7401 19.1419 10.5118 18.0774 10.4537 17.2339C10.394 16.3634 10.5052 15.609 11.0133 14.9798C11.5206 14.3514 12.2357 14.0847 13.0997 13.9612C13.3888 13.9208 13.7079 13.8919 14.057 13.8744L15.5428 10.9077C15.6162 10.7634 15.7438 10.654 15.8975 10.6033C16.0513 10.5526 16.2189 10.5647 16.3638 10.6371C16.5086 10.7094 16.619 10.836 16.6709 10.9894C16.7228 11.1428 16.712 11.3105 16.6408 11.4559L15.4462 13.8425C15.7441 13.8409 16.0574 13.8404 16.3863 13.8409H20.7047C21.0336 13.8409 21.347 13.8414 21.6448 13.8425L20.4511 11.4559C20.3783 11.3104 20.3663 11.142 20.4177 10.9876C20.4691 10.8333 20.5797 10.7056 20.7252 10.6328M13.4172 15.1565L13.0874 15.816C13.0507 15.8882 13.0286 15.9669 13.0224 16.0476C13.0163 16.1284 13.0262 16.2096 13.0515 16.2865C13.0769 16.3634 13.1172 16.4345 13.1702 16.4958C13.2232 16.557 13.2877 16.6072 13.3602 16.6434C13.4327 16.6795 13.5116 16.701 13.5924 16.7065C13.6731 16.7121 13.7542 16.7016 13.831 16.6756C13.9077 16.6497 13.9785 16.6088 14.0393 16.5553C14.1002 16.5019 14.1498 16.4369 14.1854 16.3642L14.8293 15.0764C15.2957 15.0682 15.8275 15.0674 16.4362 15.0674H20.6548C21.2635 15.0674 21.7953 15.0674 22.2617 15.0755L22.9056 16.3642C22.9791 16.5085 23.1066 16.6179 23.2603 16.6686C23.4141 16.7193 23.5817 16.7072 23.7266 16.6348C23.8714 16.5625 23.9819 16.4358 24.0338 16.2825C24.0856 16.1291 24.0748 15.9614 24.0036 15.816L23.6739 15.1565L23.8162 15.1754C24.5395 15.2793 24.8938 15.4683 25.1229 15.7505C25.3479 16.0287 25.4583 16.4075 25.4142 17.1128H11.6769C11.6327 16.4075 11.7432 16.0287 11.9682 15.7505C12.1972 15.4683 12.5515 15.2793 13.2748 15.1754L13.4172 15.1565ZM12.2357 20.2636C12.095 19.6247 11.9638 18.9837 11.8422 18.3409H25.2489C25.1267 18.9837 24.9952 19.6246 24.8545 20.2636L24.5043 21.9C24.3014 22.845 24.1607 23.4987 23.9913 23.988C23.8277 24.4625 23.6608 24.7129 23.4456 24.8864C23.2312 25.0598 22.9506 25.1711 22.454 25.2316C21.9393 25.2946 21.2701 25.2954 20.3038 25.2954H16.7864C15.821 25.2954 15.1517 25.2946 14.6371 25.2316C14.1396 25.1711 13.8598 25.0598 13.6454 24.8864C13.4302 24.7129 13.2625 24.4617 13.0997 23.988C12.9303 23.4987 12.7888 22.845 12.5867 21.9L12.2357 20.2636Z" fill="white" />
                  </svg>
                </button>
              </div>

              {/* Product info */}
              <div className="pt-1 pb-0.5 md:pt-1.5 md:pb-0.5">
                <div className="flex items-start justify-between gap-1 md:gap-2">
                  <h3 className="font-product text-[10px] md:text-[15px] font-medium truncate leading-tight text-gray-900">
                    {product.name}
                  </h3>
                  {displayRating > 0 && (
                    <div className="flex shrink-0 items-center gap-0.5 text-[9px] md:text-[11px] font-medium text-[#8b4fd1]">
                      <svg viewBox="0 0 24 24" width="9" height="9" className="md:!w-[12px] md:!h-[12px]" fill="#8b4fd1" stroke="#8b4fd1" strokeWidth="1.4" aria-hidden="true">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                      <span>{displayRating}</span>
                    </div>
                  )}
                </div>
                <div className="mt-0.5 md:mt-1 flex items-center gap-1 md:gap-2 flex-wrap">
                  <span className="text-[11px] md:text-[17px] font-bold text-gray-900 leading-none">
                    ₹{Number(sellingPrice || 0).toLocaleString()}
                  </span>
                  {discount !== null && discount > 0 && (
                    <>
                      <span className="line-through text-[9px] md:text-[12px] text-gray-400 leading-none">
                        ₹{Number(originalPrice || 0).toLocaleString()}
                      </span>
                      <span
                        className="rounded-full px-1.5 py-0.5 md:px-2.5 md:py-1 text-[8px] md:text-[11px] font-semibold leading-none"
                        style={{ background: '#ede9fe', color: '#6d28d9' }}
                      >
                        {discount}% OFF
                      </span>
                    </>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      </div>
    </>
  );
};

export default ProductGrid;