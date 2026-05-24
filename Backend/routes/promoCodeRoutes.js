const express = require("express");
const router = express.Router();
const {
  createPromoCode,
  getPromoCodes,
  validatePromoCode,
  getPromoCodeClaims
} = require("../controllers/promoCodeController");
const { protect, admin } = require("../middleware/authMiddleware");

// Public (with optional auth internally)
router.post("/validate", validatePromoCode);

// Admin Routes
router.post("/create", protect, admin, createPromoCode);
router.get("/list", protect, admin, getPromoCodes);
router.get("/claims", protect, admin, getPromoCodeClaims);

module.exports = router;
