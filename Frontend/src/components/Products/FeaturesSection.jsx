// import React from 'react';
// import { GiDiamondRing } from 'react-icons/gi';
// import { LuFeather } from 'react-icons/lu';
// import { BsStars } from 'react-icons/bs';
// import { HiOutlineShieldCheck } from 'react-icons/hi2';

// const features = [
//   { icon: <GiDiamondRing />, title: 'Premium\nFinish' },
//   { icon: <LuFeather />, title: 'Lightweight\nComfort' },
//   { icon: <BsStars />, title: 'Tarnish\nResistant' },
//   { icon: <HiOutlineShieldCheck />, title: 'Handpicked\nDesigns' },
// ];

// const FeaturesSection = () => {
//   return (
//     <section style={{ background: '#faf7f2' }}>
//       <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
//         <div className="text-center mb-6">
//           <p className="text-xs tracking-[0.3em] uppercase text-lv-gold mb-2">Why Choose Us</p>
//           <h2 className="font-serif text-2xl md:text-4xl text-lv-dark tracking-wide">Why Louis Veil</h2>
//           <div className="mt-4 flex items-center justify-center gap-3">
//             <span className="w-16 h-[1px] bg-lv-gold/70" />
//             <span className="flex items-center justify-center text-lv-gold" aria-hidden="true">
//               <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
//                 <path d="M6 0L12 6L6 12L0 6L6 0Z" fill="currentColor" />
//               </svg>
//             </span>
//             <span className="w-16 h-[1px] bg-lv-gold/70" />
//           </div>
//         </div>

//         <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0">
//           {features.map((f, i) => (
//             <div
//               key={i}
//               className={`flex flex-col items-center justify-center py-6 text-center md:py-8 ${i < features.length - 1 ? 'md:border-r md:border-[#e6dccc]' : ''}`}
//             >
//               <div className="text-[#b8972e] text-3xl mb-3">
//                 {React.cloneElement(f.icon, { className: 'inline-block' })}
//               </div>
//               <p className="text-[11px] tracking-widest uppercase text-[#4a3a1e] font-medium leading-snug whitespace-pre-line">
//                 {f.title}
//               </p>
//             </div>
//           ))}
//         </div>
//       </div>
//     </section>
//   );
// };

// export default FeaturesSection;



import React from 'react';

const features = [
  {
    icon: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <polygon points="18,4 28,12 24,28 12,28 8,12" fill="none" stroke="#b8924a" strokeWidth="1.5" strokeLinejoin="round"/>
        <line x1="8" y1="12" x2="28" y2="12" stroke="#b8924a" strokeWidth="1.2"/>
        <line x1="8" y1="12" x2="18" y2="4" stroke="#b8924a" strokeWidth="1.2"/>
        <line x1="28" y1="12" x2="18" y2="4" stroke="#b8924a" strokeWidth="1.2"/>
        <line x1="13" y1="12" x2="12" y2="28" stroke="#b8924a" strokeWidth="1"/>
        <line x1="23" y1="12" x2="24" y2="28" stroke="#b8924a" strokeWidth="1"/>
      </svg>
    ),
    title: 'Premium\nFinish',
  },
  {
    icon: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <path d="M18 6 C14 10 10 16 12 22 C13 26 16 28 18 30 C20 28 23 26 24 22 C26 16 22 10 18 6Z" fill="none" stroke="#b8924a" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M18 30 L18 6" stroke="#b8924a" strokeWidth="1" strokeDasharray="2,2"/>
        <path d="M12 22 C14 20 16 21 18 22 C20 23 22 22 24 20" fill="none" stroke="#b8924a" strokeWidth="1"/>
      </svg>
    ),
    title: 'Lightweight\nComfort',
  },
  {
    icon: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <path d="M18 8 L20 14 L14 14" stroke="#b8924a" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="23" cy="13" r="2.5" fill="none" stroke="#b8924a" strokeWidth="1.3"/>
        <circle cx="13" cy="23" r="2.5" fill="none" stroke="#b8924a" strokeWidth="1.3"/>
        <path d="M18 28 L16 22 L22 22" stroke="#b8924a" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10 18 L14 18" stroke="#b8924a" strokeWidth="1.3" strokeLinecap="round"/>
        <path d="M22 18 L26 18" stroke="#b8924a" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
    title: 'Tarnish\nResistant',
  },
  {
    icon: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <path d="M18 5 L22 9 L28 8 L27 14 L32 18 L27 22 L28 28 L22 27 L18 31 L14 27 L8 28 L9 22 L4 18 L9 14 L8 8 L14 9 Z" fill="none" stroke="#b8924a" strokeWidth="1.4" strokeLinejoin="round"/>
        <polyline points="13,18 16,21 23,14" fill="none" stroke="#b8924a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'Handpicked\nDesigns',
  },
];

const FeaturesSection = () => (
  <section
    style={{
      background: '#f5f0e8',
      padding: '1.5rem 1rem',
      textAlign: 'center',
      fontFamily: 'Georgia, serif',
    }}
  >
    <p
      style={{
        fontSize: 10,
        letterSpacing: '0.24em',
        color: '#b8924a',
        textTransform: 'uppercase',
        fontFamily: 'Arial, sans-serif',
        margin: '0 0 6px',
      }}
    >
      Why Choose Us
    </p>
    <h2
      style={{
        fontSize: 'clamp(18px, 5vw, 22px)',
        color: '#2a2118',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        margin: '0 0 10px',
        fontWeight: 400,
        lineHeight: 1.2,
      }}
    >
      Why Louis Veil
    </h2>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: '1.5rem' }}>
      <span style={{ width: 44, height: 1, background: '#b8924a', opacity: 0.7 }} />
      <span style={{ width: 7, height: 7, background: '#b8924a', transform: 'rotate(45deg)', display: 'inline-block' }} />
      <span style={{ width: 44, height: 1, background: '#b8924a', opacity: 0.7 }} />
    </div>
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '0.75rem',
        maxWidth: 980,
        margin: '0 auto',
      }}
    >
      {features.map((f, i) => (
        <div
          key={i}
          style={{
            padding: '1.1rem 0.85rem',
            border: '0.5px solid #d4c5a9',
            borderRadius: 12,
            background: 'rgba(255,255,255,0.2)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span style={{ width: 30, height: 30, display: 'grid', placeItems: 'center' }}>{f.icon}</span>
          <p
            style={{
              fontSize: 10,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: '#2a2118',
              fontFamily: 'Arial, sans-serif',
              fontWeight: 700,
              lineHeight: 1.45,
              textAlign: 'center',
              margin: 0,
              whiteSpace: 'pre-line',
            }}
          >
            {f.title}
          </p>
        </div>
      ))}
    </div>
  </section>
);

export default FeaturesSection;