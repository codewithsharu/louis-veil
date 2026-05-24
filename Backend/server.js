const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, ".env"), override: true });

const express = require('express');
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const hpp = require("hpp");
const connectDB = require('./config/db');
const userRoutes  = require('./routes/userRoutes');
const productRoutes  = require('./routes/productRoutes');
const cartRoutes  = require('./routes/cartRoutes');
const checkoutRoutes  = require('./routes/checkoutRoutes');
const orderRoutes  = require('./routes/orderRoutes');
const uploadRoutes  = require('./routes/uploadRoutes');
const subscriberRoutes  = require('./routes/subscriberRoutes');
const adminRoutes  = require('./routes/adminRoutes');
const productAdminRoutes  = require('./routes/productAdminRoutes');
const adminOrderRoutes  = require('./routes/adminOrderRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const shiprocketIntegrationRoutes = require('./routes/shiprocketIntegrationRoutes');
const promoCodeRoutes = require('./routes/promoCodeRoutes');

/**
 * ------------------------------------------------------------------
 * META HYBRID TRACKING SETUP
 * ------------------------------------------------------------------
 * This application utilizes a Hybrid Meta Tracking strategy:
 * 1. Frontend (Browser): Meta Pixel tracks PageView, ViewContent, AddToCart, InitiateCheckout.
 * 2. Backend (Server): Conversions API (CAPI) tracks the critical Purchase event.
 * 
 * The CAPI implementation securely hashes user data (em, ph) and bypasses
 * AdBlockers and iOS tracking restrictions for 100% accurate purchase ROI.
 * Configuration depends on META_PIXEL_ID and META_ACCESS_TOKEN in .env.
 * ------------------------------------------------------------------
 */

const app = express();

// Behind Nginx/Proxy in production so rate-limit can read real client IP safely.
app.set("trust proxy", 1);

// Security: HTTP headers
app.use(helmet());

// Security: Rate limiting - global
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // limit each IP to 200 requests per window
    message: { msg: "Too many requests, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(globalLimiter);

// Security: Strict rate limit for auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15, // 15 attempts per 15 minutes
    message: { msg: "Too many attempts, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
});

// Body parser with size limit to prevent payload attacks
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Security: Sanitize data against NoSQL injection
app.use(mongoSanitize());

// Security: Prevent HTTP parameter pollution
app.use(hpp());

// CORS configuration
const configuredOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(",").map((origin) => origin.trim()).filter(Boolean)
    : [];
const configuredHostIp = String(process.env.HOST_IP || "").trim();
const hostIpOrigins = configuredHostIp
    ? [`http://${configuredHostIp}`, `https://${configuredHostIp}`]
    : [];
const defaultDevOrigins = ["http://localhost:5173", "http://127.0.0.1:5173"];
const allowedOrigins = process.env.NODE_ENV === "production"
    ? [...new Set([...configuredOrigins, ...hostIpOrigins])]
    : [...new Set([...configuredOrigins, ...defaultDevOrigins, ...hostIpOrigins])];

if (process.env.NODE_ENV === "production" && !configuredOrigins.length && !configuredHostIp) {
    console.warn("FRONTEND_URL or HOST_IP is not set in production. Browser requests with Origin header will be blocked by CORS.");
}

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, health checks).
        if (!origin) {
            return callback(null, true);
        }

        // Allow localhost ports in development for Vite and preview servers
        if (
            process.env.NODE_ENV !== "production" &&
            /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)
        ) {
            return callback(null, true);
        }

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            const corsError = new Error(`Not allowed by CORS: ${origin || "unknown origin"}`);
            corsError.status = 403;
            callback(corsError);
        }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
};
app.use(cors(corsOptions));

const PORT = process.env.PORT || 3000;

// DB connection
connectDB();

app.get('/',(req,res)=>{
    res.send("Welcome to wazada Backend API");
});

// Auth routes with strict rate limiting
app.use("/api/users", authLimiter, userRoutes);

// API routes
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api", subscriberRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/shiprocket", shiprocketIntegrationRoutes);
app.use("/api/logistics", shiprocketIntegrationRoutes);
app.use("/api/promocode", promoCodeRoutes);

// Admin routes
app.use("/api/admin/users", adminRoutes);
app.use("/api/admin/products", productAdminRoutes);
app.use("/api/admin/orders", adminOrderRoutes);

// Global error handler - never leak internal errors
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err.message);
    const statusCode = err.status || 500;
    res.status(statusCode).json({
        msg: statusCode === 500 ? "Internal server error" : err.message,
        ...(process.env.NODE_ENV !== "production" ? { detail: err.message } : {}),
    });
});

app.listen(PORT,()=>{
    const startupTime = new Date().toISOString();
    console.log("\n==================================");
    console.log("Server is running on PORT:", PORT);
    console.log("Server started at:", startupTime);
    console.log("Deploy marker:", "shiprocket-migration");
    console.log("==================================");
});