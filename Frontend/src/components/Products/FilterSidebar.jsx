import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronDown } from 'react-feather';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/config';

const FilterSidebar = () => {
    const [searchParams, setSearchParam] = useSearchParams();
    const navigate = useNavigate();
    const [filter, setFilter] = useState({
        collection: 'All',
        category: 'All',
        gender: '',
        color: '',
        size: [],
        material: [],
        brand: [],
        minPrice: 0,
        maxPrice: 10000,
    });
    const [collectionOptions, setCollectionOptions] = useState(['All']);
    const [openSections, setOpenSections] = useState({ price: true });

    const categories = ['All', 'Tops', 'Bottoms', 'Saree', 'Lehenga', 'Western Dresses', 'Co-ords'];
    const categoryToApiValue = {
        Tops: 'Top Wear', Bottoms: 'Bottom Wear', Saree: 'Saree',
        Lehenga: 'Lehenga', 'Western Dresses': 'Western Dresses', 'Co-ords': 'Co-ords',
    };
    const categoryFromApiValue = {
        'Top Wear': 'Tops', 'Bottom Wear': 'Bottoms', Saree: 'Saree',
        Lehenga: 'Lehenga', 'Western Dresses': 'Western Dresses', 'Co-ords': 'Co-ords',
    };
    const colors = [
        { name: 'Red', hex: '#EF4444' }, { name: 'Blue', hex: '#3B82F6' },
        { name: 'Black', hex: '#111827' }, { name: 'Green', hex: '#16A34A' },
        { name: 'Yellow', hex: '#EAB308' }, { name: 'Gray', hex: '#9CA3AF' },
        { name: 'White', hex: '#FFFFFF' }, { name: 'Pink', hex: '#F472B6' },
        { name: 'Beige', hex: '#D2B48C' }, { name: 'Navy', hex: '#1E3A5F' },
    ];
    const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    const materials = ['Cotton', 'Wool', 'Denim', 'Polyester', 'Silk', 'Linen', 'Viscose', 'Fleece'];
    const brands = ['Urban Threads', 'Modern Fit', 'Gucci', 'Street Style', 'Beach Breeze', 'Fashion Insta'];
    const genders = ['Men', 'Women'];

    const activeFilterCount = [
        filter.collection !== 'All' ? 1 : 0,
        filter.category !== 'All' ? 1 : 0,
        filter.gender ? 1 : 0,
        filter.color ? 1 : 0,
        filter.size.length,
        filter.material.length,
        filter.brand.length,
        filter.maxPrice < 10000 ? 1 : 0,
    ].reduce((a, b) => a + b, 0);

    const toggleSection = (key) =>
        setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

    const clearFilters = () => {
        setFilter({ collection: 'All', category: 'All', gender: '', color: '', size: [], material: [], brand: [], minPrice: 0, maxPrice: 10000 });
        setSearchParam({});
        navigate('/collections/all');
    };

    useEffect(() => {
        const fetchCollectionOptions = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/api/products/collections`);
                const apiCollections = Array.isArray(response.data?.collections) ? response.data.collections : [];
                const normalized = apiCollections.map((name) => String(name || '').trim()).filter(Boolean);
                setCollectionOptions(['All', ...normalized.filter((n) => n.toLowerCase() !== 'all')]);
            } catch {
                setCollectionOptions(['All']);
            }
        };
        fetchCollectionOptions();
    }, []);

    useEffect(() => {
        const params = Object.fromEntries([...searchParams]);
        setFilter({
            collection: params.collection || 'All',
            category: params.category ? (categoryFromApiValue[params.category] || params.category) : 'All',
            gender: params.gender || '',
            color: params.color || '',
            size: params.size ? params.size.split(',') : [],
            material: params.material ? params.material.split(',') : [],
            brand: params.brand ? params.brand.split(',') : [],
            minPrice: params.minPrice || 0,
            maxPrice: params.maxPrice || 10000,
        });
    }, [searchParams]);

    const updateURLParams = (newFilters) => {
        const params = new URLSearchParams();
        Object.keys(newFilters).forEach((key) => {
            if (key === 'collection' && newFilters[key] && String(newFilters[key]).toLowerCase() !== 'all') {
                params.append('collection', newFilters[key]); return;
            }
            if (key === 'category' && newFilters[key] && newFilters[key] !== 'All') {
                params.append('category', categoryToApiValue[newFilters[key]] || newFilters[key]); return;
            }
            if (Array.isArray(newFilters[key]) && newFilters[key].length > 0) {
                params.append(key, newFilters[key].join(','));
            } else if (newFilters[key] && newFilters[key] !== 'All') {
                params.append(key, newFilters[key]);
            }
        });
        setSearchParam(params);
        navigate(`/collections/all${params.toString() ? '?' + params.toString() : ''}`);
    };

    const handleSingleSelect = (name, value) => {
        const newFilters = { ...filter };
        if (name === 'gender' || name === 'color') {
            newFilters[name] = newFilters[name] === value ? '' : value;
        } else {
            newFilters[name] = value;
        }
        setFilter(newFilters);
        updateURLParams(newFilters);
    };

    const handleMultiSelect = (name, value) => {
        const newFilters = { ...filter };
        newFilters[name] = newFilters[name].includes(value)
            ? newFilters[name].filter((i) => i !== value)
            : [...newFilters[name], value];
        setFilter(newFilters);
        updateURLParams(newFilters);
    };

    const handlePriceChange = (e) => {
        const newFilters = { ...filter, maxPrice: e.target.value };
        setFilter(newFilters);
        updateURLParams(newFilters);
    };

    // Reusable accordion section
    const Section = ({ id, label, children }) => (
        <div className="border-b border-gray-200">
            <button
                onClick={() => toggleSection(id)}
                className="w-full flex items-center justify-between py-4 px-0 text-left group"
            >
                <span className="text-[13px] font-bold tracking-[0.12em] text-[#2a1a0e] uppercase">
                    {label}
                </span>
                <ChevronDown
                    size={16}
                    className={`text-[#2a1a0e] transition-transform duration-200 ${openSections[id] ? 'rotate-180' : ''}`}
                />
            </button>
            {openSections[id] && (
                <div className="pb-4">{children}</div>
            )}
        </div>
    );

    return (
        <div className="bg-[#f0eeeb] min-h-full px-5 py-2">
            {/* Clear all badge */}
            {activeFilterCount > 0 && (
                <div className="flex items-center justify-between py-3 border-b border-gray-200 mb-1">
                    <span className="text-xs font-semibold text-gray-500 tracking-widest uppercase">
                        {activeFilterCount} Active
                    </span>
                    <button
                        onClick={clearFilters}
                        className="text-[11px] font-bold tracking-widest uppercase text-[#2a1a0e] underline underline-offset-2"
                    >
                        Clear All
                    </button>
                </div>
            )}

            {/* Price */}
            <Section id="price" label="Price">
                <div className="px-0">
                    <input
                        type="range"
                        min={0} max={10000} step={100}
                        value={filter.maxPrice}
                        onChange={handlePriceChange}
                        className="w-full h-[2px] appearance-none cursor-pointer accent-[#2a1a0e]"
                        style={{ background: `linear-gradient(to right, #2a1a0e ${filter.maxPrice / 100}%, #d1cdc8 ${filter.maxPrice / 100}%)` }}
                    />
                    <div className="flex justify-between mt-3">
                        <span className="text-xs text-gray-500 font-medium">₹0</span>
                        <span className="text-xs font-bold text-[#2a1a0e]">₹{Number(filter.maxPrice).toLocaleString()}</span>
                    </div>
                </div>
            </Section>

            {/* Collection */}
            <Section id="collection" label="Collection">
                <select
                    value={filter.collection}
                    onChange={(e) => handleSingleSelect('collection', e.target.value)}
                    className="w-full px-3 py-2.5 text-sm bg-transparent border border-[#2a1a0e]/20 text-[#2a1a0e] focus:outline-none focus:border-[#2a1a0e] appearance-none"
                >
                    {collectionOptions.map((c) => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>
            </Section>

            {/* Product Category */}
            <Section id="category" label="Product Category">
                <div className="flex flex-col gap-0">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => handleSingleSelect('category', cat)}
                            className={`text-left text-sm py-1.5 transition-all font-medium tracking-wide
                                ${filter.category === cat
                                    ? 'text-[#2a1a0e] font-bold'
                                    : 'text-gray-500 hover:text-[#2a1a0e]'
                                }`}
                        >
                            {filter.category === cat && <span className="mr-1.5">—</span>}{cat}
                        </button>
                    ))}
                </div>
            </Section>

            {/* Colour */}
            <Section id="color" label="Colour">
                <div className="flex flex-wrap gap-3">
                    {colors.map((color) => (
                        <button
                            key={color.name}
                            onClick={() => handleSingleSelect('color', color.name)}
                            className="flex flex-col items-center gap-1.5"
                            title={color.name}
                        >
                            <div
                                className={`w-7 h-7 rounded-full transition-all
                                    ${filter.color === color.name
                                        ? 'ring-2 ring-offset-1 ring-[#2a1a0e] scale-110'
                                        : color.name === 'White' ? 'ring-1 ring-gray-300' : ''
                                    }`}
                                style={{ backgroundColor: color.hex }}
                            />
                            <span className={`text-[9px] uppercase tracking-wide
                                ${filter.color === color.name ? 'font-bold text-[#2a1a0e]' : 'text-gray-400'}`}>
                                {color.name}
                            </span>
                        </button>
                    ))}
                </div>
            </Section>

            {/* Material */}
            <Section id="material" label="Material">
                <div className="flex flex-col gap-0">
                    {materials.map((mat) => (
                        <button
                            key={mat}
                            onClick={() => handleMultiSelect('material', mat)}
                            className={`text-left text-sm py-1.5 font-medium tracking-wide transition-all
                                ${filter.material.includes(mat)
                                    ? 'text-[#2a1a0e] font-bold'
                                    : 'text-gray-500 hover:text-[#2a1a0e]'
                                }`}
                        >
                            {filter.material.includes(mat) && <span className="mr-1.5">—</span>}{mat}
                        </button>
                    ))}
                </div>
            </Section>

            {/* Gender */}
            <Section id="gender" label="Gender">
                <div className="flex flex-col gap-0">
                    {genders.map((g) => (
                        <button
                            key={g}
                            onClick={() => handleSingleSelect('gender', g)}
                            className={`text-left text-sm py-1.5 font-medium tracking-wide transition-all
                                ${filter.gender === g
                                    ? 'text-[#2a1a0e] font-bold'
                                    : 'text-gray-500 hover:text-[#2a1a0e]'
                                }`}
                        >
                            {filter.gender === g && <span className="mr-1.5">—</span>}{g}
                        </button>
                    ))}
                </div>
            </Section>

            {/* Size */}
            <Section id="size" label="Size">
                <div className="flex flex-wrap gap-2">
                    {sizes.map((size) => (
                        <button
                            key={size}
                            onClick={() => handleMultiSelect('size', size)}
                            className={`w-11 h-9 text-xs font-bold tracking-wider uppercase transition-all border
                                ${filter.size.includes(size)
                                    ? 'bg-[#2a1a0e] text-white border-[#2a1a0e]'
                                    : 'bg-transparent text-gray-600 border-gray-300 hover:border-[#2a1a0e] hover:text-[#2a1a0e]'
                                }`}
                        >
                            {size}
                        </button>
                    ))}
                </div>
            </Section>

            {/* Brand */}
            <Section id="brand" label="Brand">
                <div className="flex flex-col gap-0">
                    {brands.map((brand) => (
                        <button
                            key={brand}
                            onClick={() => handleMultiSelect('brand', brand)}
                            className={`text-left text-sm py-1.5 font-medium tracking-wide transition-all
                                ${filter.brand.includes(brand)
                                    ? 'text-[#2a1a0e] font-bold'
                                    : 'text-gray-500 hover:text-[#2a1a0e]'
                                }`}
                        >
                            {filter.brand.includes(brand) && <span className="mr-1.5">—</span>}{brand}
                        </button>
                    ))}
                </div>
            </Section>

            {activeFilterCount > 0 && (
                <button
                    onClick={clearFilters}
                    className="w-full mt-5 py-3 text-xs font-bold tracking-[0.15em] uppercase border border-[#2a1a0e] text-[#2a1a0e] hover:bg-[#2a1a0e] hover:text-white transition-colors"
                >
                    Clear All ({activeFilterCount})
                </button>
            )}
        </div>
    );
};

export default FilterSidebar;