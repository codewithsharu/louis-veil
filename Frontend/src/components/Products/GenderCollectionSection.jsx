import React from 'react';
import { Link } from 'react-router-dom';
import curatedTailored from '../../assets/Curated for you/Curated for you/Custom Tailored Co-ords.png';
import curatedRefined from '../../assets/Curated for you/Curated for you/Refined Indian Tradition.png';
import curatedStatement from '../../assets/Curated for you/Curated for you/Statement Western Dresses.png';

const panels = [
  {
    title: 'Custom Tailored',
    subtitle: 'Co-ords',
    image: curatedTailored,
    link: '/collections/all?category=Co-ords',
    alt: 'Custom Tailored Collection',
  },
  {
    title: 'Refined',
    subtitle: 'Indian Traditions',
    image: curatedRefined,
    link: '/collections/all?category=Saree,Lehenga',
    alt: 'Lifestyle Collection',
  },
  {
    title: 'Statement',
    subtitle: 'Western Dresses',
    image: curatedStatement,
    link: '/collections/all?category=Western%20Dresses',
    alt: 'Him & Her Collection',
  },
];

const GenderCollectionSection = () => {
  return (
    <section className="bg-lv-cream">
      {/* Section header */}
      <div className="text-center pt-10 pb-7 md:pt-14 md:pb-10 px-4">
        <p className="text-xs tracking-[0.3em] uppercase text-lv-gold mb-2">The Collections</p>
        <h2 className="font-serif text-2xl md:text-4xl text-lv-dark tracking-wide">
          Curated for You
        </h2>
        <div className="mt-4 flex items-center justify-center gap-3">
          <span className="w-16 h-[1px] bg-lv-gold/70" />
          <span className="w-2 h-2 bg-lv-gold/80 rotate-45" />
          <span className="w-16 h-[1px] bg-lv-gold/70" />
        </div>
      </div>

      {/* 3-Panel Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[2px] md:gap-0">
        {panels.map((panel, i) => (
          <Link
            key={i}
            to={panel.link}
            className="group relative block overflow-hidden"
          >
            {/* Image */}
            <div className="aspect-[3/4] md:aspect-[4/5] overflow-hidden">
              <img
                src={panel.image}
                alt={panel.alt}
                className="w-full h-full object-cover object-center transition-transform duration-[1.2s] ease-out group-hover:scale-105"
              />
            </div>

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

            {/* Text overlay – pinned to bottom */}
            <div className="absolute inset-x-0 bottom-0 p-5 md:p-8">
              <h3 className="font-serif text-xl md:text-2xl lg:text-3xl text-white leading-tight tracking-wide">
                {panel.title}
              </h3>
              <p className="font-serif text-xl md:text-2xl lg:text-3xl text-lv-gold leading-tight tracking-wide">
                {panel.subtitle}
              </p>
              {/* Underline reveal on hover */}
              <div className="mt-4 flex items-center gap-2 opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
                <span className="text-[11px] tracking-[0.25em] uppercase text-white/80">Shop Now</span>
                <span className="w-5 h-[1px] bg-lv-gold inline-block" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default GenderCollectionSection;