import React, { useEffect, useState } from 'react';
import { Award, TrendingUp } from 'react-feather';
import GenderCollectionSection from '../components/Products/GenderCollectionSection';
import NewArrivals from '../components/Products/NewArrivals';
import ProductDetails from '../components/Products/ProductDetails';
import ProductGrid from '../components/Products/ProductGrid';
import FeaturedCollection from '../components/Products/FeaturedCollection';
import FeaturesSection from '../components/Products/FeaturesSection';
import CategoryStrip from '../components/Products/CategoryStrip';

import { useDispatch, useSelector } from 'react-redux';
import { fetchProductsByFilters } from '../redux/slices/productSlice';
import axios from 'axios';

import Hero from '../components/Layout/Hero';
import MiddleAttractionBanner from '../components/Layout/MiddleAttractionBanner';
import Testimonials from '../components/Common/Testimonials';
import Thriftstore from '../components/Common/Thrift';
import Team from '../components/portfolio/Team';
import CategoriesSection from '../components/Products/CategoriesSection';
const Home = () => {
  const dispatch = useDispatch();
  const { products, loading, error } = useSelector((state) => state.products);

  useEffect(() => {
    // Fetch products for the "Top Wears for Women's" section
    dispatch(
      fetchProductsByFilters({
        gender: 'Women',
        category: 'Top Wear',
        limit: 8,
      })
    );
  }, [dispatch]);

  return (
    <div className="min-h-screen">
      <Hero />
      <FeaturedCollection />
      {/* five category strips */}
      <CategoryStrip title="Earrings" folderName="Earrings" />
      <CategoryStrip title="Lockets" folderName="Lockets" />
      <CategoryStrip title="Bracelets" folderName="Bracelets" />
      <CategoryStrip title="Pendants" folderName="Pendants" />
      <CategoryStrip title="Combo" folderName="Combo" />
      {/* <Team /> */}
      {/* <GenderCollectionSection /> */}
      {/* <NewArrivals /> */}
      {/* <MiddleAttractionBanner /> */}
      {/* <Thriftstore /> */}
      {/* <CategoriesSection /> */}

    

      {/* Top Wears for Women's Section */}
      {/* <div className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-center gap-3 mb-8">
          <h2 className="text-3xl font-bold text-center">Top Wears for Women's</h2>
        </div>
        <ProductGrid products={products} loading={loading} error={error} />
      </div> */}

      <FeaturesSection />
      <CategoriesSection />
      <Testimonials />
    </div>
  );
};

export default Home;