import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Heart } from 'react-feather';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/config';

const Thrift = () => {
  const [thriftProducts, setThriftProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useEffect(() => {
    const fetchThriftProducts = async () => {
      try {
        const { data } = await axios.get(`${API_BASE_URL}/api/products?limit=20`);
        setThriftProducts(data.filter((p) => p.thrift === true));
      } catch (err) {
        console.error('Failed to fetch thrift products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchThriftProducts();
  }, []);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const cardWidth = window.innerWidth < 640 ? 280 : 340;
      scrollRef.current.scrollBy({ left: direction === 'left' ? -cardWidth * 2 : cardWidth * 2, behavior: 'smooth' });
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
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', updateScrollButtons);
      window.addEventListener('resize', updateScrollButtons);
      updateScrollButtons();
      return () => {
        el.removeEventListener('scroll', updateScrollButtons);
        window.removeEventListener('resize', updateScrollButtons);
      };
    }
  }, [thriftProducts]);

  const getDiscount = (price, discountPrice) => {
    if (!price || !discountPrice || price <= discountPrice) return null;
    return Math.round(((price - discountPrice) / price) * 100);
  };

  if (!loading && thriftProducts.length === 0) return null;

  return (
    <section className="bg-lv-dark py-14 md:py-20">
      <div className="max-w-[1440px] mx-auto px-5 md:px-10">
        {/* Header */}
        <div className="text-center mb-10 md:mb-14">
          <p className="text-xs tracking-[0.3em] uppercase text-lv-gold mb-2">Thrift Store</p>
          <h2 className="font-serif text-2xl md:text-4xl text-white tracking-wide">
            Discover Preowned Items
          </h2>
          <div className="mt-4 flex items-center justify-center gap-3">
            <span className="w-16 h-[1px] bg-lv-gold/70" />
            <span className="w-2 h-2 bg-lv-gold/80 rotate-45" />
            <span className="w-16 h-[1px] bg-lv-gold/70" />
          </div>
        </div>

        {/* Carousel */}
        <div className="relative">
          {/* Left Arrow */}
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="hidden md:flex absolute -left-5 top-[38%] -translate-y-1/2 w-11 h-11 items-center justify-center bg-white/10 backdrop-blur-sm border border-white/20 z-10 hover:bg-lv-gold/20 hover:border-lv-gold/40 transition-all"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
          )}

          <div
            ref={scrollRef}
            className="flex gap-4 md:gap-6 overflow-x-auto scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {loading
              ? [...Array(4)].map((_, i) => (
                  <div key={i} className="flex-shrink-0 w-[70vw] sm:w-[280px] md:w-[320px] animate-pulse">
                    <div className="aspect-[3/4] bg-white/5" />
                    <div className="mt-4 space-y-2">
                      <div className="h-3 bg-white/5 w-1/3" />
                      <div className="h-4 bg-white/5 w-3/4" />
                      <div className="h-4 bg-white/5 w-1/2" />
                    </div>
                  </div>
                ))
              : thriftProducts.map((product) => {
                  const discount = getDiscount(product.price, product.discountPrice);
                  return (
                    <Link
                      key={product._id}
                      to={`/product/${product._id}`}
                      className="flex-shrink-0 w-[70vw] sm:w-[280px] md:w-[320px] group"
                    >
                      {/* Image */}
                      <div className="relative aspect-[3/4] overflow-hidden bg-white/5">
                        <img
                          src={product.images?.[0]?.url || '/placeholder.jpg'}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        {/* Gradient overlay on hover */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        {/* Wishlist */}
                        <button className="absolute top-4 right-4 p-2 bg-white/10 backdrop-blur-sm border border-white/20 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-lv-gold/20">
                          <Heart className="w-4 h-4 text-white" />
                        </button>
                        {/* Discount tag */}
                        {discount && (
                          <div className="absolute top-4 left-4 bg-lv-gold text-lv-dark text-[10px] font-semibold tracking-[0.1em] uppercase px-3 py-1">
                            {discount}% Off
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="mt-4">
                        {product.brand && (
                          <p className="text-lv-gold/70 text-[10px] font-medium uppercase tracking-[0.2em] mb-1">
                            {product.brand}
                          </p>
                        )}
                        <h3 className="text-white text-sm font-light tracking-wide truncate group-hover:text-lv-gold transition-colors duration-300">
                          {product.name}
                        </h3>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-white font-medium text-sm tracking-wide">
                            ₹{product.discountPrice || product.price}
                          </span>
                          {discount && (
                            <span className="text-white/30 line-through text-xs">₹{product.price}</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
          </div>

          {/* Right Arrow */}
          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="hidden md:flex absolute -right-5 top-[38%] -translate-y-1/2 w-11 h-11 items-center justify-center bg-white/10 backdrop-blur-sm border border-white/20 z-10 hover:bg-lv-gold/20 hover:border-lv-gold/40 transition-all"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          )}
        </div>

        {/* CTA */}
        <div className="text-center mt-12 md:mt-16">
          <Link
            to="/thrift"
            className="inline-flex items-center gap-3 border border-lv-gold/40 text-lv-gold px-10 py-3.5 text-[11px] font-medium tracking-[0.25em] uppercase hover:bg-lv-gold hover:text-lv-dark transition-all duration-500"
          >
            Explore Thrift Collection
            <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Thrift;
