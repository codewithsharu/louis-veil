import React, { useEffect, useRef, useState } from 'react';
import { FaFilter } from 'react-icons/fa';
import FilterSidebar from '../components/Products/FilterSidebar';
import SortOptions from '../components/Products/SortOptions';
import ProductGrid from '../components/Products/ProductGrid';
import { useParams, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProductsByFilters } from '../redux/slices/productSlice';
import FeaturedThrift from '../components/Products/FeaturedThrift';

const SIDEBAR_WIDTH = 250; // px

const ThriftStore = () => {
    const { collection } = useParams();
    const [searchParams] = useSearchParams();
    const dispatch = useDispatch();
    
    const { products, loading, error } = useSelector((state) => state.products);
    const queryParams = Object.fromEntries([...searchParams]);
    
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const sidebarRef = useRef(null);

    useEffect(() => {
        // console.log("Fetching products with:", { collection, ...queryParams });
        dispatch(fetchProductsByFilters({ collection, ...queryParams }));
    }, [dispatch, collection, JSON.stringify(queryParams)]);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const handleClickOutside = (e) => {
        if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
            setIsSidebarOpen(false);
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filter products to only those with thrift === true
    const thriftProducts = Array.isArray(products)
        ? products.filter((product) => product && product.thrift === true)
        : [];

    return (
        <div className="flex flex-col lg:flex-row">
            <button
                onClick={toggleSidebar}
                className="lg:hidden border p-2 flex justify-center items-center"
                style={{ width: '100%' }}
            >
                <FaFilter className="mr-2" /> Filters
            </button>

            {/* Sidebar */}



       




            {/* Main Content */}
            <div
                className="flex-grow p-4"
                style={{
                    marginLeft: 0,
                }}
            >
                <div className="mb-6">
                  <p className="text-xs tracking-[0.3em] uppercase text-lv-gold mb-1">Preowned</p>
                  <h2 className="font-serif text-2xl md:text-3xl text-lv-dark tracking-wide">Thrift Store</h2>
                  <div className="w-10 h-[1px] bg-lv-gold mt-3" />
                </div>
                <FeaturedThrift />

                <SortOptions />
                
                {loading ? (
                    <p>Loading products...</p>
                ) : error ? (
                    <p className="text-red-500">Error: {error}</p>
                ) : thriftProducts.length > 0 ? (
                    <ProductGrid products={thriftProducts} loading={loading} error={error} />
                ) : (
                    <p>No products found.</p>
                )}
            </div>
        </div>
    );
};

export default ThriftStore;
