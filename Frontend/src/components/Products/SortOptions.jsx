import React, { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

const OPTIONS = [
  { value: '', label: 'Default' },
  { value: 'priceAsc', label: 'Price: Low to High' },
  { value: 'priceDesc', label: 'Price: High to Low' },
  { value: 'popularity', label: 'Popularity' },
];

const SortOptions = ({ compact = false, label = 'SORT' }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const current = searchParams.get('sortBy') || '';
  const currentLabel = OPTIONS.find((o) => o.value === current)?.label || 'Default';

  const setSort = (value) => {
    if (value) searchParams.set('sortBy', value);
    else searchParams.delete('sortBy');
    setSearchParams(searchParams);
  };

  useEffect(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  if (compact) {
    return (
      <div className="relative h-full w-full" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen((s) => !s)}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border-2 border-[#2a1a0e] bg-white px-4 text-xs font-bold uppercase tracking-[0.14em] text-[#2a1a0e]"
        >
          <span>{label}</span>
          <span className="text-[14px] leading-none">▾</span>
        </button>
        {open && (
          <ul className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border-2 border-[#2a1a0e] bg-white shadow-lg">
            {OPTIONS.map((opt) => (
              <li
                key={opt.value}
                onClick={() => { setSort(opt.value); setOpen(false); }}
                className="cursor-pointer px-4 py-3 text-sm font-medium text-[#2a1a0e] transition-colors hover:bg-[#f3eee7]"
              >
                {opt.label}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  const handleSortChange = (e) => {
    setSort(e.target.value);
  };

  return (
    <div className='mb-4 flex items-center justify-end'>
      <select id="sort" onChange={handleSortChange} value={current} className='rounded-lg border-2 border-[#2a1a0e] bg-white px-4 py-2 text-sm font-semibold uppercase tracking-[0.12em] text-[#2a1a0e] focus:outline-none'>
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

export default SortOptions