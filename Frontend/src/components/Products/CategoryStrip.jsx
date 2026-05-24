import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductGrid from './ProductGrid';
import axios from 'axios';
import requestWithRetry from '../../utils/requestWithRetry';
import { API_BASE_URL } from '../../utils/config';

const CategoryStrip = ({ title, folderName }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const displayProducts = products.slice(0, 4);

  useEffect(() => {
    let mounted = true;
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await requestWithRetry(`${API_BASE_URL}/api/products`);
        if (!mounted) return;
        const data = resp.data || resp;
        setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || 'Failed to load products');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchProducts();
    return () => { mounted = false; };
  }, [folderName]);

  return (
    <section style={{ background: '#fffaf6', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div className="text-center mb-6">
          <p className="text-xs tracking-[0.3em] uppercase text-lv-gold mb-2">Latest Collection</p>
          <h3 className="font-serif text-2xl md:text-3xl text-lv-dark tracking-wide">{title}</h3>
          <div className="mt-3 flex items-center justify-center gap-3">
            <span className="w-12 h-[1px] bg-lv-gold/70" />
            <span className="w-2 h-2 bg-lv-gold/80 rotate-45" />
            <span className="w-12 h-[1px] bg-lv-gold/70" />
          </div>
        </div>

        <ProductGrid
          products={displayProducts}
          loading={loading}
          error={error}
          oneRowOnMobile={true}
        />

        <div className="mt-8 flex justify-center">
          <Link
            to={`/collections/all?category=${encodeURIComponent(folderName)}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-black transition-opacity hover:opacity-70"
          >
            <span>View All</span>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14" />
              <path d="M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CategoryStrip;
