import React from "react";
import { FiBookmark, FiHeart, FiMessageCircle, FiMoreHorizontal, FiSend } from "react-icons/fi";
import profileAvatar from "../../assets/logo.png";
import post1 from "../../assets/hero1.png";
import post2 from "../../assets/hero2.png";
import post3 from "../../assets/hero3.png";
import post4 from "../../assets/hero4.png";
import post5 from "../../assets/featured.webp";
import post6 from "../../assets/mens-collection.webp";
import post7 from "../../assets/womens-collection.webp";
import post8 from "../../assets/thrift.jpg";
import post9 from "../../assets/hero/banner-01.png";

const posts = [
  {
    id: "A102",
    image: post1,
    caption: "City tailoring with a soft midnight edge.",
  },
  {
    id: "A103",
    image: post2,
    caption: "Weekend edit: clean layers, confident details.",
  },
  {
    id: "A104",
    image: post3,
    caption: "Statement outerwear for long evenings.",
  },
  {
    id: "A105",
    image: post4,
    caption: "The gold-hour fit check.",
  },
  {
    id: "A106",
    image: post5,
    caption: "Modern silhouettes, timeless mood.",
  },
  {
    id: "A107",
    image: post6,
    caption: "Menswear drop: precise cuts and premium finish.",
  },
  {
    id: "A108",
    image: post7,
    caption: "Womenswear curated in soft, elevated tones.",
  },
  {
    id: "A109",
    image: post8,
    caption: "Thrift stories, reimagined for now.",
  },
  {
    id: "A110",
    image: post9,
    caption: "A gallery of signature pieces from the house.",
  },
];

const LouisVeilFeed = () => {
  return (
    <section className="min-h-screen bg-[#fafafa] pt-28 pb-24 px-0 md:px-4">
      <div className="max-w-[640px] mx-auto">
        <div className="bg-white border-y md:border md:rounded-xl md:mt-4 overflow-hidden">
          <div className="px-4 py-4 flex items-center gap-3">
            <img
              src={profileAvatar}
              alt="Louis Veil profile"
              className="w-14 h-14 rounded-full object-contain bg-white p-1.5 border border-gray-200"
            />
            <div>
              <p className="font-semibold text-[15px] text-[#1f1f1f] leading-tight">louisveil</p>
              <p className="text-xs text-gray-500 leading-tight">Official House Account</p>
            </div>
          </div>
          <div className="px-4 pb-4 text-sm text-[#262626] leading-relaxed">
            Premium static community feed by Louis Veil.
          </div>
        </div>

        <div className="mt-3 space-y-3">
          {posts.map((post, index) => (
            <article key={post.id} className="bg-white border-y md:border md:rounded-xl overflow-hidden">
              <header className="h-14 px-4 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={profileAvatar}
                    alt="Louis Veil avatar"
                    className="w-8 h-8 rounded-full object-contain bg-white p-1 border border-gray-200"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#1f1f1f] truncate">louisveil</p>
                    <p className="text-[11px] text-gray-500 truncate">Lookbook Drop {post.id}</p>
                  </div>
                </div>
                <button type="button" aria-label="More post options" className="text-[#262626]">
                  <FiMoreHorizontal size={18} />
                </button>
              </header>

              <div className="aspect-square bg-[#efefef]">
                <img
                  src={post.image}
                  alt={`Louis Veil post ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="px-4 pt-3 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-4 text-[#1f1f1f]">
                    <button type="button" aria-label="Like post" className="hover:opacity-60 transition-opacity">
                      <FiHeart size={22} />
                    </button>
                    <button type="button" aria-label="Comment on post" className="hover:opacity-60 transition-opacity">
                      <FiMessageCircle size={22} />
                    </button>
                    <button type="button" aria-label="Share post" className="hover:opacity-60 transition-opacity">
                      <FiSend size={20} />
                    </button>
                  </div>
                  <button type="button" aria-label="Save post" className="text-[#1f1f1f] hover:opacity-60 transition-opacity">
                    <FiBookmark size={20} />
                  </button>
                </div>

                <p className="text-sm text-[#1f1f1f] mt-1 leading-relaxed">
                  <span className="font-semibold mr-1">louisveil</span>
                  {post.caption}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LouisVeilFeed;
