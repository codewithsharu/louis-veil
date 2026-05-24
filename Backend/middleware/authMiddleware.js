const jwt = require("jsonwebtoken");
const User = require("../models/user");

// Middleware to protect routes
const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {
            token = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = await User.findById(decoded.user.id).select("-password -otp -otpExpiry");
            if (!req.user) {
                return res.status(401).json({ msg: "User not found" });
            }
            next();
        } catch (error) {
            console.error("Token verification failed");
            res.status(401).json({ msg: "Not authorized, token failed" });
        }
    } else {
        res.status(401).json({ msg: "Not authorized, no token provided" });
    }
};

// Middleware to check admin
const admin = (req, res, next) => {
    if (req.user && req.user.role === "admin") {
        next();
    } else {
        res.status(403).json({ msg: "Not authorized as admin" });
    }
};

module.exports = { protect, admin };