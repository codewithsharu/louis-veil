const https = require("https");
const crypto = require("crypto");
const { URL } = require("url");

const DEFAULT_SHIPROCKET_API_BASE = "https://apiv2.shiprocket.in/v1/external";
const DEFAULT_SHIPROCKET_CHECKOUT_API_BASE = "https://checkout-api.shiprocket.com";
const DEFAULT_SHIPROCKET_CHECKOUT_ORDER_API_BASE = "https://fastrr-api-dev.pickrr.com";
const SHIPROCKET_VARIANT_MULTIPLIER = 10;
const PHONE_PLACEHOLDER_EMAIL_DOMAIN = "@otp.local";
const SHIPROCKET_OTP_SESSION_TTL_MS = 10 * 60 * 1000;

const shiprocketOtpSessionCache = new Map();

const isShiprocketDebugEnabled = () => String(process.env.SHIPROCKET_DEBUG || "").trim().toLowerCase() === "true";
const logShiprocketDebug = (stage, payload) => {
  if (!isShiprocketDebugEnabled()) {
    return;
  }

  console.log(`[Shiprocket][Debug][${stage}]`, payload);
};

const stringifyErrorMessage = (value) => {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value?.message === "string") {
    return value.message;
  }

  try {
    return JSON.stringify(value);
  } catch (error) {
    return String(value);
  }
};

const getShiprocketConfig = () => ({
  apiBase: (process.env.SHIPROCKET_API_BASE || DEFAULT_SHIPROCKET_API_BASE).replace(/\/+$/, ""),
  email: (process.env.SHIPROCKET_EMAIL || "").trim(),
  password: (process.env.SHIPROCKET_PASSWORD || "").trim(),
  pickupLocation: (process.env.SHIPROCKET_PICKUP_LOCATION || "Primary").trim(),
  defaultWeightKg: Number(process.env.SHIPROCKET_DEFAULT_WEIGHT_KG || 0.5),
  defaultLengthCm: Number(process.env.SHIPROCKET_DEFAULT_LENGTH_CM || 25),
  defaultBreadthCm: Number(process.env.SHIPROCKET_DEFAULT_BREADTH_CM || 20),
  defaultHeightCm: Number(process.env.SHIPROCKET_DEFAULT_HEIGHT_CM || 4),
  fallbackBillingEmail: (process.env.SHIPROCKET_FALLBACK_EMAIL || "support@yourdomain.com").trim(),
});

const getShiprocketCheckoutConfig = () => ({
  apiBase: (process.env.SHIPROCKET_CHECKOUT_API_BASE || DEFAULT_SHIPROCKET_CHECKOUT_API_BASE).replace(/\/+$/, ""),
  orderApiBase: (process.env.SHIPROCKET_CHECKOUT_ORDER_API_BASE || DEFAULT_SHIPROCKET_CHECKOUT_ORDER_API_BASE).replace(/\/+$/, ""),
  apiKey: (process.env.NEW_OTP_API_KEY || "").trim(),
  apiSecret: (process.env.NEW_OTP_API_SECRET || "").trim(),
  currency: (process.env.SHIPROCKET_CHECKOUT_CURRENCY || "INR").trim() || "INR",
  useBearerApiKey: String(process.env.SHIPROCKET_CHECKOUT_API_KEY_USE_BEARER || "true").trim().toLowerCase() !== "false",
});

const tokenCache = {
  token: "",
  expiresAt: 0,
  email: "",
};

const isShiprocketConfigured = () => {
  const config = getShiprocketConfig();
  return Boolean(config.email && config.password);
};

const isShiprocketCheckoutConfigured = () => {
  const config = getShiprocketCheckoutConfig();
  return Boolean(config.apiKey && config.apiSecret);
};

const safeJsonParse = (raw) => {
  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
};

const requestJson = (method, rawUrl, payload, headers = {}) =>
  new Promise((resolve, reject) => {
    const url = new URL(rawUrl);
    const bodyString = payload ? JSON.stringify(payload) : "";

    const request = https.request(
      {
        method,
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || (url.protocol === "https:" ? 443 : 80),
        path: `${url.pathname}${url.search}`,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(bodyString ? { "Content-Length": Buffer.byteLength(bodyString) } : {}),
          ...headers,
        },
      },
      (response) => {
        let raw = "";
        response.on("data", (chunk) => {
          raw += chunk;
        });

        response.on("end", () => {
          const parsed = safeJsonParse(raw) || { raw };

          if (response.statusCode >= 200 && response.statusCode < 300) {
            resolve(parsed);
            return;
          }

          const error = new Error(
            stringifyErrorMessage(parsed?.message || parsed?.error || `Shiprocket request failed with status ${response.statusCode}`)
          );
          error.statusCode = response.statusCode;
          error.response = parsed;
          reject(error);
        });
      }
    );

    request.on("error", reject);

    if (bodyString) {
      request.write(bodyString);
    }

    request.end();
  });

const requestJsonWithRawBody = (method, rawUrl, rawBody, headers = {}) =>
  new Promise((resolve, reject) => {
    const url = new URL(rawUrl);
    const bodyString = typeof rawBody === "string" ? rawBody : String(rawBody || "");

    const request = https.request(
      {
        method,
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || (url.protocol === "https:" ? 443 : 80),
        path: `${url.pathname}${url.search}`,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(bodyString ? { "Content-Length": Buffer.byteLength(bodyString) } : {}),
          ...headers,
        },
      },
      (response) => {
        let raw = "";
        response.on("data", (chunk) => {
          raw += chunk;
        });

        response.on("end", () => {
          const parsed = safeJsonParse(raw) || { raw };

          if (response.statusCode >= 200 && response.statusCode < 300) {
            resolve(parsed);
            return;
          }

          const error = new Error(
            stringifyErrorMessage(parsed?.message || parsed?.error || `Shiprocket request failed with status ${response.statusCode}`)
          );
          error.statusCode = response.statusCode;
          error.response = parsed;
          reject(error);
        });
      }
    );

    request.on("error", reject);

    if (bodyString) {
      request.write(bodyString);
    }

    request.end();
  });

const getShiprocketToken = async () => {
  const config = getShiprocketConfig();

  if (!config.email || !config.password) {
    throw new Error("Shiprocket credentials are missing");
  }

  const now = Date.now();
  if (
    tokenCache.token &&
    tokenCache.expiresAt > now + 60 * 1000 &&
    tokenCache.email === config.email
  ) {
    return tokenCache.token;
  }

  const loginResponse = await requestJson("POST", `${config.apiBase}/auth/login`, {
    email: config.email,
    password: config.password,
  });

  const token = loginResponse?.token || loginResponse?.data?.token;
  if (!token) {
    throw new Error("Shiprocket login succeeded but no token was returned");
  }

  tokenCache.token = token;
  tokenCache.expiresAt = now + 8 * 60 * 1000;
  tokenCache.email = config.email;
  return token;
};

const normalizePhone = (value) => {
  const digitsOnly = String(value || "").replace(/\D/g, "");
  if (!digitsOnly) return "";

  if (digitsOnly.length >= 10) {
    return digitsOnly.slice(-10);
  }

  return digitsOnly;
};

const isPhonePlaceholderEmail = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .endsWith(PHONE_PLACEHOLDER_EMAIL_DOMAIN);

const getPreferredUserEmail = (user, fallbackEmail = "") => {
  const rawEmail = String(user?.email || "").trim().toLowerCase();
  if (!rawEmail || isPhonePlaceholderEmail(rawEmail)) {
    return String(fallbackEmail || "").trim().toLowerCase();
  }

  return rawEmail;
};

const dedupePayloads = (payloads = []) => {
  const seen = new Set();
  const uniquePayloads = [];

  for (const payload of payloads) {
    const serialized = JSON.stringify(payload || {});
    if (seen.has(serialized)) {
      continue;
    }

    seen.add(serialized);
    uniquePayloads.push(payload);
  }

  return uniquePayloads;
};

const isTruthyApiValue = (value) =>
  value === true || value === 1 || String(value || "").trim().toLowerCase() === "true";

const isShiprocketApiSuccess = (response) => {
  if (!response || typeof response !== "object") {
    return false;
  }

  if (Object.prototype.hasOwnProperty.call(response, "success")) {
    return isTruthyApiValue(response.success);
  }

  if (Object.prototype.hasOwnProperty.call(response, "status")) {
    return isTruthyApiValue(response.status);
  }

  return true;
};

const normalizeAmount = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return 0;
  }

  return Number(amount.toFixed(2));
};

const buildCheckoutCustomerDetails = ({ checkout, user }) => {
  const shippingAddress = checkout?.shippingAddress || {};
  const customerName = `${shippingAddress.firstName || ""} ${shippingAddress.lastName || ""}`.trim() || user?.name || "Customer";

  return {
    name: customerName,
    email: getPreferredUserEmail(user, ""),
    phone: normalizePhone(shippingAddress.verifiedPhone || shippingAddress.phone || shippingAddress.phoneNumber || user?.phone),
  };
};

const buildCheckoutAddressDetails = (checkout) => {
  const shippingAddress = checkout?.shippingAddress || {};

  return {
    first_name: String(shippingAddress.firstName || "").trim(),
    last_name: String(shippingAddress.lastName || "").trim(),
    address: String(shippingAddress.address || "").trim(),
    city: String(shippingAddress.city || "").trim(),
    state: String(shippingAddress.state || shippingAddress.city || "").trim(),
    postal_code: String(shippingAddress.postalCode || "").trim(),
    country: String(shippingAddress.country || "India").trim(),
    phone: normalizePhone(shippingAddress.phone || shippingAddress.phoneNumber),
  };
};

const buildShiprocketCheckoutPayload = ({ checkout, user, checkoutItems, fallbackUrl }) => {
  const orderId = String(checkout?._id || "").trim();

  const cartItems = checkoutItems.map((item) => ({
    variant_id: String(item.variantId),
    quantity: Number(item.quantity || 1),
  }));

  return {
    cart_data: {
      items: cartItems,
      custom_attributes: {
        source: "custom_website",
        checkout_id: orderId,
      },
      mobile_app: false,
    },
    redirect_url: fallbackUrl || "",
    timestamp: new Date().toISOString(),
  };
};

const extractCheckoutToken = (response) => {
  const tokenCandidates = [
    response?.token,
    response?.checkout_token,
    response?.access_token,
    response?.data?.token,
    response?.data?.checkout_token,
    response?.data?.access_token,
    response?.result?.token,
    response?.result?.checkout_token,
    response?.result?.access_token,
  ];

  const token = tokenCandidates.find((candidate) => typeof candidate === "string" && candidate.trim());
  return token ? token.trim() : "";
};

const createCheckoutSignature = (payloadString, secret, encoding) =>
  crypto.createHmac("sha256", secret).update(payloadString).digest(encoding);

const pruneShiprocketOtpSessions = () => {
  const now = Date.now();
  for (const [phone, session] of shiprocketOtpSessionCache.entries()) {
    if (!session?.expiresAt || session.expiresAt <= now) {
      shiprocketOtpSessionCache.delete(phone);
    }
  }
};

const setShiprocketOtpSessionToken = (phone, token) => {
  pruneShiprocketOtpSessions();
  shiprocketOtpSessionCache.set(phone, {
    token,
    expiresAt: Date.now() + SHIPROCKET_OTP_SESSION_TTL_MS,
  });
};

const getShiprocketOtpSessionToken = (phone) => {
  pruneShiprocketOtpSessions();
  const session = shiprocketOtpSessionCache.get(phone);
  if (!session?.token || session.expiresAt <= Date.now()) {
    shiprocketOtpSessionCache.delete(phone);
    return "";
  }

  return String(session.token || "").trim();
};

const getCheckoutApiHeaders = (
  payloadString,
  config,
  signatureEncoding = "base64",
  useBearerApiKey = config.useBearerApiKey
) => {
  const signature = createCheckoutSignature(payloadString, config.apiSecret, signatureEncoding);
  const apiKeyHeaderValue = useBearerApiKey
    ? `Bearer ${config.apiKey}`
    : config.apiKey;

  return {
    "X-Api-Key": apiKeyHeaderValue,
    "X-Api-HMAC-SHA256": signature,
  };
};

const initiateShiprocketS2SLogin = async ({ mobileNumber }) => {
  const normalizedPhone = normalizePhone(mobileNumber);
  if (!normalizedPhone || normalizedPhone.length !== 10) {
    return {
      success: false,
      skipped: true,
      reason: "A valid 10-digit mobile number is required",
    };
  }

  const config = getShiprocketCheckoutConfig();
  if (!config.apiKey || !config.apiSecret) {
    return {
      success: false,
      skipped: true,
      reason: "Shiprocket Checkout credentials are not configured",
    };
  }

  const payload = {
    country_code: "91",
    phone: normalizedPhone,
    modes: ["SMS"],
    timestamp: new Date().toISOString(),
  };

  const rawBody = JSON.stringify(payload, null, 4);
  const signature = createCheckoutSignature(rawBody, config.apiSecret, "base64");

  try {
    const response = await requestJsonWithRawBody(
      "POST",
      `${config.apiBase}/api/v1/access-token/s2s-login/initiate`,
      rawBody,
      {
        "X-Api-Key": config.apiKey,
        "X-Api-HMAC-SHA256": signature,
      }
    );

    const initiateToken = String(
      response?.result?.token ||
      response?.token ||
      response?.data?.token ||
      ""
    ).trim();

    if (!initiateToken) {
      return {
        success: false,
        skipped: false,
        reason: "Shiprocket initiate did not return token",
        error: response,
      };
    }

    setShiprocketOtpSessionToken(normalizedPhone, initiateToken);

    return {
      success: true,
      normalizedPhone,
      initiateToken,
      raw: response,
      payload,
    };
  } catch (error) {
    return {
      success: false,
      skipped: false,
      reason: stringifyErrorMessage(error?.message || error?.response || error) || "Unable to send OTP",
      error: error?.response || { message: error?.message, statusCode: error?.statusCode },
    };
  }
};

const verifyShiprocketS2SLogin = async ({ mobileNumber, otp, token }) => {
  const normalizedPhone = normalizePhone(mobileNumber);
  const normalizedOtp = String(otp || "").replace(/\D/g, "").trim();

  if (!normalizedPhone || normalizedPhone.length !== 10) {
    return {
      success: false,
      skipped: true,
      reason: "A valid 10-digit mobile number is required",
    };
  }

  if (!normalizedOtp || normalizedOtp.length < 4 || normalizedOtp.length > 8) {
    return {
      success: false,
      skipped: true,
      reason: "A valid OTP is required",
    };
  }

  const config = getShiprocketCheckoutConfig();
  if (!config.apiKey || !config.apiSecret) {
    return {
      success: false,
      skipped: true,
      reason: "Shiprocket Checkout credentials are not configured",
    };
  }

  const initiateToken = String(token || getShiprocketOtpSessionToken(normalizedPhone) || "").trim();
  if (!initiateToken) {
    return {
      success: false,
      skipped: true,
      reason: "Send OTP first before verification",
    };
  }

  const payload = {
    token: initiateToken,
    otp: normalizedOtp,
    user_address_consent: true,
  };

  const rawBody = JSON.stringify(payload, null, 4);

  try {
    const response = await requestJsonWithRawBody(
      "POST",
      `${config.apiBase}/api/v1/access-token/s2s-login/verify`,
      rawBody,
      {
        "Content-Type": "application/json",
      }
    );

    const authorizedCustomerToken = String(
      response?.result?.authorised_customer_token ||
      response?.authorised_customer_token ||
      response?.data?.authorised_customer_token ||
      ""
    ).trim();

    if (!authorizedCustomerToken) {
      return {
        success: false,
        skipped: false,
        reason: "Shiprocket verify did not return authorized customer token",
        error: response,
      };
    }

    shiprocketOtpSessionCache.delete(normalizedPhone);

    return {
      success: true,
      normalizedPhone,
      initiateToken,
      authorizedCustomerToken,
      raw: response,
      payload,
    };
  } catch (error) {
    return {
      success: false,
      skipped: false,
      reason: stringifyErrorMessage(error?.message || error?.response || error) || "Unable to verify OTP",
      error: error?.response || { message: error?.message, statusCode: error?.statusCode },
    };
  }
};

const toIsoOrBlank = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
};

const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-") || "collection";

const toLongIdFromHex = (value, salt = 0) => {
  const numeric = Number.parseInt(String(value).replace(/[^a-fA-F0-9]/g, "").slice(-12), 16);
  if (Number.isFinite(numeric)) {
    return numeric + salt;
  }
  return Date.now() + salt;
};

const toLongIdFromString = (value, salt = 0) => {
  let hash = 0;
  const input = String(value || "collection");
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }
  return Number(hash) + salt;
};

const getEffectivePrice = (product) => {
  const regularPrice = Number(product?.price);
  const discountedPrice = Number(product?.discountPrice);

  if (Number.isFinite(discountedPrice) && discountedPrice > 0 && discountedPrice < regularPrice) {
    return discountedPrice;
  }

  return Number.isFinite(regularPrice) ? regularPrice : 0;
};

const mapProductForCatalogWebhook = (product) => {
  const productId = toLongIdFromHex(product?._id);
  const sizes = Array.isArray(product?.sizes) && product.sizes.length ? product.sizes : ["Default"];
  const colors = Array.isArray(product?.colors) && product.colors.length ? product.colors : ["Default"];
  const effectivePrice = getEffectivePrice(product);
  const firstImage = Array.isArray(product?.images) && product.images[0] ? product.images[0].url : "";
  const weight = Number(product?.weight || 0.5);

  const variants = [];
  let variantIndex = 0;

  for (const color of colors) {
    for (const size of sizes) {
      if (variantIndex >= 25) {
        break;
      }

      variants.push({
        id: productId * SHIPROCKET_VARIANT_MULTIPLIER + variantIndex + 1,
        title: `${color} / ${size}`,
        price: effectivePrice.toFixed(2),
        quantity: Number(product?.countInStock || 0),
        sku: `${product?.sku || productId}-${String(color).replace(/\s+/g, "").toUpperCase()}-${String(size).replace(/\s+/g, "").toUpperCase()}`,
        updated_at: toIsoOrBlank(product?.updatedAt),
        image: {
          src: firstImage,
        },
        weight,
      });

      variantIndex += 1;
    }

    if (variantIndex >= 25) {
      break;
    }
  }

  return {
    id: productId,
    title: String(product?.name || ""),
    body_html: `<p>${product?.description || ""}</p>`,
    vendor: String(product?.brand || ""),
    product_type: String(product?.category || ""),
    updated_at: toIsoOrBlank(product?.updatedAt),
    status: product?.isPublished ? "active" : "draft",
    variants,
    image: {
      src: firstImage,
    },
  };
};

const buildCollectionPayload = ({ title, imageSrc, updatedAt }) => ({
  id: toLongIdFromString(title),
  updated_at: toIsoOrBlank(updatedAt),
  title: String(title || ""),
  body_html: `<p>${String(title || "")} collection</p>`,
  handle: slugify(title),
  image: {
    src: String(imageSrc || ""),
  },
});

const sendCheckoutApiSignedPost = async ({ path, payload, apiBase }) => {
  const config = getShiprocketCheckoutConfig();
  if (!config.apiKey || !config.apiSecret) {
    return {
      success: false,
      skipped: true,
      reason: "Shiprocket Checkout credentials are not configured",
    };
  }

  const payloadString = JSON.stringify(payload || {});
  const signatureEncodings = ["base64", "hex"];
  const attempts = [];

  logShiprocketDebug("checkout_signed_post_request", {
    path,
    apiBase: String(apiBase || config.apiBase),
    useBearerApiKey: config.useBearerApiKey,
    payloadSizeBytes: Buffer.byteLength(payloadString),
  });

  for (const encoding of signatureEncodings) {
    try {
      const headers = getCheckoutApiHeaders(payloadString, config, encoding);
      logShiprocketDebug("checkout_signed_post_attempt", {
        path,
        signatureEncoding: encoding,
      });

      const response = await requestJson(
        "POST",
        `${String(apiBase || config.apiBase).replace(/\/+$/, "")}${path}`,
        payload,
        headers
      );

      return {
        success: true,
        raw: response,
        signatureEncoding: encoding,
      };
    } catch (error) {
      const errorMessage = stringifyErrorMessage(error?.message || error?.response || error);
      attempts.push({
        signatureEncoding: encoding,
        statusCode: error?.statusCode,
        message: errorMessage,
        response: error?.response,
      });

      logShiprocketDebug("checkout_signed_post_attempt_failed", {
        path,
        signatureEncoding: encoding,
        statusCode: error?.statusCode,
        message: errorMessage,
      });
    }
  }

  const latestAttempt = attempts[attempts.length - 1] || {};
  return {
    success: false,
    skipped: false,
    reason: latestAttempt.message || "Shiprocket Checkout API request failed",
    error: latestAttempt.response || latestAttempt,
    attempts,
  };
};

const syncShiprocketProductWebhook = async (product) => {
  if (!product) {
    return {
      success: false,
      skipped: true,
      reason: "Product payload missing",
    };
  }

  return sendCheckoutApiSignedPost({
    path: "/wh/v1/custom/product",
    payload: mapProductForCatalogWebhook(product),
  });
};

const syncShiprocketCollectionWebhook = async ({ title, imageSrc, updatedAt }) => {
  if (!String(title || "").trim()) {
    return {
      success: false,
      skipped: true,
      reason: "Collection title missing",
    };
  }

  return sendCheckoutApiSignedPost({
    path: "/wh/v1/custom/collection",
    payload: buildCollectionPayload({ title, imageSrc, updatedAt }),
  });
};

const fetchShiprocketCheckoutOrderDetails = async ({ orderId, timestamp }) => {
  const config = getShiprocketCheckoutConfig();
  const normalizedOrderId = String(orderId || "").trim();

  if (!config.apiKey || !config.apiSecret) {
    return {
      success: false,
      skipped: true,
      reason: "Shiprocket Checkout credentials are not configured",
    };
  }

  if (!normalizedOrderId) {
    return {
      success: false,
      skipped: true,
      reason: "order_id is required",
    };
  }

  const payload = {
    order_id: normalizedOrderId,
    timestamp: String(timestamp || new Date().toISOString()),
  };

  const apiResult = await sendCheckoutApiSignedPost({
    path: "/api/v1/custom-platform-order/details",
    payload,
    apiBase: config.orderApiBase,
  });

  if (!apiResult.success) {
    return apiResult;
  }

  return {
    success: true,
    raw: apiResult.raw,
    payload,
    signatureEncoding: apiResult.signatureEncoding,
  };
};

const formatOrderDate = (value) => {
  const date = value ? new Date(value) : new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

const createShiprocketOrder = async ({ order, user }) => {
  const config = getShiprocketConfig();

  if (!config.email || !config.password) {
    return {
      success: false,
      skipped: true,
      reason: "Shiprocket credentials are not configured",
    };
  }

  if (!order) {
    return {
      success: false,
      skipped: true,
      reason: "Order payload missing for Shiprocket sync",
    };
  }

  const shippingAddress = order.shippingAddress || {};
  const orderItems = Array.isArray(order.orderItems) ? order.orderItems : [];

  if (!orderItems.length) {
    return {
      success: false,
      skipped: true,
      reason: "Order has no items for Shiprocket sync",
    };
  }

  const customerName = `${shippingAddress.firstName || ""} ${shippingAddress.lastName || ""}`.trim() || user?.name || "Customer";
  const customerLastName = shippingAddress.lastName || "Customer";
  const customerPhone = normalizePhone(shippingAddress.verifiedPhone || shippingAddress.phone || shippingAddress.phoneNumber || user?.phone);

  if (!customerPhone) {
    return {
      success: false,
      skipped: true,
      reason: "Shipping phone number missing for Shiprocket sync",
    };
  }

  const verifiedPhone = shippingAddress.verifiedPhone || user?.phone || "";
  const enteredPhone = shippingAddress.phone || shippingAddress.phoneNumber || "";
  const baseAddress = shippingAddress.address || "NA";
  
  let finalAddressString = baseAddress;
  if (verifiedPhone) {
      finalAddressString += `, Verified OTP: ${verifiedPhone}`;
  }
  if (enteredPhone && normalizePhone(enteredPhone) !== normalizePhone(verifiedPhone)) {
      finalAddressString += `, Alt No: ${enteredPhone}`;
  }

  const shipmentPayload = {
    order_id: order._id.toString(),
    order_date: formatOrderDate(order.createdAt),
    pickup_location: config.pickupLocation,
    billing_customer_name: customerName,
    billing_last_name: customerLastName,
    billing_address: finalAddressString,
    billing_city: shippingAddress.city || "NA",
    billing_pincode: shippingAddress.postalCode || "000000",
    billing_state: shippingAddress.state || shippingAddress.city || "NA",
    billing_country: shippingAddress.country || "India",
    billing_email: getPreferredUserEmail(user, config.fallbackBillingEmail),
    billing_phone: customerPhone,
    shipping_is_billing: false,
    shipping_customer_name: customerName,
    shipping_last_name: customerLastName,
    shipping_address: finalAddressString,
    shipping_city: shippingAddress.city || "NA",
    shipping_pincode: shippingAddress.postalCode || "000000",
    shipping_country: shippingAddress.country || "India",
    shipping_state: shippingAddress.state || shippingAddress.city || "NA",
    shipping_email: getPreferredUserEmail(user, config.fallbackBillingEmail),
    shipping_phone: normalizePhone(shippingAddress.phone || shippingAddress.phoneNumber || customerPhone),
    order_items: orderItems.map((item, index) => ({
      name: item.name,
      sku: `${String(item.productId || "SKU")}-${index + 1}`,
      units: Number(item.quantity || 1),
      selling_price: Number(item.price || 0),
      discount: 0,
      tax: 0,
      hsn: "",
    })),
    payment_method: order.paymentMethod === "COD" ? "COD" : "Prepaid",
    sub_total: Number(order.totalPrice || 0),
    length: config.defaultLengthCm,
    breadth: config.defaultBreadthCm,
    height: config.defaultHeightCm,
    weight: Number.isFinite(config.defaultWeightKg) ? config.defaultWeightKg : 0.5,
  };

  try {
    const token = await getShiprocketToken();
    const createResponse = await requestJson(
      "POST",
      `${config.apiBase}/orders/create/adhoc`,
      shipmentPayload,
      {
        Authorization: `Bearer ${token}`,
      }
    );

    const mapped = {
      shiprocketOrderId: String(
        createResponse?.order_id ||
          createResponse?.data?.order_id ||
          ""
      ),
      shiprocketShipmentId: String(
        createResponse?.shipment_id ||
          createResponse?.data?.shipment_id ||
          ""
      ),
      shiprocketAwbCode: String(
        createResponse?.awb_code ||
          createResponse?.data?.awb_code ||
          ""
      ),
      shiprocketCourierName: String(
        createResponse?.courier_name ||
          createResponse?.data?.courier_name ||
          ""
      ),
      shiprocketTrackingUrl: String(
        createResponse?.tracking_url ||
          createResponse?.data?.tracking_url ||
          ""
      ),
      shiprocketStatus: String(
        createResponse?.status ||
          createResponse?.data?.status ||
          "created"
      ),
    };

    return {
      success: true,
      mapped,
      raw: createResponse,
      payload: shipmentPayload,
    };
  } catch (error) {
    return {
      success: false,
      skipped: false,
      reason: error.message,
      error: error.response || { message: error.message },
      payload: shipmentPayload,
    };
  }
};

const createShiprocketCheckoutAccessToken = async ({ checkout, user, checkoutItems, fallbackUrl }) => {
  const config = getShiprocketCheckoutConfig();

  if (!config.apiKey || !config.apiSecret) {
    return {
      success: false,
      skipped: true,
      reason: "Shiprocket Checkout credentials are not configured",
    };
  }

  if (!checkout) {
    return {
      success: false,
      skipped: true,
      reason: "Checkout payload missing for Shiprocket Checkout",
    };
  }

  const normalizedItems = Array.isArray(checkoutItems) ? checkoutItems.filter(Boolean) : [];
  if (!normalizedItems.length) {
    return {
      success: false,
      skipped: true,
      reason: "Checkout has no items for Shiprocket Checkout",
    };
  }

  const payload = buildShiprocketCheckoutPayload({
    checkout,
    user,
    checkoutItems: normalizedItems,
    fallbackUrl,
  });

  logShiprocketDebug("checkout_access_token_request", {
    checkoutId: String(checkout?._id || ""),
    itemCount: normalizedItems.length,
    fallbackUrl,
    useBearerApiKey: config.useBearerApiKey,
    apiBase: config.apiBase,
  });

  const payloadString = JSON.stringify(payload);
  const signatureAttempts = ["base64", "hex"];
  const endpointAttempts = ["/api/v1/access-token/checkout", "/api/v1/access-token"];
  const apiKeyModeAttempts = [config.useBearerApiKey, !config.useBearerApiKey].filter(
    (value, index, list) => list.indexOf(value) === index
  );

  const errors = [];

  for (const endpointPath of endpointAttempts) {
    for (const useBearerApiKey of apiKeyModeAttempts) {
      for (const signatureEncoding of signatureAttempts) {
        try {
          const headers = getCheckoutApiHeaders(payloadString, config, signatureEncoding, useBearerApiKey);

          logShiprocketDebug("checkout_access_token_attempt", {
            checkoutId: String(checkout?._id || ""),
            endpointPath,
            signatureEncoding,
            useBearerApiKey,
          });

          const response = await requestJson(
            "POST",
            `${config.apiBase}${endpointPath}`,
            payload,
            headers
          );

          const token = extractCheckoutToken(response);
          if (!token) {
            return {
              success: false,
              skipped: false,
              reason: "Shiprocket Checkout token not found in API response",
              error: response,
              payload,
            };
          }

          logShiprocketDebug("checkout_access_token_attempt_success", {
            checkoutId: String(checkout?._id || ""),
            endpointPath,
            signatureEncoding,
            useBearerApiKey,
          });

          return {
            success: true,
            token,
            raw: response,
            payload,
            signatureEncoding,
          };
        } catch (error) {
          const errorMessage = stringifyErrorMessage(error?.message || error?.response || error);
          errors.push({
            endpointPath,
            useBearerApiKey,
            encoding: signatureEncoding,
            statusCode: error?.statusCode,
            message: errorMessage,
            response: error?.response,
          });

          logShiprocketDebug("checkout_access_token_attempt_failed", {
            checkoutId: String(checkout?._id || ""),
            endpointPath,
            signatureEncoding,
            useBearerApiKey,
            statusCode: error?.statusCode,
            message: errorMessage,
          });

          const statusCode = Number(error?.statusCode);
          const shouldContinue = statusCode === 511 || statusCode === 401 || statusCode === 403 || statusCode === 404;
          if (!shouldContinue) {
            break;
          }
        }
      }
    }
  }

  const primaryError = errors[errors.length - 1] || {};
  return {
    success: false,
    skipped: false,
    reason: stringifyErrorMessage(primaryError.message) || "Shiprocket Checkout token request failed",
    error: primaryError.response || primaryError,
    payload,
    attempts: errors,
  };
};

module.exports = {
  createShiprocketOrder,
  isShiprocketConfigured,
  createShiprocketCheckoutAccessToken,
  isShiprocketCheckoutConfigured,
  syncShiprocketProductWebhook,
  syncShiprocketCollectionWebhook,
  fetchShiprocketCheckoutOrderDetails,
  initiateShiprocketS2SLogin,
  verifyShiprocketS2SLogin,
};
