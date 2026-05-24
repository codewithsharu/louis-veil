const mongoose = require("mongoose");

const promoCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    type: {
      type: String,
      enum: ["public", "private"],
      required: true,
    },
    discountType: {
      type: String,
      enum: ["amount", "percent"],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    usageLimit: {
      type: Number,
      default: 0, // 0 means unlimited
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    expiry: {
      type: Date,
      required: true,
    },
    assignedMobile: {
      type: String,
      trim: true,
    }, // Required if type is 'private'
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PromoCode", promoCodeSchema);
