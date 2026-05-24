import React from 'react';

function Banner(props) {
    return (
        <section className="banner" style={{top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 0}}  >
          
            <iframe 
                src="https://codewithsharu.github.io/hero-aic/collection.html" 
                title="" 
                style={{ width: '100%', height: '100%', border: 'none' }} 
                allowFullScreen
            />
        </section>
    );
}

export default Banner;