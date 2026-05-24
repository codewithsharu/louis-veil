import React from 'react';
import middleBanner from '../../assets/banner/middlebanner.png';

const MiddleAttractionBanner = () => {
  return (
    <section className="py-10 md:py-14 bg-lv-cream/30">
      <div className="w-full border-y border-lv-dark/10 bg-white">
        <img
          src={middleBanner}
          alt="Louis Veil showcase banner"
          className="w-full h-auto max-h-[80vh] object-contain block"
        />
      </div>
    </section>
  );
};

export default MiddleAttractionBanner;
