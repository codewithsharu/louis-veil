import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ShoppingBag, Star } from 'react-feather';
import { Link } from "react-router-dom";
import axios from "axios";
import requestWithRetry from '../../utils/requestWithRetry';
import { API_BASE_URL } from "../../utils/config";
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { addToWishlist, removeFromWishlist } from '../../redux/slices/productSlice';
import { addToCart } from '../../redux/slices/cartSlice';

const NewArrivals = () => {
  const dispatch = useDispatch();
  const { user, guestId } = useSelector((state) => state.auth);
  const wishlistItems = useSelector((state) => state.products.wishlistItems) || [];
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [newArrivals, setNewArrivals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNewArrivals = async () => {
      try {
        setIsLoading(true);
        const response = await requestWithRetry(`${API_BASE_URL}/api/products/new-arrivals`);
        setNewArrivals(response.data || response);
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNewArrivals();
  }, []);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const cardWidth = window.innerWidth < 640 ? 170 : 260;
      scrollRef.current.scrollBy({ left: direction === "left" ? -cardWidth * 2 : cardWidth * 2, behavior: "smooth" });
    }
  };

  const updateScrollButtons = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
    }
  };

  useEffect(() => {
    const container = scrollRef.current;
    if (container) {
      container.addEventListener("scroll", updateScrollButtons);
      window.addEventListener("resize", updateScrollButtons);
      updateScrollButtons();
    }

    return () => {
      if (container) container.removeEventListener("scroll", updateScrollButtons);
      window.removeEventListener("resize", updateScrollButtons);
    };
  }, [newArrivals]);

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
    } catch (error) {
      toast.error('Wishlist action failed');
    }
  };

  const handleCartClick = async (event, productId) => {
    event.preventDefault();
    event.stopPropagation();

    try {
      await dispatch(
        addToCart({
          productId,
          quantity: 1,
          guestId,
          userId: user?._id,
        })
      );
      toast.success('Added to cart');
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  return (
    <section id="new-arrivals-section" className="py-12 md:py-16 bg-white scroll-mt-24">
      {/* Header */}
      <div className="text-center mb-5 md:mb-8 px-4">
        <p className="text-xs tracking-[0.3em] uppercase text-lv-gold mb-2">Latest Collection</p>
        <h2 className="font-serif text-2xl md:text-4xl text-lv-dark tracking-wide">New Arrivals</h2>
        <div className="mt-4 flex items-center justify-center gap-3">
          <span className="w-16 h-[1px] bg-lv-gold/70" />
          <span className="w-2 h-2 bg-lv-gold/80 rotate-45" />
          <span className="w-16 h-[1px] bg-lv-gold/70" />
        </div>
      </div>

      {/* Carousel - edge to edge with small padding */}
      <div className="relative px-4 md:px-6">
        {/* Left Arrow */}
        <button
          onClick={() => scroll("left")}
          className={`hidden md:flex absolute left-0 top-[38%] -translate-y-1/2 w-9 h-9 items-center justify-center bg-white rounded-full z-10 shadow-[0_2px_8px_rgba(0,0,0,0.15)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)] transition ${!canScrollLeft ? 'opacity-40 cursor-default' : 'cursor-pointer'}`}
        >
          <ChevronLeft className="w-5 h-5 text-gray-500" />
        </button>

        <div
          ref={scrollRef}
          className="flex gap-[10px] md:gap-[14px] overflow-x-auto scroll-smooth"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {isLoading
            ? [...Array(6)].map((_, i) => (
                <div key={i} className="flex-shrink-0 w-[calc(50%-5px)] sm:w-[calc(33.333%-10px)] md:w-[calc(25%-11px)] lg:w-[calc(20%-12px)] animate-pulse">
                  <div className="aspect-[1/1] bg-gray-100 rounded-[22px]" />
                  <div className="p-2.5 space-y-1.5">
                    <div className="h-3 bg-gray-100 w-1/2" />
                    <div className="h-3 bg-gray-100 w-3/4" />
                    <div className="h-3 bg-gray-100 w-2/3" />
                  </div>
                </div>
              ))
            : newArrivals.map((product) => {
                const { originalPrice, sellingPrice, discount } = getPricing(product);
                const displayRating = Number(product.rating) > 0 ? product.rating : 5;
                return (
                  <Link
                    key={product._id}
                    to={`/product/${product._id}`}
                    className="flex-shrink-0 w-[calc(50%-5px)] sm:w-[calc(33.333%-10px)] md:w-[calc(25%-11px)] lg:w-[calc(20%-12px)] group rounded-[22px] border border-[#eadfce] bg-white p-2 shadow-[0_10px_30px_rgba(58,41,25,0.06)]"
                  >
                    {/* Image */}
                    <div className="relative aspect-[1/1] overflow-hidden rounded-[16px_16px_10px_10px] bg-[#f7f1e8]">
                      <img
                        src={product.images?.[0]?.url || "/placeholder.jpg"}
                        alt={product.name}
                        className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500 group-hover:opacity-0"
                      />
                      {product.images?.[1]?.url && (
                        <img
                          src={product.images[1].url}
                          alt={`${product.name} alternate view`}
                          className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                        />
                      )}
                      <button
                        type="button"
                        aria-label="Add to wishlist"
                        className={`absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full transition-transform duration-300 hover:scale-105 ${isWishlisted(product._id) ? 'bg-white/95 shadow-[0_2px_10px_rgba(0,0,0,0.16)]' : 'bg-white/80 shadow-[0_2px_8px_rgba(0,0,0,0.12)]'}`}
                        onClick={(event) => handleWishlistClick(event, product._id)}
                      >
                        <svg viewBox="0 0 24 24" width="18" height="18" stroke={isWishlisted(product._id) ? '#d64545' : '#4b3a2b'} strokeWidth="2" fill={isWishlisted(product._id) ? '#d64545' : 'none'} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={isWishlisted(product._id) ? 'none' : '1.5 2.5'} aria-hidden="true">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        aria-label="Add to cart"
                        className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#8b6a4a] text-white shadow-[0_6px_18px_rgba(58,41,25,0.15)] transition-transform duration-300 hover:scale-105"
                        onClick={(event) => handleCartClick(event, product._id)}
                      >
                        <ShoppingBag className="w-4 h-4" />
                      </button>
                      {/* Rating Badge */}
                      {/* image-level rating badge removed; using inline/bottom rating only */}
                    </div>

                    {/* Product Info */}
                    <div className="px-1 pt-2 pb-1">
                      <h3 className="font-product text-[14px] font-medium text-[#1f1610] truncate leading-snug">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className="text-[15px] font-semibold text-[#1f1610]">₹{Number(sellingPrice || 0).toLocaleString()}</span>
                        {discount !== null && discount > 0 && (
                          <>
                            <span className="text-[#a79b8d] line-through text-[11px]">₹{Number(originalPrice || 0).toLocaleString()}</span>
                            <span className="rounded-full bg-[#f4ecdf] px-2 py-0.5 text-[10px] font-medium text-[#8b6a4a]">{discount}% OFF</span>
                          </>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
        </div>

        {/* Right Arrow */}
        <button
          onClick={() => scroll("right")}
          className={`hidden md:flex absolute right-0 top-[38%] -translate-y-1/2 w-9 h-9 items-center justify-center bg-white rounded-full z-10 shadow-[0_2px_8px_rgba(0,0,0,0.15)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)] transition ${!canScrollRight ? 'opacity-40 cursor-default' : 'cursor-pointer'}`}
        >
          <ChevronRight className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <style>
        {`.scrollbar-hide::-webkit-scrollbar { display: none; }`}
      </style>
    </section>
  );
};

export default NewArrivals;