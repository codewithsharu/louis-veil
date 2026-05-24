import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import ProductGrid from './ProductGrid';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProductDetails, fetchSimilarProduct } from '../../redux/slices/productSlice';
import { addToCart } from '../../redux/slices/cartSlice';
import { Minus, Plus, ShoppingBag, Truck, RefreshCw, CheckCircle, ZoomIn, Heart, Share2 } from 'react-feather';
import { FaWhatsapp, FaFacebookF, FaInstagram } from 'react-icons/fa';
import ReactPixel from 'react-facebook-pixel';

const WHATSAPP_QUOTE_NUMBER = '917460935762';

/* ── Thin rule divider ── */
const Rule = () => (
  <div style={{ display:'flex', alignItems:'center', gap:10, margin:'10px 0' }}>
    <span style={{ flex:1, height:'1px', background:'#e8e0d4' }} />
    <svg width="6" height="6" viewBox="0 0 6 6">
      <rect x="0.5" y="0.5" width="5" height="5" transform="rotate(45 3 3)" fill="none" stroke="#b8962e" strokeWidth="0.8"/>
    </svg>
    <span style={{ flex:1, height:'1px', background:'#e8e0d4' }} />
  </div>
);

const FeatureIcon = ({ children, label }) => (
  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5, flex:1 }}>
    <div style={{
      width:38, height:38, borderRadius:'50%',
      border:'1px solid #ddd0b8',
      display:'flex', alignItems:'center', justifyContent:'center',
      color:'#9a7828',
    }}>{children}</div>
    <span style={{
      fontSize:8.5, letterSpacing:'0.14em', textTransform:'uppercase',
      color:'#8a7560', fontFamily:'"DM Sans",sans-serif', fontWeight:400,
      textAlign:'center', lineHeight:1.35, whiteSpace:'pre-line',
    }}>{label}</span>
  </div>
);

/* ─────────────────────────── main component ─────────────────────────── */
const ProductDetails = ({ productId }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { selectedProduct, loading, error, similarProducts } = useSelector(s => s.products);
  const { user, guestId } = useSelector(s => s.auth);

  const [mainImage, setMainImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const [showZoom, setShowZoom] = useState(false);
  const [[x, y], setXY] = useState([0.5, 0.5]);
  const [activeTab, setActiveTab] = useState('description');
  const [isMobile, setIsMobile] = useState(false);
  const [wishlist, setWishlist] = useState(false);
  const imgRef = useRef(null);
  const productFetchId = productId || id;
  const ZOOM = 2.8;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (productFetchId) {
      dispatch(fetchProductDetails(productFetchId));
      dispatch(fetchSimilarProduct({ id: productFetchId }));
    }
  }, [dispatch, productFetchId]);

  useEffect(() => {
    if (selectedProduct?.images?.length > 0) setMainImage(selectedProduct.images[0].url);
    if (selectedProduct?.name) {
      const pid = import.meta.env.VITE_META_PIXEL_ID;
      if (pid) ReactPixel.track('ViewContent', {
        content_name: selectedProduct.name,
        content_ids: [selectedProduct._id || productFetchId],
        content_type: 'product',
        value: selectedProduct.discountPrice || selectedProduct.price,
        currency: 'INR',
      });
    }
  }, [selectedProduct]);

  const handleMouseMove = (e) => {
    if (isMobile || !imgRef.current) return;
    const { left, top, width, height } = imgRef.current.getBoundingClientRect();
    setXY([(e.clientX - left) / width, (e.clientY - top) / height]);
  };

  const inc = () => setQuantity(q => Math.min(q + 1, selectedProduct?.stock || 999));
  const dec = () => setQuantity(q => Math.max(1, q - 1));

  const isOOS = selectedProduct?.stock === 0;
  const busy = isAddingToCart || isBuyingNow;

  const handleAddToCart = () => {
    if (isOOS) return toast.error('Out of stock');
    setIsAddingToCart(true);
    try {
      dispatch(addToCart({ productId: selectedProduct?._id || productFetchId, quantity }));
      toast.success('Added to bag');
    } catch { toast.error('Could not add to bag'); }
    finally { setIsAddingToCart(false); }
  };

  const handleBuyNow = () => {
    if (isOOS) return toast.error('Out of stock');
    setIsBuyingNow(true);
    try {
      dispatch(addToCart({ productId: selectedProduct?._id || productFetchId, quantity }));
      navigate('/checkout');
    } catch { toast.error('Could not proceed'); setIsBuyingNow(false); }
  };

  const shareWA = () => {
    const msg = `Discover ${selectedProduct?.name} — Louis Veil`;
    window.open(`https://wa.me/${WHATSAPP_QUOTE_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleShareURL = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: selectedProduct?.name, url });
    } else {
      navigator.clipboard.writeText(url).then(() => toast.success('Link copied!'));
    }
  };

  const discountPct = selectedProduct?.price && selectedProduct?.discountPrice && selectedProduct.price !== selectedProduct.discountPrice
    ? Math.round(((selectedProduct.price - selectedProduct.discountPrice) / selectedProduct.price) * 100) : 0;

  /* ── loading ── */
  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f8f5f0' }}>
      <div style={{ width:36, height:36, borderRadius:'50%', border:'1px solid #b8962e', borderTopColor:'transparent', animation:'spin 0.9s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  /* ── error ── */
  if (error) {
    const isNF = String(error).includes('404') || String(error).toLowerCase().includes('not found');
    return (
      <div style={{ minHeight:'70vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#f8f5f0', padding:'2rem', fontFamily:'"Playfair Display",serif' }}>
        <h2 style={{ fontSize:26, color:'#1c1510', marginBottom:8, fontWeight:400 }}>{isNF ? 'Product Not Found' : 'Something went wrong'}</h2>
        <p style={{ color:'#8a7560', marginBottom:32, textAlign:'center', maxWidth:400, fontSize:14, fontFamily:'"DM Sans",sans-serif' }}>
          {isNF ? "We couldn't find this product. It may have been removed." : `Error: ${error}`}
        </p>
        <button onClick={() => navigate('/collections/all')} style={{
          background:'#1c1510', color:'#f0e6d0', border:'none',
          padding:'13px 40px', letterSpacing:'0.2em', fontSize:10,
          fontFamily:'"DM Sans",sans-serif', fontWeight:500, textTransform:'uppercase', cursor:'pointer',
        }}>Browse Collections</button>
      </div>
    );
  }

  const imgs = selectedProduct?.images || [];
  const tabs = ['description', 'style notes', 'care guide', 'shipping & returns'];

  return (
    <div style={{ background:'#f8f5f0', fontFamily:'"Playfair Display","Georgia",serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500&family=DM+Sans:wght@300;400;500&display=swap');

        .lv-thumb { transition: border-color 0.2s, opacity 0.2s; cursor:pointer; }
        .lv-thumb:hover { border-color:#b8962e !important; opacity:1 !important; }
        .lv-thumb.active { border-color:#b8962e !important; opacity:1 !important; }
        .lv-thumb:not(.active) { opacity:0.6; }

        .lv-tab { transition: color 0.2s; cursor:pointer; background:none; border:none; border-bottom:1px solid transparent; }
        .lv-tab.active { color:#1c1510 !important; border-bottom-color:#b8962e !important; }
        .lv-tab:hover { color:#1c1510 !important; }

        .lv-btn-dark { transition: background 0.2s, transform 0.1s; }
        .lv-btn-dark:hover:not(:disabled) { background:#2e2318 !important; }
        .lv-btn-dark:active:not(:disabled) { transform:scale(0.99); }

        .lv-btn-ghost { transition: background 0.2s, transform 0.1s; }
        .lv-btn-ghost:hover:not(:disabled) { background:rgba(28,21,16,0.04) !important; }
        .lv-btn-ghost:active:not(:disabled) { transform:scale(0.99); }

        .lv-icon-btn { transition: background 0.18s; cursor:pointer; }
        .lv-icon-btn:hover { background:rgba(184,150,46,0.1) !important; }

        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .lv-fadein { animation: fadeIn 0.4s ease both; }

        @media(min-width:769px){
          .lv-layout {
            display:flex; flex-direction:row; align-items:flex-start;
            max-width:1100px; margin:0 auto; padding:20px 20px 0;
            height:calc(100vh - 96px); overflow:hidden;
          }
          .lv-img-col { width:52%; height:100%; display:flex; flex-direction:column; overflow:hidden; gap:0; }
          .lv-info-col {
            width:48%; height:100%; overflow-y:auto;
            padding:0 0 24px 28px;
            scrollbar-width:none;
          }
          .lv-info-col::-webkit-scrollbar { display:none; }
          .lv-mobile { display:none !important; }
          .lv-desktop { display:flex !important; }
        }

        @media(max-width:768px){
          .lv-layout { display:flex; flex-direction:column; padding:10px 14px 0; }
          .lv-img-col { width:100%; }
          .lv-info-col { width:100%; padding:14px 0 20px; }
          .lv-desktop { display:none !important; }
        }
      `}</style>

      {selectedProduct && (
        <div className="lv-fadein">

          {/* ── main grid ── */}
          <div className="lv-layout">

            {/* ══ LEFT — images ══ */}
            <div className="lv-img-col">

              {/* Main image — fills all available height */}
              <div style={{ flex:1, position:'relative', overflow:'hidden', background:'#ede8e0', cursor: isMobile ? 'default':'crosshair', minHeight:0 }}
                onMouseMove={handleMouseMove}
                onMouseEnter={() => !isMobile && setShowZoom(true)}
                onMouseLeave={() => setShowZoom(false)}
              >
                {mainImage
                  ? <img ref={imgRef} src={mainImage} alt={selectedProduct.name}
                      style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'top', display:'block' }}/>
                  : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'#b0a090', fontSize:13, fontFamily:'"DM Sans",sans-serif' }}>No image</div>
                }
                {discountPct > 0 && (
                  <div style={{ position:'absolute', top:14, left:14, background:'#1c1510', color:'#f0e6d0', fontSize:9, letterSpacing:'0.16em', fontFamily:'"DM Sans",sans-serif', fontWeight:500, padding:'4px 10px' }}>
                    −{discountPct}%
                  </div>
                )}
                <div className="lv-desktop" style={{ position:'absolute', bottom:12, right:12, background:'rgba(248,245,240,0.8)', width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <ZoomIn size={13} color="#6a5a48"/>
                </div>
              </div>

              {/* Zoom panel */}
              {showZoom && !isMobile && mainImage && (
                <div className="lv-desktop" style={{
                  position:'absolute', left:'calc(54% + 20px)', top:16, zIndex:50,
                  width:290, height:350,
                  border:'1px solid #ddd0b8', boxShadow:'0 12px 40px rgba(0,0,0,0.08)',
                  background:`url(${mainImage}) ${x*100}% ${y*100}% / ${ZOOM*100}% no-repeat`,
                  pointerEvents:'none',
                }}/>
              )}

              {/* Thumbnail strip — bottom, horizontal, same on desktop & mobile */}
              <div style={{ display:'flex', gap:7, marginTop:8, overflowX:'auto', paddingBottom:2, scrollbarWidth:'none', flexShrink:0 }}>
                {imgs.filter(i => i?.url).map((img, idx) => (
                  <button key={idx}
                    className={`lv-thumb${mainImage === img.url ? ' active' : ''}`}
                    onClick={() => setMainImage(img.url)}
                    style={{
                      width:62, height:62, padding:2, flexShrink:0,
                      border:`1px solid ${mainImage === img.url ? '#b8962e' : '#ddd0b8'}`,
                      background:'#fff', overflow:'hidden',
                    }}>
                    <img src={img.url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                  </button>
                ))}
              </div>
            </div>

            {/* ══ RIGHT — info ══ */}
            <div className="lv-info-col">

              {/* Name + top-right actions */}
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10, marginBottom:6 }}>
                <h1 style={{
                  fontSize:'clamp(20px,2.2vw,27px)', fontWeight:500, color:'#1c1510',
                  letterSpacing:'0.01em', margin:0, lineHeight:1.25,
                  fontFamily:'"Playfair Display",serif', flex:1,
                }}>
                  {selectedProduct.name}
                </h1>
                {/* Quick-action icons — top right */}
                <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0, paddingTop:3 }}>
                  <button onClick={handleShareURL} className="lv-icon-btn" aria-label="Share product link"
                    style={{ width:28, height:28, border:'1px solid #ddd0b8', background:'transparent',
                      display:'flex', alignItems:'center', justifyContent:'center', color:'#9a8878', cursor:'pointer' }}>
                    <Share2 size={12}/>
                  </button>
                  <button onClick={() => setWishlist(w => !w)} className="lv-icon-btn" aria-label="Wishlist"
                    style={{ width:28, height:28, border:'1px solid #ddd0b8', background:'transparent',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      color: wishlist ? '#c04040':'#9a8878', cursor:'pointer' }}>
                    <Heart size={12} fill={wishlist ? '#c04040':'none'}/>
                  </button>
                </div>
              </div>

              {/* Price */}
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
                <span style={{ fontSize:19, fontWeight:500, color:'#1c1510', fontFamily:'"DM Sans",sans-serif', letterSpacing:'-0.01em' }}>
                  ₹{(selectedProduct.discountPrice || selectedProduct.price || 0).toLocaleString()}
                </span>
                {discountPct > 0 && <>
                  <span style={{ fontSize:13, color:'#a89070', textDecoration:'line-through', fontFamily:'"DM Sans",sans-serif' }}>
                    ₹{(selectedProduct.price || 0).toLocaleString()}
                  </span>
                  <span style={{ fontSize:9.5, background:'#f2eade', color:'#8a6820', padding:'2px 8px', letterSpacing:'0.1em', fontFamily:'"DM Sans",sans-serif', fontWeight:500, textTransform:'uppercase' }}>
                    {discountPct}% off
                  </span>
                </>}
              </div>

              <Rule />

              {/* Stock */}
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:14, fontFamily:'"DM Sans",sans-serif', fontSize:11, letterSpacing:'0.12em', textTransform:'uppercase' }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background: isOOS ? '#c94040' : '#4a9e6e', display:'inline-block' }}/>
                <span style={{ color: isOOS ? '#c94040' : '#4a9e6e', fontWeight:400 }}>{isOOS ? 'Out of Stock' : 'In Stock'}</span>
              </div>

              {/* Quantity */}
              <div style={{ marginBottom:16 }}>
                <p style={{ fontSize:9.5, fontFamily:'"DM Sans",sans-serif', letterSpacing:'0.2em', textTransform:'uppercase', color:'#8a7560', marginBottom:8, fontWeight:400 }}>Quantity</p>
                <div style={{ display:'inline-flex', alignItems:'center', border:'1px solid #ddd0b8' }}>
                  <button onClick={dec} style={{ width:34, height:34, display:'flex', alignItems:'center', justifyContent:'center', background:'none', border:'none', cursor:'pointer', color:'#3a2e24' }}>
                    <Minus size={11}/>
                  </button>
                  <span style={{ width:34, textAlign:'center', fontSize:13, fontFamily:'"DM Sans",sans-serif', color:'#1c1510', fontWeight:400 }}>{quantity}</span>
                  <button onClick={inc} style={{ width:34, height:34, display:'flex', alignItems:'center', justifyContent:'center', background:'none', border:'none', cursor:'pointer', color:'#3a2e24' }}>
                    <Plus size={11}/>
                  </button>
                </div>
              </div>

              {/* CTA */}
              <div style={{ display:'flex', flexDirection:'column', gap:9, marginBottom:18 }}>
                <button className="lv-btn-dark" onClick={handleAddToCart} disabled={isOOS||busy}
                  style={{
                    width:'100%', padding:'13px 0',
                    background: isOOS||busy ? '#c8bfb0' : '#1c1510',
                    color: isOOS||busy ? '#f8f5f0' : '#f0e6d0',
                    border:'none', cursor: isOOS||busy ? 'not-allowed':'pointer',
                    fontFamily:'"DM Sans",sans-serif', fontSize:10.5, letterSpacing:'0.28em', fontWeight:500,
                    display:'flex', alignItems:'center', justifyContent:'center', gap:9, textTransform:'uppercase',
                  }}>
                  <ShoppingBag size={12}/>
                  {isAddingToCart ? 'Adding…' : 'Add to Cart'}
                </button>
                <button className="lv-btn-ghost" onClick={handleBuyNow} disabled={isOOS||busy}
                  style={{
                    width:'100%', padding:'12px 0', background:'transparent',
                    color: isOOS||busy ? '#b0a090' : '#1c1510',
                    border:`1px solid ${isOOS||busy ? '#c8bfb0' : '#1c1510'}`,
                    cursor: isOOS||busy ? 'not-allowed':'pointer',
                    fontFamily:'"DM Sans",sans-serif', fontSize:10.5, letterSpacing:'0.28em', fontWeight:500, textTransform:'uppercase',
                  }}>
                  {isBuyingNow ? 'Processing…' : 'Buy Now'}
                </button>
              </div>

              {/* Feature icons */}
              <div style={{ display:'flex', gap:2, padding:'13px 0', borderTop:'1px solid #e8e0d4', borderBottom:'1px solid #e8e0d4', marginBottom:16 }}>
                <FeatureIcon label={'Premium\nFinish'}>
                  <svg width="15" height="15" viewBox="0 0 18 18" fill="none">
                    <polygon points="9,2 14,6 12,15 6,15 4,6" stroke="currentColor" strokeWidth="1" fill="none"/>
                    <line x1="4" y1="6" x2="14" y2="6" stroke="currentColor" strokeWidth="0.8"/>
                  </svg>
                </FeatureIcon>
                <FeatureIcon label={'Tarnish\nResistant'}>
                  <svg width="15" height="15" viewBox="0 0 18 18" fill="none">
                    <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1" fill="none"/>
                    <polyline points="6,9 8,11 12,7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </FeatureIcon>
                <FeatureIcon label={'Lightweight\nComfort'}>
                  <svg width="15" height="15" viewBox="0 0 18 18" fill="none">
                    <path d="M9 3 C7 6 5 9 6 12 C7 14 8 15 9 16 C10 15 11 14 12 12 C13 9 11 6 9 3Z" stroke="currentColor" strokeWidth="1" fill="none"/>
                  </svg>
                </FeatureIcon>
                <FeatureIcon label={'Handpicked\nDesigns'}>
                  <svg width="15" height="15" viewBox="0 0 18 18" fill="none">
                    <path d="M9 3 L10 7 L14 7 L11 10 L12 14 L9 11.5 L6 14 L7 10 L4 7 L8 7 Z" stroke="currentColor" strokeWidth="1" fill="none" strokeLinejoin="round"/>
                  </svg>
                </FeatureIcon>
              </div>

              {/* Delivery info */}
              <div style={{ borderTop:'1px solid #e8e0d4', marginBottom:16 }}>
                {[
                  { icon:<Truck size={12}/>, title:'Free Delivery', sub:'On orders above ₹999', color:'#4a7aa0' },
                  { icon:<RefreshCw size={12}/>, title:'Easy Returns', sub:'3-day return & exchange', color:'#7a58a0' },
                  { icon:<CheckCircle size={12}/>, title:'COD Available', sub:'Cash on delivery supported', color:'#3a9060' },
                ].map((row, i, arr) => (
                  <div key={i} style={{
                    display:'flex', alignItems:'center', gap:12, padding:'9px 0',
                    borderBottom: i < arr.length-1 ? '1px solid #e8e0d4' : 'none',
                  }}>
                    <span style={{ color:row.color, opacity:0.8 }}>{row.icon}</span>
                    <div>
                      <p style={{ margin:0, fontSize:11.5, fontFamily:'"DM Sans",sans-serif', fontWeight:500, color:'#1c1510' }}>{row.title}</p>
                      <p style={{ margin:0, fontSize:9.5, color:'#9a8878', fontFamily:'"DM Sans",sans-serif', fontWeight:300 }}>{row.sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Share + Wishlist */}
              <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                <span style={{ fontSize:9.5, fontFamily:'"DM Sans",sans-serif', letterSpacing:'0.2em', textTransform:'uppercase', color:'#9a8878', marginRight:2 }}>Share</span>
                {[
                  { icon:<FaWhatsapp size={13}/>, action:shareWA, label:'WhatsApp', color:'#25D366' },
                  { icon:<FaFacebookF size={12}/>, action:()=>{}, label:'Facebook', color:'#1877F2' },
                  { icon:<FaInstagram size={12}/>, action:()=>{}, label:'Instagram', color:'#C13584' },
                ].map((s, i) => (
                  <button key={i} onClick={s.action} className="lv-icon-btn" aria-label={s.label}
                    style={{ width:28, height:28, border:'1px solid #ddd0b8', background:'transparent',
                      display:'flex', alignItems:'center', justifyContent:'center', color:s.color, cursor:'pointer' }}>
                    {s.icon}
                  </button>
                ))}
                <button onClick={() => setWishlist(w => !w)} className="lv-icon-btn"
                  style={{ width:28, height:28, border:'1px solid #ddd0b8', background:'transparent',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    color: wishlist ? '#c04040':'#9a8878', cursor:'pointer', marginLeft:'auto' }}>
                  <Heart size={12} fill={wishlist ? '#c04040':'none'}/>
                </button>
              </div>
            </div>
          </div>

          {/* ── Tabs ── */}
          <div style={{ maxWidth:1160, margin:'28px auto 0', padding:'0 20px' }}>
            <div style={{ display:'flex', borderBottom:'1px solid #e8e0d4', overflowX:'auto' }}>
              {tabs.map(tab => (
                <button key={tab}
                  className={`lv-tab${activeTab === tab ? ' active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding:'10px 18px', fontSize:9.5, letterSpacing:'0.2em', textTransform:'uppercase',
                    fontFamily:'"DM Sans",sans-serif', fontWeight:400, whiteSpace:'nowrap',
                    color: activeTab === tab ? '#1c1510':'#9a8878',
                    borderBottom: activeTab === tab ? '1px solid #b8962e':'1px solid transparent',
                    marginBottom:'-1px',
                  }}>
                  {tab}
                </button>
              ))}
            </div>

            <div style={{ padding:'22px 0 32px' }}>
              {activeTab === 'description' && (
                <div style={{ maxWidth:680 }}>
                  {/* Full description — only here, not repeated above */}
                  <p style={{ fontSize:13.5, color:'#3a3028', lineHeight:2, marginBottom:16, fontFamily:'"DM Sans",sans-serif', fontWeight:300, letterSpacing:'0.015em' }}>
                    {selectedProduct.description}
                  </p>
                  {selectedProduct.features?.length > 0 && (
                    <ul style={{ paddingLeft:0, listStyle:'none', margin:0 }}>
                      {selectedProduct.features.map((f, i) => (
                        <li key={i} style={{ display:'flex', gap:10, alignItems:'flex-start', fontSize:12.5, color:'#5a4e40', marginBottom:8, fontFamily:'"DM Sans",sans-serif', fontWeight:300, lineHeight:1.65 }}>
                          <svg width="12" height="12" viewBox="0 0 12 12" style={{ marginTop:3, flexShrink:0 }}>
                            <rect x="1" y="1" width="10" height="10" transform="rotate(45 6 6)" fill="none" stroke="#b8962e" strokeWidth="0.8"/>
                          </svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              {activeTab === 'style notes' && (
                <p style={{ fontSize:13.5, color:'#3a3028', lineHeight:2, fontFamily:'"DM Sans",sans-serif', fontWeight:300, letterSpacing:'0.015em', maxWidth:620 }}>
                  Style this piece with a flowing ethnic ensemble for festive occasions, or let it elevate a simple western outfit. The timeless design pairs beautifully with both traditional and contemporary looks.
                </p>
              )}
              {activeTab === 'care guide' && (
                <div style={{ fontFamily:'"DM Sans",sans-serif', fontSize:13, color:'#4a3e30', lineHeight:2, fontWeight:300 }}>
                  <p style={{margin:'0 0 4px'}}>— Store in the provided pouch when not in use to prevent tarnishing.</p>
                  <p style={{margin:'0 0 4px'}}>— Avoid contact with perfumes, lotions, and water.</p>
                  <p style={{margin:'0 0 4px'}}>— Wipe gently with a soft dry cloth after each wear.</p>
                  <p style={{margin:0}}>— Keep away from direct sunlight and humidity.</p>
                </div>
              )}
              {activeTab === 'shipping & returns' && (
                <div style={{ fontFamily:'"DM Sans",sans-serif', fontSize:13, color:'#4a3e30', lineHeight:2, fontWeight:300 }}>
                  <p style={{margin:'0 0 4px'}}>— Free delivery on orders above ₹999. Standard shipping: 3–5 business days.</p>
                  <p style={{margin:'0 0 4px'}}>— Express shipping available at checkout.</p>
                  <p style={{margin:'0 0 4px'}}>— Returns accepted within 3 days of delivery in original condition.</p>
                  <p style={{margin:0}}>— COD available across India.</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Similar products ── */}
          {similarProducts?.length > 0 && (
            <div style={{ maxWidth:1160, margin:'0 auto', padding:'0 20px 60px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:20 }}>
                <h2 style={{ fontSize:'clamp(15px,2vw,20px)', fontWeight:400, color:'#1c1510', letterSpacing:'0.04em', margin:0, fontFamily:'"Playfair Display",serif' }}>
                  You May Also Like
                </h2>
                <span style={{ flex:1, height:'1px', background:'#e8e0d4' }}/>
                <span style={{ fontSize:9, letterSpacing:'0.3em', textTransform:'uppercase', fontFamily:'"DM Sans",sans-serif', color:'#b8962e', fontWeight:400 }}>
                  Curated for you
                </span>
              </div>
              <ProductGrid products={similarProducts}/>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default ProductDetails;