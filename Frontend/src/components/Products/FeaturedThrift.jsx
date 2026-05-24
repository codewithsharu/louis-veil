import React from 'react';
import { Link } from 'react-router-dom';
import featured from "../../assets/thrift.jpg";
import { ArrowRight, MessageCircle, TrendingUp, Clock } from 'react-feather';

const FeaturedThrift = () => {
  return (
    <section className="relative bg-lv-cream overflow-hidden">
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Image Side */}
          <div className="w-full md:w-1/2">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-black/20 group-hover:from-black/30 group-hover:to-black/10 transition-all duration-300" />
              <img 
                src={featured}
                alt="Sell your items with us"
                className="w-full h-[400px] object-cover transform group-hover:scale-[1.02] transition-transform duration-500"
              />
              <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-sm px-4 py-2 shadow-lg transform group-hover:translate-y-[-4px] transition-transform duration-300">
                <p className="text-sm font-semibold text-neutral-800 tracking-wider">Start Selling Today</p>
              </div>
            </div>
          </div>

          {/* Content Side */}
          <div className="w-full md:w-1/2 space-y-6 md:pl-8">
            <div>
              <h2 className="text-5xl font-serif font-bold mb-4 text-lv-dark">
                Want to Sell?
                <br />
                Join Our Platform
              </h2>
              <p className="text-base text-neutral-600 leading-relaxed">
                Turn your pre-loved items into cash! We provide a trusted platform 
                for selling your quality second-hand items to our community.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-5 h-5 text-lv-gold" />
                  <p className="text-2xl font-bold text-neutral-800">0%</p>
                </div>
                <p className="text-sm text-neutral-500">Commission Fee</p>
              </div>
              <div className="bg-white p-4 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-5 h-5 text-lv-gold" />
                  <p className="text-2xl font-bold text-neutral-800">24h</p>
                </div>
                <p className="text-sm text-neutral-500">Quick Response</p>
              </div>
            </div>

            <div className="space-y-4">
              <a 
                href="https://wa.me/917460935762"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between bg-lv-dark text-white px-6 py-3 hover:bg-lv-dark/90 transition-all duration-300 hover:shadow-lg w-full group tracking-wider uppercase"
              >
                <span className="text-base font-semibold">Contact on WhatsApp</span>
                <MessageCircle className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Background Decoration */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-lv-gold/10 rounded-full blur-3xl -z-10 opacity-50" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-lv-gold/5 rounded-full blur-3xl -z-10 opacity-50" />
    </section>
  );
};

export default FeaturedThrift;