const express = require("express");
const Order = require("../models/Order");
const { protect } = require("../middleware/authMiddleware");
const { getInvoiceByOrderId } = require("../controllers/orderController");
const mongoose = require("mongoose");

const router = express.Router();

// Helper: validate ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Get invoice - PROTECTED with ownership check
router.get('/:id/invoice', protect, async (req, res) => {
    if (!isValidObjectId(req.params.id)) {
        return res.status(400).json({ msg: "Invalid order ID" });
    }
    // Verify ownership before returning invoice
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ msg: "Order not found" });
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
        return res.status(403).json({ msg: "Not authorized to view this invoice" });
    }
    getInvoiceByOrderId(req, res);
});

// Get user's orders
router.get("/my-orders", protect, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        console.error("Fetch orders error:", error.message);
        res.status(500).json({ msg: "Server error" });
    }
});

// Get order details by id - WITH OWNERSHIP CHECK
router.get("/:id", protect, async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ msg: "Invalid order ID" });
        }

        const order = await Order.findById(req.params.id).populate("user", "name email");

        if (!order) {
            return res.status(404).json({ msg: "Order not found." });
        }

        // Ownership check: only the order owner or admin can view
        if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== "admin") {
            return res.status(403).json({ msg: "Not authorized to view this order" });
        }

        res.json(order);
    } catch (error) {
        console.error("Fetch order error:", error.message);
        res.status(500).json({ msg: "Server error" });
    }
});

module.exports = router;