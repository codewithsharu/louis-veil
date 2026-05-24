import React, { useState, useEffect, useCallback } from 'react';
import { Star, ChevronLeft, ChevronRight } from 'react-feather';

const testimonials = [
  {
    name: 'Priya Sharma',
    location: 'Mumbai',
    rating: 5,
    text: 'Amazing quality at such affordable prices! The fabric is super soft and the fit is exactly as described. Already ordered 3 more tees!',
    avatar: 'PS',
  },
  {
    name: 'Rahul Verma',
    location: 'Delhi',
    rating: 5,
    text: 'Best oversized tees I\'ve found online. The thrift store section is genius — got a branded jacket at 70% off. Highly recommend Louis Veil!',
    avatar: 'RV',
  },
  {
    name: 'Ananya Patel',
    location: 'Bangalore',
    rating: 4,
    text: 'Love the designs and the sustainable approach with the thrift store. Delivery was quick and packaging was neat. Will definitely shop again.',
    avatar: 'AP',
  },
  {
    name: 'Karthik Nair',
    location: 'Chennai',
    rating: 5,
    text: 'The graphic tees are fire! Got so many compliments. Quality rivals brands 3x the price. Louis Veil is now my go-to for casual wear.',
    avatar: 'KN',
  },
  {
    name: 'Sneha Reddy',
    location: 'Hyderabad',
    rating: 5,
    text: 'Ordered from the thrift collection and was blown away by the condition. Looks brand new! Great initiative and amazing customer service.',
    avatar: 'SR',
  },
];

const Testimonials = () => {
  const [current, setCurrent] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % testimonials.length);
  }, []);

  const prev = () => {
    setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(next, 4000);
    return () => clearInterval(timer);
  }, [isAutoPlaying, next]);

  return (
    <section className="bg-lv-cream py-10 md:py-14">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-xs tracking-[0.3em] uppercase text-lv-gold mb-2">Testimonials</p>
          <h2 className="font-serif text-2xl md:text-4xl text-lv-dark tracking-wide">What Our Customers Say</h2>
          <div className="mt-4 flex items-center justify-center gap-3">
            <span className="w-16 h-[1px] bg-lv-gold/70" />
            <span className="w-2 h-2 bg-lv-gold/80 rotate-45" />
            <span className="w-16 h-[1px] bg-lv-gold/70" />
          </div>
        </div>

        {/* Desktop: 3 cards, Mobile: single card carousel */}
        <div className="hidden md:grid md:grid-cols-3 gap-5">
          {testimonials.slice(0, 3).map((t, i) => (
            <TestimonialCard key={i} testimonial={t} />
          ))}
        </div>

        {/* Mobile Carousel */}
        <div
          className="md:hidden relative"
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(true)}
        >
          <TestimonialCard testimonial={testimonials[current]} />

          {/* Nav arrows */}
          <div className="flex justify-center items-center gap-4 mt-5">
            <button
              onClick={prev}
              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>

            <div className="flex gap-1.5">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === current ? 'bg-black w-5' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={next}
              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Desktop dots */}
        <div className="hidden md:flex justify-center gap-1.5 mt-6">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-black w-5' : 'bg-gray-300'}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

const TestimonialCard = ({ testimonial }) => {
  const { name, location, rating, text, avatar } = testimonial;

  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
      {/* Stars */}
      <div className="flex gap-0.5 mb-3">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-3.5 h-3.5 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}`}
          />
        ))}
      </div>

      {/* Quote */}
      <p className="text-sm text-gray-600 leading-relaxed mb-4">"{text}"</p>

      {/* Author */}
      <div className="flex items-center gap-3 pt-3 border-t border-gray-50">
        <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
          {avatar}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">{name}</p>
          <p className="text-xs text-gray-400">{location}</p>
        </div>
      </div>
    </div>
  );
};

export default Testimonials;
