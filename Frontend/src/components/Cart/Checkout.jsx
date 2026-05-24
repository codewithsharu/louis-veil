import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { createCheckout } from "../../redux/slices/checkoutSlice";
import { fetchCart, removeFromCart, updateCartItemQuantity } from "../../redux/slices/cartSlice";
import axios from "axios";
import { API_BASE_URL } from "../../utils/config";
import { getCartPricing, getItemPricing } from "../../utils/pricing";
import { openPhoneAuthModal, logout } from "../../redux/slices/authSlice";
import { getValidToken } from "../../utils/auth";
import ReactPixel from 'react-facebook-pixel';

const checkoutDebug = (step, data = {}) => {
  console.log(`[Checkout][Frontend][Debug] ${step}`, data);
};
const createCheckoutTraceId = () => `fe_chk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const SHIPROCKET_CHECKOUT_SCRIPT_ID = "shiprocket-headless-checkout-script";
const SHIPROCKET_CHECKOUT_SCRIPT_URL = "https://checkout-ui.shiprocket.com/assets/js/channels/shopify.js";
const SHIPROCKET_CHECKOUT_STYLE_ID = "shiprocket-headless-checkout-style";
const SHIPROCKET_CHECKOUT_STYLE_URL = "https://checkout-ui.shiprocket.com/assets/styles/shopify.css";
const DEFAULT_SHIPROCKET_SELLER_DOMAIN = "louisveil.com";

const resolveShiprocketSellerDomain = () => {
  const fromEnv = String(import.meta.env.VITE_SHIPROCKET_SELLER_DOMAIN || "").trim();
  if (fromEnv) return fromEnv;
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") return DEFAULT_SHIPROCKET_SELLER_DOMAIN;
  return window.location.host;
};

const resolveShiprocketReturnOrigin = () => {
  const fromEnv = String(import.meta.env.VITE_SHIPROCKET_RETURN_ORIGIN || "").trim().replace(/\/+$/, "");
  if (fromEnv) return fromEnv;
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") return "https://louisveil.com";
  return window.location.origin;
};

const ensureSellerDomainInput = () => {
  const sellerDomain = resolveShiprocketSellerDomain();
  const existing = document.getElementById("sellerDomain");
  if (existing) { existing.value = sellerDomain; return; }
  const input = document.createElement("input");
  input.type = "hidden"; input.id = "sellerDomain"; input.value = sellerDomain;
  document.body.appendChild(input);
};

const ensureShiprocketCheckoutStyle = () => {
  if (document.getElementById(SHIPROCKET_CHECKOUT_STYLE_ID)) return;
  const link = document.createElement("link");
  link.id = SHIPROCKET_CHECKOUT_STYLE_ID; link.rel = "stylesheet"; link.href = SHIPROCKET_CHECKOUT_STYLE_URL;
  document.head.appendChild(link);
};

const ensureShiprocketCheckoutScript = () =>
  new Promise((resolve, reject) => {
    if (window.HeadlessCheckout?.addToCart) { resolve(window.HeadlessCheckout); return; }
    window.shiprocketCheckoutChannel = "CUSTOM";
    ensureSellerDomainInput();
    ensureShiprocketCheckoutStyle();
    const existingScript = document.getElementById(SHIPROCKET_CHECKOUT_SCRIPT_ID);
    if (existingScript) {
      existingScript.addEventListener("load", () => {
        if (window.HeadlessCheckout?.addToCart) resolve(window.HeadlessCheckout);
        else reject(new Error("Shiprocket script loaded but HeadlessCheckout is unavailable."));
      }, { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Failed to load Shiprocket checkout script.")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.id = SHIPROCKET_CHECKOUT_SCRIPT_ID; script.src = SHIPROCKET_CHECKOUT_SCRIPT_URL; script.async = true;
    script.onload = () => {
      if (window.HeadlessCheckout?.addToCart) resolve(window.HeadlessCheckout);
      else reject(new Error("Shiprocket script loaded but checkout object is missing."));
    };
    script.onerror = () => reject(new Error("Failed to load Shiprocket checkout script."));
    document.body.appendChild(script);
  });

const CUSTOM_MEASUREMENT_FIELDS = [
  { id: 'bustChest', shortLabel: 'Bust' }, { id: 'waist', shortLabel: 'Waist' },
  { id: 'hips', shortLabel: 'Hips' }, { id: 'shoulderWidth', shortLabel: 'Shoulder' },
  { id: 'sleeveLength', shortLabel: 'Sleeve' }, { id: 'armhole', shortLabel: 'Armhole' },
  { id: 'bicepSize', shortLabel: 'Bicep' },
];

const getCompactMeasurementLine = (customMeasurements) => {
  if (!customMeasurements || typeof customMeasurements !== "object") return "";
  return CUSTOM_MEASUREMENT_FIELDS
    .filter((f) => Number.isFinite(Number(customMeasurements[f.id])))
    .map((f) => `${f.shortLabel} ${Number(customMeasurements[f.id]).toFixed(1).replace(".0", "")}`)
    .join(" · ");
};

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true); script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const stripShiprocketReturnParams = () => {
  const params = new URLSearchParams(window.location.search);
  ["sr_checkout_id","oid","ost","fastrr_transaction_id","fastrr_status","seller","seller_id","fastrr_status_code","fastrr_message"]
    .forEach((p) => params.delete(p));
  const nextSearch = params.toString();
  const nextPath = nextSearch ? window.location.pathname + "?" + nextSearch : window.location.pathname;
  window.history.replaceState({}, "", nextPath);
};

// ─── STYLES ───────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=JetBrains+Mono:wght@400;500&display=swap');

  :root {
    --lv-ink:    #0e0d0b;
    --lv-cream:  #f7f5f0;
    --lv-warm:   #eeebe3;
    --lv-border: rgba(14,13,11,0.10);
    --lv-muted:  #7a7367;
    --lv-gold:   #b89a5a;
    --lv-green:  #2d6a4f;
    --lv-red:    #c0392b;
    --lv-mono:   'JetBrains Mono', monospace;
    --lv-serif:  'Cormorant Garamond', Georgia, serif;
    --lv-sans:   'DM Sans', -apple-system, sans-serif;
    --lv-radius: 4px;
    --lv-radius-lg: 8px;
  }

  .lv-co *, .lv-co *::before, .lv-co *::after { box-sizing: border-box; }

  .lv-co {
    font-family: var(--lv-sans);
    background: var(--lv-cream);
    min-height: 100vh;
    color: var(--lv-ink);
  }

  /* ── page grid ── */
  .lv-grid {
    max-width: 1160px;
    margin: 0 auto;
    padding: 48px 24px 80px;
    display: grid;
    grid-template-columns: 1fr 480px;
    gap: 40px;
    align-items: start;
  }
  @media (max-width: 900px) {
    .lv-grid { grid-template-columns: 1fr; padding: 28px 16px 60px; }
    .lv-right { order: -1; }
  }

  /* ── section heading ── */
  .lv-eyebrow {
    font-family: var(--lv-sans);
    font-size: 9px; font-weight: 600;
    letter-spacing: .18em; text-transform: uppercase;
    color: var(--lv-muted); margin-bottom: 6px;
  }
  .lv-section-title {
    font-family: var(--lv-serif);
    font-size: 32px; font-weight: 400;
    letter-spacing: -0.01em; line-height: 1.1;
    color: var(--lv-ink); margin-bottom: 32px;
  }

  /* ── saved addresses ── */
  .lv-saved-block {
    background: #fff;
    border: 1px solid var(--lv-border);
    border-radius: var(--lv-radius-lg);
    overflow: hidden;
    margin-bottom: 24px;
  }
  .lv-saved-header {
    padding: 10px 14px;
    background: var(--lv-warm);
    font-size: 9px; font-weight: 600;
    letter-spacing: .16em; text-transform: uppercase;
    color: var(--lv-muted);
    display: flex; align-items: center; justify-content: space-between;
  }
  .lv-addr-btn {
    width: 100%; padding: 12px 14px;
    background: none; border: none; border-bottom: 1px solid var(--lv-border);
    cursor: pointer; text-align: left;
    transition: background .14s;
  }
  .lv-addr-btn:last-child { border-bottom: none; }
  .lv-addr-btn:hover { background: var(--lv-warm); }
  .lv-addr-btn.selected {
    background: #fff;
    box-shadow: inset 0 0 0 1.5px var(--lv-ink);
  }
  .lv-addr-btn-name { font-size: 13px; font-weight: 600; color: var(--lv-ink); }
  .lv-addr-btn-sub  { font-size: 11px; color: var(--lv-muted); margin-top: 2px; }
  .lv-addr-empty { padding: 12px 14px; font-size: 12px; color: var(--lv-muted); }

  /* ── form ── */
  .lv-form-section-title {
    font-size: 10px; font-weight: 600;
    letter-spacing: .14em; text-transform: uppercase;
    color: var(--lv-muted); margin-bottom: 14px; margin-top: 28px;
  }
  .lv-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .lv-field { display: flex; flex-direction: column; gap: 5px; }
  .lv-label {
    font-size: 10px; font-weight: 500;
    letter-spacing: .1em; text-transform: uppercase;
    color: var(--lv-muted);
  }
  .lv-input {
    width: 100%; height: 46px;
    border: 1px solid var(--lv-border);
    border-radius: var(--lv-radius);
    background: #fff;
    padding: 0 14px;
    font-family: var(--lv-sans);
    font-size: 13px; color: var(--lv-ink);
    outline: none;
    transition: border-color .18s, box-shadow .18s;
    appearance: none;
  }
  .lv-input:focus {
    border-color: var(--lv-gold);
    box-shadow: 0 0 0 3px rgba(184,154,90,.10);
  }
  .lv-input::placeholder { color: #bbb; }

  /* ── checkbox ── */
  .lv-check-group { margin-top: 16px; display: flex; flex-direction: column; gap: 10px; }
  .lv-check-label {
    display: flex; align-items: flex-start; gap: 9px;
    font-size: 12px; color: var(--lv-muted); cursor: pointer; line-height: 1.5;
  }
  .lv-check-label input[type="checkbox"] {
    margin-top: 2px; width: 15px; height: 15px;
    accent-color: var(--lv-ink); flex-shrink: 0;
  }

  /* ── payment section ── */
  .lv-pay-grid { display: flex; flex-direction: column; gap: 10px; margin-top: 14px; }
  .lv-pay-option {
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    padding: 14px 16px;
    border: 1px solid var(--lv-border);
    border-radius: var(--lv-radius-lg);
    background: #fff;
    cursor: pointer;
    transition: border-color .18s, background .18s;
  }
  .lv-pay-option:hover  { border-color: rgba(14,13,11,.25); }
  .lv-pay-option.active { border-color: var(--lv-ink); background: #fff; }
  .lv-pay-title { font-size: 13px; font-weight: 600; color: var(--lv-ink); }
  .lv-pay-sub   { font-size: 11px; color: var(--lv-muted); margin-top: 2px; line-height: 1.4; }
  .lv-radio {
    width: 18px; height: 18px; flex-shrink: 0;
    border-radius: 50%;
    border: 1.5px solid var(--lv-border);
    background: #fff;
    display: flex; align-items: center; justify-content: center;
    transition: border-color .15s;
  }
  .lv-pay-option.active .lv-radio { border-color: var(--lv-ink); }
  .lv-radio-dot {
    width: 9px; height: 9px; border-radius: 50%;
    background: var(--lv-ink);
    opacity: 0; transition: opacity .15s;
  }
  .lv-pay-option.active .lv-radio-dot { opacity: 1; }

  /* COD note */
  .lv-cod-note {
    font-size: 11px; color: #92681c;
    background: #fef9ec; border: 1px solid #f0d98a;
    border-radius: var(--lv-radius);
    padding: 8px 12px; margin-top: 8px;
  }

  /* ── submit button ── */
  .lv-submit {
    margin-top: 24px;
    width: 100%; height: 52px;
    background: var(--lv-ink); color: #fff;
    border: none; border-radius: var(--lv-radius-lg);
    font-family: var(--lv-sans);
    font-size: 11px; font-weight: 600;
    letter-spacing: .15em; text-transform: uppercase;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 10px;
    transition: opacity .18s, transform .15s;
  }
  .lv-submit:hover:not(:disabled) { opacity: .88; }
  .lv-submit:active:not(:disabled) { transform: scale(.99); }
  .lv-submit:disabled { opacity: .5; cursor: not-allowed; }

  /* error */
  .lv-error {
    margin-top: 12px;
    padding: 10px 14px;
    background: #fdf0ef; border: 1px solid #f5c2be;
    border-radius: var(--lv-radius);
    font-size: 12px; color: var(--lv-red);
  }

  /* ══════════════════════════════════
     RIGHT PANEL — ORDER SUMMARY
  ══════════════════════════════════ */
  .lv-right {
    position: sticky; top: 24px;
  }
  .lv-panel {
    background: #fff;
    border: 1px solid var(--lv-border);
    border-radius: var(--lv-radius-lg);
    overflow: hidden;
  }
  .lv-panel-header {
    padding: 18px 20px 16px;
    border-bottom: 1px solid var(--lv-border);
    display: flex; align-items: baseline; justify-content: space-between;
  }
  .lv-panel-title {
    font-family: var(--lv-serif);
    font-size: 22px; font-weight: 400;
    letter-spacing: -0.01em;
  }
  .lv-item-count {
    font-size: 11px; color: var(--lv-muted);
    font-family: var(--lv-sans);
  }

  /* ── cart items ── */
  .lv-items { padding: 0 20px; }
  .lv-item {
    display: grid;
    grid-template-columns: 72px 1fr auto;
    gap: 14px;
    padding: 16px 0;
    border-bottom: 1px solid var(--lv-border);
    align-items: start;
  }
  .lv-item:last-child { border-bottom: none; }
  .lv-item-img-wrap {
    width: 72px; height: 88px;
    border-radius: var(--lv-radius);
    overflow: hidden; flex-shrink: 0;
    background: var(--lv-warm);
    position: relative;
  }
  .lv-item-img {
    width: 100%; height: 100%;
    object-fit: cover; display: block;
    transition: transform .3s ease;
  }
  .lv-item:hover .lv-item-img { transform: scale(1.04); }
  .lv-item-disc-ribbon {
    position: absolute; bottom: 0; left: 0; right: 0;
    background: rgba(14,13,11,.72);
    font-size: 9px; font-weight: 600;
    color: #fff; letter-spacing: .06em;
    text-align: center; padding: 3px 0;
    font-family: var(--lv-mono);
  }
  .lv-item-name {
    font-size: 13px; font-weight: 500;
    color: var(--lv-ink); line-height: 1.35;
    display: -webkit-box; -webkit-line-clamp: 2;
    -webkit-box-orient: vertical; overflow: hidden;
  }
  .lv-item-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 5px; }
  .lv-tag {
    font-size: 10px; font-weight: 500;
    color: var(--lv-muted);
    background: var(--lv-warm);
    padding: 2px 7px; border-radius: 3px;
  }
  .lv-tag-custom {
    font-size: 10px; font-weight: 500;
    color: #4f46e5; background: #f0effb;
    padding: 2px 7px; border-radius: 3px;
  }
  .lv-item-stepper {
    display: inline-flex; align-items: center;
    border: 1px solid var(--lv-border);
    border-radius: 999px; overflow: hidden;
    height: 28px; margin-top: 8px;
    background: var(--lv-cream);
  }
  .lv-step-btn {
    width: 28px; height: 28px;
    border: none; background: none;
    font-size: 15px; font-weight: 300;
    color: var(--lv-ink); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background .12s; font-family: var(--lv-sans);
  }
  .lv-step-btn:hover { background: var(--lv-warm); }
  .lv-step-btn:disabled { color: #ccc; cursor: not-allowed; }
  .lv-step-qty {
    font-size: 12px; font-weight: 500;
    color: var(--lv-ink);
    padding: 0 10px;
    border-left: 1px solid var(--lv-border);
    border-right: 1px solid var(--lv-border);
    font-family: var(--lv-mono);
    user-select: none;
  }
  .lv-item-price {
    text-align: right; padding-top: 2px;
  }
  .lv-item-price-final {
    font-size: 14px; font-weight: 600;
    color: var(--lv-ink);
    font-family: var(--lv-mono);
  }
  .lv-item-price-original {
    font-size: 11px; color: #c0bdb5;
    text-decoration: line-through;
    font-family: var(--lv-mono); margin-top: 2px;
  }
  .lv-stock-warn {
    font-size: 10px; font-weight: 500; color: #92681c;
    margin-top: 5px;
  }

  /* ── promo ── */
  .lv-promo-block {
    margin: 0 20px 0;
    border-top: 1px solid var(--lv-border);
    padding: 16px 0;
  }
  .lv-promo-label {
    font-size: 10px; font-weight: 600;
    letter-spacing: .12em; text-transform: uppercase;
    color: var(--lv-muted); margin-bottom: 10px;
    display: flex; align-items: center; gap: 6px;
  }
  .lv-promo-row { display: flex; gap: 8px; }
  .lv-promo-input {
    flex: 1; height: 40px;
    border: 1px solid var(--lv-border);
    border-radius: var(--lv-radius);
    background: var(--lv-cream);
    padding: 0 12px;
    font-family: var(--lv-mono);
    font-size: 12px; font-weight: 500;
    color: var(--lv-ink); letter-spacing: .07em;
    outline: none;
    transition: border-color .18s;
  }
  .lv-promo-input:focus { border-color: var(--lv-gold); }
  .lv-promo-input::placeholder { font-family: var(--lv-sans); letter-spacing: 0; color: #bbb; font-size: 12px; }
  .lv-promo-btn {
    height: 40px; padding: 0 16px;
    border: none; border-radius: var(--lv-radius);
    font-family: var(--lv-sans);
    font-size: 11px; font-weight: 600;
    letter-spacing: .1em; text-transform: uppercase;
    cursor: pointer; white-space: nowrap;
    transition: opacity .15s;
  }
  .lv-promo-btn.apply  { background: var(--lv-ink); color: #fff; }
  .lv-promo-btn.remove { background: #fdf0ef; color: var(--lv-red); }
  .lv-promo-btn:disabled { opacity: .5; cursor: not-allowed; }
  .lv-promo-success {
    margin-top: 8px; font-size: 11px; color: var(--lv-green);
    display: flex; align-items: center; gap: 5px;
  }
  .lv-promo-error { margin-top: 8px; font-size: 11px; color: var(--lv-red); }

  /* ── price breakdown ── */
  .lv-price-block {
    background: var(--lv-warm);
    padding: 16px 20px;
    border-top: 1px solid var(--lv-border);
  }
  .lv-price-title {
    font-size: 9px; font-weight: 600;
    letter-spacing: .18em; text-transform: uppercase;
    color: var(--lv-muted); margin-bottom: 13px;
  }
  .lv-prow {
    display: flex; justify-content: space-between; align-items: center;
    font-size: 12px; color: var(--lv-muted);
    margin-bottom: 8px;
  }
  .lv-prow span:last-child { font-family: var(--lv-mono); font-size: 12px; }
  .lv-prow.green { color: var(--lv-green); }
  .lv-pdiv { height: 1px; background: var(--lv-border); margin: 11px 0; }
  .lv-ptotal {
    display: flex; justify-content: space-between; align-items: baseline;
    font-size: 15px; font-weight: 600; color: var(--lv-ink);
  }
  .lv-ptotal span:last-child { font-family: var(--lv-mono); font-size: 16px; }
  .lv-save-strip {
    margin-top: 13px;
    background: #edf7f2; border: 1px solid #b7e4cc;
    border-radius: var(--lv-radius);
    padding: 8px 12px;
    font-size: 11px; font-weight: 600; color: var(--lv-green);
    display: flex; align-items: center; gap: 6px;
  }

  /* ── entrance animation ── */
  @keyframes lv-rise {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .lv-left  { animation: lv-rise .4s ease both; }
  .lv-right { animation: lv-rise .4s .1s ease both; }
  .lv-item  { animation: lv-rise .3s ease both; }
  .lv-item:nth-child(1) { animation-delay: .05s }
  .lv-item:nth-child(2) { animation-delay: .10s }
  .lv-item:nth-child(3) { animation-delay: .15s }
  .lv-item:nth-child(4) { animation-delay: .20s }
  .lv-item:nth-child(5) { animation-delay: .25s }

  /* loading / empty */
  .lv-loading { display: flex; align-items: center; justify-content: center; min-height: 60vh; font-family: var(--lv-serif); font-size: 22px; font-weight: 300; color: var(--lv-muted); }
`;

// ─── COMPONENT ────────────────────────────────────────────────────────────────
const Checkout = () => {
  const [paymentMethod,         setPaymentMethod]         = useState("razorpay");
  const [submittingPayment,     setSubmittingPayment]     = useState(false);
  const [cartSyncFailed,        setCartSyncFailed]        = useState(false);
  const [paymentError,          setPaymentError]          = useState("");
  const [checkoutTraceId,       setCheckoutTraceId]       = useState(() => createCheckoutTraceId());
  const [savedAddresses,        setSavedAddresses]        = useState([]);
  const [loadingSavedAddresses, setLoadingSavedAddresses] = useState(false);
  const [saveAddressForFuture,  setSaveAddressForFuture]  = useState(false);
  const [setAddressAsDefault,   setSetAddressAsDefault]   = useState(false);
  const [promoCodeInput,        setPromoCodeInput]        = useState("");
  const [appliedPromo,          setAppliedPromo]          = useState(null);
  const [promoError,            setPromoError]            = useState("");
  const [promoLoading,          setPromoLoading]          = useState(false);
  const handledShiprocketReturnRef = useRef(false);
  const checkoutSubmitInFlightRef  = useRef(false);

  const showCheckoutError = (message) => { setPaymentError(message); checkoutDebug("checkout_inline_error", { message }); };

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { cart, loading, error } = useSelector((state) => state.cart);
  const { user, guestId }        = useSelector((state) => state.auth);

  const openPhoneAuthFlow = (redirectPath = "/checkout") => {
    dispatch(logout());
    dispatch(openPhoneAuthModal({ redirectPath }));
    navigate("/", { replace: true });
  };

  const displayItems   = cart?.products || [];
  const displayPricing = getCartPricing(displayItems);
  const dbFinalSubtotal = Number.isFinite(Number(cart?.totalPrice)) ? Number(cart.totalPrice) : displayPricing.finalSubtotal;

  const [shippingAddress, setShippingAddress] = useState({
    firstName: "", lastName: "", address: "", city: "",
    postalCode: "", country: "India", phone: user?.phone || "",
  });

  const applyShippingAddress = (addr) => {
    setShippingAddress({
      firstName: addr?.firstName || "", lastName: addr?.lastName || "",
      address: addr?.address || "", city: addr?.city || "",
      postalCode: addr?.postalCode || "", country: addr?.country || "India",
      phone: addr?.phone || "",
    });
    setPaymentError("");
  };

  const isSelectedSavedAddress = (addr) => {
    if (!addr) return false;
    return ["firstName", "lastName", "address", "city", "postalCode", "country", "phone"].every((key) => {
      return String(shippingAddress?.[key] || "").trim() === String(addr?.[key] || "").trim();
    });
  };

  const fetchSavedAddresses = async () => {
    const validToken = getValidToken();
    if (!validToken || !user?._id) return;
    try {
      setLoadingSavedAddresses(true);
      const { data } = await axios.get(`${API_BASE_URL}/api/users/addresses`, { headers: { Authorization: `Bearer ${validToken}` } });
      const addresses = Array.isArray(data?.addresses) ? data.addresses : [];
      setSavedAddresses(addresses);
    } catch (e) { console.error("[Checkout] Failed to fetch saved addresses", e); }
    finally { setLoadingSavedAddresses(false); }
  };

  const saveAddressForUser = async () => {
    if (!saveAddressForFuture) return;
    const validToken = getValidToken();
    if (!validToken || !user?._id) return;
    try {
      const { data } = await axios.post(`${API_BASE_URL}/api/users/addresses`,
        { address: shippingAddress, label: setAddressAsDefault ? "Default" : "Saved", setAsDefault: setAddressAsDefault },
        { headers: { Authorization: `Bearer ${validToken}` } }
      );
      setSavedAddresses(Array.isArray(data?.addresses) ? data.addresses : []);
    } catch (e) { console.error("[Checkout] Failed to save address", e); }
  };

  useEffect(() => {
    if (!cart?.products?.length && !checkoutSubmitInFlightRef.current && !submittingPayment) {
      navigate("/");
    }
  }, [cart, navigate, submittingPayment]);

  useEffect(() => {
    const token = getValidToken();
    const pixelId = import.meta.env.VITE_META_PIXEL_ID;
    if (pixelId && cart?.products?.length > 0 && token) {
      ReactPixel.track('InitiateCheckout', { content_ids: cart.products.map(p => p.productId), num_items: cart.products.length, value: Number.isFinite(Number(cart?.totalPrice)) ? Number(cart.totalPrice) : 0, currency: 'INR' });
    }
    checkoutDebug("checkout_mount", { checkoutTraceId, hasUser: Boolean(user), hasToken: Boolean(token) });
    if (!user || !token) { openPhoneAuthFlow("/checkout"); return; }
    const syncCart = async () => {
      const result = await dispatch(fetchCart({ userId: user?._id, guestId }));
      setCartSyncFailed(!fetchCart.fulfilled.match(result));
    };
    syncCart();
  }, [checkoutTraceId, dispatch, guestId, navigate, user]);

  useEffect(() => { fetchSavedAddresses(); }, [user?._id]);

  useEffect(() => {
    if (!user?.phone) return;
    setShippingAddress((cur) => String(cur?.phone || "").trim() ? cur : { ...cur, phone: user.phone });
  }, [user?.phone]);

  // ── shiprocket / razorpay handlers (unchanged logic) ──────────────────────
  const handleStartShiprocketHostedCheckout = async (checkoutId, clickEvent = null) => {
    const validToken = getValidToken();
    if (!validToken) { showCheckoutError("Session expired. Please login again."); openPhoneAuthFlow("/checkout"); return false; }
    const returnOrigin = resolveShiprocketReturnOrigin();
    const fallbackUrl  = `${returnOrigin}/checkout?sr_checkout_id=${encodeURIComponent(checkoutId)}`;
    try {
      setSubmittingPayment(true);
      const { data } = await axios.post(`${API_BASE_URL}/api/checkout/${checkoutId}/shiprocket/access-token`, { fallbackUrl }, { headers: { Authorization: `Bearer ${validToken}` } });
      const checkoutToken = data?.token;
      if (!checkoutToken) { showCheckoutError("Unable to start hosted checkout. Missing checkout token."); return false; }
      await ensureShiprocketCheckoutScript();
      let mounted = false;
      const callback = () => { mounted = true; };
      const launcherEvent = clickEvent || { preventDefault: () => {}, stopPropagation: () => {} };
      window.HeadlessCheckout.addToCart(launcherEvent, checkoutToken, { fallbackUrl: data?.fallbackUrl || fallbackUrl }, callback);
      window.setTimeout(() => {
        if (mounted || document.getElementById("headless-iframe")) return;
        showCheckoutError("Checkout did not open. Please disable browser extensions/content blockers and try again.");
      }, 1500);
      return true;
    } catch (e) {
      showCheckoutError(e?.response?.data?.msg || "Unable to open hosted checkout right now. Please try again.");
      setSubmittingPayment(false); return false;
    }
  };

  const handleStartRazorpayCheckout = async (checkoutId) => {
    const validToken = getValidToken();
    if (!validToken) { showCheckoutError("Session expired. Please login again."); openPhoneAuthFlow("/checkout"); return false; }
    try {
      setSubmittingPayment(true);
      const res = await loadRazorpayScript();
      if (!res) { showCheckoutError("Razorpay SDK failed to load. Are you offline?"); setSubmittingPayment(false); return false; }
      const { data } = await axios.post(`${API_BASE_URL}/api/checkout/${checkoutId}/razorpay/create-order`, {}, { headers: { Authorization: `Bearer ${validToken}` } });
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID, amount: data.amount, currency: data.currency,
        name: "Louis Veil", description: "Order Payment", order_id: data.id,
        handler: async (response) => {
          try {
            await axios.put(`${API_BASE_URL}/api/checkout/${checkoutId}/pay`, { paymentStatus: "paid", paymentDetails: { gateway: "razorpay", razorpay_order_id: response.razorpay_order_id, razorpay_payment_id: response.razorpay_payment_id, razorpay_signature: response.razorpay_signature, confirmed_at: new Date().toISOString() } }, { headers: { Authorization: `Bearer ${validToken}` } });
            await handleFinalizeCheckout(checkoutId);
          } catch { showCheckoutError("Payment verification failed."); setSubmittingPayment(false); checkoutSubmitInFlightRef.current = false; }
        },
        prefill: { name: `${shippingAddress.firstName} ${shippingAddress.lastName}`.trim(), contact: shippingAddress.phone },
        theme: { color: "#0e0d0b" },
        modal: { ondismiss: () => { setSubmittingPayment(false); checkoutSubmitInFlightRef.current = false; } }
      };
      const rzp1 = new window.Razorpay(options);
      rzp1.on("payment.failed", (response) => { showCheckoutError(response.error.description); setSubmittingPayment(false); checkoutSubmitInFlightRef.current = false; });
      rzp1.open(); return true;
    } catch (e) { showCheckoutError(e?.response?.data?.msg || "Unable to open Razorpay right now. Please try again."); setSubmittingPayment(false); return false; }
  };

  const handleFinalizeShiprocketRedirectPayment = async (checkoutId, transactionReference, redirectPayload) => {
    const validToken = getValidToken();
    if (!validToken) { showCheckoutError("Session expired. Please login again."); openPhoneAuthFlow("/checkout"); return; }
    try {
      setSubmittingPayment(true);
      await axios.put(`${API_BASE_URL}/api/checkout/${checkoutId}/pay`, { paymentStatus: "paid", paymentDetails: { gateway: "shiprocket_checkout", transaction_id: transactionReference, payment_id: transactionReference, source: "shiprocket_hosted_redirect", redirect_payload: redirectPayload, confirmed_at: new Date().toISOString() } }, { headers: { Authorization: `Bearer ${validToken}` } });
      await handleFinalizeCheckout(checkoutId);
    } catch (e) { showCheckoutError(e?.response?.data?.msg || "Payment completed but order finalization failed. Please contact support."); setSubmittingPayment(false); }
  };

  const handleCreateCheckout = async (e) => {
    e.preventDefault();
    if (checkoutSubmitInFlightRef.current) return;
    checkoutSubmitInFlightRef.current = true;
    setPaymentError("");
    const currentTraceId = createCheckoutTraceId();
    setCheckoutTraceId(currentTraceId);
    if (!shippingAddress.address || !shippingAddress.city || !shippingAddress.postalCode || !shippingAddress.country || !shippingAddress.phone) {
      showCheckoutError("Please fill all required fields."); checkoutSubmitInFlightRef.current = false; return;
    }
    if (!paymentMethod) { showCheckoutError("Please select a payment method."); checkoutSubmitInFlightRef.current = false; return; }
    await saveAddressForUser();
    const token = getValidToken();
    if (!token) { showCheckoutError("Session expired. Please login again."); openPhoneAuthFlow("/checkout"); checkoutSubmitInFlightRef.current = false; return; }
    const latestCartResult = await dispatch(fetchCart({ userId: user?._id, guestId }));
    if (!fetchCart.fulfilled.match(latestCartResult)) { setCartSyncFailed(true); showCheckoutError("Could not sync latest cart from server. Please try again."); checkoutSubmitInFlightRef.current = false; return; }
    setCartSyncFailed(false);
    const latestCart = latestCartResult.payload;
    if (latestCart?.products?.length > 0) {
      const res = await dispatch(createCheckout({ shippingAddress, paymentMethod, promoCode: appliedPromo ? appliedPromo.promoCode : undefined }));
      if (res.payload?._id) {
        if (paymentMethod === "razorpay") { const ok = await handleStartRazorpayCheckout(res.payload._id, e); if (!ok) { checkoutSubmitInFlightRef.current = false; } return; }
        if (paymentMethod === "shiprocket") { const ok = await handleStartShiprocketHostedCheckout(res.payload._id, e); if (!ok) { checkoutSubmitInFlightRef.current = false; } return; }
        await handleFinalizeCheckout(res.payload._id);
      } else {
        const errMsg = res.payload?.message || res.payload?.msg || "Checkout creation failed";
        if (errMsg.toLowerCase().includes("session expired") || errMsg.toLowerCase().includes("not authorized")) { showCheckoutError("Session expired. Please login again."); openPhoneAuthFlow("/checkout"); }
        else showCheckoutError(errMsg);
      }
    }
    checkoutSubmitInFlightRef.current = false;
  };

  const handleDecreaseQuantity = (item) => {
    if (item.quantity > 1) { dispatch(updateCartItemQuantity({ productId: item.productId, quantity: item.quantity - 1, guestId, userId: user?._id, size: item.size, color: item.color, customMeasurementKey: item.customMeasurementKey || '' })); return; }
    dispatch(removeFromCart({ productId: item.productId, guestId, userId: user?._id, size: item.size, color: item.color, customMeasurementKey: item.customMeasurementKey || '' }));
  };
  const handleIncreaseQuantity = (item) => {
    if (Number.isFinite(Number(item.countInStock)) && item.quantity >= Number(item.countInStock)) return;
    dispatch(updateCartItemQuantity({ productId: item.productId, quantity: item.quantity + 1, guestId, userId: user?._id, size: item.size, color: item.color, customMeasurementKey: item.customMeasurementKey || '' }));
  };

  const handleFinalizeCheckout = async (id) => {
    if (!id) return;
    const validToken = getValidToken();
    if (!validToken) { showCheckoutError("Session expired. Please login again."); openPhoneAuthFlow("/checkout"); return; }
    try {
      await axios.post(`${API_BASE_URL}/api/checkout/${id}/finalize`, {}, { headers: { Authorization: `Bearer ${validToken}` } });
      navigate("/order-confirmation");
    } catch (e) { showCheckoutError(e?.response?.data?.msg || "Order finalization failed. Please contact support."); }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkoutId          = params.get("sr_checkout_id");
    const transactionReference = params.get("fastrr_transaction_id") || params.get("oid");
    const checkoutStatus      = String(params.get("ost") || params.get("fastrr_status") || "").trim().toLowerCase();
    const hasFailureStatus    = checkoutStatus && checkoutStatus !== "success" && checkoutStatus !== "paid";
    if (!checkoutId || handledShiprocketReturnRef.current) return;
    if (!transactionReference && !checkoutStatus) return;
    handledShiprocketReturnRef.current = true;
    const redirectPayload = Object.fromEntries(params.entries());
    if (hasFailureStatus) { showCheckoutError("Payment was not completed. Please try again."); stripShiprocketReturnParams(); return; }
    handleFinalizeShiprocketRedirectPayment(checkoutId, transactionReference, redirectPayload).finally(() => stripShiprocketReturnParams());
  }, []);

  // ── render ─────────────────────────────────────────────────────────────────
  if (loading) return <div className="lv-co"><style>{CSS}</style><div className="lv-loading">Loading…</div></div>;
  if (!cart?.products?.length) return <div className="lv-co"><style>{CSS}</style><div className="lv-loading">Your cart is empty</div></div>;

  const totalItems = displayItems.reduce((s, i) => s + Number(i.quantity || 0), 0);
  const discountPct = displayPricing.originalSubtotal > 0 ? Math.round((displayPricing.totalDiscount / displayPricing.originalSubtotal) * 100) : 0;
  const finalTotal  = Math.max(0, dbFinalSubtotal - (appliedPromo?.discountAmount || 0));

  return (
    <div className="lv-co">
      <style>{CSS}</style>

      <div className="lv-grid">

        {/* ══ LEFT — SHIPPING + PAYMENT ══ */}
        <div className="lv-left">
          <p className="lv-eyebrow">Louis Veil</p>
          <h1 className="lv-section-title">Checkout</h1>

          <form onSubmit={handleCreateCheckout}>

            {/* Saved addresses */}
            {(savedAddresses.length > 0 || loadingSavedAddresses) && (
              <div className="lv-saved-block">
                <div className="lv-saved-header">
                  <span>Saved addresses</span>
                  {loadingSavedAddresses && <span style={{ fontFamily: 'var(--lv-sans)', fontSize: 10, color: 'var(--lv-muted)' }}>Loading…</span>}
                </div>
                {savedAddresses.slice(0, 3).map((addr) => (
                  <div key={addr._id} role="button" tabIndex={0} className={`lv-addr-btn${isSelectedSavedAddress(addr) ? ' selected' : ''}`} onClick={() => applyShippingAddress(addr)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') applyShippingAddress(addr); }}>
                    <div className="lv-addr-btn-name">
                      {[addr.firstName, addr.lastName].filter(Boolean).join(' ')}
                      {addr.isDefault && (
                        <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--lv-gold)', marginLeft: 8 }}>Default</span>
                      )}
                    </div>
                    <div className="lv-addr-btn-sub">{[addr.address, addr.city, addr.postalCode].filter(Boolean).join(', ')}</div>
                  </div>
                ))}
              </div>
            )}
            {!loadingSavedAddresses && savedAddresses.length === 0 && (
              <div className="lv-saved-block">
                <div className="lv-saved-header"><span>Saved addresses</span></div>
                <p className="lv-addr-empty">No saved addresses yet — fill once and we&apos;ll remember it.</p>
              </div>
            )}

            {/* Shipping fields */}
            <p className="lv-form-section-title" style={{ marginTop: 0 }}>Shipping address</p>

            <div className="lv-row" style={{ marginBottom: 12 }}>
              <div className="lv-field">
                <label className="lv-label">First name</label>
                <input className="lv-input" value={shippingAddress.firstName} onChange={(e) => setShippingAddress({ ...shippingAddress, firstName: e.target.value })} placeholder="Priya" required />
              </div>
              <div className="lv-field">
                <label className="lv-label">Last name</label>
                <input className="lv-input" value={shippingAddress.lastName} onChange={(e) => setShippingAddress({ ...shippingAddress, lastName: e.target.value })} placeholder="Sharma" required />
              </div>
            </div>

            {[
              { key: 'address',    label: 'Street address',  placeholder: '12 Linking Road, Bandra West' },
              { key: 'city',       label: 'City',             placeholder: 'Mumbai' },
              { key: 'postalCode', label: 'Postal code',      placeholder: '400050' },
              { key: 'country',    label: 'Country',          placeholder: 'India' },
              { key: 'phone',      label: 'Phone number',     placeholder: '+91 98765 43210' },
            ].map(({ key, label, placeholder }) => (
              <div className="lv-field" key={key} style={{ marginBottom: 12 }}>
                <label className="lv-label">{label}</label>
                <input
                  className="lv-input"
                  value={shippingAddress[key]}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, [key]: e.target.value })}
                  placeholder={placeholder}
                  required
                />
              </div>
            ))}

            <div className="lv-check-group">
              <label className="lv-check-label">
                <input
                  type="checkbox"
                  checked={saveAddressForFuture}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setSaveAddressForFuture(checked);
                    if (!checked) setSetAddressAsDefault(false);
                  }}
                />
                Save this address for faster checkout next time
              </label>
              {saveAddressForFuture && (
                <label className="lv-check-label">
                  <input type="checkbox" checked={setAddressAsDefault} onChange={(e) => setSetAddressAsDefault(e.target.checked)} />
                  Set as default address
                </label>
              )}
            </div>

            {/* Payment method */}
            <p className="lv-form-section-title">Payment method</p>
            <div className="lv-pay-grid">
              {[
                { id: 'COD',       title: 'Cash on delivery', sub: 'Pay securely at your doorstep after delivery.' },
                { id: 'razorpay',  title: 'Online payment',   sub: 'UPI, cards, wallets, or netbanking via Razorpay.' },
              ].map(({ id, title, sub }) => (
                <div key={id} className={`lv-pay-option${paymentMethod === id ? ' active' : ''}`} onClick={() => { setPaymentMethod(id); setPaymentError(""); }}>
                  <div>
                    <div className="lv-pay-title">{title}</div>
                    <div className="lv-pay-sub">{sub}</div>
                  </div>
                  <div className="lv-radio"><div className="lv-radio-dot" /></div>
                </div>
              ))}
            </div>

            {paymentMethod === "COD" && (
              <p className="lv-cod-note">COD selected — switch to Online Payment to pay instantly via Razorpay.</p>
            )}

            {/* Submit */}
            <button type="submit" className="lv-submit" disabled={submittingPayment}>
              {submittingPayment ? (
                'Processing…'
              ) : paymentMethod === "COD" ? (
                'Place order '
              ) : (
                <>
                  <span>Pay online</span>
                  <img src="https://cdn.shopify.com/extensions/019dce8a-3680-7b3c-a501-2f98bfaca250/shiprocket-smart-cart-221/assets/buy_button_icons.png" alt="UPI, cards, wallets" style={{ height: 18, opacity: .85 }} loading="lazy" />
                </>
              )}
            </button>

            {paymentError && <div className="lv-error">{paymentError}</div>}
          </form>
        </div>

        {/* ══ RIGHT — ORDER SUMMARY ══ */}
        <div className="lv-right">
          <div className="lv-panel">

            <div className="lv-panel-header">
              <span className="lv-panel-title">Your order</span>
              <span className="lv-item-count">{totalItems} {totalItems === 1 ? 'item' : 'items'}</span>
            </div>

            {(cartSyncFailed || error) && (
              <div style={{ padding: '10px 20px', fontSize: 12, color: 'var(--lv-red)', background: '#fdf0ef', borderBottom: '1px solid var(--lv-border)' }}>
                {cartSyncFailed ? "Could not sync cart with server." : error}
              </div>
            )}

            {/* Items */}
            <div className="lv-items">
              {displayItems.map((item) => {
                const pricing        = getItemPricing(item);
                const maxStockReached = Number.isFinite(Number(item.countInStock)) && item.quantity >= Number(item.countInStock);
                const measurements   = getCompactMeasurementLine(item.customMeasurements);
                const key            = `${item.productId}-${item.size || ''}-${item.color || ''}-${item.customMeasurementKey || ''}`;

                return (
                  <div className="lv-item" key={key}>
                    {/* image */}
                    <div className="lv-item-img-wrap">
                      <img src={item.image} alt={item.name} className="lv-item-img" loading="lazy" />
                      {pricing.hasDiscount && (
                        <div className="lv-item-disc-ribbon">{pricing.discountPercent}% OFF</div>
                      )}
                    </div>

                    {/* info */}
                    <div>
                      <div className="lv-item-name">{item.name}</div>
                      <div className="lv-item-tags">
                        {item.size  && <span className="lv-tag">{item.size}</span>}
                        {item.color && <span className="lv-tag">{item.color}</span>}
                        {measurements && <span className="lv-tag-custom">✦ Custom fit</span>}
                      </div>
                      <div className="lv-item-stepper">
                        <button type="button" className="lv-step-btn" onClick={() => handleDecreaseQuantity(item)} aria-label="Decrease">−</button>
                        <span className="lv-step-qty">{item.quantity}</span>
                        <button type="button" className="lv-step-btn" onClick={() => handleIncreaseQuantity(item)} disabled={maxStockReached} aria-label="Increase">+</button>
                      </div>
                      {maxStockReached && <div className="lv-stock-warn">Max stock reached</div>}
                    </div>

                    {/* price */}
                    <div className="lv-item-price">
                      <div className="lv-item-price-final">₹{(pricing.finalPrice * item.quantity).toFixed(0)}</div>
                      {pricing.hasDiscount && (
                        <div className="lv-item-price-original">₹{(pricing.originalPrice * item.quantity).toFixed(0)}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Promo code */}
            <div className="lv-promo-block">
              <div className="lv-promo-label">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                Promo code
              </div>
              <div className="lv-promo-row">
                <input
                  className="lv-promo-input"
                  value={promoCodeInput}
                  onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                  placeholder="e.g. VEIL20"
                  disabled={!!appliedPromo || promoLoading}
                />
                <button
                  type="button"
                  className={`lv-promo-btn ${appliedPromo ? 'remove' : 'apply'}`}
                  disabled={promoLoading}
                  onClick={async () => {
                    if (appliedPromo) { setAppliedPromo(null); setPromoCodeInput(""); setPromoError(""); return; }
                    if (!promoCodeInput.trim()) return;
                    setPromoLoading(true); setPromoError("");
                    try {
                      const { data } = await axios.post(`${API_BASE_URL}/api/promocode/validate`, { code: promoCodeInput, cartTotal: dbFinalSubtotal }, { headers: { Authorization: `Bearer ${getValidToken()}` } });
                      setAppliedPromo(data);
                    } catch (e) { setPromoError(e.response?.data?.msg || "Invalid promo code"); }
                    finally { setPromoLoading(false); }
                  }}
                >
                  {promoLoading ? "…" : appliedPromo ? "Remove" : "Apply"}
                </button>
              </div>
              {promoError   && <div className="lv-promo-error">{promoError}</div>}
              {appliedPromo && (
                <div className="lv-promo-success">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  {appliedPromo.msg}
                </div>
              )}
            </div>

            {/* Price breakdown */}
            <div className="lv-price-block">
              <div className="lv-price-title">Price summary</div>
              <div className="lv-prow"><span>Original subtotal</span><span>₹{displayPricing.originalSubtotal.toFixed(0)}</span></div>
              {displayPricing.totalDiscount > 0 && (
                <div className="lv-prow green"><span>Product discount</span><span>− ₹{displayPricing.totalDiscount.toFixed(0)}</span></div>
              )}
              {appliedPromo && (
                <div className="lv-prow green"><span>Promo — {appliedPromo.promoCode}</span><span>− ₹{appliedPromo.discountAmount.toFixed(0)}</span></div>
              )}
              <div className="lv-prow"><span>Shipping</span><span style={{ color: 'var(--lv-green)', fontWeight: 600 }}>Calculated at next step</span></div>
              <div className="lv-pdiv" />
              <div className="lv-ptotal"><span>Total</span><span>₹{finalTotal.toFixed(0)}</span></div>
              {displayPricing.totalDiscount > 0 && (
                <div className="lv-save-strip">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                  You&apos;re saving ₹{(displayPricing.totalDiscount + (appliedPromo?.discountAmount || 0)).toFixed(0)} ({discountPct}% off)
                </div>
              )}
            </div>

          </div>
        </div>
        {/* END RIGHT */}

      </div>
    </div>
  );
};

export default Checkout;