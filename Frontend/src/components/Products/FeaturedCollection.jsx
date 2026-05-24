import React from 'react';
import { Link } from 'react-router-dom';

/* ─── Inline SVG illustrations ─────────────────────────────────────── */

const EarringsSVG = () => (
  <svg viewBox="0 0 180 198" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
    <rect width="180" height="198" fill="#e8d8c0"/>
    <ellipse cx="90" cy="60" rx="26" ry="26" fill="#f5e6c8" stroke="#c9a97a" strokeWidth="1"/>
    <ellipse cx="90" cy="60" rx="20" ry="20" fill="#d4a855"/>
    <ellipse cx="90" cy="60" rx="11" ry="11" fill="#f0c76e"/>
    <ellipse cx="90" cy="60" rx="5" ry="5" fill="#fff8e8"/>
    <ellipse cx="86" cy="56" rx="2" ry="2" fill="white" opacity="0.7"/>
    <rect x="88" y="86" width="4" height="22" rx="2" fill="#c9a97a"/>
    <ellipse cx="90" cy="116" rx="10" ry="10" fill="#f5e6c8" stroke="#c9a97a" strokeWidth="0.8"/>
    <ellipse cx="90" cy="116" rx="7" ry="7" fill="#d4a855"/>
    <ellipse cx="90" cy="116" rx="3.5" ry="3.5" fill="#f0c76e"/>
    <ellipse cx="88.5" cy="114.5" rx="1.2" ry="1.2" fill="white" opacity="0.7"/>
    <rect x="87.5" y="126" width="2.5" height="10" rx="1.2" fill="#c9a97a"/>
    <ellipse cx="89" cy="140" rx="7" ry="12" fill="#f5e6c8" stroke="#c9a97a" strokeWidth="0.7"/>
    <ellipse cx="89" cy="140" rx="4.5" ry="8.5" fill="#d4a855"/>
    <ellipse cx="87.5" cy="137" rx="1.5" ry="1.5" fill="white" opacity="0.6"/>
    <circle cx="62" cy="148" r="5" fill="#f5f0e8" stroke="#c9a97a" strokeWidth="0.5"/>
    <circle cx="62" cy="148" r="2.5" fill="white" opacity="0.6"/>
    <circle cx="118" cy="155" r="4" fill="#f5f0e8" stroke="#c9a97a" strokeWidth="0.5"/>
    <circle cx="50" cy="162" r="3" fill="#f5f0e8" stroke="#c9a97a" strokeWidth="0.5"/>
    <circle cx="130" cy="138" r="3.5" fill="#f5f0e8" stroke="#c9a97a" strokeWidth="0.5"/>
    <circle cx="45" cy="130" r="4.5" fill="#f5f0e8" stroke="#c9a97a" strokeWidth="0.5"/>
    <circle cx="135" cy="170" r="3" fill="#f5f0e8" stroke="#c9a97a" strokeWidth="0.5"/>
  </svg>
);

const ChokersSVG = () => (
  <svg viewBox="0 0 180 198" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
    <rect width="180" height="198" fill="#e8d8c0"/>
    <path d="M22 90 Q90 72 158 90 Q158 108 90 112 Q22 108 22 90Z" fill="#c9903a" stroke="#a06820" strokeWidth="0.8"/>
    <ellipse cx="90" cy="91" rx="10" ry="9" fill="#f5e6c8" stroke="#a06820" strokeWidth="0.8"/>
    <ellipse cx="90" cy="91" rx="7" ry="6.5" fill="#e8c56a"/>
    <ellipse cx="90" cy="91" rx="4" ry="3.8" fill="#fff8e8"/>
    <ellipse cx="88.5" cy="89.5" rx="1.5" ry="1.5" fill="white" opacity="0.75"/>
    <ellipse cx="68" cy="93" rx="8.5" ry="8" fill="#f5e6c8" stroke="#a06820" strokeWidth="0.8"/>
    <ellipse cx="68" cy="93" rx="6" ry="5.5" fill="#e8c56a"/>
    <ellipse cx="68" cy="93" rx="3.2" ry="3" fill="#fff8e8"/>
    <ellipse cx="112" cy="93" rx="8.5" ry="8" fill="#f5e6c8" stroke="#a06820" strokeWidth="0.8"/>
    <ellipse cx="112" cy="93" rx="6" ry="5.5" fill="#e8c56a"/>
    <ellipse cx="112" cy="93" rx="3.2" ry="3" fill="#fff8e8"/>
    <ellipse cx="47" cy="98" rx="7" ry="6.5" fill="#f5e6c8" stroke="#a06820" strokeWidth="0.7"/>
    <ellipse cx="47" cy="98" rx="5" ry="4.5" fill="#e8c56a"/>
    <ellipse cx="133" cy="98" rx="7" ry="6.5" fill="#f5e6c8" stroke="#a06820" strokeWidth="0.7"/>
    <ellipse cx="133" cy="98" rx="5" ry="4.5" fill="#e8c56a"/>
    <circle cx="90" cy="113" r="5.5" fill="#f5f0e8" stroke="#c9a97a" strokeWidth="0.5"/>
    <circle cx="77" cy="115" r="4.8" fill="#f5f0e8" stroke="#c9a97a" strokeWidth="0.5"/>
    <circle cx="103" cy="115" r="4.8" fill="#f5f0e8" stroke="#c9a97a" strokeWidth="0.5"/>
    <circle cx="65" cy="112" r="4.2" fill="#f5f0e8" stroke="#c9a97a" strokeWidth="0.5"/>
    <circle cx="115" cy="112" r="4.2" fill="#f5f0e8" stroke="#c9a97a" strokeWidth="0.5"/>
    <line x1="90" y1="118" x2="90" y2="132" stroke="#c9a97a" strokeWidth="0.8"/>
    <ellipse cx="90" cy="138" rx="5" ry="8" fill="#f5e6c8" stroke="#c9a97a" strokeWidth="0.7"/>
    <ellipse cx="90" cy="138" rx="3.2" ry="5.5" fill="#d4a855"/>
    <ellipse cx="88.8" cy="135" rx="1.2" ry="1.2" fill="white" opacity="0.65"/>
    <line x1="77" y1="120" x2="77" y2="131" stroke="#c9a97a" strokeWidth="0.7"/>
    <ellipse cx="77" cy="136" rx="4" ry="6.5" fill="#f5e6c8" stroke="#c9a97a" strokeWidth="0.6"/>
    <ellipse cx="77" cy="136" rx="2.6" ry="4.5" fill="#d4a855"/>
    <line x1="103" y1="120" x2="103" y2="131" stroke="#c9a97a" strokeWidth="0.7"/>
    <ellipse cx="103" cy="136" rx="4" ry="6.5" fill="#f5e6c8" stroke="#c9a97a" strokeWidth="0.6"/>
    <ellipse cx="103" cy="136" rx="2.6" ry="4.5" fill="#d4a855"/>
    <circle cx="35" cy="155" r="5" fill="#f5f0e8" stroke="#c9a97a" strokeWidth="0.4" opacity="0.7"/>
    <circle cx="145" cy="148" r="4" fill="#f5f0e8" stroke="#c9a97a" strokeWidth="0.4" opacity="0.7"/>
  </svg>
);

const BridalSetsSVG = () => (
  <svg viewBox="0 0 180 198" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
    <rect width="180" height="198" fill="#e8d8c0"/>
    <path d="M32 78 Q90 58 148 78 Q148 92 90 96 Q32 92 32 78Z" fill="#c9903a" stroke="#a06820" strokeWidth="0.7"/>
    <ellipse cx="90" cy="78" rx="8" ry="7.5" fill="#f5e6c8" stroke="#a06820" strokeWidth="0.7"/>
    <ellipse cx="90" cy="78" rx="5.5" ry="5" fill="#e8c56a"/>
    <ellipse cx="90" cy="78" rx="3" ry="2.8" fill="#fff8e8"/>
    <ellipse cx="89" cy="76.8" rx="1.1" ry="1.1" fill="white" opacity="0.75"/>
    <ellipse cx="73" cy="81" rx="7" ry="6.5" fill="#f5e6c8" stroke="#a06820" strokeWidth="0.7"/>
    <ellipse cx="73" cy="81" rx="4.8" ry="4.5" fill="#e8c56a"/>
    <ellipse cx="107" cy="81" rx="7" ry="6.5" fill="#f5e6c8" stroke="#a06820" strokeWidth="0.7"/>
    <ellipse cx="107" cy="81" rx="4.8" ry="4.5" fill="#e8c56a"/>
    <ellipse cx="57" cy="85" rx="6" ry="5.5" fill="#f5e6c8" stroke="#a06820" strokeWidth="0.6"/>
    <ellipse cx="57" cy="85" rx="4" ry="3.7" fill="#e8c56a"/>
    <ellipse cx="123" cy="85" rx="6" ry="5.5" fill="#f5e6c8" stroke="#a06820" strokeWidth="0.6"/>
    <ellipse cx="123" cy="85" rx="4" ry="3.7" fill="#e8c56a"/>
    <circle cx="90" cy="97" r="5" fill="#f5f0e8" stroke="#c9a97a" strokeWidth="0.5"/>
    <circle cx="79" cy="99" r="4.3" fill="#f5f0e8" stroke="#c9a97a" strokeWidth="0.5"/>
    <circle cx="101" cy="99" r="4.3" fill="#f5f0e8" stroke="#c9a97a" strokeWidth="0.5"/>
    <line x1="90" y1="102" x2="90" y2="114" stroke="#c9a97a" strokeWidth="0.8"/>
    <path d="M80 122 Q90 112 100 122 Q100 134 90 138 Q80 134 80 122Z" fill="#f5e6c8" stroke="#c9a97a" strokeWidth="0.8"/>
    <path d="M83 124 Q90 116 97 124 Q97 132 90 135 Q83 132 83 124Z" fill="#d4a855"/>
    <ellipse cx="90" cy="126" rx="3.5" ry="3" fill="#fff8e8"/>
    <ellipse cx="89" cy="124.8" rx="1.4" ry="1.4" fill="white" opacity="0.7"/>
    <ellipse cx="142" cy="148" rx="8" ry="8" fill="#f5e6c8" stroke="#c9a97a" strokeWidth="0.7"/>
    <ellipse cx="142" cy="148" rx="5.5" ry="5.5" fill="#d4a855"/>
    <ellipse cx="142" cy="148" rx="3" ry="3" fill="#f0c76e"/>
    <ellipse cx="140.8" cy="146.8" rx="1.2" ry="1.2" fill="white" opacity="0.7"/>
    <line x1="142" y1="156" x2="142" y2="164" stroke="#c9a97a" strokeWidth="0.7"/>
    <ellipse cx="142" cy="170" rx="4.5" ry="7" fill="#f5e6c8" stroke="#c9a97a" strokeWidth="0.6"/>
    <ellipse cx="142" cy="170" rx="2.8" ry="4.8" fill="#d4a855"/>
    <ellipse cx="38" cy="152" rx="7" ry="7" fill="#f5e6c8" stroke="#c9a97a" strokeWidth="0.7"/>
    <ellipse cx="38" cy="152" rx="4.8" ry="4.8" fill="#d4a855"/>
    <ellipse cx="38" cy="152" rx="2.5" ry="2.5" fill="#f0c76e"/>
    <line x1="38" y1="159" x2="38" y2="167" stroke="#c9a97a" strokeWidth="0.7"/>
    <ellipse cx="38" cy="173" rx="4" ry="6.5" fill="#f5e6c8" stroke="#c9a97a" strokeWidth="0.6"/>
    <ellipse cx="38" cy="173" rx="2.5" ry="4.3" fill="#d4a855"/>
    <circle cx="60" cy="160" r="4.5" fill="#f5f0e8" stroke="#c9a97a" strokeWidth="0.4" opacity="0.75"/>
    <circle cx="120" cy="165" r="3.5" fill="#f5f0e8" stroke="#c9a97a" strokeWidth="0.4" opacity="0.75"/>
  </svg>
);

const LocketsSVG = () => (
  <svg viewBox="0 0 180 198" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
    <rect width="180" height="198" fill="#e8d8c0"/>
    <rect x="48" y="52" width="84" height="84" rx="20" fill="#f7e6d8" stroke="#c9a97a" strokeWidth="0.9"/>
    <circle cx="90" cy="94" r="18" fill="#e8c56a"/>
    <circle cx="90" cy="94" r="9" fill="#fff8e8"/>
    <ellipse cx="90" cy="132" rx="8" ry="12" fill="#f5e6c8" stroke="#c9a97a" strokeWidth="0.6"/>
    <circle cx="60" cy="150" r="4" fill="#f5f0e8" stroke="#c9a97a" strokeWidth="0.4"/>
    <circle cx="120" cy="150" r="4" fill="#f5f0e8" stroke="#c9a97a" strokeWidth="0.4"/>
  </svg>
);

const BraceletsSVG = () => (
  <svg viewBox="0 0 180 198" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
    <rect width="180" height="198" fill="#e8d8c0"/>
    <ellipse cx="90" cy="84" rx="68" ry="24" fill="#f7e6d8" stroke="#c9a97a" strokeWidth="0.9"/>
    <ellipse cx="90" cy="84" rx="36" ry="12" fill="#e8c56a"/>
    <ellipse cx="90" cy="110" rx="10" ry="18" fill="#f5e6c8" stroke="#c9a97a" strokeWidth="0.6"/>
    <circle cx="54" cy="138" r="4" fill="#f5f0e8" stroke="#c9a97a" strokeWidth="0.4"/>
    <circle cx="126" cy="138" r="4" fill="#f5f0e8" stroke="#c9a97a" strokeWidth="0.4"/>
  </svg>
);

/* ─── Corner accent component ───────────────────────────────────────── */
const CornerAccents = () => (
  <>
    {['tl','tr','bl','br'].map(pos => (
      <span key={pos} style={{
        position: 'absolute',
        width: 14, height: 14,
        ...(pos.includes('t') ? { top: 8 } : { bottom: 8 }),
        ...(pos.includes('l') ? { left: 8 } : { right: 8 }),
        borderTop: pos.includes('t') ? '1px solid #c9a97a' : 'none',
        borderBottom: pos.includes('b') ? '1px solid #c9a97a' : 'none',
        borderLeft: pos.includes('l') ? '1px solid #c9a97a' : 'none',
        borderRight: pos.includes('r') ? '1px solid #c9a97a' : 'none',
      }} />
    ))}
  </>
);

/* ─── Styles injected once ──────────────────────────────────────────── */
const styles = `
  @media (max-width: 640px) {
    .featured-cards-grid {
      display: flex !important;
      flex-direction: row !important;
      justify-content: center !important;
      gap: 1.25rem !important;
    }
    .featured-card-link {
      flex: 0 0 auto !important;
      width: auto !important;
    }
    .featured-card-wrap {
      border-radius: 9999px !important;
      box-shadow: 0 2px 16px rgba(90,55,20,0.10) !important;
    }
    .featured-card-image {
      width: 96px !important;
      height: 96px !important;
      aspect-ratio: 1 / 1 !important;
      border-radius: 9999px !important;
      border: 1.5px solid #c9a97a !important;
      overflow: hidden !important;
    }
    .featured-card-footer {
      background: transparent !important;
      border-top: none !important;
      padding: 8px 4px 0 !important;
    }
    .featured-card-explore {
      display: none !important;
    }
    .featured-card-divider {
      display: none !important;
    }
    .featured-card-title {
      font-size: 10px !important;
      letter-spacing: 0.18em !important;
    }
    .featured-card-corner-accents {
      display: none !important;
    }
    .featured-card-hover-overlay {
      border-radius: 9999px !important;
    }
  }
`;

/* ─── Card component ────────────────────────────────────────────────── */
const FeaturedCard = ({ title, slug, SvgIllustration, folderName }) => {
  const [hovered, setHovered] = React.useState(false);
  const [useInline, setUseInline] = React.useState(false);

  return (
    <Link
      to={`/collections/${slug}`}
      className="featured-card-link"
      style={{ display: 'block', textDecoration: 'none' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="featured-card-wrap"
        style={{
          borderRadius: 4,
          overflow: 'hidden',
          background: '#f0e6d8',
          boxShadow: hovered
            ? '0 10px 32px rgba(90,55,20,0.14)'
            : '0 2px 20px rgba(90,55,20,0.08)',
          transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
          transition: 'transform 0.35s ease, box-shadow 0.35s ease',
        }}
      >
        {/* Image area */}
        <div
          className="featured-card-image"
          style={{ width: '100%', aspectRatio: '1 / 1.1', position: 'relative', overflow: 'hidden' }}
        >
          {!useInline ? (
            <img
              src={`/assets/collections/${folderName}/cover.png`}
              alt={`${title} illustration`}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              onError={(e) => {
                const img = e.currentTarget;
                img.onerror = null;
                if (img.src.endsWith('.png')) {
                  img.src = img.src.replace(/\.png$/, '.svg');
                } else {
                  setUseInline(true);
                }
              }}
            />
          ) : (
            <SvgIllustration />
          )}

          {/* Hover overlay */}
          <div
            className="featured-card-hover-overlay"
            style={{
              position: 'absolute', inset: 0,
              background: 'rgba(43,29,18,0.12)',
              opacity: hovered ? 1 : 0,
              transition: 'opacity 0.35s ease',
            }}
          />
          <span className="featured-card-corner-accents">
            <CornerAccents />
          </span>
        </div>

        {/* Footer */}
        <div
          className="featured-card-footer"
          style={{
            padding: '14px 12px 16px',
            textAlign: 'center',
            background: '#f0e6d8',
            borderTop: '0.5px solid #d9c5a8',
          }}
        >
          <p
            className="featured-card-title"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: '0.22em',
              color: '#2b1d12',
              textTransform: 'uppercase',
              margin: '0 0 6px',
            }}
          >
            {title}
          </p>
          <p
            className="featured-card-explore"
            style={{
              fontFamily: "'Montserrat', sans-serif",
              fontSize: 8.5,
              letterSpacing: '0.28em',
              color: '#b8945a',
              textTransform: 'uppercase',
              fontWeight: 500,
              margin: '0 0 6px',
            }}
          >
            Explore
          </p>
          <div
            className="featured-card-divider"
            style={{
              height: 0.5,
              background: '#b8945a',
              width: hovered ? '100%' : 28,
              margin: '0 auto',
              transition: 'width 0.4s ease',
            }}
          />
        </div>
      </div>
    </Link>
  );
};

/* ─── Main component ────────────────────────────────────────────────── */
const FeaturedCollection = () => {
  const cards = [
    { title: 'Earrings',  slug: 'earrings',  SvgIllustration: EarringsSVG,  folderName: 'Earrings'  },
    { title: 'Lockets',   slug: 'lockets',   SvgIllustration: LocketsSVG,   folderName: 'Lockets'   },
    { title: 'Bracelets', slug: 'bracelets', SvgIllustration: BraceletsSVG, folderName: 'Bracelets' },
  ];

  return (
    <>
      {/* Google Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=Montserrat:wght@300;400;500;600&display=swap"
        rel="stylesheet"
      />

      {/* Mobile circle styles */}
      <style>{styles}</style>

      <section style={{ background: '#f9f3ec', padding: '3rem 2rem', fontFamily: "'Montserrat', sans-serif" }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>

          {/* Header */}
          <div className="text-center mb-8">
            <p className="text-xs tracking-[0.3em] uppercase text-lv-gold mb-2">Handcrafted Excellence</p>
            <h2 className="font-serif text-2xl md:text-4xl text-lv-dark tracking-wide">Featured Collection</h2>
            <div className="mt-4 mb-10 flex items-center justify-center gap-3">
              <span className="w-16 h-[1px] bg-lv-gold/70" />
              <span className="w-2 h-2 bg-lv-gold/80 rotate-45" />
              <span className="w-16 h-[1px] bg-lv-gold/70" />
            </div>
          </div>

          {/* Cards grid */}
          <div
            className="featured-cards-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {cards.map(card => (
              <FeaturedCard key={card.slug} {...card} />
            ))}
          </div>

        </div>
      </section>
    </>
  );
};

export default FeaturedCollection;