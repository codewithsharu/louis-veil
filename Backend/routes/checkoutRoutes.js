const express = require('express');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const Cart = require("../models/cart");
const Checkout = require("../models/Checkout");
const CheckoutSession = require("../models/CheckoutSession");
const Product = require("../models/products");
const Order = require("../models/Order");
const PromoCode = require("../models/PromoCode");
const PromoCodeClaim = require("../models/PromoCodeClaim");
const { protect } = require("../middleware/authMiddleware");
const { sendOrderConfirmation } = require("../services/emailService");
const {
    createShiprocketOrder,
    createShiprocketCheckoutAccessToken,
} = require("../services/shiprocketService");
const mongoose = require("mongoose");

const router = express.Router();
const DELIVERY_CHARGE = 0;
const FALLBACK_PRODUCT_IMAGE = "https://via.placeholder.com/400x400?text=Product";

// Helper: validate ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
const logPaymentDebug = (stage, data) => {
    console.log(`[Checkout][${stage}]`, data);
};
const logCheckoutDebug = (stage, data) => {
    console.log(`[Checkout][Debug][${stage}]`, data);
};
const createTraceId = () => `chk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const SHIPROCKET_VARIANT_MULTIPLIER = 10;
const getEffectivePrice = (product) => {
    const regularPrice = Number(product?.price);
    const discountedPrice = Number(product?.discountPrice);

    if (Number.isFinite(discountedPrice) && discountedPrice > 0 && discountedPrice < regularPrice) {
        return discountedPrice;
    }

    return Number.isFinite(regularPrice) ? regularPrice : 0;
};

const toLongIdFromHex = (value, salt = 0) => {
    const numeric = Number.parseInt(String(value).replace(/[^a-fA-F0-9]/g, "").slice(-12), 16);
    if (Number.isFinite(numeric)) {
        return numeric + salt;
    }
    return Date.now() + salt;
};

const normalizeVariantValue = (value) => {
    const normalized = String(value || "").trim().toLowerCase();
    if (!normalized || normalized === "n/a" || normalized === "na") {
        return "default";
    }
    return normalized;
};

const resolveShiprocketVariantId = (product, checkoutItem, fallbackIndex = 0) => {
    const baseProductId = toLongIdFromHex(checkoutItem?.productId || product?._id || fallbackIndex + 1);
    const sizes = Array.isArray(product?.sizes) && product.sizes.length ? product.sizes : ["Default"];
    const colors = Array.isArray(product?.colors) && product.colors.length ? product.colors : ["Default"];
    const targetSize = normalizeVariantValue(checkoutItem?.size);
    const targetColor = normalizeVariantValue(checkoutItem?.color);

    let variantIndex = 0;
    for (const color of colors) {
        for (const size of sizes) {
            if (variantIndex >= 25) {
                break;
            }

            if (
                normalizeVariantValue(color) === targetColor &&
                normalizeVariantValue(size) === targetSize
            ) {
                return baseProductId * SHIPROCKET_VARIANT_MULTIPLIER + variantIndex + 1;
            }

            variantIndex += 1;
        }

        if (variantIndex >= 25) {
            break;
        }
    }

    const fallbackVariantIndex = Math.max(0, fallbackIndex % 25);
    return baseProductId * SHIPROCKET_VARIANT_MULTIPLIER + fallbackVariantIndex + 1;
};

const buildShiprocketCheckoutItems = async (checkoutItems) => {
    if (!Array.isArray(checkoutItems) || !checkoutItems.length) {
        return [];
    }

    const uniqueProductIds = [
        ...new Set(
            checkoutItems
                .map((item) => String(item.productId || ""))
                .filter((id) => id && isValidObjectId(id))
        ),
    ];

    const products = uniqueProductIds.length
        ? await Product.find({ _id: { $in: uniqueProductIds } })
            .select("sku sizes colors")
            .lean()
        : [];

    const productMap = new Map(products.map((product) => [String(product._id), product]));

    return checkoutItems.map((item, index) => {
        const productId = String(item.productId || "");
        const product = productMap.get(productId);

        return {
            productId,
            variantId: resolveShiprocketVariantId(product, item, index),
            quantity: Number(item.quantity || 1),
            price: Number(item.price || 0),
            name: item.name,
            sku: product?.sku,
        };
    });
};

const getCartBasedCheckoutItems = async (userId) => {
    const userCart = await Cart.findOne({ user: userId });
    const cartItems = userCart?.products || [];

    logCheckoutDebug("cart_fetch", {
        userId: userId?.toString?.() || userId,
        hasCart: Boolean(userCart),
        itemCount: cartItems.length,
        cartTotalPrice: userCart?.totalPrice,
        items: cartItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            originalPrice: item.originalPrice,
            size: item.size,
            color: item.color,
            customMeasurementKey: item.customMeasurementKey,
            customMeasurements: item.customMeasurements,
        })),
    });

    if (!cartItems.length) {
        return { error: { status: 400, msg: "No items in cart" } };
    }

    return {
        checkoutItems: cartItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            size: item.size || "N/A",
            color: item.color || "N/A",
            customMeasurementKey: item.customMeasurementKey || "",
            customMeasurements: item.customMeasurements || undefined,
            image: item.image,
        })),
    };
};

const buildVerifiedCheckoutItems = async (checkoutItems) => {
    if (!checkoutItems || checkoutItems.length === 0) {
        return { error: { status: 400, msg: "No items in checkout" } };
    }

    const verifiedItems = [];
    let serverSubtotal = 0;
    let totalDiscountAmount = 0;
    const itemDetails = [];

    for (const item of checkoutItems) {
        if (!item.productId || !isValidObjectId(item.productId)) {
            return { error: { status: 400, msg: "Invalid product ID in checkout items" } };
        }
        if (!item.quantity || item.quantity < 1 || !Number.isInteger(item.quantity)) {
            return { error: { status: 400, msg: "Invalid quantity for product" } };
        }

        const product = await Product.findById(item.productId);
        if (!product) {
            return { error: { status: 404, msg: `Product not found: ${item.productId}` } };
        }
        if (product.countInStock < item.quantity) {
            return { error: { status: 400, msg: `Insufficient stock for ${product.name}` } };
        }

        const resolvedImage =
            (Array.isArray(product.images) && product.images[0] && product.images[0].url) ||
            item.image ||
            FALLBACK_PRODUCT_IMAGE;

        const regularPrice = Number(product.price);
        const discountPrice = Number(product.discountPrice);
        console.log(`[Product-Fetch-Checkout] productId: ${item.productId}, quantity: ${item.quantity}, dbPrice: ${regularPrice}, dbDiscountPrice: ${discountPrice}, productName: ${product.name}, stock: ${product.countInStock}`);
        const effectivePrice = getEffectivePrice(product);
        const discountPerItem = regularPrice - effectivePrice;
        const totalDiscountForItem = discountPerItem * item.quantity;

        logCheckoutDebug("verify_item", {
            productId: item.productId,
            productName: product.name,
            quantity: item.quantity,
            dbPrice: regularPrice,
            dbDiscountPrice: discountPrice,
            effectivePrice,
            discountPerItem,
            totalDiscountForItem,
            countInStock: product.countInStock,
        });

        itemDetails.push({
            productId: item.productId,
            productName: product.name,
            quantity: item.quantity,
            regularPrice,
            effectivePrice,
            discountPerItem,
            totalDiscountForItem,
        });

        verifiedItems.push({
            productId: item.productId,
            name: product.name,
            image: resolvedImage,
            price: effectivePrice,
            originalPrice: Number.isFinite(regularPrice) ? regularPrice : effectivePrice,
            countInStock: Number.isFinite(Number(product.countInStock)) ? Number(product.countInStock) : 0,
            quantity: item.quantity,
            size: item.size || "N/A",
            color: item.color || "N/A",
            customMeasurementKey: item.customMeasurementKey || "",
            customMeasurements: item.customMeasurements || undefined,
        });

        serverSubtotal += effectivePrice * item.quantity;
        totalDiscountAmount += totalDiscountForItem;
    }

    return { 
        verifiedItems, 
        serverSubtotal,
        totalDiscountAmount,
        originalSubtotal: serverSubtotal + totalDiscountAmount,
        itemDetails,
    };
};

// Checkout route - SERVER-SIDE price calculation
router.post("/", protect, async (req, res) => {
    const { shippingAddress, paymentMethod, promoCode } = req.body;
    const verifiedPhone = String(req.user?.phone || "").trim();
    const traceId = createTraceId();
    logCheckoutDebug("create_checkout_request", {
        traceId,
        userId: req.user?._id?.toString(),
        host: req.get("host"),
        origin: req.get("origin"),
        userAgent: req.get("user-agent"),
        nodeEnv: process.env.NODE_ENV,
        paymentMethod,
        shippingAddress,
    });

    if (
        !shippingAddress ||
        !shippingAddress.address ||
        !shippingAddress.city ||
        !shippingAddress.postalCode ||
        !shippingAddress.country
    ) {
        return res.status(400).json({ msg: "Complete shipping address is required" });
    }



    const validPaymentMethods = ["COD", "shiprocket", "razorpay"];
    if (!paymentMethod || !validPaymentMethods.includes(paymentMethod)) {
        return res.status(400).json({ msg: "Invalid payment method" });
    }

    try {
        const cartPayload = await getCartBasedCheckoutItems(req.user._id);
        if (cartPayload.error) {
            return res.status(cartPayload.error.status).json({ msg: cartPayload.error.msg });
        }
        const checkoutItemsSource = cartPayload.checkoutItems;

        const { verifiedItems, serverSubtotal, totalDiscountAmount, originalSubtotal, itemDetails, error } = await buildVerifiedCheckoutItems(checkoutItemsSource);
        if (error) {
            logCheckoutDebug("create_checkout_verify_failed", { traceId, ...error });
            return res.status(error.status).json({ msg: error.msg });
        }

        // Create checkout with server-calculated subtotal only
        let payableTotal = serverSubtotal;
        let appliedPromoCode = null;
        let appliedPromoDiscount = 0;

        if (promoCode) {
            const promo = await PromoCode.findOne({ code: promoCode.toUpperCase() });
            if (promo && promo.isActive && new Date(promo.expiry) >= new Date() && (promo.usageLimit === 0 || promo.usageCount < promo.usageLimit)) {
                let isValid = true;
                if (promo.type === "private") {
                    const assignedPhoneStr = (promo.assignedMobile || "").replace("+", "").trim();
                    const userPhoneStr = verifiedPhone.replace("+", "").trim();
                    if (userPhoneStr !== assignedPhoneStr) isValid = false;
                }
                if (isValid) {
                    if (promo.discountType === "amount") {
                        appliedPromoDiscount = promo.discountValue;
                    } else if (promo.discountType === "percent") {
                        appliedPromoDiscount = (serverSubtotal * promo.discountValue) / 100;
                    }
                    if (appliedPromoDiscount > serverSubtotal) {
                        appliedPromoDiscount = serverSubtotal;
                    }
                    payableTotal -= appliedPromoDiscount;
                    appliedPromoCode = promo.code;
                }
            }
        }
        logCheckoutDebug("create_checkout_pricing_result", {
            traceId,
            originalSubtotal,
            totalDiscountAmount,
            serverSubtotal,
            payableTotal,
            itemCount: verifiedItems.length,
            itemDetails,
            verifiedItems: verifiedItems.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
                originalPrice: item.originalPrice,
            })),
        });

        const newCheckout = await Checkout.create({
            user: req.user._id,
            checkoutItems: verifiedItems,
            shippingAddress: {
                ...shippingAddress,
                verifiedPhone,
            },
            paymentMethod,
            totalPrice: payableTotal,
            promoCode: appliedPromoCode,
            promoCodeDiscount: appliedPromoDiscount,
            paymentStatus: "Pending",
            isPaid: false,
        });

        logCheckoutDebug("create_checkout_success", {
            traceId,
            checkoutId: newCheckout?._id,
            totalPrice: newCheckout?.totalPrice,
            itemCount: newCheckout?.checkoutItems?.length || 0,
        });

        res.status(201).json(newCheckout);
    } catch (error) {
        console.error("Checkout error:", {
            traceId,
            message: error?.message,
            stack: error?.stack,
            name: error?.name,
        });
        if (error.name === "ValidationError") {
            return res.status(400).json({ msg: error.message });
        }
        res.status(500).json({ msg: "Server error", detail: error.message, traceId });
    }
});

// Preview checkout summary from DB prices only.
router.post("/preview", protect, async (req, res) => {
    try {
        const cartPayload = await getCartBasedCheckoutItems(req.user._id);
        if (cartPayload.error) {
            return res.status(cartPayload.error.status).json({ msg: cartPayload.error.msg });
        }

        const { verifiedItems, serverSubtotal, totalDiscountAmount, originalSubtotal, itemDetails, error } = await buildVerifiedCheckoutItems(cartPayload.checkoutItems);
        if (error) {
            return res.status(error.status).json({ msg: error.msg });
        }

        logCheckoutDebug("preview_pricing", {
            originalSubtotal,
            totalDiscountAmount,
            serverSubtotal,
            itemCount: verifiedItems.length,
            itemDetails,
        });

        const totalPrice = serverSubtotal;
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        const checkoutSession = await CheckoutSession.create({
            user: req.user._id,
            checkoutItems: verifiedItems,
            subtotal: serverSubtotal,
            deliveryCharge: DELIVERY_CHARGE,
            totalPrice,
            expiresAt,
        });

        return res.json({
            checkoutSessionId: checkoutSession._id,
            checkoutItems: verifiedItems,
            subtotal: serverSubtotal,
            totalDiscountAmount,
            originalSubtotal,
            deliveryCharge: DELIVERY_CHARGE,
            totalPrice,
        });
    } catch (error) {
        console.error("Checkout preview error:", error);
        return res.status(500).json({ msg: "Server error", detail: error.message });
    }
});

router.post("/:id/shiprocket/access-token", protect, async (req, res) => {
    const traceId = createTraceId();

    try {
        logCheckoutDebug("shiprocket_access_token_request_received", {
            traceId,
            checkoutId: req.params.id,
            userId: req.user?._id?.toString?.() || "",
            hasFallbackUrl: Boolean(req.body?.fallbackUrl),
            origin: req.get("origin") || "",
            userAgent: req.get("user-agent") || "",
        });

        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ msg: "Invalid checkout ID" });
        }

        const checkout = await Checkout.findById(req.params.id).populate("user", "name email phone");
        if (!checkout) {
            return res.status(404).json({ msg: "Checkout not found" });
        }

        if (checkout.user?._id?.toString() !== req.user._id.toString()) {
            return res.status(403).json({ msg: "Not authorized" });
        }

        if (checkout.paymentMethod !== "shiprocket") {
            return res.status(400).json({ msg: "Hosted checkout is only available for online payment" });
        }

        if (checkout.isFinalized) {
            return res.status(400).json({ msg: "Checkout already finalized" });
        }

        if (checkout.isPaid) {
            return res.status(400).json({ msg: "Checkout already paid" });
        }

        const requestedFallbackUrl = typeof req.body?.fallbackUrl === "string"
            ? req.body.fallbackUrl.trim()
            : "";
        const normalizedFrontendOrigin = String(process.env.FRONTEND_URL || "")
            .split(",")
            .map((origin) => origin.trim())
            .filter(Boolean)[0]
            ?.replace(/\/+$/, "");
        const fallbackBaseUrl = requestedFallbackUrl || (normalizedFrontendOrigin
            ? `${normalizedFrontendOrigin}/checkout?sr_checkout_id=${checkout._id}`
            : `${req.protocol}://${req.get("host")}/checkout?sr_checkout_id=${checkout._id}`);

        const checkoutItemsForToken = await buildShiprocketCheckoutItems(checkout.checkoutItems);
        if (!checkoutItemsForToken.length) {
            return res.status(400).json({ msg: "No checkout items available for payment" });
        }

        logCheckoutDebug("shiprocket_access_token_payload_ready", {
            traceId,
            checkoutId: checkout._id.toString(),
            paymentMethod: checkout.paymentMethod,
            itemCount: checkoutItemsForToken.length,
            items: checkoutItemsForToken.map((item) => ({
                productId: item.productId,
                variantId: item.variantId,
                quantity: item.quantity,
                price: item.price,
            })),
            fallbackUrl: fallbackBaseUrl,
        });

        const tokenResult = await createShiprocketCheckoutAccessToken({
            checkout,
            user: checkout.user,
            checkoutItems: checkoutItemsForToken,
            fallbackUrl: fallbackBaseUrl,
        });

        if (!tokenResult.success) {
            logCheckoutDebug("shiprocket_checkout_access_token_failed", {
                traceId,
                checkoutId: checkout._id.toString(),
                userId: checkout.user?._id?.toString?.() || "",
                paymentMethod: checkout.paymentMethod,
                reason: tokenResult.reason,
                skipped: tokenResult.skipped,
                attempts: tokenResult.attempts,
            });

            return res.status(tokenResult.skipped ? 400 : 502).json({
                msg: tokenResult.reason || "Unable to start hosted checkout",
                traceId,
                ...(process.env.NODE_ENV !== "production" ? { detail: tokenResult.error, attempts: tokenResult.attempts } : {}),
            });
        }

        logCheckoutDebug("shiprocket_checkout_access_token_success", {
            traceId,
            checkoutId: checkout._id.toString(),
            signatureEncoding: tokenResult.signatureEncoding,
            tokenLength: String(tokenResult.token || "").length,
        });

        return res.status(200).json({
            checkoutId: checkout._id,
            token: tokenResult.token,
            fallbackUrl: fallbackBaseUrl,
        });
    } catch (error) {
        logCheckoutDebug("shiprocket_checkout_access_token_error", {
            traceId,
            checkoutId: req.params.id,
            userId: req.user?._id?.toString?.() || "",
            requestBodyKeys: Object.keys(req.body || {}),
            message: error?.message,
            stack: error?.stack,
        });
        return res.status(500).json({ msg: "Unable to initiate hosted checkout", traceId });
    }
});

// Debug endpoint: verify checkout item -> Shiprocket variant mapping.
router.get("/:id/shiprocket/variant-debug", protect, async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ msg: "Invalid checkout ID" });
        }

        const checkout = await Checkout.findById(req.params.id);
        if (!checkout) {
            return res.status(404).json({ msg: "Checkout not found" });
        }

        if (checkout.user?.toString() !== req.user._id.toString()) {
            return res.status(403).json({ msg: "Not authorized" });
        }

        const debugRows = [];

        for (let index = 0; index < (checkout.checkoutItems || []).length; index += 1) {
            const item = checkout.checkoutItems[index];
            const product = isValidObjectId(item?.productId)
                ? await Product.findById(item.productId).select("name sku sizes colors _id").lean()
                : null;

            const resolvedVariantId = resolveShiprocketVariantId(product, item, index);
            const sizes = Array.isArray(product?.sizes) && product.sizes.length ? product.sizes : ["Default"];
            const colors = Array.isArray(product?.colors) && product.colors.length ? product.colors : ["Default"];

            const catalogVariants = [];
            let variantIndex = 0;
            const baseProductId = toLongIdFromHex(item?.productId || product?._id || index + 1);

            for (const color of colors) {
                for (const size of sizes) {
                    if (variantIndex >= 25) {
                        break;
                    }

                    catalogVariants.push({
                        id: baseProductId * SHIPROCKET_VARIANT_MULTIPLIER + variantIndex + 1,
                        color,
                        size,
                        title: `${color} / ${size}`,
                    });

                    variantIndex += 1;
                }

                if (variantIndex >= 25) {
                    break;
                }
            }

            const matchedVariant = catalogVariants.find((variant) => Number(variant.id) === Number(resolvedVariantId)) || null;

            debugRows.push({
                checkoutItem: {
                    productId: item?.productId,
                    name: item?.name,
                    size: item?.size,
                    color: item?.color,
                    quantity: item?.quantity,
                },
                product: product
                    ? {
                        id: product._id,
                        name: product.name,
                        sku: product.sku || "",
                        sizes,
                        colors,
                    }
                    : null,
                resolvedVariantId,
                matchedInGeneratedCatalog: Boolean(matchedVariant),
                matchedVariant,
                generatedVariantCount: catalogVariants.length,
                generatedVariantsPreview: catalogVariants.slice(0, 10),
            });
        }

        return res.status(200).json({
            checkoutId: checkout._id,
            itemCount: debugRows.length,
            items: debugRows,
        });
    } catch (error) {
        console.error("[Checkout][VariantDebug]", error.message);
        return res.status(500).json({ msg: "Failed to verify variant mapping" });
    }
});

// Debug endpoint: run end-to-end preflight (variant mapping + token generation).
router.get("/:id/shiprocket/preflight-debug", protect, async (req, res) => {
    const traceId = createTraceId();

    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ msg: "Invalid checkout ID" });
        }

        const checkout = await Checkout.findById(req.params.id).populate("user", "name email phone");
        if (!checkout) {
            return res.status(404).json({ msg: "Checkout not found" });
        }

        if (checkout.user?._id?.toString() !== req.user._id.toString()) {
            return res.status(403).json({ msg: "Not authorized" });
        }

        const fallbackUrl = String(req.query?.fallbackUrl || "").trim() || `${req.protocol}://${req.get("host")}/checkout?sr_checkout_id=${checkout._id}`;
        const checkoutItemsForToken = await buildShiprocketCheckoutItems(checkout.checkoutItems);
        const variantRows = [];

        for (let index = 0; index < (checkout.checkoutItems || []).length; index += 1) {
            const item = checkout.checkoutItems[index];
            const product = isValidObjectId(item?.productId)
                ? await Product.findById(item.productId).select("name sku sizes colors _id").lean()
                : null;

            const resolvedVariantId = resolveShiprocketVariantId(product, item, index);
            const sizes = Array.isArray(product?.sizes) && product.sizes.length ? product.sizes : ["Default"];
            const colors = Array.isArray(product?.colors) && product.colors.length ? product.colors : ["Default"];

            const generatedIds = [];
            let variantIndex = 0;
            const baseProductId = toLongIdFromHex(item?.productId || product?._id || index + 1);
            for (const color of colors) {
                for (const size of sizes) {
                    if (variantIndex >= 25) break;
                    generatedIds.push(baseProductId * SHIPROCKET_VARIANT_MULTIPLIER + variantIndex + 1);
                    variantIndex += 1;
                }
                if (variantIndex >= 25) break;
            }

            variantRows.push({
                checkoutItem: {
                    productId: item?.productId,
                    size: item?.size,
                    color: item?.color,
                },
                resolvedVariantId,
                matchedInGeneratedCatalog: generatedIds.includes(resolvedVariantId),
            });
        }

        const tokenResult = await createShiprocketCheckoutAccessToken({
            checkout,
            user: checkout.user,
            checkoutItems: checkoutItemsForToken,
            fallbackUrl,
        });

        return res.status(200).json({
            traceId,
            checkoutId: checkout._id,
            fallbackUrl,
            itemCount: checkoutItemsForToken.length,
            variants: variantRows,
            token: {
                success: tokenResult.success,
                reason: tokenResult.reason || "",
                skipped: Boolean(tokenResult.skipped),
                signatureEncoding: tokenResult.signatureEncoding || "",
                tokenLength: String(tokenResult.token || "").length,
                rawOrderId: tokenResult?.raw?.result?.data?.order_id || tokenResult?.raw?.data?.order_id || "",
                attempts: tokenResult.attempts || [],
            },
        });
    } catch (error) {
        console.error("[Checkout][PreflightDebug]", {
            traceId,
            message: error?.message,
        });
        return res.status(500).json({ msg: "Preflight debug failed", traceId });
    }
});

// Razorpay Create Order
router.post("/:id/razorpay/create-order", protect, async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ msg: "Invalid checkout ID" });
        }
        const checkout = await Checkout.findById(req.params.id);
        if (!checkout) return res.status(404).json({ msg: "Checkout not found" });
        if (checkout.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ msg: "Not authorized" });
        }
        if (checkout.isPaid) return res.status(400).json({ msg: "Already paid" });

        const instance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        const options = {
            amount: Math.round(checkout.totalPrice * 100), 
            currency: "INR",
            receipt: checkout._id.toString(),
        };

        const order = await instance.orders.create(options);
        if (!order) return res.status(500).json({ msg: "Error creating Razorpay order" });

        res.json(order);
    } catch (error) {
        console.error("Razorpay order creation error:", error);
        res.status(500).json({ msg: "Error creating razorpay order", error: error.message });
    }
});

// Payment confirmation route
router.put("/:id/pay", protect, async (req, res) => {
    const { paymentStatus, paymentDetails } = req.body;
    try {
        logPaymentDebug("pay_request", {
            checkoutId: req.params.id,
            paymentStatus,
            hasPaymentDetails: Boolean(paymentDetails),
        });

        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ msg: "Invalid checkout ID" });
        }

        const checkout = await Checkout.findById(req.params.id);

        if (!checkout) {
            return res.status(404).json({ msg: "No checkout found." });
        }

        // Ownership check
        if (checkout.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ msg: "Not authorized" });
        }

        if (checkout.isPaid) {
            return res.status(400).json({ msg: "Checkout already paid" });
        }

        if (paymentDetails && paymentDetails.gateway === "razorpay") {
            const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentDetails;
            const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
            hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
            const expectedSignature = hmac.digest("hex");
            if (expectedSignature !== razorpay_signature) {
                return res.status(400).json({ msg: "Invalid payment signature" });
            }
        }

        if (paymentStatus === "paid") {
            checkout.isPaid = true;
            checkout.paymentStatus = paymentStatus;
            checkout.paymentDetails = paymentDetails;
            checkout.paidAt = Date.now();
            await checkout.save();

            res.status(200).json(checkout);
        } else {
            res.status(400).json({ msg: "Invalid payment status." });
        }
    } catch (error) {
        console.error("Payment error:", error);
        res.status(500).json({
            msg: "Payment confirmation failed",
            detail: error.message,
        });
    }
});

// Finalize order route
router.post("/:id/finalize", protect, async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ msg: "Invalid checkout ID" });
        }

        const checkout = await Checkout.findById(req.params.id).populate("user", "name email phone");

        if (!checkout) {
            return res.status(404).json({ msg: "Checkout not found" });
        }

        // Ownership check
        if (checkout.user._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ msg: "Not authorized" });
        }

        if (checkout.isFinalized) {
            return res.status(400).json({ msg: "Checkout already finalized" });
        }

        const isCodCheckout = checkout.paymentMethod === "COD";
        if (!isCodCheckout && !checkout.isPaid) {
            return res.status(400).json({ msg: "Checkout is not paid" });
        }

        // Re-verify prices from DB one final time before creating order
        let verifiedTotalPrice = 0;
        const finalOrderItems = [];

        for (const item of checkout.checkoutItems) {
            const product = await Product.findById(item.productId);
            const verifiedPrice = product ? getEffectivePrice(product) : item.price;

            // Check stock one final time
            if (product && product.countInStock < item.quantity) {
                return res.status(400).json({ msg: `Insufficient stock for ${item.name}` });
            }

            finalOrderItems.push({
                productId: item.productId,
                name: item.name,
                image: item.image,
                price: verifiedPrice,
                quantity: item.quantity,
                size: item.size || "N/A",
                color: item.color || "N/A",
                customMeasurementKey: item.customMeasurementKey || "",
                customMeasurements: item.customMeasurements || undefined,
            });
            verifiedTotalPrice += verifiedPrice * item.quantity;

            // Decrement stock
            if (product) {
                product.countInStock -= item.quantity;
                await product.save();
            }
        }

        const finalOrderTotal = verifiedTotalPrice - (checkout.promoCodeDiscount || 0);

        // Create final order with verified price
        const normalizedPaymentStatus = isCodCheckout
            ? "pending"
            : (checkout.paymentStatus || "paid").toLowerCase();

        const finalOrder = await Order.create({
            user: checkout.user._id,
            orderItems: finalOrderItems,
            shippingAddress: checkout.shippingAddress,
            paymentMethod: checkout.paymentMethod,
            totalPrice: finalOrderTotal,
            promoCode: checkout.promoCode,
            promoCodeDiscount: checkout.promoCodeDiscount,
            isPaid: isCodCheckout ? false : true,
            paidAt: isCodCheckout ? null : checkout.paidAt,
            isDelivered: false,
            paymentStatus: normalizedPaymentStatus,
            paymentDetails: checkout.paymentDetails,
            paymentId:
                checkout?.paymentDetails?.payment_id ||
                checkout?.paymentDetails?.transaction_id ||
                checkout?.paymentDetails?.paymentId ||
                undefined,
        });

        const shiprocketSyncResult = await createShiprocketOrder({
            order: finalOrder,
            user: checkout.user,
        });

        if (shiprocketSyncResult.success) {
            finalOrder.shiprocketOrderId = shiprocketSyncResult.mapped.shiprocketOrderId;
            finalOrder.shiprocketShipmentId = shiprocketSyncResult.mapped.shiprocketShipmentId;
            finalOrder.shiprocketAwbCode = shiprocketSyncResult.mapped.shiprocketAwbCode;
            finalOrder.shiprocketCourierName = shiprocketSyncResult.mapped.shiprocketCourierName;
            finalOrder.shiprocketTrackingUrl = shiprocketSyncResult.mapped.shiprocketTrackingUrl;
            finalOrder.shiprocketStatus = shiprocketSyncResult.mapped.shiprocketStatus;
            finalOrder.shiprocketSyncedAt = new Date();
            finalOrder.shiprocketPayload = shiprocketSyncResult.raw;
            await finalOrder.save();
            logCheckoutDebug("shiprocket_sync_success", {
                orderId: finalOrder._id.toString(),
                shiprocketOrderId: finalOrder.shiprocketOrderId,
                shiprocketShipmentId: finalOrder.shiprocketShipmentId,
            });
        } else {
            finalOrder.shiprocketStatus = shiprocketSyncResult.skipped ? "not_configured" : "sync_failed";
            finalOrder.shiprocketPayload = {
                reason: shiprocketSyncResult.reason,
                error: shiprocketSyncResult.error,
                payload: shiprocketSyncResult.payload,
            };
            await finalOrder.save();
            logCheckoutDebug("shiprocket_sync_failed", {
                orderId: finalOrder._id.toString(),
                skipped: shiprocketSyncResult.skipped,
                reason: shiprocketSyncResult.reason,
            });
        }

        // Mark checkout as finalized
        checkout.isFinalized = true;
        checkout.finalizedAt = Date.now();
        await checkout.save();

        if (checkout.promoCode) {
            const promo = await PromoCode.findOne({ code: checkout.promoCode });
            if (promo) {
                promo.usageCount += 1;
                await promo.save();
                
                await PromoCodeClaim.create({
                    code: promo.code,
                    user: checkout.user._id,
                    mobile: checkout.shippingAddress.verifiedPhone || checkout.user.phone,
                    order: finalOrder._id,
                    discountApplied: checkout.promoCodeDiscount,
                    status: "applied"
                });
            }
        }

        // Delete user's cart
        await Cart.findOneAndDelete({ user: checkout.user._id });

        // Send order confirmation emails (non-blocking)
        sendOrderConfirmation(checkout.user, finalOrder).catch(err =>
            console.error("Email sending failed:", err.message)
        );

        // Meta Conversions API (Purchase Event)
        if (process.env.META_ACCESS_TOKEN && process.env.META_PIXEL_ID) {
            const sendMetaPurchaseEvent = async () => {
                const axios = require('axios');
                const crypto = require('crypto');
                const hash = (str) => str ? crypto.createHash('sha256').update(str.trim().toLowerCase()).digest('hex') : undefined;

                const eventPayload = {
                    data: [{
                        event_name: 'Purchase',
                        event_time: Math.floor(Date.now() / 1000),
                        action_source: 'website',
                        user_data: {
                            em: [hash(checkout.user.email)],
                            ph: [hash(checkout.shippingAddress.verifiedPhone || checkout.user.phone)],
                        },
                        custom_data: {
                            currency: 'INR',
                            value: finalOrderTotal,
                            content_ids: finalOrderItems.map(item => String(item.productId)),
                            content_type: 'product',
                            payment_type: checkout.paymentMethod === 'Razorpay' ? 'Prepaid_Online' : 'Cash_On_Delivery'
                        },
                        event_id: String(finalOrder._id)
                    }]
                };

                await axios.post(
                    `https://graph.facebook.com/v19.0/${process.env.META_PIXEL_ID}/events?access_token=${process.env.META_ACCESS_TOKEN}`,
                    eventPayload
                );
            };

            sendMetaPurchaseEvent()
                .then(() => {
                    console.log(`[Meta CAPI] Purchase event successfully sent to Meta for Order ${finalOrder._id}`);
                    console.log(`[Meta CAPI] Payment Method: ${checkout.paymentMethod}, Amount: ₹${finalOrderTotal}`);
                })
                .catch(err => {
                    console.error("[Meta CAPI] Purchase tracking failed:", err.response?.data || err.message);
                });
        }

        res.status(201).json(finalOrder);
    } catch (error) {
        console.error("Finalize order error:", error.message);
        res.status(500).json({ msg: "Server error" });
    }
});

module.exports = router;
