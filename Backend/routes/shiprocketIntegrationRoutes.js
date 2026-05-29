const express = require("express");
const mongoose = require("mongoose");
const Product = require("../models/products");
const Order = require("../models/Order");
const Checkout = require("../models/Checkout");
const Cart = require("../models/cart");
const { protect, admin } = require("../middleware/authMiddleware");
const { fetchShiprocketCheckoutOrderDetails } = require("../services/shiprocketService");

const router = express.Router();
const SHIPROCKET_VARIANT_MULTIPLIER = 10;

const DEFAULT_ALLOWED_COLLECTIONS = [
  "Earrings",
  "Lockets",
  "Bracelets",
  "Pendants",
  "Combo",
];

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
const shouldDebugLog = () => String(process.env.SHIPROCKET_DEBUG || "").toLowerCase() === "true";
const logIntegrationDebug = (stage, data) => {
  if (!shouldDebugLog()) {
    return;
  }
  console.log(`[Shiprocket][Debug][${stage}]`, data);
};
const isValidWebhookRequest = (req) => {
  const expectedToken = String(process.env.SHIPROCKET_WEBHOOK_TOKEN || "").trim();
  if (!expectedToken) {
    return true;
  }

  const incomingToken = String(req.get("x-api-key") || "").trim();
  return Boolean(incomingToken) && incomingToken === expectedToken;
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

const getPaginationParams = (query) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 100));
  return { page, limit };
};

const toIsoOrBlank = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
};

const getAllowedCollections = () => {
  const fromEnv = String(process.env.ALLOWED_COLLECTIONS || "").trim();
  const values = (fromEnv
    ? fromEnv.split(",")
    : DEFAULT_ALLOWED_COLLECTIONS
  )
    .map((entry) => String(entry || "").trim())
    .filter(Boolean);

  return new Set(values.map((name) => name.toLowerCase()));
};

const isCodPaymentType = (value) => String(value || "").toLowerCase().includes("cod");

const getEffectivePrice = (product) => {
  const regularPrice = Number(product?.price);
  const discountedPrice = Number(product?.discountPrice);

  if (Number.isFinite(discountedPrice) && discountedPrice > 0 && discountedPrice < regularPrice) {
    return discountedPrice;
  }

  return Number.isFinite(regularPrice) ? regularPrice : 0;
};

const mapProductForShiprocket = (product) => {
  const productId = toLongIdFromHex(product._id);
  const sizes = Array.isArray(product.sizes) && product.sizes.length ? product.sizes : ["Default"];
  const colors = Array.isArray(product.colors) && product.colors.length ? product.colors : ["Default"];
  const effectivePrice = getEffectivePrice(product);
  const regularPrice = Number(product.price || effectivePrice);
  const firstImage = Array.isArray(product.images) && product.images[0] ? product.images[0].url : "";
  const weight = Number(product.weight || 0.5);
  const grams = Math.max(1, Math.round(weight * 1000));

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
        compare_at_price: regularPrice.toFixed(2),
        sku: `${product.sku || productId}-${String(color).replace(/\s+/g, "").toUpperCase()}-${String(size).replace(/\s+/g, "").toUpperCase()}`,
        quantity: Number(product.countInStock || 0),
        created_at: toIsoOrBlank(product.createdAt),
        updated_at: toIsoOrBlank(product.updatedAt),
        taxable: true,
        option_values: {
          Color: color,
          Size: size,
        },
        grams,
        image: {
          src: firstImage,
        },
        weight,
        weight_unit: "kg",
      });

      variantIndex += 1;
    }

    if (variantIndex >= 25) {
      break;
    }
  }

  return {
    id: productId,
    title: String(product.name || ""),
    body_html: `<p>${product.description || ""}</p>`,
    vendor: product.brand || "Louis Veil",
    product_type: product.category || "Fashion",
    created_at: toIsoOrBlank(product.createdAt),
    handle: slugify(product.name),
    updated_at: toIsoOrBlank(product.updatedAt),
    tags: Array.isArray(product.tags) ? product.tags.join(", ") : "",
    status: product.isPublished ? "active" : "draft",
    variants,
    image: {
      src: firstImage,
    },
    options: [
      {
        name: "Color",
        values: colors,
      },
      {
        name: "Size",
        values: sizes,
      },
    ],
  };
};

const getPublishedCollectionRows = async () => {
  const allowedCollections = getAllowedCollections();
  const sourceProducts = await Product.find({ isPublished: true })
    .select("collections createdAt updatedAt images")
    .sort({ updatedAt: -1 })
    .lean();

  const collectionMap = new Map();

  sourceProducts.forEach((product) => {
    const title = String(product.collections || "General").trim() || "General";
    if (allowedCollections.size && !allowedCollections.has(title.toLowerCase())) {
      return;
    }

    if (!collectionMap.has(title)) {
      const firstImage = Array.isArray(product.images) && product.images[0] ? product.images[0].url : "";
      collectionMap.set(title, {
        id: toLongIdFromString(title),
        title,
        handle: slugify(title),
        body_html: `<p>${title} collection</p>`,
        created_at: toIsoOrBlank(product.createdAt),
        updated_at: toIsoOrBlank(product.updatedAt),
        image: { src: firstImage },
      });
    }
  });

  return Array.from(collectionMap.values());
};

// Catalog API: Shiprocket fetch products.
router.get("/products", async (req, res) => {
  try {
    const { page, limit } = getPaginationParams(req.query);

    const filter = { isPublished: true };
    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return res.json({
      data: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
        products: products.map(mapProductForShiprocket),
      },
    });
  } catch (error) {
    console.error("[Shiprocket][Catalog][Products]", error.message);
    return res.status(500).json({ msg: "Failed to fetch products catalog" });
  }
});

// Catalog API: Shiprocket fetch collections.
router.get("/collections", async (req, res) => {
  try {
    const { page, limit } = getPaginationParams(req.query);
    const collections = await getPublishedCollectionRows();

    const total = collections.length;
    const paginated = collections.slice((page - 1) * limit, page * limit);

    return res.json({
      data: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
        collections: paginated,
      },
    });
  } catch (error) {
    console.error("[Shiprocket][Catalog][Collections]", error.message);
    return res.status(500).json({ msg: "Failed to fetch collections catalog" });
  }
});

const fetchProductsByCollection = async (req, res) => {
  try {
    const { page, limit } = getPaginationParams(req.query);
    const collectionId = String(req.query.collection_id || "").trim();
    const collectionHandle = String(req.query.collection_handle || "").trim().toLowerCase();
    const collectionTitle = String(req.query.collection_title || "").trim().toLowerCase();

    const collections = await getPublishedCollectionRows();
    const selectedCollection = collections.find((collection) => {
      if (collectionId && String(collection.id) === collectionId) {
        return true;
      }

      if (collectionHandle && String(collection.handle).toLowerCase() === collectionHandle) {
        return true;
      }

      if (collectionTitle && String(collection.title).toLowerCase() === collectionTitle) {
        return true;
      }

      return false;
    });

    if (!selectedCollection) {
      return res.json({
        data: {
          page,
          limit,
          total: 0,
          total_pages: 0,
          products: [],
        },
      });
    }

    const filter = {
      isPublished: true,
      collections: selectedCollection.title,
    };

    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return res.json({
      data: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
        collection: selectedCollection,
        products: products.map(mapProductForShiprocket),
      },
    });
  } catch (error) {
    console.error("[Shiprocket][Catalog][ProductsByCollection]", error.message);
    return res.status(500).json({ msg: "Failed to fetch collection products catalog" });
  }
};

// Catalog API: Shiprocket fetch products by collection.
router.get("/products-by-collection", fetchProductsByCollection);
router.get("/products/by-collection", fetchProductsByCollection);

// Shiprocket Checkout webhook: order placed callback.
router.post("/webhook/checkout/order", async (req, res) => {
  const payload = req.body || {};

  try {
    logIntegrationDebug("checkout_webhook_received", {
      orderId: payload.order_id || payload.checkout_id || "",
      status: payload.status || "",
      paymentType: payload.payment_type || "",
      transactionId: payload.transaction_id || payload.payment_id || payload.fastrr_transaction_id || "",
      bodyKeys: Object.keys(payload),
    });

    if (!isValidWebhookRequest(req)) {
      logIntegrationDebug("checkout_webhook_rejected", { reason: "invalid_webhook_token" });
      return res.status(401).json({ received: true, matched: false, msg: "Invalid webhook token" });
    }

    const checkoutId = String(payload.order_id || payload.checkout_id || "").trim();
    const status = String(payload.status || "").trim().toUpperCase();
    const transactionRef = String(
      payload.transaction_id || payload.payment_id || payload.fastrr_transaction_id || ""
    ).trim();

    if (!checkoutId) {
      logIntegrationDebug("checkout_webhook_invalid", { reason: "missing_checkout_id" });
      return res.status(400).json({ received: true, matched: false, msg: "order_id is required" });
    }

    if (!isValidObjectId(checkoutId)) {
      logIntegrationDebug("checkout_webhook_unmapped_id", { checkoutId });
      return res.status(200).json({ received: true, matched: false, msg: "order_id not mapped to local checkout" });
    }

    const checkout = await Checkout.findById(checkoutId).populate("user", "name email");
    if (!checkout) {
      logIntegrationDebug("checkout_webhook_not_found", { checkoutId });
      return res.status(200).json({ received: true, matched: false, msg: "Checkout not found" });
    }

    if (checkout.isFinalized) {
      logIntegrationDebug("checkout_webhook_duplicate_finalized", { checkoutId });
      return res.status(200).json({
        received: true,
        matched: true,
        duplicate: true,
        msg: "Checkout already finalized",
      });
    }

    const existingOrder = await Order.findOne({
      $or: [
        { paymentId: transactionRef || `sr_${checkoutId}` },
        { shiprocketOrderId: checkoutId },
      ],
    });

    if (existingOrder) {
      logIntegrationDebug("checkout_webhook_duplicate_existing_order", {
        checkoutId,
        orderId: existingOrder._id?.toString?.() || "",
      });
      return res.status(200).json({ received: true, matched: true, duplicate: true, orderId: existingOrder._id });
    }

    const isCod = isCodPaymentType(payload.payment_type || checkout.paymentMethod);
    const isSuccessful = status === "SUCCESS" || status === "PAID";

    if (!isSuccessful) {
      logIntegrationDebug("checkout_webhook_payment_not_success", { checkoutId, status });
      checkout.paymentStatus = "failed";
      checkout.paymentDetails = {
        ...(checkout.paymentDetails || {}),
        gateway: "shiprocket_checkout",
        webhook_payload: payload,
      };
      await checkout.save();
      return res.status(200).json({ received: true, matched: true, processed: false, msg: "Payment not successful" });
    }

    const orderItems = Array.isArray(checkout.checkoutItems)
      ? checkout.checkoutItems.map((item) => ({
          productId: item.productId,
          name: item.name,
          image: item.image,
          price: Number(item.price || 0),
          quantity: Number(item.quantity || 1),
          size: item.size || "N/A",
          color: item.color || "N/A",
          customMeasurementKey: item.customMeasurementKey || "",
          customMeasurements: item.customMeasurements || undefined,
        }))
      : [];

    if (!orderItems.length) {
      logIntegrationDebug("checkout_webhook_no_items", { checkoutId });
      return res.status(200).json({ received: true, matched: true, processed: false, msg: "Checkout has no items" });
    }

    let totalPrice = 0;
    for (const item of orderItems) {
      totalPrice += Number(item.price || 0) * Number(item.quantity || 1);
      const product = await Product.findById(item.productId);
      if (product) {
        product.countInStock = Math.max(0, Number(product.countInStock || 0) - Number(item.quantity || 0));
        await product.save();
      }
    }

    const finalOrder = await Order.create({
      user: checkout.user?._id || checkout.user,
      orderItems,
      shippingAddress: checkout.shippingAddress,
      paymentMethod: isCod ? "COD" : "shiprocket",
      paymentId: transactionRef || `sr_${checkoutId}`,
      paymentDetails: {
        gateway: "shiprocket_checkout",
        webhook_payload: payload,
      },
      totalPrice,
      isPaid: isCod ? false : true,
      paidAt: isCod ? null : new Date(),
      isDelivered: false,
      paymentStatus: isCod ? "pending" : "paid",
      shiprocketOrderId: checkoutId,
      shiprocketStatus: status,
      shiprocketSyncedAt: new Date(),
      shiprocketPayload: payload,
    });

    checkout.isPaid = !isCod;
    checkout.paidAt = !isCod ? new Date() : checkout.paidAt;
    checkout.paymentStatus = isCod ? "pending" : "paid";
    checkout.paymentDetails = {
      ...(checkout.paymentDetails || {}),
      gateway: "shiprocket_checkout",
      webhook_payload: payload,
      transaction_id: transactionRef,
      payment_id: transactionRef,
    };
    checkout.isFinalized = true;
    checkout.finalizedAt = new Date();
    await checkout.save();

    await Cart.findOneAndDelete({ user: checkout.user?._id || checkout.user });

    logIntegrationDebug("checkout_webhook_processed", {
      checkoutId,
      localOrderId: finalOrder._id?.toString?.() || "",
      isCod,
      totalPrice,
      itemCount: orderItems.length,
    });

    return res.status(201).json({
      received: true,
      matched: true,
      processed: true,
      orderId: finalOrder._id,
    });
  } catch (error) {
    console.error("[Shiprocket][Webhook][CheckoutOrder]", error.message, payload);
    return res.status(500).json({ received: true, matched: false, msg: "Checkout order webhook processing failed" });
  }
});

// Merchant API: fetch order details from Shiprocket Checkout API.
router.post("/checkout/order-details", protect, admin, async (req, res) => {
  try {
    const { order_id: orderId, timestamp } = req.body || {};

    logIntegrationDebug("order_details_request", {
      orderId: orderId || "",
      hasTimestamp: Boolean(timestamp),
      requestedBy: req.user?._id?.toString?.() || "",
    });

    const details = await fetchShiprocketCheckoutOrderDetails({
      orderId,
      timestamp,
    });

    if (!details.success) {
      logIntegrationDebug("order_details_failed", {
        orderId: orderId || "",
        reason: details.reason,
        skipped: details.skipped,
        attempts: details.attempts,
      });
      return res.status(details.skipped ? 400 : 502).json({
        msg: details.reason || "Failed to fetch Shiprocket order details",
        ...(process.env.NODE_ENV !== "production" ? { detail: details.error, attempts: details.attempts } : {}),
      });
    }

    logIntegrationDebug("order_details_success", {
      orderId: orderId || "",
      signatureEncoding: details.signatureEncoding,
    });

    return res.status(200).json({
      order_id: orderId,
      signatureEncoding: details.signatureEncoding,
      data: details.raw,
    });
  } catch (error) {
    console.error("[Shiprocket][OrderDetails]", error.message);
    return res.status(500).json({ msg: "Unable to fetch order details" });
  }
});

// Order webhook for shipment status sync.
router.post("/webhook/order", async (req, res) => {
  const payload = req.body || {};

  try {
    if (!isValidWebhookRequest(req)) {
      return res.status(401).json({ received: true, matched: false, msg: "Invalid webhook token" });
    }

    const orderIdCandidate = String(
      payload.order_id || payload.channel_order_id || payload.orderId || ""
    ).trim();
    const shipmentIdCandidate = String(payload.shipment_id || payload.shipmentId || "").trim();

    let order = null;

    if (orderIdCandidate && isValidObjectId(orderIdCandidate)) {
      order = await Order.findById(orderIdCandidate);
    }

    if (!order && orderIdCandidate) {
      order = await Order.findOne({ shiprocketOrderId: orderIdCandidate });
    }

    if (!order && shipmentIdCandidate) {
      order = await Order.findOne({ shiprocketShipmentId: shipmentIdCandidate });
    }

    if (!order) {
      return res.status(200).json({ received: true, matched: false });
    }

    const incomingStatus = String(
      payload.current_status || payload.shipment_status || payload.status || payload.order_status || ""
    ).trim();

    const normalizedStatus = incomingStatus.toLowerCase();

    if (normalizedStatus.includes("out for delivery")) {
      order.status = "Shipped";
    } else if (
      (normalizedStatus.includes("delivered") || normalizedStatus === "delivered") &&
      !normalizedStatus.includes("out for delivery") &&
      !normalizedStatus.includes("undeliver")
    ) {
      order.isDelivered = true;
      order.deliveredAt = new Date();
      order.status = "Delivered";
    } else if (
      normalizedStatus.includes("ship") ||
      normalizedStatus.includes("in transit") ||
      normalizedStatus.includes("pickup") ||
      normalizedStatus.includes("manifest")
    ) {
      order.status = "Shipped";
    } else if (normalizedStatus.includes("cancel") || normalizedStatus.includes("rto")) {
      order.status = "Cancelled";
    }

    order.shiprocketOrderId = orderIdCandidate || order.shiprocketOrderId;
    order.shiprocketShipmentId = shipmentIdCandidate || order.shiprocketShipmentId;
    order.shiprocketAwbCode = String(payload.awb_code || payload.awb || order.shiprocketAwbCode || "");
    order.shiprocketCourierName = String(payload.courier_name || payload.courier || order.shiprocketCourierName || "");
    order.shiprocketTrackingUrl = String(payload.tracking_url || payload.trackingUrl || order.shiprocketTrackingUrl || "");
    order.shiprocketStatus = incomingStatus || order.shiprocketStatus;
    order.shiprocketLastWebhookAt = new Date();
    order.shiprocketPayload = payload;

    await order.save();

    return res.status(200).json({ received: true, matched: true });
  } catch (error) {
    console.error("[Shiprocket][Webhook][Order]", error.message, payload);
    return res.status(500).json({ received: true, matched: false, msg: "Webhook processing failed" });
  }
});

module.exports = router;
