const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const { protect, admin } = require("../middleware/authMiddleware");
const path = require("path");

require("dotenv").config();
const router = express.Router();

// Cloudinary config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer setup without restrictive file filtering, but with a 10MB protection limit
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE },
});

// Protected upload - only authenticated admins can upload
router.post("/", protect, admin, upload.single("image"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ msg: "No file uploaded" });
        }

        // Stream upload to cloudinary
        const streamUpload = (fileBuffer) => {
            return new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    {
                        resource_type: "auto",
                        folder: "products",
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

        const result = await streamUpload(req.file.buffer);
        res.json({ imageUrl: result.secure_url });
    } catch (error) {
        console.error("Upload error:", error.message);
        res.status(500).json({ msg: "Upload failed" });
    }
});

// Handle multer errors
router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({ msg: "File too large. Maximum size is 10MB" });
        }
        return res.status(400).json({ msg: err.message });
    }
    if (err.message) {
        return res.status(400).json({ msg: err.message });
    }
    next(err);
});

module.exports = router;