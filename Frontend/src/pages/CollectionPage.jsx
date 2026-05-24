import React, { useEffect, useRef, useState } from 'react';
import { X } from 'react-feather';
import FilterSidebar from '../components/Products/FilterSidebar';
import SortOptions from '../components/Products/SortOptions';
import ProductGrid from '../components/Products/ProductGrid';
import { useParams, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProductsByFilters } from '../redux/slices/productSlice';

const SIDEBAR_WIDTH = 260;

const CollectionPage = () => {
    const { collection } = useParams();
    const [searchParams] = useSearchParams();
    const dispatch = useDispatch();
    const selectedCollection = collection || 'all';

    const { products, loading, error } = useSelector((state) => state.products);
    const queryParams = Object.fromEntries([...searchParams]);
    const normalizedQueryParams =
        queryParams.category?.toLowerCase() === 'collection'
            ? { ...queryParams, category: 'All' }
            : queryParams;

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const sidebarRef = useRef(null);
    const [topOffset, setTopOffset] = useState(0);
    const [isLarge, setIsLarge] = useState(
        typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
    );

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const update = () => {
            const navEl = document.querySelector('nav');
            setTopOffset(navEl ? Math.ceil(navEl.getBoundingClientRect().bottom) : 0);
            setIsLarge(window.innerWidth >= 1024);
        };
        update();
        window.addEventListener('resize', update);
        window.addEventListener('scroll', update);
        return () => {
            window.removeEventListener('resize', update);
            window.removeEventListener('scroll', update);
        };
    }, []);

    useEffect(() => {
        dispatch(fetchProductsByFilters({ collection: selectedCollection, ...normalizedQueryParams }));
    }, [dispatch, selectedCollection, JSON.stringify(normalizedQueryParams)]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
                setIsSidebarOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="flex flex-col lg:flex-row min-h-screen bg-white lg:pt-4">

            {/* ── Mobile filter/sort bar ── */}
            <div
                className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white z-30"
                style={{ position: 'sticky', top: topOffset + 'px' }}
            >

                {/* FILTER button */}
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="flex h-11 basis-0 flex-1 min-w-0 items-center justify-center gap-2 rounded-lg border-2 border-[#2a1a0e] bg-white px-4 text-xs font-bold uppercase tracking-[0.14em] text-[#2a1a0e]"
                >
                    {/* Sliders / funnel icon */}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <line x1="4"  y1="6"  x2="20" y2="6"  />
                        <line x1="8"  y1="12" x2="16" y2="12" />
                        <line x1="10" y1="18" x2="14" y2="18" />
                        <circle cx="7"  cy="6"  r="1.8" fill="currentColor" stroke="none" />
                        <circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none" />
                        <circle cx="17" cy="18" r="1.8" fill="currentColor" stroke="none" />
                    </svg>
                    FILTER
                </button>

                {/* SORT dropdown — SortOptions must render a "SORT ▾" style button internally */}
                <div className="basis-0 flex-1 min-w-0">
                    <SortOptions compact label="SORT" />
                </div>
            </div>

            {/* Mobile sidebar backdrop */}
            {!isLarge && isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/30 z-40"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* ── Sidebar ── */}
            <div
                ref={sidebarRef}
                style={
                    !isLarge
                        ? {
                            width: SIDEBAR_WIDTH,
                            position: 'fixed',
                            left: 0,
                            top: topOffset + 'px',
                            bottom: 0,
                            zIndex: 50,
                            transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
                            transition: 'transform 0.3s ease',
                            overflowY: 'auto',
                        }
                        : {
                            width: SIDEBAR_WIDTH,
                            minWidth: SIDEBAR_WIDTH,
                            borderRight: '1px solid #e8e5e1',
                        }
                }
                className="bg-[#f0eeeb] lg:sticky lg:top-0 lg:self-start lg:h-screen lg:overflow-y-auto no-scrollbar"
            >
                {/* Mobile close button */}
                {!isLarge && (
                    <div className="flex items-center justify-between px-5 pt-4 pb-2">
                        <span className="text-xs font-bold tracking-[0.15em] uppercase text-[#2a1a0e]">
                            Filters
                        </span>
                        <button onClick={() => setIsSidebarOpen(false)}>
                            <X size={18} className="text-[#2a1a0e]" />
                        </button>
                    </div>
                )}
                <FilterSidebar />
            </div>

            {/* ── Main Content ── */}
            <div className="flex-grow bg-white">

                {/* Desktop top bar */}
                <div className="hidden lg:flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <span className="text-xs font-semibold tracking-[0.15em] uppercase text-gray-400">
                        {products.length} Products
                    </span>
                    <SortOptions />
                </div>

                {/* Collection heading */}
                <div className="px-6 pt-6 pb-2">
                    <p className="text-[10px] tracking-[0.3em] uppercase text-[#b8924a] mb-1">Shop</p>
                    <h2 className="font-serif text-2xl md:text-3xl text-[#2a1a0e] tracking-wide capitalize">
                        {selectedCollection === 'all' ? 'All Collections' : selectedCollection}
                    </h2>
                    <div className="w-8 h-[1px] bg-[#b8924a] mt-3" />
                </div>

                {/* Product grid */}
                <div className="px-4 md:px-6 py-4">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="w-6 h-6 border-2 border-[#2a1a0e] border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : error ? (
                        <p className="text-red-500 text-sm px-2">Error: {error}</p>
                    ) : products.length > 0 ? (
                        <ProductGrid products={products} loading={loading} error={error} />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 gap-3">
                            <p className="text-xs tracking-widest uppercase text-gray-400">
                                No products found
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CollectionPage;