// Backend/models/Wishlist.js
const mongoose = require("mongoose");

const wishlistItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },
}, { _id: false });





const wishlistSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    items: [wishlistItemSchema],
}, { timestamps: true });

module.exports = mongoose.model("Wishlist", wishlistSchema);