import React from 'react';

import team1 from '../../assets/hero/1.gif';
import team2 from '../../assets/hero/2.gif';
import team3 from '../../assets/hero/3.gif';
import team4 from '../../assets/hero/4.gif';
import team5 from '../../assets/hero/5.gif';

// This component previously attempted to use inline JS-in-CSS for advanced animation and responsive styles.
// If you are seeing an error, it is likely because the <style> tag is not closed or is malformed, or because
// advanced CSS-in-JS syntax (like media queries and pseudo-classes) is not supported in plain JS objects.
// We'll rewrite this to use a regular CSS class-based approach and fix the <style> tag.

function Team() {
    // Array of team images for the slider
    const teamImages = [
        team1, team2, team3, team4, team5, team1, team2, team3, team1, // 9x team1 for the loop
        team2, team3, team4, team5
    ];

    return (
        <section className="cs_history" id="portfolio" style={{ position: 'relative', overflow: 'hidden', background: 'white', marginTop: '20px' }}>
            <div className="cs_slider_wrapper">
                {teamImages.map((img, i) => (
                    <div key={i} className="cs_slide">
                        <div className="cs_card">
                            <img src={img} alt={`Card Thumbnail ${i + 1}`} className="cs_image" />
                        </div>
                    </div>
                ))}
            </div>
            {/* Animation and responsive styles */}
            <style>{`
                .cs_slider_wrapper {
                    display: flex;
                    transition: transform 0.6s ease;
                    animation: slide 10s linear infinite;
                }
                .cs_slider_wrapper:hover {
                    animation-play-state: paused;
                }
                .cs_slider_wrapper:not(:hover) {
                    animation-play-state: running;
                }
                @keyframes slide {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                @media (max-width: 768px) {
                    .cs_slider_wrapper {
                        animation: slideMobile 8s linear infinite;
                    }
                    @keyframes slideMobile {
                        0% { transform: translateX(0); }
                        100% { transform: translateX(-60%); }
                    }
                }
                .cs_slide {
                    flex: 0 0 auto;
                    padding: 0 12px;
                    width: 250px;
                }
                @media (max-width: 768px) {
                    .cs_slide {
                        padding: 0 1px;
                        width: 200px;
                    }
                }
                .cs_card {
                    border-radius: 20px;
                    overflow: hidden;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
                }
                @media (max-width: 768px) {
                    .cs_card {
                        transform: scale(0.9);
                    }
                }
                .cs_image {
                    width: 100%;
                    height: 400px;
                    display: block;
                    transition: transform 0.3s ease;
                }
                .cs_image:hover {
                    transform: scale(1.05);
                }
                @media (max-width: 768px) {
                    .cs_image {
                        max-width: 100%;
                        height: 300px;
                    }
                }
            `}</style>
        </section>
    );
}

export default Team;