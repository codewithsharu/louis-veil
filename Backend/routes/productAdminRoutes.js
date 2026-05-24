const express = require("express");
const Cart = require("../models/cart");
const Checkout = require("../models/Checkout");
const Product = require("../models/products");
const User = require("../models/user")
const Order = require("../models/Order");
const { protect , admin } = require("../middleware/authMiddleware");

const router = express.Router();

//get all products
router.get("/",protect,admin,async (req,res) => {
    try {
        const products = await Product.find({});
        res.json(products)
    } catch (error) {
        console.log(error);
        res.status(500).json({msg:"Server Error"});
    }
});

// Export all products as JSON
router.get("/export/json", protect, admin, async (req, res) => {
    try {
        const products = await Product.find({}).lean();
        const cleanedProducts = products.map((p) => {
            delete p.__v;
            return p;
        });
        res.setHeader("Content-Disposition", "attachment; filename=products_export.json");
        res.json(cleanedProducts);
    } catch (error) {
        console.error("Export error:", error);
        res.status(500).json({ msg: "Failed to export products" });
    }
});

// Bulk Insert Products via JSON
router.post("/bulk/json", protect, admin, async (req, res) => {
    try {
        const items = req.body;
        if (!Array.isArray(items)) {
            return res.status(400).json({ msg: "Payload must be a JSON array of product objects" });
        }
        if (items.length === 0) {
            return res.status(400).json({ msg: "JSON array is empty" });
        }

        // Clean internal fields before bulk inserting
        const cleanedItems = items.map(item => {
            const copy = { ...item };
            delete copy._id;
            delete copy.__v;
            delete copy.createdAt;
            delete copy.updatedAt;
            copy.user = req.user._id; // enforce admin ownership
            return copy;
        });

        const inserted = await Product.insertMany(cleanedItems, { ordered: false });
        res.status(201).json({
            msg: `Successfully imported ${inserted.length} products!`,
            count: inserted.length
        });
    } catch (error) {
        console.error("Bulk insert error:", error);
        
        if (error.name === "ValidationError") {
            const missingFields = Object.keys(error.errors).join(", ");
            return res.status(400).json({ 
                msg: `Validation failed. Please check your JSON data. Missing/Invalid fields: ${missingFields}` 
            });
        }

        if (error.name === "BulkWriteError" || error.name === "MongoBulkWriteError") {
            let errorContext = "Some failed validation.";
            if (error.code === 11000) {
                errorContext = "Duplicate unique fields found (likely SKU).";
            }
            return res.status(400).json({
                msg: `Partial success: ${error.insertedCount} imported. ${errorContext}`,
                errorDetail: error.message
            });
        }
        res.status(500).json({ msg: error.message || "Failed to import bulk products" });
    }
});


module.exports = router;