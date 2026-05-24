const mongoose = require("mongoose");

const promoCodeClaimSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    mobile: {
      type: String,
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "order",
      required: true,
    },
    discountApplied: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["applied", "reverted"],
      default: "applied",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PromoCodeClaim", promoCodeClaimSchema);
