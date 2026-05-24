const express = require("express");
const Order = require("../models/Order");
const { protect, admin } = require("../middleware/authMiddleware");
const { sendEmail } = require("../services/emailService");
const mongoose = require("mongoose");

const router = express.Router();

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Get bought collections summary (public)
router.get("/buy-collection", async (req, res) => {
    try {
        const paidOnly = String(req.query.paidOnly || "true").toLowerCase() !== "false";
        const matchStage = paidOnly ? { isPaid: true } : {};

        const summary = await Order.aggregate([
            { $match: matchStage },
            { $unwind: "$orderItems" },
            {
                $lookup: {
                    from: "products",
                    localField: "orderItems.productId",
                    foreignField: "_id",
                    as: "product",
                },
            },
            {
                $addFields: {
                    product: { $arrayElemAt: ["$product", 0] },
                },
            },
            {
                $project: {
                    orderId: "$_id",
                    quantity: { $ifNull: ["$orderItems.quantity", 0] },
                    collection: {
                        $ifNull: ["$product.collections", "Uncategorized"],
                    },
                },
            },
            {
                $group: {
                    _id: "$collection",
                    itemsSold: { $sum: "$quantity" },
                    orderIds: { $addToSet: "$orderId" },
                },
            },
            {
                $project: {
                    _id: 0,
                    collection: "$_id",
                    itemsSold: 1,
                    ordersCount: { $size: "$orderIds" },
                },
            },
            { $sort: { itemsSold: -1, collection: 1 } },
        ]);

        res.json({
            paidOnly,
            count: summary.length,
            collections: summary,
        });
    } catch (error) {
        console.error("Buy-collection summary error:", error.message);
        res.status(500).json({ msg: "Internal Server Error." });
    }
});

// Get all orders (Admin only)
router.get("/", protect, admin, async (req, res) => {
    try {
        const orders = await Order.find({}).populate("user", "name email");
        res.json(orders);
    } catch (error) {
        console.error("Fetch orders error:", error.message);
        res.status(500).json({ msg: "Internal Server Error." });
    }
});

// Update order status and send email
router.put("/:id", protect, admin, async (req, res) => {
    if (!isValidObjectId(req.params.id)) {
        return res.status(400).json({ msg: "Invalid order ID" });
    }

    const validStatuses = ["Processing", "Shipped", "Delivered", "Cancelled"];
    if (req.body.status && !validStatuses.includes(req.body.status)) {
        return res.status(400).json({ msg: "Invalid order status" });
    }

    try {
        const order = await Order.findById(req.params.id).populate("user", "email");

        if (!order) {
            return res.status(404).json({ msg: "No order found." });
        }

        if (req.body.status) {
            order.status = req.body.status;
            if (req.body.status === "Delivered") {
                order.isDelivered = true;
                order.deliveredAt = Date.now();
            }
        }

        const updatedOrder = await order.save();

        // Send email notification (non-blocking)
        const emailSubject = `Order Update - Your Order #${order._id}`;
        const emailMessage = `Your order with ID: ${order._id} has been updated to status: ${order.status}.`;
        sendEmail(order.user.email, emailSubject, emailMessage).catch(err =>
            console.error("Email send failed:", err.message)
        );

        res.json(updatedOrder);
    } catch (error) {
        console.error("Update order error:", error.message);
        res.status(500).json({ msg: "Internal Server Error." });
    }
});

// Delete an order (Admin only)
router.delete("/:id", protect, admin, async (req, res) => {
    if (!isValidObjectId(req.params.id)) {
        return res.status(400).json({ msg: "Invalid order ID" });
    }

    try {
        const order = await Order.findById(req.params.id);
        if (order) {
            await order.deleteOne();
            res.json({ msg: "Order deleted" });
        } else {
            res.status(404).json({ msg: "Order not found" });
        }
    } catch (error) {
        console.error("Delete order error:", error.message);
        res.status(500).json({ msg: "Internal Server Error." });
    }
});

module.exports = router;
