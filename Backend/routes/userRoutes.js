const express = require("express");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const validator = require("validator");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/user");
const { protect } = require("../middleware/authMiddleware");
const { sendOTP } = require("../services/emailService");
const {
    initiateShiprocketS2SLogin,
    verifyShiprocketS2SLogin,
} = require("../services/shiprocketService");
const router = express.Router();

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper: sanitize string input
const sanitize = (str) => {
    if (typeof str !== "string") return "";
    return str.trim().slice(0, 200);
};

const sanitizeName = (value) => {
    if (typeof value !== "string") return "";
    return value.trim().slice(0, 50);
};

const sanitizeAddressField = (value, max = 120) => {
    if (typeof value !== "string") return "";
    return value.trim().slice(0, max);
};

const normalizeAddressForCompare = (address = {}) => {
    const compact = (val) => String(val || "").trim().toLowerCase().replace(/\s+/g, " ");
    return {
        firstName: compact(address.firstName),
        lastName: compact(address.lastName),
        address: compact(address.address),
        city: compact(address.city),
        postalCode: compact(address.postalCode),
        country: compact(address.country),
        phone: compact(address.phone),
    };
};

const validateAddressPayload = (payload = {}) => {
    const requiredFields = ["firstName", "lastName", "address", "city", "postalCode", "country", "phone"];
    for (const field of requiredFields) {
        if (!payload[field] || !String(payload[field]).trim()) {
            return `Missing required field: ${field}`;
        }
    }
    return null;
};

const sortAddresses = (addresses = []) => {
    return [...addresses].sort((a, b) => {
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;
        return new Date(b.lastUsedAt || 0) - new Date(a.lastUsedAt || 0);
    });
};

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const PROFILE_ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const PROFILE_MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

const uploadProfileImage = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: PROFILE_MAX_FILE_SIZE },
    fileFilter: (req, file, cb) => {
        if (PROFILE_ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Only JPEG, PNG, WebP, and AVIF images are allowed"), false);
        }
    },
});

const streamUploadToCloudinary = (fileBuffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                resource_type: "image",
                folder: "users/profiles",
                allowed_formats: ["jpg", "jpeg", "png", "webp", "avif"],
                gravity: "auto",
                crop: "fill",
                width: 500,
                height: 500
            },
            (error, result) => {
                if (result) {
                    resolve(result);
                } else {
                    reject(error);
                }
            }
        );

        streamifier.createReadStream(fileBuffer).pipe(stream);
    });
};

const PHONE_PLACEHOLDER_EMAIL_DOMAIN = "otp.local";

const normalizeIndianPhoneDigits = (value) => {
    const digits = String(value || "").replace(/\D/g, "");
    if (!digits) return "";

    let normalized = digits;
    if (digits.length === 12 && digits.startsWith("91")) {
        normalized = digits.slice(2);
    } else if (digits.length === 11 && digits.startsWith("0")) {
        normalized = digits.slice(1);
    } else if (digits.length > 10) {
        normalized = digits.slice(-10);
    }

    return /^[6-9]\d{9}$/.test(normalized) ? normalized : "";
};

const toVerifiedIndianPhone = (digits) => `+91${digits}`;

const buildPhonePlaceholderEmail = (digits, suffix = "") =>
    `phone_${digits}${suffix ? `_${suffix}` : ""}@${PHONE_PLACEHOLDER_EMAIL_DOMAIN}`;

const isPhonePlaceholderEmail = (value) =>
    String(value || "").trim().toLowerCase().endsWith(`@${PHONE_PLACEHOLDER_EMAIL_DOMAIN}`);

const buildSafeUserResponse = (user) => ({
    _id: user._id,
    name: user.name,
    email: isPhonePlaceholderEmail(user.email) ? "" : (user.email || ""),
    phone: user.phone || "",
    role: user.role,
    profileImage: user.profileImage || "",
    authProvider: user.authProvider || "email",
});

const signUserToken = (user) =>
    new Promise((resolve, reject) => {
        const payload = { user: { id: user._id, role: user.role } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "24h" }, (err, token) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(token);
        });
    });

const ensureUniquePhonePlaceholderEmail = async (digits, existingUserId = "") => {
    let suffix = 0;

    while (suffix < 100) {
        const candidate = buildPhonePlaceholderEmail(digits, suffix || "");
        const existing = await User.findOne({ email: candidate }).select("_id");
        if (!existing || String(existing._id) === String(existingUserId || "")) {
            return candidate;
        }
        suffix += 1;
    }

    return buildPhonePlaceholderEmail(digits, Date.now());
};

const createPhoneAuthPassword = () => crypto.randomBytes(24).toString("hex");

// Google OAuth login — verify ID token and issue JWT
router.post("/google-login", async (req, res) => {
    const { credential } = req.body;

    if (!credential || typeof credential !== "string") {
        return res.status(400).json({ msg: "Google credential is required" });
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
        console.error("GOOGLE_CLIENT_ID is not configured");
        return res.status(503).json({ msg: "Google login is not configured" });
    }

    try {
        let payload;
        
        // Handle access tokens from custom google login hooks (starts with ya29.)
        if (credential.startsWith("ya29.")) {
            const axios = require("axios");
            const { data } = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
                headers: { Authorization: `Bearer ${credential}` }
            });
            
            payload = {
                email_verified: data.email_verified,
                email: data.email,
                sub: data.sub,
                name: data.name,
                picture: data.picture,
            };
        } else {
            // Standard ID Token verification
            const ticket = await googleClient.verifyIdToken({
                idToken: credential,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            payload = ticket.getPayload();
        }

        if (!payload || !payload.email_verified || !payload.email) {
            return res.status(401).json({ msg: "Google account email is not verified" });
        }

        const { sub: googleId, email, name: googleName, picture } = payload;

        // Find existing user by googleId or email
        let user = await User.findOne({ googleId });
        if (!user) {
            user = await User.findOne({ email: email.toLowerCase() });
        }

        if (!user) {
            // Create new user from Google account
            user = new User({
                name: sanitize(googleName) || email.split("@")[0],
                email: email.toLowerCase(),
                googleId,
                profileImage: picture || "",
                isVerified: true,
                authProvider: "google",
            });
        } else {
            // Update existing user with Google info
            if (!user.googleId) {
                user.googleId = googleId;
            }
            if (!user.isVerified) {
                user.isVerified = true;
            }
            if (!user.profileImage && picture) {
                user.profileImage = picture;
            }
            if (!String(user.name || "").trim() || user.name === "Temporary") {
                user.name = sanitize(googleName) || email.split("@")[0];
            }
            if (!user.authProvider || user.authProvider === "shiprocket_phone" ||
                (user.authProvider === "email" && !user.password)) {
                user.authProvider = "google";
            }
        }

        await user.save();
        const token = await signUserToken(user);

        return res.status(200).json({
            user: buildSafeUserResponse(user),
            token,
        });
    } catch (error) {
        console.error("Google login error:", error.message);
        if (error.message && error.message.includes("Token used too late")) {
            return res.status(401).json({ msg: "Google session expired. Please try again." });
        }
        return res.status(401).json({ msg: "Invalid Google credential" });
    }
});

// Phone-first auth: request OTP from Shiprocket Checkout S2S API
router.post("/phone-login/initiate", async (req, res) => {
    const mobileNumberInput = req.body?.mobileNumber || req.body?.phone || "";
    const normalizedPhoneDigits = normalizeIndianPhoneDigits(mobileNumberInput);

    if (!normalizedPhoneDigits) {
        return res.status(400).json({ msg: "Valid 10-digit Indian mobile number is required" });
    }

    try {
        const initiateResult = await initiateShiprocketS2SLogin({
            mobileNumber: normalizedPhoneDigits,
        });

        if (!initiateResult.success) {
            return res.status(initiateResult.skipped ? 400 : 502).json({
                msg: initiateResult.reason || "Unable to send OTP",
                ...(process.env.NODE_ENV !== "production" ? { detail: initiateResult.error, attempts: initiateResult.attempts } : {}),
            });
        }

        return res.status(200).json({
            msg: "OTP sent successfully",
            mobileNumber: toVerifiedIndianPhone(normalizedPhoneDigits),
        });
    } catch (error) {
        console.error("Phone OTP initiate error:", error.message);
        return res.status(500).json({ msg: "Unable to send OTP right now" });
    }
});

// Phone-first auth: verify OTP and issue JWT session
router.post("/phone-login/verify", async (req, res) => {
    const mobileNumberInput = req.body?.mobileNumber || req.body?.phone || "";
    const otp = String(req.body?.otp || "").replace(/\D/g, "").trim();
    const initiateToken = String(req.body?.token || req.body?.initiateToken || "").trim();
    const normalizedPhoneDigits = normalizeIndianPhoneDigits(mobileNumberInput);

    if (!normalizedPhoneDigits) {
        return res.status(400).json({ msg: "Valid 10-digit Indian mobile number is required" });
    }

    if (!otp || otp.length < 4 || otp.length > 8) {
        return res.status(400).json({ msg: "Valid OTP is required" });
    }

    try {
        const verifyResult = await verifyShiprocketS2SLogin({
            mobileNumber: normalizedPhoneDigits,
            otp,
            token: initiateToken,
        });

        if (!verifyResult.success) {
            return res.status(401).json({
                msg: verifyResult.reason || "Invalid or expired OTP",
                ...(process.env.NODE_ENV !== "production" ? { detail: verifyResult.error, attempts: verifyResult.attempts } : {}),
            });
        }

        const verifiedPhone = toVerifiedIndianPhone(normalizedPhoneDigits);

        let user = await User.findOne({ phone: verifiedPhone });
        if (!user) {
            const defaultPlaceholderEmail = buildPhonePlaceholderEmail(normalizedPhoneDigits);
            user = await User.findOne({ email: defaultPlaceholderEmail });
        }

        if (!user) {
            const placeholderEmail = await ensureUniquePhonePlaceholderEmail(normalizedPhoneDigits);
            user = new User({
                name: `Customer ${normalizedPhoneDigits.slice(-4)}`,
                email: placeholderEmail,
                password: createPhoneAuthPassword(),
                isVerified: true,
                phone: verifiedPhone,
                phoneVerifiedAt: new Date(),
                authProvider: "shiprocket_phone",
            });
        } else {
            user.phone = verifiedPhone;
            user.phoneVerifiedAt = new Date();
            user.isVerified = true;

            if (!user.password) {
                user.password = createPhoneAuthPassword();
            }

            if (!String(user.name || "").trim() || String(user.name || "").trim().toLowerCase() === "temporary") {
                user.name = `Customer ${normalizedPhoneDigits.slice(-4)}`;
            }

            if (isPhonePlaceholderEmail(user.email) || !user.email) {
                user.authProvider = "shiprocket_phone";
            }
        }

        await user.save();
        const token = await signUserToken(user);

        return res.status(200).json({
            user: buildSafeUserResponse(user),
            token,
        });
    } catch (error) {
        console.error("Phone OTP verify error:", error.message);
        return res.status(500).json({ msg: "Unable to verify OTP right now" });
    }
});

// Step 1: Request OTP for registration
router.post("/register/request-otp", async (req, res) => {
    const { email } = req.body;

    if (!email || !validator.isEmail(email)) {
        return res.status(400).json({ msg: "Valid email is required" });
    }

    try {
        const existingUser = await User.findOne({ email: email.toLowerCase(), isVerified: true });
        if (existingUser) {
            return res.status(400).json({ msg: "User with this email already exists" });
        }

        let user = await User.findOne({ email: email.toLowerCase(), isVerified: false });

        if (!user) {
            user = new User({
                email: email.toLowerCase(),
                name: "Temporary",
                password: "temporary123456",
                isVerified: false
            });
        }

        const otp = user.generateOTP();
        if (!otp) {
            return res.status(429).json({ msg: "Too many OTP requests. Please try again later." });
        }
        await user.save();
        await sendOTP(email, otp);

        res.status(200).json({ msg: "OTP sent to your email" });
    } catch (error) {
        console.error("OTP Request Error:", error.message);
        res.status(500).json({ msg: "Server Error" });
    }
});

// Step 2: Verify OTP and complete registration
router.post("/register/verify", async (req, res) => {
    const { email, otp, name, password } = req.body;

    if (!email || !otp || !name || !password) {
        return res.status(400).json({ msg: "All fields are required" });
    }
    if (!validator.isEmail(email)) {
        return res.status(400).json({ msg: "Valid email is required" });
    }
    if (password.length < 6 || password.length > 128) {
        return res.status(400).json({ msg: "Password must be 6-128 characters" });
    }

    try {
        const user = await User.findOne({ email: email.toLowerCase(), isVerified: false });
        if (!user) {
            return res.status(400).json({ msg: "User not found or already verified" });
        }

        if (!user.verifyOTP(otp)) {
            await user.save(); // Save incremented attempts
            return res.status(400).json({ msg: "Invalid or expired OTP" });
        }

        user.name = sanitize(name);
        user.password = password;
        user.isVerified = true;
        user.otp = undefined;
        user.otpExpiry = undefined;
        user.otpAttempts = 0;
        user.otpLockedUntil = undefined;

        await user.save();
        const token = await signUserToken(user);

        res.status(201).json({
            user: buildSafeUserResponse(user),
            token,
        });
    } catch (error) {
        console.error("OTP Verification Error:", error.message);
        res.status(500).json({ msg: "Server Error" });
    }
});

// Resend OTP
router.post("/register/resend-otp", async (req, res) => {
    const { email } = req.body;

    if (!email || !validator.isEmail(email)) {
        return res.status(400).json({ msg: "Valid email is required" });
    }

    try {
        const user = await User.findOne({ email: email.toLowerCase(), isVerified: false });
        if (!user) {
            return res.status(404).json({ msg: "User not found or already verified" });
        }

        const otp = user.generateOTP();
        if (!otp) {
            return res.status(429).json({ msg: "Too many OTP requests. Please try again later." });
        }
        await user.save();
        await sendOTP(email, otp);

        res.status(200).json({ msg: "New OTP sent to your email" });
    } catch (error) {
        console.error("Resend OTP Error:", error.message);
        res.status(500).json({ msg: "Server Error" });
    }
});

// Login route
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ msg: "Email and password are required" });
    }
    if (!validator.isEmail(email)) {
        return res.status(400).json({ msg: "Valid email is required" });
    }

    try {
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) return res.status(400).json({ msg: "Invalid credentials" });

        if (!user.isVerified) {
            return res.status(401).json({
                msg: "Email not verified",
                needVerification: true,
            });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

        const token = await signUserToken(user);

        res.json({
            user: buildSafeUserResponse(user),
            token,
        });
    } catch (error) {
        console.error("Login Error:", error.message);
        res.status(500).json({ msg: "Server Error" });
    }
});

router.post("/forgot-password/request-otp", async (req, res) => {
    const { email } = req.body;

    if (!email || !validator.isEmail(email)) {
        return res.status(400).json({ msg: "Valid email is required" });
    }

    try {
        const user = await User.findOne({ email: email.toLowerCase(), isVerified: true });

        if (!user) {
            // Don't reveal whether the email exists
            return res.status(200).json({ msg: "If the email is registered, an OTP has been sent" });
        }

        const otp = user.generateOTP();
        if (!otp) {
            return res.status(429).json({ msg: "Too many OTP requests. Please try again later." });
        }
        await user.save();
        await sendOTP(email, otp);

        res.status(200).json({ msg: "If the email is registered, an OTP has been sent" });
    } catch (error) {
        console.error("Forgot Password OTP Error:", error.message);
        res.status(500).json({ msg: "Server Error" });
    }
});

// Forgot Password - Verify OTP & Reset Password
router.post("/forgot-password/reset", async (req, res) => {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
        return res.status(400).json({ msg: "All fields are required" });
    }
    if (!validator.isEmail(email)) {
        return res.status(400).json({ msg: "Valid email is required" });
    }
    if (newPassword.length < 6 || newPassword.length > 128) {
        return res.status(400).json({ msg: "Password must be 6-128 characters" });
    }

    try {
        const user = await User.findOne({ email: email.toLowerCase(), isVerified: true });

        if (!user) {
            return res.status(400).json({ msg: "Invalid request" });
        }

        if (!user.verifyOTP(otp)) {
            await user.save(); // Save incremented attempts
            return res.status(400).json({ msg: "Invalid or expired OTP" });
        }

        user.password = newPassword;
        user.otp = undefined;
        user.otpExpiry = undefined;
        user.otpAttempts = 0;
        user.otpLockedUntil = undefined;

        await user.save();

        res.status(200).json({ msg: "Password reset successful. You can now log in." });
    } catch (error) {
        console.error("Password Reset Error:", error.message);
        res.status(500).json({ msg: "Server Error" });
    }
});

// Profile route
router.get("/profile", protect, async (req, res) => {
    res.json(buildSafeUserResponse(req.user));
});

// Update profile (name + optional profile image)
router.patch("/profile", protect, (req, res, next) => {
    uploadProfileImage.single("profileImage")(req, res, (err) => {
        if (err) {
            if (err.code === "LIMIT_FILE_SIZE") {
                return res.status(400).json({ msg: "Profile image is too large. Maximum size is 2MB." });
            }
            return res.status(400).json({ msg: err.message || "File upload error." });
        }
        next();
    });
}, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        let hasUpdates = false;

        if (typeof req.body?.name !== "undefined") {
            const cleanedName = sanitizeName(req.body.name);
            if (!cleanedName) {
                return res.status(400).json({ msg: "Name is required" });
            }

            if (cleanedName !== user.name) {
                user.name = cleanedName;
                hasUpdates = true;
            }
        }

        if (req.file) {
            const uploaded = await streamUploadToCloudinary(req.file.buffer);
            user.profileImage = uploaded.secure_url;
            hasUpdates = true;
        }

        if (!hasUpdates) {
            return res.status(400).json({ msg: "No profile changes detected" });
        }

        await user.save();

        res.status(200).json({
            msg: "Profile updated successfully",
            user: buildSafeUserResponse(user),
        });
    } catch (error) {
        console.error("Update Profile Error:", error.message);
        res.status(500).json({ msg: "Server Error" });
    }
});

// Get all saved addresses for authenticated user
router.get("/addresses", protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("savedAddresses");
        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        const sortedAddresses = sortAddresses(user.savedAddresses || []);

        res.status(200).json({ addresses: sortedAddresses });
    } catch (error) {
        console.error("Get Addresses Error:", error.message);
        res.status(500).json({ msg: "Server Error" });
    }
});

// Save or update an address for authenticated user
router.post("/addresses", protect, async (req, res) => {
    try {
        const { address, setAsDefault = false, label = "Home" } = req.body || {};
        const validationError = validateAddressPayload(address);
        if (validationError) {
            return res.status(400).json({ msg: validationError });
        }

        const user = await User.findById(req.user._id).select("savedAddresses");
        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        const cleanedAddress = {
            label: sanitizeAddressField(label, 30) || "Home",
            firstName: sanitizeAddressField(address.firstName, 50),
            lastName: sanitizeAddressField(address.lastName, 50),
            address: sanitizeAddressField(address.address, 250),
            city: sanitizeAddressField(address.city, 80),
            postalCode: sanitizeAddressField(address.postalCode, 20),
            country: sanitizeAddressField(address.country, 80),
            phone: sanitizeAddressField(address.phone, 25),
            lastUsedAt: new Date(),
        };

        const normalizedIncoming = normalizeAddressForCompare(cleanedAddress);
        const existingIndex = (user.savedAddresses || []).findIndex((saved) => {
            const normalizedSaved = normalizeAddressForCompare(saved);
            return (
                normalizedSaved.firstName === normalizedIncoming.firstName &&
                normalizedSaved.lastName === normalizedIncoming.lastName &&
                normalizedSaved.address === normalizedIncoming.address &&
                normalizedSaved.city === normalizedIncoming.city &&
                normalizedSaved.postalCode === normalizedIncoming.postalCode &&
                normalizedSaved.country === normalizedIncoming.country &&
                normalizedSaved.phone === normalizedIncoming.phone
            );
        });

        if (setAsDefault) {
            user.savedAddresses = (user.savedAddresses || []).map((saved) => ({
                ...saved.toObject(),
                isDefault: false,
            }));
        }

        if (existingIndex > -1) {
            user.savedAddresses[existingIndex].label = cleanedAddress.label;
            user.savedAddresses[existingIndex].firstName = cleanedAddress.firstName;
            user.savedAddresses[existingIndex].lastName = cleanedAddress.lastName;
            user.savedAddresses[existingIndex].address = cleanedAddress.address;
            user.savedAddresses[existingIndex].city = cleanedAddress.city;
            user.savedAddresses[existingIndex].postalCode = cleanedAddress.postalCode;
            user.savedAddresses[existingIndex].country = cleanedAddress.country;
            user.savedAddresses[existingIndex].phone = cleanedAddress.phone;
            user.savedAddresses[existingIndex].lastUsedAt = cleanedAddress.lastUsedAt;
            if (setAsDefault) {
                user.savedAddresses[existingIndex].isDefault = true;
            }
        } else {
            user.savedAddresses.push({
                ...cleanedAddress,
                isDefault: Boolean(setAsDefault),
            });
        }

        // Keep a sensible cap while preserving most recently used addresses
        if (user.savedAddresses.length > 2) {
            user.savedAddresses = user.savedAddresses
                .sort((a, b) => new Date(b.lastUsedAt || 0) - new Date(a.lastUsedAt || 0))
                .slice(0, 2);
        }

        await user.save();

        const sortedAddresses = sortAddresses(user.savedAddresses || []);

        res.status(200).json({
            msg: "Address saved",
            addresses: sortedAddresses,
        });
    } catch (error) {
        console.error("Save Address Error:", error.message);
        res.status(500).json({ msg: "Server Error" });
    }
});

// Edit a saved address
router.put("/addresses/:addressId", protect, async (req, res) => {
    try {
        const { addressId } = req.params;
        const { address, label = "Home", setAsDefault = false } = req.body || {};
        const validationError = validateAddressPayload(address);
        if (validationError) {
            return res.status(400).json({ msg: validationError });
        }

        const user = await User.findById(req.user._id).select("savedAddresses");
        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        const target = user.savedAddresses.id(addressId);
        if (!target) {
            return res.status(404).json({ msg: "Address not found" });
        }

        if (setAsDefault) {
            user.savedAddresses.forEach((saved) => {
                saved.isDefault = false;
            });
        }

        target.label = sanitizeAddressField(label, 30) || "Home";
        target.firstName = sanitizeAddressField(address.firstName, 50);
        target.lastName = sanitizeAddressField(address.lastName, 50);
        target.address = sanitizeAddressField(address.address, 250);
        target.city = sanitizeAddressField(address.city, 80);
        target.postalCode = sanitizeAddressField(address.postalCode, 20);
        target.country = sanitizeAddressField(address.country, 80);
        target.phone = sanitizeAddressField(address.phone, 25);
        target.lastUsedAt = new Date();

        if (setAsDefault) {
            target.isDefault = true;
        }

        await user.save();

        res.status(200).json({
            msg: "Address updated",
            addresses: sortAddresses(user.savedAddresses || []),
        });
    } catch (error) {
        console.error("Update Address Error:", error.message);
        res.status(500).json({ msg: "Server Error" });
    }
});

// Set default address
router.patch("/addresses/:addressId/default", protect, async (req, res) => {
    try {
        const { addressId } = req.params;
        const user = await User.findById(req.user._id).select("savedAddresses");
        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        const target = user.savedAddresses.id(addressId);
        if (!target) {
            return res.status(404).json({ msg: "Address not found" });
        }

        user.savedAddresses.forEach((saved) => {
            saved.isDefault = String(saved._id) === String(addressId);
            if (saved.isDefault) {
                saved.lastUsedAt = new Date();
            }
        });

        await user.save();
        res.status(200).json({ msg: "Default address updated", addresses: sortAddresses(user.savedAddresses || []) });
    } catch (error) {
        console.error("Set Default Address Error:", error.message);
        res.status(500).json({ msg: "Server Error" });
    }
});

// Clear default address
router.delete("/addresses/:addressId/default", protect, async (req, res) => {
    try {
        const { addressId } = req.params;
        const user = await User.findById(req.user._id).select("savedAddresses");
        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        const target = user.savedAddresses.id(addressId);
        if (!target) {
            return res.status(404).json({ msg: "Address not found" });
        }

        target.isDefault = false;
        await user.save();

        res.status(200).json({ msg: "Default address cleared", addresses: sortAddresses(user.savedAddresses || []) });
    } catch (error) {
        console.error("Clear Default Address Error:", error.message);
        res.status(500).json({ msg: "Server Error" });
    }
});

// Delete an address
router.delete("/addresses/:addressId", protect, async (req, res) => {
    try {
        const { addressId } = req.params;
        const user = await User.findById(req.user._id).select("savedAddresses");
        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        const target = user.savedAddresses.id(addressId);
        if (!target) {
            return res.status(404).json({ msg: "Address not found" });
        }

        const wasDefault = target.isDefault;
        target.deleteOne();

        if (wasDefault && user.savedAddresses.length > 0) {
            user.savedAddresses[0].isDefault = true;
            user.savedAddresses[0].lastUsedAt = new Date();
        }

        await user.save();
        res.status(200).json({ msg: "Address deleted", addresses: sortAddresses(user.savedAddresses || []) });
    } catch (error) {
        console.error("Delete Address Error:", error.message);
        res.status(500).json({ msg: "Server Error" });
    }
});

router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({ msg: "Profile image too large. Max size is 3MB" });
        }
        return res.status(400).json({ msg: err.message });
    }

    if (err?.message) {
        return res.status(400).json({ msg: err.message });
    }

    next(err);
});

module.exports = router;