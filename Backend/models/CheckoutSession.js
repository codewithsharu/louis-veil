const mongoose = require("mongoose");

const customMeasurementSchema = new mongoose.Schema(
    {
        bustChest: Number,
        waist: Number,
        hips: Number,
        shoulderWidth: Number,
        sleeveLength: Number,
        armhole: Number,
        bicepSize: Number,
    },
    { _id: false }
);

const checkoutSessionItemSchema = new mongoose.Schema(
    {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        image: {
            type: String,
            required: true,
        },
        price: {
            type: Number,
            required: true,
        },
        originalPrice: {
            type: Number,
            required: true,
        },
        countInStock: {
            type: Number,
            required: true,
            default: 0,
        },
        quantity: {
            type: Number,
            required: true,
        },
        size: String,
        color: String,
        customMeasurementKey: {
            type: String,
            default: "",
        },
        customMeasurements: customMeasurementSchema,
    },
    { _id: false }
);

const checkoutSessionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        checkoutItems: [checkoutSessionItemSchema],
        subtotal: {
            type: Number,
            required: true,
        },
        deliveryCharge: {
            type: Number,
            required: true,
            default: 0,
        },
        totalPrice: {
            type: Number,
            required: true,
        },
        isUsed: {
            type: Boolean,
            default: false,
        },
        expiresAt: {
            type: Date,
            required: true,
            index: { expires: 0 },
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("CheckoutSession", checkoutSessionSchema);
