// Backend/routes/wishlistRoutes.js
const express = require("express");
const Wishlist = require("../models/Wishlist");
const { protect } = require("../middleware/authMiddleware");
const mongoose = require("mongoose");

const router = express.Router();

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Get user's wishlist - only own wishlist
router.post("/fetch/:userid", protect, async (req, res) => {
    const { userid } = req.params;

    // Ownership check: users can only fetch their own wishlist
    if (userid !== req.user._id.toString()) {
        return res.status(403).json({ msg: "Not authorized to view this wishlist" });
    }

    try {
        const wishlist = await Wishlist.findOne({ user: userid });
        if (!wishlist) {
            return res.status(404).json({ msg: "Wishlist not found" });
        }
        res.status(200).json({ success: true, data: wishlist });
    } catch (error) {
        console.error("Wishlist fetch error:", error.message);
        res.status(500).json({ success: false, msg: "Server Error" });
    }
});

// Add item to wishlist - only own wishlist
router.post("/:userid/:productId", protect, async (req, res) => {
    const { userid, productId } = req.params;

    if (userid !== req.user._id.toString()) {
        return res.status(403).json({ msg: "Not authorized" });
    }
    if (!isValidObjectId(productId)) {
        return res.status(400).json({ msg: "Invalid product ID" });
    }

    try {
        let wishlist = await Wishlist.findOne({ user: userid }) || new Wishlist({ user: userid, items: [] });

        if (wishlist.items.some(item => item.productId.toString() === productId)) {
            return res.status(400).json({ msg: "Item already in wishlist" });
        }

        // Limit wishlist size
        if (wishlist.items.length >= 50) {
            return res.status(400).json({ msg: "Wishlist is full (max 50 items)" });
        }

        wishlist.items.push({ productId });
        await wishlist.save();
        res.status(201).json(wishlist);
    } catch (error) {
        console.error("Wishlist add error:", error.message);
        res.status(500).json({ msg: "Server Error" });
    }
});

// Remove item from wishlist - only own wishlist
router.delete("/:userid/:productId", protect, async (req, res) => {
    const { userid, productId } = req.params;

    if (userid !== req.user._id.toString()) {
        return res.status(403).json({ msg: "Not authorized" });
    }
    if (!isValidObjectId(productId)) {
        return res.status(400).json({ msg: "Invalid product ID" });
    }

    try {
        const wishlist = await Wishlist.findOne({ user: userid });

        if (!wishlist) {
            return res.status(404).json({ msg: "Wishlist not found" });
        }

        wishlist.items = wishlist.items.filter(item => item.productId.toString() !== productId);
        await wishlist.save();
        res.status(200).json(wishlist);
    } catch (error) {
        console.error("Wishlist remove error:", error.message);
        res.status(500).json({ msg: "Server Error" });
    }
});

module.exports = router;