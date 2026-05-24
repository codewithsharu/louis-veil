import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
// PayPalButton import removed (not needed)
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
  if (fromEnv) {
    return fromEnv;
  }

  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") {
    return DEFAULT_SHIPROCKET_SELLER_DOMAIN;
  }

  return window.location.host;
};

const resolveShiprocketReturnOrigin = () => {
  const fromEnv = String(import.meta.env.VITE_SHIPROCKET_RETURN_ORIGIN || "").trim().replace(/\/+$/, "");
  if (fromEnv) {
    return fromEnv;
  }

  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") {
    return "https://louisveil.com";
  }

  return window.location.origin;
};

const ensureSellerDomainInput = () => {
  const sellerDomain = resolveShiprocketSellerDomain();
  const existing = document.getElementById("sellerDomain");
  if (existing) {
    existing.value = sellerDomain;
    return;
  }

  const input = document.createElement("input");
  input.type = "hidden";
  input.id = "sellerDomain";
  input.value = sellerDomain;
  document.body.appendChild(input);
};

const ensureShiprocketCheckoutStyle = () => {
  if (document.getElementById(SHIPROCKET_CHECKOUT_STYLE_ID)) {
    return;
  }

  const link = document.createElement("link");
  link.id = SHIPROCKET_CHECKOUT_STYLE_ID;
  link.rel = "stylesheet";
  link.href = SHIPROCKET_CHECKOUT_STYLE_URL;
  document.head.appendChild(link);
};

const ensureShiprocketCheckoutScript = () =>
  new Promise((resolve, reject) => {
    if (window.HeadlessCheckout?.addToCart) {
      resolve(window.HeadlessCheckout);
      return;
    }

    window.shiprocketCheckoutChannel = "CUSTOM";
    ensureSellerDomainInput();
    ensureShiprocketCheckoutStyle();

    const existingScript = document.getElementById(SHIPROCKET_CHECKOUT_SCRIPT_ID);
    if (existingScript) {
      existingScript.addEventListener(
        "load",
        () => {
          if (window.HeadlessCheckout?.addToCart) {
            resolve(window.HeadlessCheckout);
          } else {
            reject(new Error("Shiprocket script loaded but HeadlessCheckout is unavailable."));
          }
        },
        { once: true }
      );
      existingScript.addEventListener("error", () => reject(new Error("Failed to load Shiprocket checkout script.")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.id = SHIPROCKET_CHECKOUT_SCRIPT_ID;
    script.src = SHIPROCKET_CHECKOUT_SCRIPT_URL;
    script.async = true;
    script.onload = () => {
      if (window.HeadlessCheckout?.addToCart) {
        resolve(window.HeadlessCheckout);
      } else {
        reject(new Error("Shiprocket script loaded but checkout object is missing."));
      }
    };
    script.onerror = () => reject(new Error("Failed to load Shiprocket checkout script."));
    document.body.appendChild(script);
  });
const CUSTOM_MEASUREMENT_FIELDS = [
  { id: 'bustChest', shortLabel: 'Bust' },
  { id: 'waist', shortLabel: 'Waist' },
  { id: 'hips', shortLabel: 'Hips' },
  { id: 'shoulderWidth', shortLabel: 'Shoulder' },
  { id: 'sleeveLength', shortLabel: 'Sleeve' },
  { id: 'armhole', shortLabel: 'Armhole' },
  { id: 'bicepSize', shortLabel: 'Bicep' },
];

const getCompactMeasurementLine = (customMeasurements) => {
  if (!customMeasurements || typeof customMeasurements !== "object") {
    return "";
  }

  return CUSTOM_MEASUREMENT_FIELDS
    .filter((field) => Number.isFinite(Number(customMeasurements[field.id])))
    .map((field) => {
      const formattedValue = Number(customMeasurements[field.id]).toFixed(1).replace(".0", "");
      return `${field.shortLabel} ${formattedValue}"`;
    })
    .join(" | ");
};

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const stripShiprocketReturnParams = () => {
  const params = new URLSearchParams(window.location.search);
  [
    "sr_checkout_id",
    "oid",
    "ost",
    "fastrr_transaction_id",
    "fastrr_status",
    "seller",
    "seller_id",
    "fastrr_status_code",
    "fastrr_message",
  ].forEach((paramName) => params.delete(paramName));

  const nextSearch = params.toString();
  const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}`;
  window.history.replaceState({}, "", nextUrl);
};

const buildDirectShiprocketHostedUrl = (checkoutToken, fallbackUrl) => {
  const checkoutBase = "https://fastrr-boost-ui.pickrr.com/";
  const sellerDomain = resolveShiprocketSellerDomain();
  const cartPayload = window.btoa(encodeURIComponent(JSON.stringify([])));
  const channelPayload = window.btoa(
    encodeURIComponent(
      JSON.stringify({
        shop_name: "company-logo",
        shop_url: sellerDomain,
        redirectUrl: fallbackUrl,
        credInstalled: false,
      })
    )
  );

  const params = new URLSearchParams({
    platform: "CUSTOM",
    type: "cart",
    customCheckoutToken: String(checkoutToken || ""),
    cart: cartPayload,
    channel: channelPayload,
  });

  return `${checkoutBase}?${params.toString()}`;
};

const Checkout = () => {
  const [paymentMethod, setPaymentMethod] = useState("razorpay");
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [cartSyncFailed, setCartSyncFailed] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [checkoutTraceId, setCheckoutTraceId] = useState(() => createCheckoutTraceId());
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [loadingSavedAddresses, setLoadingSavedAddresses] = useState(false);
  const [saveAddressForFuture, setSaveAddressForFuture] = useState(true);
  const [setAddressAsDefault, setSetAddressAsDefault] = useState(true);
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const handledShiprocketReturnRef = useRef(false);
  const checkoutSubmitInFlightRef = useRef(false);

  const showCheckoutError = (message) => {
    setPaymentError(message);
    checkoutDebug("checkout_inline_error", { message });
  };

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { cart, loading, error } = useSelector((state) => state.cart);
  const { user, guestId } = useSelector((state) => state.auth);
  const openPhoneAuthFlow = (redirectPath = "/checkout") => {
    dispatch(logout());
    dispatch(openPhoneAuthModal({ redirectPath }));
    navigate("/", { replace: true });
  };
  const displayItems = cart?.products || [];
  const displayPricing = getCartPricing(displayItems);
  const dbFinalSubtotal = Number.isFinite(Number(cart?.totalPrice))
    ? Number(cart.totalPrice)
    : displayPricing.finalSubtotal;

  const [shippingAddress, setShippingAddress] = useState({
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    postalCode: "",
    country: "India",
    phone: user?.phone || "",
  });

  const applyShippingAddress = (nextAddress) => {
    setShippingAddress({
      firstName: nextAddress?.firstName || "",
      lastName: nextAddress?.lastName || "",
      address: nextAddress?.address || "",
      city: nextAddress?.city || "",
      postalCode: nextAddress?.postalCode || "",
      country: nextAddress?.country || "India",
      phone: nextAddress?.phone || "",
    });
    setPaymentError("");
  };

  const fetchSavedAddresses = async () => {
    const validToken = getValidToken();
    if (!validToken || !user?._id) return;

    try {
      setLoadingSavedAddresses(true);
      const { data } = await axios.get(`${API_BASE_URL}/api/users/addresses`, {
        headers: {
          Authorization: `Bearer ${validToken}`,
        },
      });

      const addresses = Array.isArray(data?.addresses) ? data.addresses : [];
      setSavedAddresses(addresses);

      const isCurrentAddressEmpty = !shippingAddress.address && !shippingAddress.city && !shippingAddress.phone;
      if (addresses.length > 0 && isCurrentAddressEmpty) {
        applyShippingAddress(addresses[0]);
      }
    } catch (addressError) {
      console.error("[Checkout][Frontend] Failed to fetch saved addresses", {
        message: addressError?.message,
        response: addressError?.response?.data,
      });
    } finally {
      setLoadingSavedAddresses(false);
    }
  };

  const saveAddressForUser = async () => {
    if (!saveAddressForFuture) return;

    const validToken = getValidToken();
    if (!validToken || !user?._id) return;

    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/api/users/addresses`,
        {
          address: shippingAddress,
          label: setAddressAsDefault ? "Default" : "Saved",
          setAsDefault: setAddressAsDefault,
        },
        {
          headers: {
            Authorization: `Bearer ${validToken}`,
          },
        }
      );

      const addresses = Array.isArray(data?.addresses) ? data.addresses : [];
      setSavedAddresses(addresses);
    } catch (addressError) {
      console.error("[Checkout][Frontend] Failed to save address", {
        message: addressError?.message,
        response: addressError?.response?.data,
      });
      // Address persistence should not block checkout payment flow.
    }
  };

  // Redirect if cart is empty
  useEffect(() => {
    if (!cart?.products?.length) {
      navigate("/");
    }
  }, [cart, navigate]);

  // Enforce authenticated checkout and refresh cart from DB prices.
  useEffect(() => {
    const token = getValidToken();
    
    // Meta Pixel: InitiateCheckout
    const pixelId = import.meta.env.VITE_META_PIXEL_ID;
    if (pixelId && cart?.products?.length > 0 && token) {
        ReactPixel.track('InitiateCheckout', {
            content_ids: cart.products.map(p => p.productId),
            num_items: cart.products.length,
            value: Number.isFinite(Number(cart?.totalPrice)) ? Number(cart.totalPrice) : 0,
            currency: 'INR'
        });
    }

    checkoutDebug("checkout_mount", {
      checkoutTraceId,
      hasUser: Boolean(user),
      hasToken: Boolean(token),
      guestId,
      cartItems: cart?.products?.length || 0,
      cartTotalPrice: cart?.totalPrice,
      currentUrl: window.location.href,
      appOrigin: window.location.origin,
      apiBaseUrl: API_BASE_URL,
      mode: import.meta.env.MODE,
    });

    if (!user || !token) {
      checkoutDebug("redirect_login_missing_auth", {
        hasUser: Boolean(user),
        hasToken: Boolean(token),
      });
      openPhoneAuthFlow("/checkout");
      return;
    }

    const syncCart = async () => {
      checkoutDebug("sync_cart_start", { checkoutTraceId, userId: user?._id, guestId, apiBaseUrl: API_BASE_URL });
      const result = await dispatch(fetchCart({ userId: user?._id, guestId }));
      checkoutDebug("sync_cart_result", {
        checkoutTraceId,
        requestStatus: result?.meta?.requestStatus,
        payloadItems: result?.payload?.products?.length || 0,
        payloadTotalPrice: result?.payload?.totalPrice,
        payloadTotalDiscount: result?.payload?.totalDiscount,
        payloadProducts: (result?.payload?.products || []).map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          originalPrice: item.originalPrice,
          discountPrice: item.discountPrice,
          discountPerItem: item.originalPrice - item.price,
          totalDiscountForThisItem: (item.originalPrice - item.price) * item.quantity,
          size: item.size,
          color: item.color,
        })),
        error: result?.error,
      });
      setCartSyncFailed(!fetchCart.fulfilled.match(result));
    };

    syncCart();
  }, [checkoutTraceId, dispatch, guestId, navigate, user]);

  useEffect(() => {
    fetchSavedAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  useEffect(() => {
    if (!user?.phone) {
      return;
    }

    setShippingAddress((current) => {
      if (String(current?.phone || "").trim()) {
        return current;
      }

      return {
        ...current,
        phone: user.phone,
      };
    });
  }, [user?.phone]);

  useEffect(() => {
    checkoutDebug("pricing_snapshot", {
      checkoutTraceId,
      cartTotalPrice: cart?.totalPrice,
      cartTotalDiscount: cart?.totalDiscount || 0,
      derivedOriginalSubtotal: displayPricing.originalSubtotal,
      derivedDiscount: displayPricing.totalDiscount,
      derivedFinalSubtotal: displayPricing.finalSubtotal,
      dbFinalSubtotal,
      discountPercentage: displayPricing.originalSubtotal > 0
        ? ((displayPricing.totalDiscount / displayPricing.originalSubtotal) * 100).toFixed(2) + "%"
        : "0%",
      displayItems: displayItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        originalPrice: item.originalPrice,
        discountPerItem: item.originalPrice - item.price,
        totalDiscountForItem: (item.originalPrice - item.price) * item.quantity,
      })),
    });
  }, [cart?.totalPrice, cart?.totalDiscount, displayPricing.originalSubtotal, displayPricing.totalDiscount, displayPricing.finalSubtotal, dbFinalSubtotal, displayItems, checkoutTraceId]);

  const handleStartShiprocketHostedCheckout = async (checkoutId, clickEvent = null) => {
    const validToken = getValidToken();
    if (!validToken) {
      showCheckoutError("Session expired. Please login again.");
      openPhoneAuthFlow("/checkout");
      return false;
    }

    const returnOrigin = resolveShiprocketReturnOrigin();
    const fallbackUrl = `${returnOrigin}/checkout?sr_checkout_id=${encodeURIComponent(checkoutId)}`;

    try {
      setSubmittingPayment(true);

      const { data } = await axios.post(
        `${API_BASE_URL}/api/checkout/${checkoutId}/shiprocket/access-token`,
        { fallbackUrl },
        {
          headers: {
            Authorization: `Bearer ${validToken}`,
          },
        }
      );

      const checkoutToken = data?.token;
      if (!checkoutToken) {
        showCheckoutError("Unable to start hosted checkout. Missing checkout token.");
        return false;
      }

      const directCheckoutUrl = buildDirectShiprocketHostedUrl(
        checkoutToken,
        data?.fallbackUrl || fallbackUrl
      );

      await ensureShiprocketCheckoutScript();

      let mounted = false;
      const callback = (eventData = {}) => {
        mounted = true;
        checkoutDebug("shiprocket_hosted_checkout_callback", {
          checkoutId,
          eventData,
        });
      };

      const launcherEvent = clickEvent || {
        preventDefault: () => {},
        stopPropagation: () => {},
      };

      checkoutDebug("shiprocket_hosted_checkout_init", {
        checkoutId,
        fallbackUrl: data?.fallbackUrl || fallbackUrl,
        directCheckoutUrl,
        sellerDomain: resolveShiprocketSellerDomain(),
      });

      window.HeadlessCheckout.addToCart(
        launcherEvent,
        checkoutToken,
        { fallbackUrl: data?.fallbackUrl || fallbackUrl },
        callback
      );

      window.setTimeout(() => {
        if (mounted || document.getElementById("headless-iframe")) {
          return;
        }

        checkoutDebug("shiprocket_hosted_checkout_not_mounted", {
          checkoutId,
          directCheckoutUrl,
        });

        showCheckoutError("Checkout did not open. Please disable browser extensions/content blockers and try again.");
      }, 1500);

      return true;
    } catch (hostedCheckoutError) {
      console.error("[Checkout][Frontend] Shiprocket hosted checkout initiation failed", {
        checkoutId,
        message: hostedCheckoutError?.message,
        response: hostedCheckoutError?.response?.data,
      });

      showCheckoutError(
        hostedCheckoutError?.response?.data?.msg ||
        "Unable to open hosted checkout right now. Please try again."
      );
      setSubmittingPayment(false);
      return false;
    }
  };

  const handleStartRazorpayCheckout = async (checkoutId) => {
    const validToken = getValidToken();
    if (!validToken) {
      showCheckoutError("Session expired. Please login again.");
      openPhoneAuthFlow("/checkout");
      return false;
    }

    try {
      setSubmittingPayment(true);
      const res = await loadRazorpayScript();
      if (!res) {
        showCheckoutError("Razorpay SDK failed to load. Are you offline?");
        setSubmittingPayment(false);
        return false;
      }

      const { data } = await axios.post(
        `${API_BASE_URL}/api/checkout/${checkoutId}/razorpay/create-order`,
        {},
        {
          headers: {
            Authorization: `Bearer ${validToken}`,
          },
        }
      );

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency,
        name: "Louisveil",
        description: "Order Payment",
        order_id: data.id,
        handler: async function (response) {
          try {
            await axios.put(
              `${API_BASE_URL}/api/checkout/${checkoutId}/pay`,
              {
                paymentStatus: "paid",
                paymentDetails: {
                  gateway: "razorpay",
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  confirmed_at: new Date().toISOString(),
                },
              },
              {
                headers: {
                  Authorization: `Bearer ${validToken}`,
                },
              }
            );
            await handleFinalizeCheckout(checkoutId);
          } catch (error) {
             showCheckoutError("Payment verification failed.");
             setSubmittingPayment(false);
             checkoutSubmitInFlightRef.current = false;
          }
        },
        prefill: {
          name: `${shippingAddress.firstName} ${shippingAddress.lastName}`.trim(),
          contact: shippingAddress.phone,
        },
        theme: {
          color: "#2874f0",
        },
        modal: {
          ondismiss: function () {
            setSubmittingPayment(false);
            checkoutSubmitInFlightRef.current = false;
          }
        }
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.on("payment.failed", function (response) {
        showCheckoutError(response.error.description);
        setSubmittingPayment(false);
        checkoutSubmitInFlightRef.current = false;
      });
      rzp1.open();
      return true;
    } catch (error) {
      showCheckoutError(
        error?.response?.data?.msg || "Unable to open Razorpay right now. Please try again."
      );
      setSubmittingPayment(false);
      return false;
    }
  };

  const handleFinalizeShiprocketRedirectPayment = async (checkoutId, transactionReference, redirectPayload) => {
    const validToken = getValidToken();
    if (!validToken) {
      showCheckoutError("Session expired. Please login again.");
      openPhoneAuthFlow("/checkout");
      return;
    }

    try {
      setSubmittingPayment(true);
      await axios.put(
        `${API_BASE_URL}/api/checkout/${checkoutId}/pay`,
        {
          paymentStatus: "paid",
          paymentDetails: {
            gateway: "shiprocket_checkout",
            transaction_id: transactionReference,
            payment_id: transactionReference,
            source: "shiprocket_hosted_redirect",
            redirect_payload: redirectPayload,
            confirmed_at: new Date().toISOString(),
          },
        },
        {
          headers: {
            Authorization: `Bearer ${validToken}`,
          },
        }
      );

      checkoutDebug("shiprocket_redirect_payment_marked_paid", {
        checkoutId,
        transactionReference,
      });

      await handleFinalizeCheckout(checkoutId);
    } catch (confirmError) {
      console.error("[Checkout][Frontend] Shiprocket redirect payment finalize failed", {
        checkoutId,
        transactionReference,
        message: confirmError?.message,
        response: confirmError?.response?.data,
      });

      showCheckoutError(
        confirmError?.response?.data?.msg ||
        "Payment completed but order finalization failed. Please contact support."
      );
      setSubmittingPayment(false);
    }
  };

  const handleCreateCheckout = async (e) => {
    e.preventDefault();
    if (checkoutSubmitInFlightRef.current) {
      checkoutDebug("create_checkout_ignored_duplicate_submit", {
        checkoutTraceId,
      });
      return;
    }

    checkoutSubmitInFlightRef.current = true;
    setPaymentError("");
    const currentTraceId = createCheckoutTraceId();
    setCheckoutTraceId(currentTraceId);
    checkoutDebug("create_checkout_clicked", {
      checkoutTraceId: currentTraceId,
      paymentMethod,
      shippingAddress,
      cartItems: cart?.products?.length || 0,
      cartTotalPrice: cart?.totalPrice,
    });

    if (
      !shippingAddress.address ||
      !shippingAddress.city ||
      !shippingAddress.postalCode ||
      !shippingAddress.country ||
      !shippingAddress.phone
    ) {
      showCheckoutError("Please fill all required fields.");
      checkoutSubmitInFlightRef.current = false;
      return;
    }
    if (!paymentMethod) {
      checkoutDebug("create_checkout_blocked_missing_payment_method");
      showCheckoutError("Please select a payment method.");
      checkoutSubmitInFlightRef.current = false;
      return;
    }

    await saveAddressForUser();

    const token = getValidToken();
    if (!token) {
      checkoutDebug("create_checkout_blocked_missing_token");
      showCheckoutError("Session expired. Please login again.");
      openPhoneAuthFlow("/checkout");
      checkoutSubmitInFlightRef.current = false;
      return;
    }

    // Always refresh cart before checkout so prices come from DB.
    const latestCartResult = await dispatch(fetchCart({ userId: user?._id, guestId }));
    checkoutDebug("create_checkout_sync_result", {
      checkoutTraceId: currentTraceId,
      requestStatus: latestCartResult?.meta?.requestStatus,
      payloadItems: latestCartResult?.payload?.products?.length || 0,
      payloadTotalPrice: latestCartResult?.payload?.totalPrice,
      payloadTotalDiscount: latestCartResult?.payload?.totalDiscount,
      payloadProducts: (latestCartResult?.payload?.products || []).map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        originalPrice: item.originalPrice,
        discountPerItem: item.originalPrice - item.price,
        totalDiscountForThisItem: (item.originalPrice - item.price) * item.quantity,
      })),
      error: latestCartResult?.error,
    });

    if (!fetchCart.fulfilled.match(latestCartResult)) {
      setCartSyncFailed(true);
      checkoutDebug("create_checkout_blocked_sync_failed", {
        checkoutTraceId: currentTraceId,
        payload: latestCartResult?.payload,
        error: latestCartResult?.error,
      });
      showCheckoutError("Could not sync latest cart from server. Please try again.");
      checkoutSubmitInFlightRef.current = false;
      return;
    }

    setCartSyncFailed(false);
    const latestCart = latestCartResult.payload;

    if (latestCart?.products?.length > 0) {
      console.log("[Checkout][Frontend] Creating checkout", {
        paymentMethod,
        itemCount: latestCart.products.length,
      });

      const res = await dispatch(
        createCheckout({
          shippingAddress,
          paymentMethod,
          promoCode: appliedPromo ? appliedPromo.promoCode : undefined
        })
      );

      checkoutDebug("create_checkout_dispatch_result", {
        checkoutTraceId: currentTraceId,
        requestStatus: res?.meta?.requestStatus,
        payloadTotalPrice: res?.payload?.totalPrice,
        payloadTraceId: res?.payload?.traceId,
        payloadCheckoutItems: res?.payload?.checkoutItems?.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          originalPrice: item.originalPrice,
        })),
        error: res?.error,
      });

      if (res.payload?._id) {
        checkoutDebug("create_checkout_success", {
          checkoutTraceId: currentTraceId,
          checkoutId: res.payload._id,
          totalPrice: res.payload.totalPrice,
          checkoutItems: res.payload.checkoutItems,
        });
        console.log("[Checkout][Frontend] Checkout created", {
          checkoutId: res.payload._id,
          totalPrice: res.payload.totalPrice,
        });
        if (paymentMethod === "razorpay") {
          const hostedCheckoutStarted = await handleStartRazorpayCheckout(res.payload._id, e);
          if (!hostedCheckoutStarted) {
            checkoutSubmitInFlightRef.current = false;
            return;
          }

          checkoutDebug("create_checkout_hosted_checkout_opened", {
            checkoutId: res.payload._id,
            paymentMethod,
          });

          return;
        }

        if (paymentMethod === "shiprocket") {
          const hostedCheckoutStarted = await handleStartShiprocketHostedCheckout(res.payload._id, e);
          if (!hostedCheckoutStarted) {
            checkoutSubmitInFlightRef.current = false;
            return;
          }

          checkoutDebug("create_checkout_hosted_checkout_opened", {
            checkoutId: res.payload._id,
            paymentMethod,
          });

          return;
        }

        checkoutDebug("create_checkout_finalize_start", {
          checkoutId: res.payload._id,
          paymentMethod,
        });
        await handleFinalizeCheckout(res.payload._id);
        checkoutSubmitInFlightRef.current = false;
        return;
      } else {
        const errMsg = res.payload?.message || res.payload?.msg || "Checkout creation failed";
        if (errMsg.toLowerCase().includes("session expired") || errMsg.toLowerCase().includes("not authorized")) {
          showCheckoutError("Session expired. Please login again.");
          openPhoneAuthFlow("/checkout");
          checkoutSubmitInFlightRef.current = false;
          return;
        }

        console.error("[Checkout][Frontend] Checkout creation failed", {
          checkoutTraceId: currentTraceId,
          payload: res.payload,
          error: res.error,
        });
        showCheckoutError(errMsg);
        checkoutSubmitInFlightRef.current = false;
      }
    }

    checkoutSubmitInFlightRef.current = false;
  };

  const handleDecreaseQuantity = (item) => {
    if (item.quantity > 1) {
      dispatch(
        updateCartItemQuantity({
          productId: item.productId,
          quantity: item.quantity - 1,
          guestId,
          userId: user?._id,
          size: item.size,
          color: item.color,
          customMeasurementKey: item.customMeasurementKey || '',
        })
      );
      return;
    }

    dispatch(
      removeFromCart({
        productId: item.productId,
        guestId,
        userId: user?._id,
        size: item.size,
        color: item.color,
        customMeasurementKey: item.customMeasurementKey || '',
      })
    );
  };

  const handleIncreaseQuantity = (item) => {
    if (Number.isFinite(Number(item.countInStock)) && item.quantity >= Number(item.countInStock)) {
      return;
    }

    dispatch(
      updateCartItemQuantity({
        productId: item.productId,
        quantity: item.quantity + 1,
        guestId,
        userId: user?._id,
        size: item.size,
        color: item.color,
        customMeasurementKey: item.customMeasurementKey || '',
      })
    );
  };

  const handleFinalizeCheckout = async (id) => {
    if (!id) {
      console.error("Checkout ID is missing.");
      return;
    }

    const validToken = getValidToken();
    if (!validToken) {
      showCheckoutError("Session expired. Please login again.");
      openPhoneAuthFlow("/checkout");
      return;
    }

    try {
      // Send request to finalize checkout
      await axios.post(
        `${API_BASE_URL}/api/checkout/${id}/finalize`,
        {},
        {
          headers: {
            Authorization: `Bearer ${validToken}`,
          },
        }
      );

      console.log("[Checkout][Frontend] Checkout finalized", { checkoutId: id });
      navigate("/order-confirmation");
    } catch (error) {
      console.error("[Checkout][Frontend] Finalize checkout failed", {
        checkoutId: id,
        message: error?.message,
        response: error?.response?.data,
      });
      showCheckoutError(error?.response?.data?.msg || "Order finalization failed. Please contact support.");
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkoutId = params.get("sr_checkout_id");
    const transactionReference = params.get("fastrr_transaction_id") || params.get("oid");
    const checkoutStatus = String(params.get("ost") || params.get("fastrr_status") || "").trim().toLowerCase();
    const hasFailureStatus = checkoutStatus && checkoutStatus !== "success" && checkoutStatus !== "paid";

    if (!checkoutId || handledShiprocketReturnRef.current) {
      return;
    }

    if (!transactionReference && !checkoutStatus) {
      return;
    }

    handledShiprocketReturnRef.current = true;
    const redirectPayload = Object.fromEntries(params.entries());

    if (hasFailureStatus) {
      checkoutDebug("shiprocket_redirect_payment_failed", {
        checkoutId,
        failedStatus: checkoutStatus,
        redirectPayload,
      });
      showCheckoutError("Payment was not completed. Please try again.");
      stripShiprocketReturnParams();
      return;
    }

    checkoutDebug("shiprocket_redirect_payment_detected", {
      checkoutId,
      transactionReference,
      redirectPayload,
    });

    handleFinalizeShiprocketRedirectPayment(checkoutId, transactionReference, redirectPayload)
      .finally(() => {
        stripShiprocketReturnParams();
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <p>Loading cart...</p>;
  if (!cart?.products?.length) return <p>Your cart is empty</p>;

  return (
    <div className="max-w-6xl mx-auto py-10 px-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Section - Shipping Details */}
      <div className="bg-white shadow-lg p-6">
        <h2 className="font-serif text-2xl tracking-wide mb-6 text-lv-dark">Checkout</h2>
        <form onSubmit={handleCreateCheckout}>
          <div className="space-y-4">


            <h3 className="text-lg font-semibold text-gray-700">
              Shipping Address
            </h3>
            <div className="rounded-md border border-[#dfe6f5] bg-[#f7f9ff] p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#1f5fd1]">Saved Addresses</p>
                {loadingSavedAddresses && <p className="text-xs text-gray-500">Loading...</p>}
              </div>
              {savedAddresses.length > 0 ? (
                <div className="mt-2 space-y-2">
                  {savedAddresses.slice(0, 3).map((savedAddress) => (
                    <button
                      key={savedAddress._id}
                      type="button"
                      onClick={() => applyShippingAddress(savedAddress)}
                      className="w-full rounded-md border border-[#d7e3ff] bg-white px-3 py-2 text-left hover:border-[#2874f0]"
                    >
                      <p className="text-sm font-semibold text-gray-900">
                        {(savedAddress.firstName || "").trim()} {(savedAddress.lastName || "").trim()} {savedAddress.isDefault ? "• Default" : ""}
                      </p>
                      <p className="text-xs text-gray-600 truncate">
                        {savedAddress.address}, {savedAddress.city}, {savedAddress.postalCode}
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-xs text-gray-600">No saved address yet. Fill once and we will save it for faster checkout.</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="First Name"
                className="w-full p-3 border border-gray-200 focus:outline-none focus:border-lv-gold"
                value={shippingAddress.firstName}
                onChange={(e) =>
                  setShippingAddress({
                    ...shippingAddress,
                    firstName: e.target.value,
                  })
                }
                required
              />
              <input
                type="text"
                placeholder="Last Name"
                className="w-full p-3 border border-gray-200 focus:outline-none focus:border-lv-gold"
                value={shippingAddress.lastName}
                onChange={(e) =>
                  setShippingAddress({
                    ...shippingAddress,
                    lastName: e.target.value,
                  })
                }
                required
              />
            </div>
            <input
              type="text"
              placeholder="Address"
              className="w-full p-3 border border-gray-200 focus:outline-none focus:border-lv-gold"
              value={shippingAddress.address}
              onChange={(e) =>
                setShippingAddress({
                  ...shippingAddress,
                  address: e.target.value,
                })
              }
              required
            />
            <input
              type="text"
              placeholder="City"
              className="w-full p-3 border border-gray-200 focus:outline-none focus:border-lv-gold"
              value={shippingAddress.city}
              onChange={(e) =>
                setShippingAddress({ ...shippingAddress, city: e.target.value })
              }
              required
            />
            <input
              type="text"
              placeholder="Postal Code"
              className="w-full p-3 border border-gray-200 focus:outline-none focus:border-lv-gold"
              value={shippingAddress.postalCode}
              onChange={(e) =>
                setShippingAddress({
                  ...shippingAddress,
                  postalCode: e.target.value,
                })
              }
              required
            />
            <input
              type="text"
              placeholder="Country"
              className="w-full p-3 border border-gray-200 focus:outline-none focus:border-lv-gold"
              value={shippingAddress.country}
              onChange={(e) =>
                setShippingAddress({
                  ...shippingAddress,
                  country: e.target.value,
                })
              }
              required
            />
            <input
              type="text"
              placeholder="Phone Number"
              className="w-full p-3 border border-gray-200 focus:outline-none focus:border-lv-gold"
              value={shippingAddress.phone}
              onChange={(e) =>
                setShippingAddress({
                  ...shippingAddress,
                  phone: e.target.value,
                })
              }
              required
            />

            <div className="rounded-md border border-gray-200 bg-gray-50 p-3 space-y-2">
              <label className="flex items-start gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={saveAddressForFuture}
                  onChange={(e) => setSaveAddressForFuture(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#2874f0]"
                />
                <span>Save this address for faster checkout next time</span>
              </label>
              {saveAddressForFuture && (
                <label className="flex items-start gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={setAddressAsDefault}
                    onChange={(e) => setSetAddressAsDefault(e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-[#2874f0]"
                  />
                  <span>Set as default address</span>
                </label>
              )}
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-4 rounded-md border border-[#dfe6f5] bg-[#f5f8ff] p-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-[#1f5fd1]">Order Summary</h3>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between text-gray-700">
                  <span>Items</span>
                  <span>{displayItems.reduce((total, item) => total + Number(item.quantity || 0), 0)}</span>
                </div>
                <div className="flex items-center justify-between text-gray-700">
                  <span>Original Price</span>
                  <span>₹{displayPricing.originalSubtotal.toFixed(2)}</span>
                </div>
                {displayPricing.totalDiscount > 0 && (
                  <div className="flex items-center justify-between text-green-700">
                    <span>Discount</span>
                    <span>-₹{displayPricing.totalDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-[#d7e3ff] pt-2 flex items-center justify-between text-base font-semibold text-gray-900">
                  <span>Total Payable</span>
                  <span>₹{dbFinalSubtotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <h3 className="text-lg font-semibold mb-4 text-gray-900">
              Payment Method
            </h3>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod("COD");
                  setPaymentError("");
                }}
                className={`w-full rounded-md border px-4 py-3 text-left transition-colors ${paymentMethod === "COD" ? "border-[#2874f0] bg-[#f0f5ff]" : "border-gray-300 bg-white hover:border-[#2874f0]/60"}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Cash on Delivery (COD)</p>
                    <p className="text-xs text-gray-600">Pay securely at your doorstep after delivery.</p>
                  </div>
                  <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full border ${paymentMethod === "COD" ? "border-[#2874f0] bg-[#2874f0] text-white" : "border-gray-300 bg-white text-transparent"}`}>
                    •
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentMethod("razorpay");
                  setPaymentError("");
                }}
                className={`w-full rounded-md border px-4 py-3 text-left transition-colors ${paymentMethod === "razorpay" ? "border-[#2874f0] bg-[#f0f5ff]" : "border-gray-300 bg-white hover:border-[#2874f0]/60"}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Online Payment</p>
                    <p className="text-xs text-gray-600">Pay securely via UPI, cards, wallets, or netbanking using Razorpay.</p>
                  </div>
                  <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full border ${paymentMethod === "razorpay" ? "border-[#2874f0] bg-[#2874f0] text-white" : "border-gray-300 bg-white text-transparent"}`}>
                    •
                  </span>
                </div>
              </button>
            </div>

            {paymentMethod === "COD" && (
              <p className="mt-3 text-xs text-amber-700">
                COD is selected. You can switch to Online Payment to pay instantly via Razorpay.
              </p>
            )}

            <button
              type="submit"
              disabled={submittingPayment}
              className="mt-4 w-full rounded-md bg-[#fb641b] py-3 text-sm font-semibold uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#f45b0f]"
            >
              {submittingPayment ? (
                "Processing..."
              ) : paymentMethod === "COD" ? (
                "Place Order (COD)"
              ) : (
                <span className="flex flex-wrap items-center justify-center gap-2">
                  <span>Pay Online</span>
                  <img
                    src="https://cdn.shopify.com/extensions/019dce8a-3680-7b3c-a501-2f98bfaca250/shiprocket-smart-cart-221/assets/buy_button_icons.png"
                    alt="UPI, cards, wallets, and netbanking"
                    className="h-5"
                    loading="lazy"
                  />
                </span>
              )}
            </button>

            {paymentError && (
              <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {paymentError}
              </div>
            )}
          </div>
        </form>
      </div>
      {/* Right Section - Order Summary */}
      <div className="bg-lv-cream/50 shadow-lg p-6">
        <h3 className="font-serif text-lg tracking-wide mb-4 text-lv-dark">
          Cart Items
        </h3>
        {cartSyncFailed && (
          <p className="mb-3 text-sm text-red-600">Could not sync cart with server. Discounted DB prices may be outdated until sync succeeds.</p>
        )}
        {error && (
          <p className="mb-3 text-sm text-red-600">{error}</p>
        )}
        <div className="space-y-4">
          {displayItems.map((item) => {
            const pricing = getItemPricing(item);
            const maxStockReached = Number.isFinite(Number(item.countInStock)) && item.quantity >= Number(item.countInStock);
            const compactMeasurementLine = getCompactMeasurementLine(item.customMeasurements);

            return (
              <div
                key={`${item.productId}-${item.size || ""}-${item.color || ""}-${item.customMeasurementKey || ""}`}
                className="flex justify-between items-center border-b pb-4"
              >
                <div className="flex items-center space-x-4">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div>
                    <p className="text-gray-800 font-medium">{item.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.color || "N/A"} / {item.size || "N/A"}</p>
                    {compactMeasurementLine && (
                      <p className="text-[11px] text-indigo-700 mt-1">{compactMeasurementLine}</p>
                    )}
                    <div className="mt-1 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDecreaseQuantity(item)}
                        className="h-7 w-7 border border-gray-300 text-gray-700 hover:border-lv-gold transition-colors"
                        aria-label={`Decrease quantity for ${item.name}`}
                      >
                        -
                      </button>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      <button
                        type="button"
                        onClick={() => handleIncreaseQuantity(item)}
                        className={`h-7 w-7 border text-gray-700 transition-colors ${maxStockReached ? "border-gray-200 text-gray-300 cursor-not-allowed" : "border-gray-300 hover:border-lv-gold"}`}
                        aria-label={`Increase quantity for ${item.name}`}
                        disabled={maxStockReached}
                      >
                        +
                      </button>
                    </div>
                    {maxStockReached && (
                      <p className="text-xs text-amber-700">Max stock reached</p>
                    )}
                    {pricing.hasDiscount && (
                      <p className="text-xs text-gray-500">
                        <span className="line-through mr-1">₹{pricing.originalPrice.toFixed(2)}</span>
                        <span className="text-green-600">{pricing.discountPercent}% OFF</span>
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-gray-800 font-medium">
                    ₹{(pricing.finalPrice * item.quantity).toFixed(2)}
                  </p>
                  {pricing.hasDiscount && (
                    <p className="text-xs text-gray-500 line-through">
                      ₹{(pricing.originalPrice * item.quantity).toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      {/* Detailed Price Section */}
      <div className="border-t pt-4 mt-4 space-y-2">
          {/* Promo Code Section */}
          <div className="mb-4 bg-white p-4 rounded shadow-sm border border-gray-100">
            <h4 className="text-sm font-semibold mb-2 text-gray-700">Have a Promo Code?</h4>
            <div className="flex gap-2">
              <input
                type="text"
                value={promoCodeInput}
                onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                placeholder="Enter Code"
                className="flex-1 border p-2 rounded text-sm focus:outline-none focus:border-lv-gold"
                disabled={appliedPromo || promoLoading}
              />
              <button
                type="button"
                onClick={async () => {
                  if (appliedPromo) {
                    setAppliedPromo(null);
                    setPromoCodeInput("");
                    setPromoError("");
                    return;
                  }
                  if (!promoCodeInput.trim()) return;
                  setPromoLoading(true);
                  setPromoError("");
                  try {
                    const { data } = await axios.post(`${API_BASE_URL}/api/promocode/validate`, {
                      code: promoCodeInput,
                      cartTotal: dbFinalSubtotal,
                    }, { headers: { Authorization: `Bearer ${getValidToken()}` } });
                    setAppliedPromo(data);
                  } catch (err) {
                    setPromoError(err.response?.data?.msg || "Invalid promo code");
                  } finally {
                    setPromoLoading(false);
                  }
                }}
                className={`px-4 py-2 text-sm font-semibold rounded text-white ${appliedPromo ? "bg-red-500 hover:bg-red-600" : "bg-lv-dark hover:bg-[#2a2a2a]"}`}
                disabled={promoLoading}
              >
                {promoLoading ? "..." : appliedPromo ? "Remove" : "Apply"}
              </button>
            </div>
            {promoError && <p className="text-red-500 text-xs mt-2">{promoError}</p>}
            {appliedPromo && <p className="text-green-600 text-xs mt-2">{appliedPromo.msg}</p>}
          </div>

          <div className="flex justify-between text-md text-gray-700">
              <span>Original Subtotal:</span>
          <span>₹{displayPricing.originalSubtotal.toFixed(2)}</span>
          </div>
        {displayPricing.totalDiscount > 0 && (
            <div className="flex justify-between text-md text-green-700">
                <span>Discount:</span>
            <span>-₹{displayPricing.totalDiscount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-md text-gray-700">
              <span>Subtotal (After Discount):</span>
          <span>₹{dbFinalSubtotal.toFixed(2)}</span>
          </div>
          {appliedPromo && (
            <div className="flex justify-between text-md text-green-700 font-medium">
                <span>Promo Code ({appliedPromo.promoCode}):</span>
                <span>-₹{appliedPromo.discountAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="border-t pt-2 flex justify-between text-lg font-semibold text-gray-800">
              <span>Total:</span>
          <span>₹{Math.max(0, dbFinalSubtotal - (appliedPromo?.discountAmount || 0)).toFixed(2)}</span>
          </div>
      </div>

      </div>
    </div>
  );
};

export default Checkout;
