import { useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../utils/config";
import { getValidToken } from "../utils/auth";

const SHIPROCKET_CHECKOUT_SCRIPT_ID = "shiprocket-headless-checkout-script";
const SHIPROCKET_CHECKOUT_SCRIPT_URL = "https://checkout-ui.shiprocket.com/assets/js/channels/shopify.js";
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
  const existing = document.getElementById("sellerDomain");
  const sellerDomain = resolveShiprocketSellerDomain();
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

const ensureShiprocketCheckoutScript = () =>
  new Promise((resolve, reject) => {
    if (window.HeadlessCheckout?.addToCart) {
      resolve(window.HeadlessCheckout);
      return;
    }

    window.shiprocketCheckoutChannel = "CUSTOM";
    ensureSellerDomainInput();

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

const defaultShippingAddress = {
  firstName: "Test",
  lastName: "User",
  address: "Test Address",
  city: "Delhi",
  postalCode: "110001",
  country: "India",
  phone: "9999999999",
};

const createDebugTraceId = () => `srdbg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const TestCheckoutPage = () => {
  const [manualCheckoutId, setManualCheckoutId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [stopOnFailure, setStopOnFailure] = useState(true);
  const [debugLogs, setDebugLogs] = useState([]);
  const [lastDirectCheckoutUrl, setLastDirectCheckoutUrl] = useState("");

  const appendDebugLog = (level, step, data = {}) => {
    const row = {
      time: new Date().toISOString(),
      level,
      step,
      data,
    };
    setDebugLogs((prev) => [...prev, row]);
    if (level === "error") {
      console.error(`[TestCheckoutPage][${step}]`, data);
      return;
    }
    console.log(`[TestCheckoutPage][${step}]`, data);
  };

  const launchHostedCheckout = async (clickEvent, checkoutId) => {
    const traceId = createDebugTraceId();
    const token = getValidToken();
    appendDebugLog("info", "launch_started", {
      traceId,
      checkoutId,
      hasClickEvent: Boolean(clickEvent),
      stopOnFailure,
      origin: window.location.origin,
      host: window.location.host,
      sellerDomain: resolveShiprocketSellerDomain(),
      apiBaseUrl: API_BASE_URL,
    });

    if (!token) {
      setMessage("Auth token missing. Please login first.");
      appendDebugLog("error", "auth_token_missing", { traceId });
      return;
    }

    const normalizedId = String(checkoutId || "").trim();
    if (!normalizedId) {
      setMessage("Checkout ID is required.");
      appendDebugLog("error", "checkout_id_missing", { traceId });
      return;
    }

    setLoading(true);
    setMessage("");
    setLastDirectCheckoutUrl("");

    try {
      const returnOrigin = resolveShiprocketReturnOrigin();
      const fallbackUrl = `${returnOrigin}/checkout-test?sr_checkout_id=${encodeURIComponent(normalizedId)}`;
      appendDebugLog("info", "fallback_url_ready", { traceId, fallbackUrl });

      try {
        const variantDebugResponse = await axios.get(
          `${API_BASE_URL}/api/checkout/${normalizedId}/shiprocket/variant-debug`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "X-Checkout-Debug-Trace": traceId,
            },
          }
        );

        appendDebugLog("info", "variant_debug_response", {
          traceId,
          status: variantDebugResponse.status,
          itemCount: variantDebugResponse?.data?.itemCount,
          items: variantDebugResponse?.data?.items,
        });
      } catch (variantError) {
        appendDebugLog("error", "variant_debug_failed", {
          traceId,
          message: variantError?.message,
          response: variantError?.response?.data,
        });
      }

      const { data } = await axios.post(
        `${API_BASE_URL}/api/checkout/${normalizedId}/shiprocket/access-token`,
        { fallbackUrl },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Checkout-Debug-Trace": traceId,
          },
        }
      );

      appendDebugLog("info", "access_token_response", {
        traceId,
        hasToken: Boolean(data?.token),
        tokenLength: String(data?.token || "").length,
        fallbackUrl: data?.fallbackUrl,
      });

      const checkoutToken = data?.token;
      if (!checkoutToken) {
        setMessage("Token not returned from backend.");
        appendDebugLog("error", "access_token_missing", { traceId, response: data });
        setLoading(false);
        return;
      }

      const directCheckoutUrl = buildDirectShiprocketHostedUrl(
        checkoutToken,
        data?.fallbackUrl || fallbackUrl
      );
      setLastDirectCheckoutUrl(directCheckoutUrl);
      appendDebugLog("info", "direct_checkout_url_built", {
        traceId,
        directCheckoutUrl,
      });

      await ensureShiprocketCheckoutScript();
      appendDebugLog("info", "launcher_script_ready", { traceId });

      let mounted = false;
      const callback = (eventData = {}) => {
        mounted = true;
        appendDebugLog("info", "launcher_callback", {
          traceId,
          eventData,
        });
      };

      const launcherEvent = clickEvent || {
        preventDefault: () => {},
        stopPropagation: () => {},
      };

      window.HeadlessCheckout.addToCart(
        launcherEvent,
        checkoutToken,
        { fallbackUrl: data?.fallbackUrl || fallbackUrl },
        callback
      );
      appendDebugLog("info", "launcher_invoked", { traceId });

      window.setTimeout(() => {
        if (mounted || document.getElementById("headless-iframe")) {
          setMessage(`Hosted checkout launched for ${normalizedId}`);
          appendDebugLog("info", "launcher_mounted", {
            traceId,
            mounted,
            hasIframe: Boolean(document.getElementById("headless-iframe")),
          });
          return;
        }

        appendDebugLog("error", "launcher_not_mounted", {
          traceId,
          stopOnFailure,
          directCheckoutUrl,
        });

        if (stopOnFailure) {
          setMessage("Checkout launcher failed. Stopped due to debug mode. See logs below.");
          return;
        }

        setMessage("Official launcher did not mount checkout. Use Direct Checkout URL below for manual open.");
      }, 1200);
    } catch (error) {
      appendDebugLog("error", "launch_exception", {
        traceId,
        message: error?.message,
        response: error?.response?.data,
      });
      setMessage(error?.response?.data?.msg || error?.message || "Failed to launch checkout.");
    } finally {
      setLoading(false);
    }
  };

  const createAndLaunch = async () => {
    const traceId = createDebugTraceId();
    const token = getValidToken();
    if (!token) {
      setMessage("Auth token missing. Please login first.");
      appendDebugLog("error", "create_auth_token_missing", { traceId });
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/api/checkout`,
        {
          shippingAddress: defaultShippingAddress,
          paymentMethod: "shiprocket",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      appendDebugLog("info", "create_checkout_response", {
        traceId,
        checkoutId: data?._id,
        totalPrice: data?.totalPrice,
      });

      const checkoutId = data?._id;
      if (!checkoutId) {
        setMessage("Checkout creation failed. Add items to cart first.");
        appendDebugLog("error", "create_checkout_missing_id", { traceId, response: data });
        setLoading(false);
        return;
      }

      setManualCheckoutId(checkoutId);
      await launchHostedCheckout(null, checkoutId);
    } catch (error) {
      appendDebugLog("error", "create_checkout_exception", {
        traceId,
        message: error?.message,
        response: error?.response?.data,
      });
      setMessage(error?.response?.data?.msg || error?.message || "Failed to create checkout.");
      setLoading(false);
    }
  };

  const copyDirectCheckoutUrl = async () => {
    if (!lastDirectCheckoutUrl) {
      return;
    }
    try {
      await navigator.clipboard.writeText(lastDirectCheckoutUrl);
      setMessage("Direct checkout URL copied.");
    } catch (error) {
      setMessage("Unable to copy URL. Copy it manually from the box.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold text-gray-900">Shiprocket Checkout Test Page</h1>
      <p className="mt-2 text-sm text-gray-600">
        Use this page to isolate hosted checkout launch. Login is required.
      </p>

      <div className="mt-6 rounded-md border border-gray-200 bg-white p-4">
        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={stopOnFailure}
            onChange={(event) => setStopOnFailure(event.target.checked)}
          />
          Stop on failure (do not auto-redirect)
        </label>

        <label className="block text-sm font-medium text-gray-700" htmlFor="checkout-id-input">
          Existing Checkout ID
        </label>
        <input
          id="checkout-id-input"
          type="text"
          value={manualCheckoutId}
          onChange={(event) => setManualCheckoutId(event.target.value)}
          placeholder="Paste checkout ID"
          className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={(event) => launchHostedCheckout(event, manualCheckoutId)}
            disabled={loading}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Please wait..." : "Launch With Checkout ID"}
          </button>

          <button
            type="button"
            onClick={() => createAndLaunch()}
            disabled={loading}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Please wait..." : "Create Checkout + Launch"}
          </button>
        </div>

        {lastDirectCheckoutUrl && (
          <div className="mt-4 rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
            <p className="font-semibold">Direct Checkout URL</p>
            <p className="mt-1 break-all">{lastDirectCheckoutUrl}</p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={copyDirectCheckoutUrl}
                className="rounded bg-blue-600 px-2 py-1 text-white"
              >
                Copy URL
              </button>
              <button
                type="button"
                onClick={() => window.open(lastDirectCheckoutUrl, "_blank", "noopener,noreferrer")}
                className="rounded bg-blue-800 px-2 py-1 text-white"
              >
                Open in New Tab
              </button>
            </div>
          </div>
        )}
      </div>

      {message && (
        <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {message}
        </p>
      )}

      <div className="mt-6 rounded-md border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Debug Timeline</h2>
          <button
            type="button"
            onClick={() => setDebugLogs([])}
            className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700"
          >
            Clear Logs
          </button>
        </div>
        <div className="mt-3 max-h-96 overflow-auto rounded bg-[#0b1020] p-3 text-xs text-[#d8e1ff]">
          {debugLogs.length === 0 ? (
            <p>No debug logs yet.</p>
          ) : (
            debugLogs.map((row, index) => (
              <pre key={`${row.time}_${index}`} className="mb-3 whitespace-pre-wrap break-words">
                {`${row.time} [${row.level.toUpperCase()}] ${row.step}\n${JSON.stringify(row.data, null, 2)}`}
              </pre>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TestCheckoutPage;
