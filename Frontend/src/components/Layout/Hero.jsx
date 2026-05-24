import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const slides = [
  {
    desktop: '/assets/banner/banner1/pc/pc.png',
    mobile: '/assets/banner/banner1/mobile/mobile.png',
    title: 'Timeless Beauty',
  },
  {
    desktop: '/assets/banner/banner2/pc/pc.png',
    mobile: '/assets/banner/banner2/mobile/mobile.png',
    title: 'Elegant Craftsmanship',
  },
];

const Hero = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative bg-[#f3e9dc]">

      {/* ── BANNER IMAGE AREA ── */}
      <div className="relative w-full h-[58vh] min-h-[360px] md:h-[calc(100vh-108px)] md:min-h-[560px] overflow-hidden">

        {/* Slides */}
        {slides.map((s, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-[1400ms] ease-in-out ${
              i === currentIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <picture>
              <source media="(min-width: 768px)" srcSet={s.desktop} />
              <img
                src={s.mobile}
                alt={s.title}
                className="w-full h-full object-cover"
                style={{
                  animation: i === currentIndex ? 'hero-fade 8s ease-out forwards' : 'none',
                }}
              />
            </picture>
          </div>
        ))}

        {/* ── DESKTOP BUTTONS — always bottom-left of banner ── */}
        <div className="absolute bottom-10 left-0 hidden md:flex px-8 lg:px-14 xl:px-16 z-10">
          <div className="flex flex-row gap-3">
            <Link to="/collections/all" className="lv-btn-primary">
              Shop Collection
            </Link>
            <Link to="/collections/all" className="lv-btn-ghost">
              View Lookbook <span className="lv-arrow">→</span>
            </Link>
          </div>
        </div>

      </div>

      {/* ── MOBILE CONTENT PANEL ── */}
      <div className="md:hidden">
        <div className="w-full relative -mt-20 sm:-mt-12 bg-[#f3e9dc] sm:rounded-t-[24px] pt-5 sm:pt-10 pb-10 shadow-[0_-8px_24px_rgba(36,28,20,0.06)]">
          <div className="pointer-events-none absolute -top-7 left-0 h-14 w-full rounded-t-[100%] bg-[#f3e9dc] sm:hidden" />
          <div className="mx-auto w-full max-w-xl px-6 text-center">
            <h1
              key={currentIndex}
              className="font-heading text-[#2b241c] text-4xl sm:text-5xl tracking-tight leading-[1.02] mb-4"
              style={{ animation: 'hero-text-up 0.9s cubic-bezier(0.25,0.46,0.45,0.94) both' }}
            >
              Timeless Beauty.
              <br />
              Effortless You.
            </h1>
            <p className="text-[#5c4d3b] text-base sm:text-lg leading-[1.6] max-w-lg mx-auto mb-6">
              Curated artificial jewellery crafted for modern elegance.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
              <Link to="/collections/all" className="lv-btn-primary w-full sm:w-auto">
                Shop Collection
              </Link>
              <Link to="/collections/all" className="lv-btn-ghost-beige w-full sm:w-auto justify-center">
                View Lookbook <span className="lv-arrow">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        /* ── Primary: deep dark with gold border glow ── */
        .lv-btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 13px 28px;
          background: #1c1209;
          color: #f5e6c8;
          font-size: 12px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          font-weight: 500;
          border-radius: 6px;
          border: 1px solid rgba(196,158,80,0.55);
          cursor: pointer;
          white-space: nowrap;
          text-decoration: none;
          box-shadow: inset 0 1px 0 rgba(255,220,120,0.12), 0 2px 12px rgba(0,0,0,0.35);
          transition: background 0.22s ease, border-color 0.22s ease, color 0.22s ease, box-shadow 0.22s ease;
        }
        .lv-btn-primary:hover {
          background: #2a1a0a;
          border-color: rgba(196,158,80,0.9);
          color: #ffd98a;
          box-shadow: inset 0 1px 0 rgba(255,220,120,0.2), 0 4px 20px rgba(0,0,0,0.4);
        }

        /* ── Ghost on image/dark banner: frosted white ── */
        .lv-btn-ghost {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 13px 28px;
          background: rgba(255,255,255,0.24);
          color: #111111;
          font-size: 12px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          font-weight: 500;
          border-radius: 6px;
          border: 1px solid rgba(255,255,255,0.42);
          cursor: pointer;
          white-space: nowrap;
          text-decoration: none;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.18);
          transition: background 0.22s ease, border-color 0.22s ease, color 0.22s ease;
        }
        .lv-btn-ghost:hover {
          background: rgba(255,255,255,0.36);
          border-color: rgba(255,255,255,0.62);
          color: #000000;
        }

        /* ── Ghost on beige mobile panel ── */
        .lv-btn-ghost-beige {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 13px 28px;
          background: rgba(255,255,255,0.24);
          color: #111111;
          font-size: 12px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          font-weight: 500;
          border-radius: 6px;
          border: 1px solid rgba(255,255,255,0.42);
          cursor: pointer;
          white-space: nowrap;
          text-decoration: none;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.14);
          transition: background 0.22s ease, border-color 0.22s ease;
        }
        .lv-btn-ghost-beige:hover {
          background: rgba(255,255,255,0.36);
          border-color: rgba(255,255,255,0.62);
          color: #000000;
        }

        .lv-arrow {
          font-size: 15px;
          display: inline-block;
          transition: transform 0.2s ease;
        }
        .lv-btn-primary:hover .lv-arrow,
        .lv-btn-ghost:hover .lv-arrow,
        .lv-btn-ghost-beige:hover .lv-arrow {
          transform: translateX(4px);
        }

        @keyframes hero-fade {
          from { opacity: 0.92; }
          to   { opacity: 1; }
        }
        @keyframes hero-text-up {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
};

export default Hero;