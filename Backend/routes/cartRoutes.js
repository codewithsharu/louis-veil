const express = require('express');
const Cart = require("../models/cart");
const Product = require("../models/products");
const { protect } = require("../middleware/authMiddleware");
const mongoose = require("mongoose");

const router = express.Router();
const FALLBACK_PRODUCT_IMAGE = "https://via.placeholder.com/400x400?text=Product";
const logCartDebug = (stage, data) => {
    console.log(`[Cart][Debug][${stage}]`, data);
};

const getEffectivePrice = (product) => {
    const regularPrice = Number(product?.price);
    const discountedPrice = Number(product?.discountPrice);

    if (Number.isFinite(discountedPrice) && discountedPrice > 0 && discountedPrice < regularPrice) {
        return discountedPrice;
    }

    return Number.isFinite(regularPrice) ? regularPrice : 0;
};

const CUSTOM_MEASUREMENT_FIELDS = [
    "bustChest",
    "waist",
    "hips",
    "shoulderWidth",
    "sleeveLength",
    "armhole",
    "bicepSize",
];

const sanitizeCustomMeasurements = (customMeasurements) => {
    if (!customMeasurements || typeof customMeasurements !== "object") {
        return null;
    }

    const hasAllFields = CUSTOM_MEASUREMENT_FIELDS.every(
        (field) => customMeasurements[field] !== undefined && customMeasurements[field] !== null && customMeasurements[field] !== ""
    );

    if (!hasAllFields) {
        return null;
    }

    const normalized = {};

    for (const field of CUSTOM_MEASUREMENT_FIELDS) {
        const numericValue = Number(customMeasurements[field]);
        if (!Number.isFinite(numericValue) || numericValue <= 0 || numericValue > 100) {
            return null;
        }
        normalized[field] = Number(numericValue.toFixed(2));
    }

    return normalized;
};

const buildCustomMeasurementKey = (customMeasurements) =>
    CUSTOM_MEASUREMENT_FIELDS.map((field) => `${field}:${Number(customMeasurements[field]).toFixed(2)}`).join("|");

const normalizeCustomMeasurementKey = (customMeasurementKey, normalizedCustomMeasurements) => {
    if (typeof customMeasurementKey === "string" && customMeasurementKey.trim()) {
        return customMeasurementKey.trim().slice(0, 220);
    }

    if (normalizedCustomMeasurements) {
        return buildCustomMeasurementKey(normalizedCustomMeasurements);
    }

    return "";
};

// Helper: get cart for authenticated user or guest
const getCart = async (userId, guestId) => {
    if (userId) {
        return await Cart.findOne({ user: userId });
    } else if (guestId) {
        return await Cart.findOne({ guestId });
    }
    return null;
};

// Helper: validate ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Helper: recalculate cart total from DB prices (server-side only)
const recalculateCartTotal = async (cart) => {
    let totalPrice = 0;
    let totalDiscount = 0;
    const itemDiscounts = [];

    for (const item of cart.products) {
        const product = await Product.findById(item.productId);
        if (product) {
            const originalPrice = Number(product.price);
            const discountPrice = Number(product.discountPrice);
            console.log(`[Product-Fetch] productId: ${item.productId}, dbPrice: ${originalPrice}, dbDiscountPrice: ${discountPrice}, productName: ${product.name}`);
            item.originalPrice = Number.isFinite(originalPrice) ? originalPrice : item.price;
            item.price = getEffectivePrice(product); // Always use effective DB price
            item.discountPrice = Number.isFinite(discountPrice) && discountPrice > 0 ? discountPrice : undefined;
            item.countInStock = Number.isFinite(Number(product.countInStock)) ? Number(product.countInStock) : 0;
            item.name = product.name; // Keep name in sync

            // Calculate discount per item
            const discountPerItem = item.originalPrice - item.price;
            const totalDiscountForItem = discountPerItem * item.quantity;
            totalDiscount += totalDiscountForItem;

            itemDiscounts.push({
                productId: item.productId,
                quantity: item.quantity,
                originalPrice: item.originalPrice,
                effectivePrice: item.price,
                discountPerItem: discountPerItem,
                totalDiscountForItem: totalDiscountForItem,
            });

            logCartDebug("recalculate_item", {
                productId: item.productId,
                quantity: item.quantity,
                dbPrice: Number(product.price),
                dbDiscountPrice: Number(product.discountPrice),
                effectivePrice: item.price,
                originalPrice: item.originalPrice,
                discountPerItem: discountPerItem,
                totalDiscountForItem: totalDiscountForItem,
            });
            totalPrice += item.price * item.quantity;
        }
    }
    cart.totalPrice = totalPrice;
    cart.totalDiscount = totalDiscount;

    logCartDebug("recalculate_total", {
        cartId: cart?._id,
        itemCount: cart.products.length,
        totalPrice,
        totalDiscount,
        originalTotalBeforeDiscount: totalPrice + totalDiscount,
        itemDiscounts,
    });
    return cart;
};

// Add to cart (supports both authenticated users and guests)
router.post("/", async (req, res) => {
    const { productId, quantity, size, color, customMeasurements, customMeasurementKey, guestId } = req.body;
    const normalizedSize = size || "";
    const normalizedColor = color || "";
    const normalizedCustomMeasurements = sanitizeCustomMeasurements(customMeasurements);
    const normalizedCustomMeasurementKey = normalizeCustomMeasurementKey(customMeasurementKey, normalizedCustomMeasurements);

    // Get userId from token if available (optional auth)
    let userId = null;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {
            const jwt = require("jsonwebtoken");
            const decoded = jwt.verify(
                req.headers.authorization.split(" ")[1],
                process.env.JWT_SECRET
            );
            userId = decoded.user.id;
        } catch (e) {
            // Guest user - continue without userId
        }
    }

    if (!productId || !isValidObjectId(productId)) {
        return res.status(400).json({ msg: "Valid product ID is required" });
    }
    if (!quantity || quantity < 1 || quantity > 10 || !Number.isInteger(quantity)) {
        return res.status(400).json({ msg: "Quantity must be an integer between 1 and 10" });
    }

    try {
        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ msg: "Product not found" });

        if (product.countInStock < quantity) {
            return res.status(400).json({ msg: "Insufficient stock" });
        }

        // Server-side price from DB only - never trust client
        const serverPrice = getEffectivePrice(product);
        const originalPrice = Number(product.price);
        const resolvedImage =
            (Array.isArray(product.images) && product.images[0] && product.images[0].url) ||
            FALLBACK_PRODUCT_IMAGE;

        let cart = await getCart(userId, guestId);

        if (cart) {
            const productIndex = cart.products.findIndex(
                (p) =>
                    p.productId.toString() === productId &&
                    p.size === normalizedSize &&
                    p.color === normalizedColor &&
                    (p.customMeasurementKey || "") === normalizedCustomMeasurementKey
            );
            if (productIndex > -1) {
                const newQty = cart.products[productIndex].quantity + quantity;
                if (newQty > 10) {
                    return res.status(400).json({ msg: "Max 10 items per product" });
                }
                cart.products[productIndex].quantity = newQty;
                cart.products[productIndex].price = serverPrice; // Always refresh price from DB
                cart.products[productIndex].originalPrice = Number.isFinite(originalPrice)
                    ? originalPrice
                    : serverPrice;
                cart.products[productIndex].countInStock = Number.isFinite(Number(product.countInStock))
                    ? Number(product.countInStock)
                    : 0;
                cart.products[productIndex].customMeasurementKey = normalizedCustomMeasurementKey;
                cart.products[productIndex].customMeasurements = normalizedCustomMeasurements || undefined;
            } else {
                cart.products.push({
                    productId,
                    name: product.name,
                    image: resolvedImage,
                    price: serverPrice,
                    originalPrice: Number.isFinite(originalPrice) ? originalPrice : serverPrice,
                    countInStock: Number.isFinite(Number(product.countInStock)) ? Number(product.countInStock) : 0,
                    size: normalizedSize,
                    color: normalizedColor,
                    customMeasurementKey: normalizedCustomMeasurementKey,
                    customMeasurements: normalizedCustomMeasurements || undefined,
                    quantity,
                });
            }

            // Recalculate total from DB prices
            cart = await recalculateCartTotal(cart);
            await cart.save();
            return res.status(200).json(cart);
        } else {
            // Create a new cart
            const newCart = await Cart.create({
                user: userId ? userId : undefined,
                guestId: !userId ? (guestId || "guest_" + new Date().getTime()) : undefined,
                products: [{
                    productId,
                    name: product.name,
                    image: resolvedImage,
                    price: serverPrice,
                    originalPrice: Number.isFinite(originalPrice) ? originalPrice : serverPrice,
                    countInStock: Number.isFinite(Number(product.countInStock)) ? Number(product.countInStock) : 0,
                    size: normalizedSize,
                    color: normalizedColor,
                    customMeasurementKey: normalizedCustomMeasurementKey,
                    customMeasurements: normalizedCustomMeasurements || undefined,
                    quantity,
                }],
                totalPrice: serverPrice * quantity,
            });
            return res.status(201).json(newCart);
        }
    } catch (error) {
        console.error("Cart add error:", error.message);
        res.status(500).json({ msg: "Server Error" });
    }
});

// Update cart item quantity
router.put("/", async (req, res) => {
    const { productId, quantity, size, color, customMeasurementKey, guestId } = req.body;
    const normalizedSize = size || "";
    const normalizedColor = color || "";
    const normalizedCustomMeasurementKey = normalizeCustomMeasurementKey(customMeasurementKey, null);

    let userId = null;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {
            const jwt = require("jsonwebtoken");
            const decoded = jwt.verify(
                req.headers.authorization.split(" ")[1],
                process.env.JWT_SECRET
            );
            userId = decoded.user.id;
        } catch (e) { /* guest */ }
    }

    if (!productId || !isValidObjectId(productId)) {
        return res.status(400).json({ msg: "Valid product ID is required" });
    }
    if (quantity !== undefined && (!Number.isInteger(quantity) || quantity < 0 || quantity > 10)) {
        return res.status(400).json({ msg: "Quantity must be an integer between 0 and 10" });
    }

    try {
        let cart = await getCart(userId, guestId);
        if (!cart) return res.status(404).json({ msg: "Cart not found." });

        const productIndex = cart.products.findIndex(
            (p) =>
                p.productId.toString() === productId &&
                p.size === normalizedSize &&
                p.color === normalizedColor &&
                (p.customMeasurementKey || "") === normalizedCustomMeasurementKey
        );

        if (productIndex > -1) {
            if (quantity > 0) {
                // Verify stock
                const product = await Product.findById(productId);
                if (product && quantity > product.countInStock) {
                    return res.status(400).json({ msg: "Insufficient stock" });
                }
                cart.products[productIndex].quantity = quantity;
                // Refresh price from DB
                if (product) {
                    const originalPrice = Number(product.price);
                    cart.products[productIndex].originalPrice = Number.isFinite(originalPrice)
                        ? originalPrice
                        : cart.products[productIndex].price;
                    cart.products[productIndex].countInStock = Number.isFinite(Number(product.countInStock))
                        ? Number(product.countInStock)
                        : 0;
                    cart.products[productIndex].price = getEffectivePrice(product);
                }
            } else {
                cart.products.splice(productIndex, 1);
            }
            // Recalculate total from DB prices
            cart = await recalculateCartTotal(cart);
            await cart.save();
            res.status(200).json(cart);
        } else {
            res.status(404).json({ msg: "Product not found in cart" });
        }
    } catch (error) {
        console.error("Cart update error:", error.message);
        res.status(500).json({ msg: "Server Error" });
    }
});

// Delete from cart
router.delete("/", async (req, res) => {
    const { productId, size, color, customMeasurementKey, guestId } = req.body;
    const normalizedSize = size || "";
    const normalizedColor = color || "";
    const normalizedCustomMeasurementKey = normalizeCustomMeasurementKey(customMeasurementKey, null);

    let userId = null;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {
            const jwt = require("jsonwebtoken");
            const decoded = jwt.verify(
                req.headers.authorization.split(" ")[1],
                process.env.JWT_SECRET
            );
            userId = decoded.user.id;
        } catch (e) { /* guest */ }
    }

    if (!productId || !isValidObjectId(productId)) {
        return res.status(400).json({ msg: "Valid product ID is required" });
    }

    try {
        let cart = await getCart(userId, guestId);
        if (!cart) return res.status(404).json({ msg: "Cart not found." });

        const productIndex = cart.products.findIndex(
            (p) =>
                p.productId.toString() === productId &&
                p.size === normalizedSize &&
                p.color === normalizedColor &&
                (p.customMeasurementKey || "") === normalizedCustomMeasurementKey
        );
        if (productIndex > -1) {
            cart.products.splice(productIndex, 1);
            cart = await recalculateCartTotal(cart);
            await cart.save();
            return res.status(200).json(cart);
        } else {
            return res.status(404).json({ msg: "Product not found in the cart." });
        }
    } catch (error) {
        console.error("Cart delete error:", error.message);
        res.status(500).json({ msg: "Server Error" });
    }
});

// Get cart
router.get("/", async (req, res) => {
    const { guestId } = req.query;

    let userId = null;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {
            const jwt = require("jsonwebtoken");
            const decoded = jwt.verify(
                req.headers.authorization.split(" ")[1],
                process.env.JWT_SECRET
            );
            userId = decoded.user.id;
        } catch (e) { /* guest */ }
    }

    try {
        let cart = await getCart(userId, guestId);
        if (cart) {
            // Refresh prices from DB before returning
            cart = await recalculateCartTotal(cart);
            await cart.save();
            logCartDebug("get_cart_response", {
                userId,
                guestId,
                cartId: cart?._id,
                itemCount: cart.products.length,
                totalPrice: cart.totalPrice,
                totalDiscount: cart.totalDiscount || 0,
                items: cart.products.map((item) => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    price: item.price,
                    originalPrice: item.originalPrice,
                    discountPrice: item.discountPrice,
                    discountPerItem: item.originalPrice - item.price,
                    totalDiscountForThisItem: (item.originalPrice - item.price) * item.quantity,
                })),
            });
            res.json(cart);
        } else {
            const emptyCart = {
                user: userId || undefined,
                guestId: userId ? undefined : guestId,
                products: [],
                totalPrice: 0,
                totalDiscount: 0,
            };
            logCartDebug("get_cart_empty_response", {
                userId,
                guestId,
                totalPrice: 0,
                totalDiscount: 0,
            });
            res.status(200).json(emptyCart);
        }
    } catch (error) {
        console.error("Cart get error:", error.message);
        res.status(500).json({ msg: "Server Error" });
    }
});

// Merge guest cart into user cart (requires auth)
router.post("/merge", protect, async (req, res) => {
    const { guestId } = req.body;
    try {
        const guestCart = await Cart.findOne({ guestId });
        const userCart = await Cart.findOne({ user: req.user._id });

        if (guestCart) {
            if (guestCart.products.length === 0) {
                return res.status(400).json({ msg: "Guest cart is empty" });
            }
            if (userCart) {
                guestCart.products.forEach((guestItem) => {
                    const productIndex = userCart.products.findIndex(
                        (item) => item.productId.toString() === guestItem.productId.toString() &&
                            item.size === guestItem.size &&
                            item.color === guestItem.color &&
                            (item.customMeasurementKey || "") === (guestItem.customMeasurementKey || "")
                    );
                    if (productIndex > -1) {
                        userCart.products[productIndex].quantity += guestItem.quantity;
                        // Cap at 10
                        if (userCart.products[productIndex].quantity > 10) {
                            userCart.products[productIndex].quantity = 10;
                        }
                    } else {
                        userCart.products.push(guestItem);
                    }
                });
                // Recalculate from DB prices
                const updatedCart = await recalculateCartTotal(userCart);
                await updatedCart.save();

                // Remove the guest cart after merge
                await Cart.findOneAndDelete({ guestId });

                res.status(200).json(updatedCart);
            } else {
                // Assign guest cart to user
                guestCart.user = req.user._id;
                guestCart.guestId = undefined;
                const updatedCart = await recalculateCartTotal(guestCart);
                await updatedCart.save();
                res.status(200).json(updatedCart);
            }
        } else {
            if (userCart) {
                return res.status(200).json(userCart);
            }
            res.status(404).json({ msg: "Guest cart not found" });
        }
    } catch (error) {
        console.error("Cart merge error:", error.message);
        res.status(500).json({ msg: "Server Error" });
    }
});

module.exports = router;