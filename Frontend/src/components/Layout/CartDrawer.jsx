import { useMemo, useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { openPhoneAuthModal } from '../../redux/slices/authSlice'
import { getCartPricing } from '../../utils/pricing'
import CartContents from '../Cart/CartContents'

const FREE_DELIVERY_THRESHOLD = 499

const CartDrawer = ({ drawerOpen, toggleCartDrawer }) => {
    const dispatch  = useDispatch()
    const navigate  = useNavigate()
    const { user, guestId } = useSelector((s) => s.auth)
    const { cart }          = useSelector((s) => s.cart)

    const userId      = user?._id ?? null
    const cartItems   = cart?.products ?? []
    const cartPricing = useMemo(() => getCartPricing(cartItems), [cartItems])
    const totalPayable = Math.max(0, cartPricing.finalSubtotal)
    const totalItems   = cartItems.reduce((s, i) => s + Number(i.quantity || 0), 0)
    const discountPct  = cartPricing.originalSubtotal > 0
        ? Math.round((cartPricing.totalDiscount / cartPricing.originalSubtotal) * 100) : 0

    const [couponCode,    setCouponCode]    = useState('')
    const [couponApplied, setCouponApplied] = useState(false)
    const [couponError,   setCouponError]   = useState('')
    const [couponFocused, setCouponFocused] = useState(false)

    const remaining        = FREE_DELIVERY_THRESHOLD - totalPayable
    const deliveryProgress = Math.min(100, (totalPayable / FREE_DELIVERY_THRESHOLD) * 100)
    const deliveryFree     = remaining <= 0

    useEffect(() => {
        document.body.style.overflow = drawerOpen ? 'hidden' : ''
        return () => { document.body.style.overflow = '' }
    }, [drawerOpen])

    const handleCheckout = () => {
        toggleCartDrawer()
        navigate('/checkout')
        if (!user) dispatch(openPhoneAuthModal({ redirectPath: '/checkout' }))
    }

    const handleApply = () => {
        const val = couponCode.trim().toUpperCase()
        if (!val) return
        if (val.length >= 4) { setCouponApplied(true); setCouponError('') }
        else { setCouponError('Invalid code — please try again.'); setCouponApplied(false) }
    }

    const handleRemoveCoupon = () => {
        setCouponCode(''); setCouponApplied(false); setCouponError('')
    }

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

                .cd, .cd * { box-sizing: border-box; }
                .cd {
                    font-family: 'Sora', -apple-system, sans-serif;
                    position: fixed; inset: 0; z-index: 9997;
                }

                /* ── panel ── */
                .cd-panel {
                    position: absolute; right: 0; top: 0;
                    width: 100%; max-width: 420px; height: 100%;
                    display: flex; flex-direction: column;
                    background: #FAFAF8;
                }

                /* ── scroll body ── */
                .cd-body {
                    flex: 1 1 0; min-height: 0;
                    overflow-y: auto; overflow-x: hidden;
                    -webkit-overflow-scrolling: touch;
                    overscroll-behavior: contain;
                    padding: 12px 14px 0;
                    display: flex; flex-direction: column; gap: 10px;
                }
                .cd-body::-webkit-scrollbar { width: 0; }

                /* ── header ── */
                .cd-header {
                    display: flex; align-items: center; gap: 12px;
                    padding: 17px 16px 15px;
                    background: #fff;
                    border-bottom: 1px solid rgba(0,0,0,0.07);
                    flex-shrink: 0;
                }
                .cd-close {
                    width: 34px; height: 34px;
                    border-radius: 50%;
                    background: #f4f3f0;
                    border: none; cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    color: #555;
                    transition: background .15s;
                    flex-shrink: 0;
                }
                .cd-close:hover { background: #ededeb; }
                .cd-title {
                    flex: 1;
                    font-size: 16px; font-weight: 600;
                    color: #111; letter-spacing: -0.02em;
                }
                .cd-count-pill {
                    background: #111; color: #fff;
                    border-radius: 20px; padding: 3px 11px;
                    font-size: 12px; font-weight: 600;
                    font-family: 'JetBrains Mono', monospace;
                }

                /* ── delivery strip ── */
                .cd-del-strip {
                    padding: 10px 16px 12px;
                    background: #fff;
                    border-bottom: 1px solid rgba(0,0,0,0.06);
                    flex-shrink: 0;
                }
                .cd-del-row {
                    display: flex; align-items: center; justify-content: space-between;
                    font-size: 12px; color: #888; margin-bottom: 8px;
                }
                .cd-del-row strong { color: #111; font-weight: 600; }
                .cd-del-free { font-size: 12px; font-weight: 600; color: #15803d; display: flex; align-items: center; gap: 6px; }
                .cd-bar-track {
                    height: 3px; background: rgba(0,0,0,0.08);
                    border-radius: 4px; overflow: hidden;
                }
                .cd-bar-fill {
                    height: 100%; border-radius: 4px;
                    background: #111;
                    transition: width .55s ease;
                }

                /* ── card shell ── */
                .cd-card {
                    background: #fff;
                    border-radius: 16px;
                    border: 1px solid rgba(0,0,0,0.07);
                    overflow: hidden;
                    flex-shrink: 0;
                }

                /* ── coupon ── */
                .cd-coupon-wrap {
                    border-radius: 16px;
                    border: 1.5px dashed rgba(0,0,0,0.14);
                    background: #fff;
                    overflow: hidden;
                    flex-shrink: 0;
                    transition: border-color .2s;
                }
                .cd-coupon-wrap.focused { border-color: rgba(0,0,0,0.35); }
                .cd-coupon-wrap.error   { border-color: #f87171; }
                .cd-coupon-wrap.applied { border-style: solid; border-color: #bbf7d0; background: #f0fdf4; }

                .cd-coupon-inner { padding: 12px 14px; }
                .cd-coupon-hd {
                    display: flex; align-items: center; gap: 7px;
                    font-size: 11px; font-weight: 600; color: #999;
                    letter-spacing: .05em; text-transform: uppercase;
                    margin-bottom: 10px;
                }
                .cd-cin-row {
                    display: flex; align-items: center; gap: 10px;
                }
                .cd-cin {
                    flex: 1; border: none; outline: none;
                    background: transparent;
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 13px; font-weight: 500;
                    color: #111; letter-spacing: .06em;
                }
                .cd-cin::placeholder { color: #ccc; font-family: 'Sora', sans-serif; font-size: 12px; letter-spacing: 0; }
                .cd-apply {
                    background: #111; color: #fff;
                    border: none; border-radius: 9px;
                    padding: 8px 16px;
                    font-size: 11px; font-weight: 700;
                    font-family: 'Sora', sans-serif;
                    letter-spacing: .05em; cursor: pointer;
                    transition: opacity .15s;
                    white-space: nowrap;
                }
                .cd-apply:active { opacity: .8; }
                .cd-err {
                    font-size: 11px; color: #ef4444;
                    margin-top: 7px; font-weight: 500;
                    display: flex; align-items: center; gap: 5px;
                }

                /* coupon applied */
                .cd-applied-row {
                    display: flex; align-items: center; gap: 10px;
                    padding: 13px 14px;
                }
                .cd-applied-tag {
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 12px; font-weight: 600;
                    color: #166534;
                    background: #dcfce7;
                    padding: 3px 9px; border-radius: 6px;
                }
                .cd-applied-lbl { font-size: 12px; color: #166534; font-weight: 500; flex: 1; }
                .cd-remove-btn {
                    border: none; background: none; cursor: pointer;
                    color: #86efac; display: flex; align-items: center;
                    transition: color .15s;
                }
                .cd-remove-btn:hover { color: #4ade80; }

                /* ── price section ── */
                .cd-price-sec { padding: 14px 16px; }
                .cd-price-title {
                    font-size: 10px; font-weight: 600;
                    color: #bbb; letter-spacing: .09em;
                    text-transform: uppercase; margin-bottom: 13px;
                }
                .cd-prow {
                    display: flex; justify-content: space-between;
                    font-size: 13px; color: #888; margin-bottom: 9px;
                    align-items: center;
                }
                .cd-prow.green { color: #16a34a; }
                .cd-pdiv { height: 1px; background: rgba(0,0,0,0.07); margin: 10px 0; }
                .cd-ptotal {
                    display: flex; justify-content: space-between;
                    font-size: 15px; font-weight: 700; color: #111;
                }
                .cd-ptotal-val { font-family: 'JetBrains Mono', monospace; }
                .cd-save-badge {
                    margin-top: 13px;
                    display: inline-flex; align-items: center; gap: 5px;
                    background: #f0fdf4; color: #15803d;
                    border: 1px solid #bbf7d0;
                    border-radius: 20px; padding: 5px 13px;
                    font-size: 11.5px; font-weight: 600;
                }

                /* ── empty state ── */
                .cd-empty {
                    flex: 1;
                    display: flex; flex-direction: column;
                    align-items: center; justify-content: center;
                    gap: 10px; padding: 48px 24px; text-align: center;
                }
                .cd-empty-icon {
                    width: 60px; height: 60px;
                    background: #f4f3f0; border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    margin-bottom: 4px;
                }
                .cd-empty h3 { font-size: 16px; font-weight: 600; color: #111; margin: 0; }
                .cd-empty p  { font-size: 13px; color: #aaa; margin: 0; line-height: 1.5; }
                .cd-shop-btn {
                    display: inline-flex; align-items: center; gap: 7px;
                    background: #111; color: #fff;
                    text-decoration: none;
                    border-radius: 12px; padding: 11px 22px;
                    font-size: 13px; font-weight: 600;
                    margin-top: 6px;
                    transition: opacity .15s;
                }
                .cd-shop-btn:hover { opacity: .88; }

                /* ── footer ── */
                .cd-footer {
                    flex-shrink: 0;
                    padding: 12px 14px 20px;
                    background: #fff;
                    border-top: 1px solid rgba(0,0,0,0.07);
                }
                .cd-trust {
                    display: flex; align-items: center;
                    justify-content: center; gap: 14px;
                    margin-bottom: 11px;
                }
                .cd-trust-item {
                    display: flex; align-items: center; gap: 4px;
                    font-size: 10.5px; color: #bbb;
                }

                /* ── CTA button ── */
                .cd-cta {
                    display: flex; align-items: center;
                    background: #111; border-radius: 15px;
                    padding: 6px 6px 6px 18px;
                    cursor: pointer;
                    transition: opacity .15s;
                }
                .cd-cta:hover { opacity: .92; }
                .cd-cta-left { flex: 1; }
                .cd-cta-label {
                    font-size: 9px; color: rgba(255,255,255,0.35);
                    letter-spacing: .09em; text-transform: uppercase;
                    margin-bottom: 1px;
                }
                .cd-cta-amount {
                    font-size: 20px; font-weight: 700; color: #fff;
                    font-family: 'JetBrains Mono', monospace;
                    letter-spacing: -0.03em; line-height: 1;
                }
                .cd-cta-saving {
                    font-size: 10px; color: #4ade80; margin-top: 2px;
                    font-weight: 500;
                }
                .cd-cta-pill {
                    background: #fff; color: #111;
                    border-radius: 11px; padding: 13px 18px;
                    display: flex; align-items: center; gap: 7px;
                    font-size: 13px; font-weight: 700;
                    letter-spacing: -0.01em;
                    white-space: nowrap;
                }
            `}</style>

            <div
                className="cd"
                style={{
                    opacity: drawerOpen ? 1 : 0,
                    pointerEvents: drawerOpen ? 'auto' : 'none',
                    transition: 'opacity 0.28s cubic-bezier(.4,0,.2,1)',
                }}
            >
                {/* Backdrop */}
                <button
                    aria-label="Close cart"
                    onClick={toggleCartDrawer}
                    style={{
                        position: 'absolute', inset: 0, width: '100%', height: '100%',
                        background: 'rgba(0,0,0,0.42)',
                        backdropFilter: 'blur(6px)',
                        border: 'none', cursor: 'pointer',
                    }}
                />

                {/* ═══ PANEL ═══ */}
                <div
                    className="cd-panel"
                    style={{
                        transform: drawerOpen ? 'translateX(0)' : 'translateX(100%)',
                        transition: 'transform 0.34s cubic-bezier(.4,0,.2,1)',
                    }}
                >
                    {/* HEADER */}
                    <div className="cd-header">
                        <button className="cd-close" onClick={toggleCartDrawer} aria-label="Close">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                        </button>
                        <div className="cd-title">My bag</div>
                        {totalItems > 0 && <span className="cd-count-pill">{totalItems}</span>}
                    </div>

                    {/* DELIVERY STRIP */}
                    {cartItems.length > 0 && (
                        <div className="cd-del-strip">
                            {deliveryFree ? (
                                <div className="cd-del-free">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                                    You've unlocked free delivery!
                                </div>
                            ) : (
                                <>
                                    <div className="cd-del-row">
                                        <span>
                                            Add <strong>₹{remaining.toFixed(0)}</strong> more for free delivery
                                        </span>
                                        <span style={{ fontSize: 11, color: '#ccc', fontFamily: "'JetBrains Mono',monospace" }}>₹{FREE_DELIVERY_THRESHOLD}</span>
                                    </div>
                                    <div className="cd-bar-track">
                                        <div className="cd-bar-fill" style={{ width: `${deliveryProgress}%` }} />
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* SCROLL BODY */}
                    <div className="cd-body">

                        {/* Cart items */}
                        {cartItems.length > 0 ? (
                            <div className="cd-card">
                                <CartContents cart={cart} userId={userId} guestId={guestId} />
                            </div>
                        ) : (
                            <div className="cd-empty">
                                <div className="cd-empty-icon">
                                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
                                    </svg>
                                </div>
                                <h3>Your bag is empty</h3>
                                <p>Looks like you haven't added<br />anything yet</p>
                                <Link to="/collections/all" onClick={toggleCartDrawer} className="cd-shop-btn">
                                    Explore products
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                                </Link>
                            </div>
                        )}

                        {/* COUPON */}
                        {cartItems.length > 0 && (
                            <div className={`cd-coupon-wrap ${couponApplied ? 'applied' : couponError ? 'error' : couponFocused ? 'focused' : ''}`}>
                                {couponApplied ? (
                                    <div className="cd-applied-row">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                        <div className="cd-applied-lbl">
                                            <span className="cd-applied-tag">{couponCode}</span>
                                            {' '}applied to this order
                                        </div>
                                        <button className="cd-remove-btn" onClick={handleRemoveCoupon} aria-label="Remove coupon">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="cd-coupon-inner">
                                        <div className="cd-coupon-hd">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                                            Coupon code
                                        </div>
                                        <div className="cd-cin-row">
                                            <input
                                                className="cd-cin"
                                                value={couponCode}
                                                onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError('') }}
                                                onFocus={() => setCouponFocused(true)}
                                                onBlur={() => setCouponFocused(false)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleApply()}
                                                placeholder="e.g. SAVE20"
                                                autoCapitalize="characters"
                                                spellCheck={false}
                                            />
                                            {couponCode.trim() && (
                                                <button className="cd-apply" onClick={handleApply}>APPLY</button>
                                            )}
                                        </div>
                                        {couponError && (
                                            <div className="cd-err">
                                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                                                {couponError}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* PRICE BREAKDOWN */}
                        {cartItems.length > 0 && (
                            <div className="cd-card">
                                <div className="cd-price-sec">
                                    <div className="cd-price-title">Price details</div>
                                    <div className="cd-prow">
                                        <span>MRP ({totalItems} {totalItems === 1 ? 'item' : 'items'})</span>
                                        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13 }}>₹{cartPricing.originalSubtotal.toFixed(0)}</span>
                                    </div>
                                    {cartPricing.totalDiscount > 0 && (
                                        <div className="cd-prow green">
                                            <span>Product discount</span>
                                            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13 }}>− ₹{cartPricing.totalDiscount.toFixed(0)}</span>
                                        </div>
                                    )}
                                    <div className="cd-prow">
                                        <span>Delivery</span>
                                        <span style={{
                                            fontFamily: "'JetBrains Mono',monospace",
                                            fontSize: 13,
                                            color: deliveryFree ? '#16a34a' : '#888',
                                            fontWeight: deliveryFree ? 600 : 400,
                                        }}>
                                            {deliveryFree ? 'FREE' : '₹49'}
                                        </span>
                                    </div>
                                    <div className="cd-pdiv" />
                                    <div className="cd-ptotal">
                                        <span>Total payable</span>
                                        <span className="cd-ptotal-val">₹{totalPayable.toFixed(0)}</span>
                                    </div>
                                    {cartPricing.totalDiscount > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                                            <div className="cd-save-badge">
                                                🎁 Saving ₹{cartPricing.totalDiscount.toFixed(0)} ({discountPct}% off)
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div style={{ height: 14, flexShrink: 0 }} />
                    </div>
                    {/* END SCROLL BODY */}

                    {/* FOOTER */}
                    {cartItems.length > 0 && (
                        <div className="cd-footer">
                            <div className="cd-trust">
                                <div className="cd-trust-item">
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                                    Secure checkout
                                </div>
                                <div className="cd-trust-item">
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                                    Easy returns
                                </div>
                                <div className="cd-trust-item">
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                                    100% safe
                                </div>
                            </div>
                            <div className="cd-cta" onClick={handleCheckout} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && handleCheckout()}>
                                <div className="cd-cta-left">
                                    <div className="cd-cta-label">TOTAL</div>
                                    <div className="cd-cta-amount">₹{totalPayable.toFixed(0)}</div>
                                    {cartPricing.totalDiscount > 0 && (
                                        <div className="cd-cta-saving">Saving ₹{cartPricing.totalDiscount.toFixed(0)}</div>
                                    )}
                                </div>
                                <div className="cd-cta-pill">
                                    Place order
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
                {/* END PANEL */}
            </div>
        </>
    )
}

export default CartDrawer