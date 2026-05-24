const PromoCode = require("../models/PromoCode");
const PromoCodeClaim = require("../models/PromoCodeClaim");
const User = require("../models/user");
const jwt = require("jsonwebtoken");

// Optional auth helper to get user if token exists
const getOptionalUser = async (req) => {
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      const token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return await User.findById(decoded.user.id);
    } catch (error) {
      return null;
    }
  }
  return null;
};

// @desc    Create a new promo code
// @route   POST /api/promocode/create
// @access  Private/Admin
const createPromoCode = async (req, res) => {
  try {
    const {
      code,
      type,
      discountType,
      discountValue,
      usageLimit,
      expiry,
      assignedMobile,
      isActive,
    } = req.body;

    if (type === "private" && !assignedMobile) {
      return res.status(400).json({ msg: "Private promo codes must have an assigned mobile number." });
    }

    const existingCode = await PromoCode.findOne({ code: code.toUpperCase() });
    if (existingCode) {
      return res.status(400).json({ msg: "Promo code already exists" });
    }

    const promoCode = await PromoCode.create({
      code: code.toUpperCase(),
      type,
      discountType,
      discountValue,
      usageLimit: usageLimit || 0,
      expiry,
      assignedMobile: type === "private" ? assignedMobile : undefined,
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json(promoCode);
  } catch (error) {
    res.status(500).json({ msg: "Server error creating promo code", error: error.message });
  }
};

// @desc    Get all promo codes
// @route   GET /api/promocode/list
// @access  Private/Admin
const getPromoCodes = async (req, res) => {
  try {
    const promoCodes = await PromoCode.find({}).sort({ createdAt: -1 });
    res.json(promoCodes);
  } catch (error) {
    res.status(500).json({ msg: "Server error fetching promo codes" });
  }
};

// @desc    Validate a promo code
// @route   POST /api/promocode/validate
// @access  Public (conditionally Private)
const validatePromoCode = async (req, res) => {
  try {
    const { code, mobile, cartTotal } = req.body;

    if (!code) {
      return res.status(400).json({ msg: "Promo code is required" });
    }
    if (!cartTotal) {
      return res.status(400).json({ msg: "Cart total is required for validation" });
    }

    const promo = await PromoCode.findOne({ code: code.toUpperCase() });

    if (!promo || !promo.isActive) {
      return res.status(400).json({ msg: "Invalid or inactive promo code" });
    }
    
    if (new Date(promo.expiry) < new Date()) {
      return res.status(400).json({ msg: "Promo code has expired" });
    }

    if (promo.usageLimit > 0 && promo.usageCount >= promo.usageLimit) {
      return res.status(400).json({ msg: "Promo code usage limit reached" });
    }

    if (promo.type === "private") {
      const user = await getOptionalUser(req);
      if (!user) {
        return res.status(401).json({ msg: "You must be logged in to use this promo code" });
      }
      
      // Need verified mobile logic: if use isVerified or just phone match
      const userPhoneStr = (user.phone || "").replace("+", "").trim();
      const assignedPhoneStr = (promo.assignedMobile || "").replace("+", "").trim();
      
      if (userPhoneStr !== assignedPhoneStr) {
        return res.status(403).json({ msg: "This promo code is not assigned to your mobile number" });
      }

    }

    // Calculate discount
    let discountAmount = 0;
    if (promo.discountType === "amount") {
      discountAmount = promo.discountValue;
    } else if (promo.discountType === "percent") {
      discountAmount = (cartTotal * promo.discountValue) / 100;
    }
    
    // Ensure discount doesnt exceed cart total
    if (discountAmount > cartTotal) {
      discountAmount = cartTotal;
    }

    res.json({
      valid: true,
      promoCode: promo.code,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      discountAmount: discountAmount,
      msg: `Promo code applied successfully. You saved ₹${discountAmount.toFixed(2)}`
    });

  } catch (error) {
    res.status(500).json({ msg: "Server error validating promo code", error: error.message });
  }
};

// @desc    Get all promo code claims
// @route   GET /api/promocode/claims
// @access  Private/Admin
const getPromoCodeClaims = async (req, res) => {
  try {
    const claims = await PromoCodeClaim.find({}).populate("user", "name email phone").populate("order", "totalPrice status createdAt").sort({ createdAt: -1 });
    res.json(claims);
  } catch (error) {
    res.status(500).json({ msg: "Server error fetching promo code claims" });
  }
};

module.exports = {
  createPromoCode,
  getPromoCodes,
  validatePromoCode,
  getPromoCodeClaims
};
