import React, { useState, useRef, useEffect } from 'react'
import { Form, useNavigate } from 'react-router-dom';
import { HiMagnifyingGlass, HiMiniXMark } from 'react-icons/hi2';
import { useDispatch } from 'react-redux';
import { fetchProductsByFilters, setFilters } from '../../redux/slices/productSlice';
import ReactPixel from 'react-facebook-pixel';


const SearchBar = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [isOpen, setIsOpen] = useState(false)
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const inputRef = useRef(null)
    const handleSearchToggle =()=>{
        setIsOpen(!isOpen)
    }

    useEffect(()=>{
        if(isOpen && inputRef.current){
            inputRef.current.focus()
        }
    },[isOpen])
    // Live search: debounce input and auto-submit without pressing the button
    // Only run while the compact search box is open to avoid navigating on mount.
    useEffect(() => {
        if (!isOpen) return;

        const val = searchTerm;
        const containsSlash = /[\/\\]/.test(val);

        if (containsSlash) {
            // Clear search params and show all products
            dispatch(setFilters({ search: '' }));
            dispatch(fetchProductsByFilters({}));
            navigate('/collections/all');
            // clear input visually
            setSearchTerm('');
            return;
        }

        const handler = setTimeout(() => {
            const trimmed = val.trim();
            if (trimmed === '') {
                dispatch(setFilters({ search: '' }));
                dispatch(fetchProductsByFilters({}));
                navigate('/collections/all');
            } else {
                dispatch(setFilters({ search: trimmed }));
                dispatch(fetchProductsByFilters({ search: trimmed }));
                navigate(`/collections/all?search=${encodeURIComponent(trimmed)}`);
            }
        }, 350);

        return () => clearTimeout(handler);
    }, [searchTerm, dispatch, navigate, isOpen]);
    const handleSearch =(e)=>{
        e.preventDefault();
        dispatch(setFilters({search:searchTerm}))
        dispatch(fetchProductsByFilters({search:searchTerm}))

        const pixelId = import.meta.env.VITE_META_PIXEL_ID;
        if (pixelId && searchTerm) {
            ReactPixel.track('Search', { search_string: searchTerm });
        }

        navigate(`/collections/all?search=${searchTerm}`)
        setIsOpen(false)
    }
  return (
    <div className={`flex items-center transition-all duration-200 ${isOpen ? "relative" : "w-auto"}`}>
        {isOpen ? (
        <form onSubmit={handleSearch} className='relative flex items-center'>
            <div className="relative w-72">
                <input 
                ref={inputRef}
                type="text" 
                onChange={(e)=>setSearchTerm(e.target.value)}
                placeholder='Search' 
                value={searchTerm} 
                className='bg-gray-100 px-4 py-2 pl-2 pr-10 rounded-lg focus:outline-none w-full placeholder:text-gray-700' />
                <button type='submit' className='absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800 '>
                    <HiMagnifyingGlass className='h-5 w-5'/>
                </button>
            </div>
            <button type='button' onClick={handleSearchToggle} className='ml-2 text-gray-600 hover:text-gray-800'>
                <HiMiniXMark className='h-6 w-6'/>
            </button>
        </form>
        ) : (
            <button onClick={handleSearchToggle}>
                <HiMagnifyingGlass className='h-5 w-5 text-gray-700'/>
            </button>
        )}
    </div>
  )
}

export default SearchBar