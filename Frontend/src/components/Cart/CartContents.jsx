import React from 'react';
import { useDispatch } from 'react-redux';
import { removeFromCart, updateCartItemQuantity } from '../../redux/slices/cartSlice';
import { getItemPricing } from '../../utils/pricing';

const FALLBACK_IMAGE = 'https://via.placeholder.com/160x200?text=Product';

const MEASUREMENT_FIELDS = [
    { id: 'bustChest',     short: 'Bust'     },
    { id: 'waist',         short: 'Waist'    },
    { id: 'hips',          short: 'Hips'     },
    { id: 'shoulderWidth', short: 'Shoulder' },
    { id: 'sleeveLength',  short: 'Sleeve'   },
    { id: 'armhole',       short: 'Armhole'  },
    { id: 'bicepSize',     short: 'Bicep'    },
];

const getMeasurementLine = (m) => {
    if (!m || typeof m !== 'object') return '';
    return MEASUREMENT_FIELDS
        .filter(f => Number.isFinite(Number(m[f.id])))
        .map(f => `${f.short} ${Number(m[f.id]).toFixed(1).replace('.0', '')}"`)
        .join(' · ');
};

const CartContents = ({ cart, userId, guestId }) => {
    const dispatch = useDispatch();

    const handleQty = (productId, delta, quantity, size, color, customMeasurementKey) => {
        const target = cart.products.find(
            i => i.productId === productId &&
                 i.size === size &&
                 i.color === color &&
                 (i.customMeasurementKey || '') === (customMeasurementKey || '')
        );
        if (delta > 0 && Number.isFinite(Number(target?.countInStock)) && quantity >= Number(target.countInStock)) return;
        const newQty = quantity + delta;
        if (newQty >= 1) {
            dispatch(updateCartItemQuantity({ productId, quantity: newQty, guestId, userId, size, color, customMeasurementKey }));
        } else {
            dispatch(removeFromCart({ productId, guestId, userId, size, color, customMeasurementKey }));
        }
    };

    const handleRemove = (productId, size, color, customMeasurementKey) => {
        dispatch(removeFromCart({ productId, guestId, userId, size, color, customMeasurementKey }));
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

                /* ─── reset ─── */
                .cc, .cc * { box-sizing: border-box; }
                .cc {
                    font-family: 'Sora', -apple-system, sans-serif;
                    display: flex;
                    flex-direction: column;
                }

                /* ─── item row ─── */
                .cc-item {
                    display: grid;
                    grid-template-columns: 80px 1fr;
                    gap: 14px;
                    padding: 16px 16px;
                    position: relative;
                    border-bottom: 1px solid rgba(0,0,0,0.055);
                    transition: background .18s ease;
                }
                .cc-item:last-child { border-bottom: none; }
                .cc-item:hover { background: rgba(0,0,0,0.013); }

                /* ─── image ─── */
                .cc-img-wrap {
                    position: relative;
                    width: 80px;
                    height: 96px;
                    border-radius: 10px;
                    overflow: hidden;
                    flex-shrink: 0;
                    background: #f0efeb;
                }
                .cc-img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    display: block;
                    transition: transform .35s ease;
                }
                .cc-item:hover .cc-img { transform: scale(1.04); }

                /* discount ribbon on image */
                .cc-ribbon {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background: rgba(0,0,0,0.72);
                    backdrop-filter: blur(4px);
                    color: #fff;
                    font-size: 9.5px;
                    font-weight: 600;
                    letter-spacing: .04em;
                    text-align: center;
                    padding: 4px 0;
                    font-family: 'JetBrains Mono', monospace;
                }

                /* ─── right col ─── */
                .cc-right {
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    min-width: 0;
                    padding: 1px 0;
                }

                /* name + delete */
                .cc-top {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    gap: 6px;
                }
                .cc-name {
                    font-size: 13px;
                    font-weight: 600;
                    color: #111;
                    line-height: 1.4;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    letter-spacing: -0.01em;
                }
                .cc-tags {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 4px;
                    margin-top: 5px;
                }
                .cc-tag {
                    font-size: 10px;
                    font-weight: 500;
                    color: #777;
                    background: #f4f3f0;
                    padding: 2px 7px;
                    border-radius: 5px;
                    letter-spacing: .01em;
                }
                .cc-tag-custom {
                    font-size: 10px;
                    font-weight: 500;
                    color: #5b50e8;
                    background: #f0effb;
                    padding: 2px 7px;
                    border-radius: 5px;
                    max-width: 175px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                /* delete — appears on hover only (desktop), always on mobile */
                .cc-del {
                    background: none;
                    border: none;
                    cursor: pointer;
                    width: 28px;
                    height: 28px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    color: #ccc;
                    transition: color .15s, background .15s;
                    opacity: 0;
                    transition: opacity .2s, color .15s, background .15s;
                }
                .cc-item:hover .cc-del { opacity: 1; }
                .cc-del:hover {
                    color: #e05252;
                    background: #fff0f0;
                }
                /* always visible on touch */
                @media (hover: none) { .cc-del { opacity: 1 !important; } }

                /* ─── bottom row ─── */
                .cc-bottom {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-top: 8px;
                }

                /* stepper — pill style */
                .cc-stepper {
                    display: inline-flex;
                    align-items: center;
                    border: 1.5px solid rgba(0,0,0,0.11);
                    border-radius: 999px;
                    overflow: hidden;
                    height: 32px;
                    background: #fff;
                }
                .cc-step-btn {
                    width: 32px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 16px;
                    font-weight: 400;
                    line-height: 1;
                    color: #333;
                    background: none;
                    border: none;
                    cursor: pointer;
                    transition: background .12s;
                    font-family: 'Sora', sans-serif;
                    user-select: none;
                }
                .cc-step-btn:hover { background: #f5f4f1; }
                .cc-step-btn:active { background: #ececea; }
                .cc-step-btn:disabled { color: #d0d0d0; cursor: not-allowed; }
                .cc-qty-val {
                    min-width: 28px;
                    text-align: center;
                    font-size: 13px;
                    font-weight: 600;
                    color: #111;
                    font-family: 'JetBrains Mono', monospace;
                    user-select: none;
                }

                /* price block */
                .cc-price-block { text-align: right; line-height: 1; }
                .cc-price {
                    font-size: 15px;
                    font-weight: 700;
                    color: #111;
                    letter-spacing: -0.02em;
                    font-family: 'JetBrains Mono', monospace;
                }
                .cc-original {
                    font-size: 11px;
                    color: #c0bdb5;
                    text-decoration: line-through;
                    margin-top: 2px;
                    font-family: 'JetBrains Mono', monospace;
                }

                /* stock */
                .cc-stock {
                    margin-top: 6px;
                    font-size: 10px;
                    font-weight: 600;
                    color: #b45309;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                /* stagger fade-in */
                @keyframes cc-in {
                    from { opacity: 0; transform: translateY(6px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .cc-item {
                    animation: cc-in .28s ease both;
                }
                .cc-item:nth-child(1) { animation-delay: .02s }
                .cc-item:nth-child(2) { animation-delay: .06s }
                .cc-item:nth-child(3) { animation-delay: .10s }
                .cc-item:nth-child(4) { animation-delay: .14s }
                .cc-item:nth-child(5) { animation-delay: .18s }
            `}</style>

            <div className="cc">
                {cart.products.map((product, index) => {
                    const pricing       = getItemPricing(product);
                    const maxStock      = Number.isFinite(Number(product.countInStock)) && product.quantity >= Number(product.countInStock);
                    const measurements  = getMeasurementLine(product.customMeasurements);
                    const key           = `${product.productId}-${product.size||''}-${product.color||''}-${product.customMeasurementKey||''}-${index}`;
                    const discountLabel = pricing.hasDiscount ? `${pricing.discountPercent}% OFF` : null;

                    return (
                        <div className="cc-item" key={key}>

                            {/* Image */}
                            <div className="cc-img-wrap">
                                <img
                                    src={product.image || FALLBACK_IMAGE}
                                    alt={product.name || 'Product'}
                                    className="cc-img"
                                    loading="lazy"
                                />
                                {discountLabel && (
                                    <div className="cc-ribbon">{discountLabel}</div>
                                )}
                            </div>

                            {/* Right column */}
                            <div className="cc-right">

                                {/* Name + delete */}
                                <div className="cc-top">
                                    <div style={{ minWidth: 0 }}>
                                        <div className="cc-name">{product.name}</div>
                                        <div className="cc-tags">
                                            {product.size  && <span className="cc-tag">{product.size}</span>}
                                            {product.color && <span className="cc-tag">{product.color}</span>}
                                            {measurements  && <span className="cc-tag-custom" title={measurements}>✦ Custom fit</span>}
                                        </div>
                                    </div>
                                    <button
                                        className="cc-del"
                                        onClick={() => handleRemove(product.productId, product.size, product.color, product.customMeasurementKey || '')}
                                        aria-label={`Remove ${product.name}`}
                                    >
                                        {/* inline SVG trash so no icon-lib dependency */}
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="3 6 5 6 21 6"/>
                                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                            <path d="M10 11v6M14 11v6"/>
                                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                                        </svg>
                                    </button>
                                </div>

                                {/* Stepper + price */}
                                <div className="cc-bottom">
                                    <div className="cc-stepper">
                                        <button
                                            className="cc-step-btn"
                                            onClick={() => handleQty(product.productId, -1, product.quantity, product.size, product.color, product.customMeasurementKey || '')}
                                            aria-label="Decrease quantity"
                                        >
                                            −
                                        </button>
                                        <span className="cc-qty-val">{product.quantity}</span>
                                        <button
                                            className="cc-step-btn"
                                            onClick={() => handleQty(product.productId, +1, product.quantity, product.size, product.color, product.customMeasurementKey || '')}
                                            disabled={maxStock}
                                            aria-label="Increase quantity"
                                        >
                                            +
                                        </button>
                                    </div>

                                    <div className="cc-price-block">
                                        <div className="cc-price">₹{pricing.finalPrice.toFixed(0)}</div>
                                        {pricing.hasDiscount && (
                                            <div className="cc-original">₹{pricing.originalPrice.toFixed(0)}</div>
                                        )}
                                    </div>
                                </div>

                                {maxStock && (
                                    <div className="cc-stock">
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                                        </svg>
                                        Max stock reached
                                    </div>
                                )}
                            </div>

                        </div>
                    );
                })}
            </div>
        </>
    );
};

export default CartContents;