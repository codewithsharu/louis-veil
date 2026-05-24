import React from 'react';
import { Link } from 'react-router-dom';
// Prefer images from public/assets/collections/<Category>/cover.jpg so uploads reflect automatically.
const categories = [
  { label: 'Earrings', queryValue: 'Earrings', image: '/assets/collections/Earrings/cover.png' },
  { label: 'Lockets', queryValue: 'Lockets', image: '/assets/collections/Lockets/cover.png' },
  { label: 'Bracelets', queryValue: 'Bracelets', image: '/assets/collections/Bracelets/cover.png' },
  { label: 'Pendants', queryValue: 'Pendants', image: '/assets/collections/Pendants/cover.png' },
  { label: 'Combo', queryValue: 'Combo', image: '/assets/collections/Combo/cover.png' },
];

const CategoriesSection = () => {
  return (
    <section id="categories-section" className="bg-lv-cream/40 py-10 md:py-12 px-4 scroll-mt-24">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-7">
          <p className="text-xs tracking-[0.3em] uppercase text-lv-gold mb-2">Categories</p>
          <h2 className="font-serif text-2xl md:text-4xl text-lv-dark tracking-wide">Shop by Category</h2>
          <div className="mt-4 flex items-center justify-center gap-3">
            <span className="w-16 h-[1px] bg-lv-gold/70" />
            <span className="w-2 h-2 bg-lv-gold/80 rotate-45" />
            <span className="w-16 h-[1px] bg-lv-gold/70" />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
          {categories.map((category) => (
            <Link
              key={category.label}
              to={`/collections/all?category=${encodeURIComponent(category.queryValue)}`}
              className="group relative block overflow-hidden border border-lv-dark/10 bg-white"
            >
              <div className="aspect-[3/4] overflow-hidden">
                <img
                  src={category.image}
                  alt={`${category.label} category`}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  onError={(e) => {
                    const img = e.currentTarget;
                    img.onerror = null;
                    if (img.src.endsWith('.png')) img.src = img.src.replace(/\.png$/, '.svg');
                  }}
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3 md:p-4">
                <p className="font-serif text-lg md:text-2xl text-white tracking-wide">{category.label}</p>
                <p className="text-[11px] md:text-xs uppercase tracking-[0.22em] text-lv-gold mt-1">Explore</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;
