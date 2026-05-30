const express = require("express");
const Product = require("../models/products");
const { protect, admin } = require("../middleware/authMiddleware");
const {
    syncShiprocketProductWebhook,
    syncShiprocketCollectionWebhook,
} = require("../services/shiprocketService");

const router = express.Router();

const DEFAULT_ALLOWED_COLLECTIONS = [
    "Earrings",
    "Lockets",
    "Bracelets",
    "Pendants",
    "Combo",
];

const getAllowedCollections = () => {
    const fromEnv = String(process.env.ALLOWED_COLLECTIONS || "").trim();
    const values = (fromEnv
        ? fromEnv.split(",")
        : DEFAULT_ALLOWED_COLLECTIONS
    )
        .map((entry) => String(entry || "").trim())
        .filter(Boolean);

    return new Set(values.map((name) => name.toLowerCase()));
};

const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildProductQuery = (queryParams, forcedCollection) => {
    const { collection, size, color, gender, minPrice, maxPrice, search, category, material, brand } = queryParams;
    const query = {};

    const selectedCollection = forcedCollection || collection;
    if (selectedCollection && String(selectedCollection).toLowerCase() !== "all") {
        query.collections = selectedCollection;
    }
    if (category && String(category).toLowerCase() !== "all") {
        if (String(category).includes(",")) {
            query.category = { $in: String(category).split(",") };
        } else {
            query.category = category;
        }
    }
    if (material) {
        query.material = { $in: String(material).split(",") };
    }
    if (brand) {
        query.brand = { $in: String(brand).split(",") };
    }
    if (size) {
        query.sizes = { $in: String(size).split(",") };
    }
    if (color) {
        query.colors = { $in: [color] };
    }
    if (gender) {
        query.gender = gender;
    }
    if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price["$gte"] = Number(minPrice);
        if (maxPrice) query.price["$lte"] = Number(maxPrice);
    }
    if (search) {
        const escapedSearch = escapeRegex(String(search));
        query.$or = [
            { name: { $regex: escapedSearch, $options: "i" } },
            { description: { $regex: escapedSearch, $options: "i" } },
            { keywords: { $elemMatch: { $regex: escapedSearch, $options: "i" } } },
        ];
    }

    return query;
};

const buildSort = (sortBy) => {
    let sort = {};
    if (!sortBy) {
        return sort;
    }

    switch (sortBy) {
        case "priceAsc":
            sort = { price: 1 };
            break;
        case "priceDesc":
            sort = { price: -1 };
            break;
        case "popularity":
            sort = { rating: 1 };
            break;
        default:
            break;
    }

    return sort;
};

const getSafeLimit = (limit) => {
    if (limit === undefined || limit === null || String(limit).trim() === "") {
        return null;
    }

    const numericLimit = Number(limit);
    if (!Number.isFinite(numericLimit) || numericLimit <= 0) {
        return null;
    }

    return Math.min(Math.floor(numericLimit), 200);
};

const getPrimaryImageSrc = (product) =>
    (Array.isArray(product?.images) && product.images[0] ? String(product.images[0].url || "") : "");

const runCatalogSyncInBackground = (product, sourceLabel) => {
    if (!product) {
        return;
    }

    Promise.allSettled([
        syncShiprocketProductWebhook(product),
        syncShiprocketCollectionWebhook({
            title: product.collections,
            imageSrc: getPrimaryImageSrc(product),
            updatedAt: product.updatedAt || new Date(),
        }),
    ])
        .then((results) => {
            const productResult = results[0]?.status === "fulfilled" ? results[0].value : null;
            const collectionResult = results[1]?.status === "fulfilled" ? results[1].value : null;

            if (productResult && !productResult.success && !productResult.skipped) {
                console.error("[Shiprocket][Catalog][ProductWebhook]", {
                    sourceLabel,
                    productId: product?._id?.toString?.() || "",
                    reason: productResult.reason,
                });
            }

            if (collectionResult && !collectionResult.success && !collectionResult.skipped) {
                console.error("[Shiprocket][Catalog][CollectionWebhook]", {
                    sourceLabel,
                    collection: product.collections,
                    reason: collectionResult.reason,
                });
            }
        })
        .catch((error) => {
            console.error("[Shiprocket][Catalog][WebhookDispatch]", {
                sourceLabel,
                productId: product?._id?.toString?.() || "",
                message: error?.message,
            });
        });
};

//create products
router.post("/", protect, admin, async (req, res) => {
    try {
        const {
            name,
            description,
            price,
            discountPrice,
            countInStock,
            category,
            brand,
            sizes,
            colors,
            collections,
            material,
            gender,
            images,
            isFeatured,
            isPublished,
            tags,
            keywords,
            dimensions,
            weight,
            sku,
        } = req.body;
        const effectiveCollections = collections || category || "Jewellery";

        const product = new Product({
            name,
            description,
            price,
            discountPrice,
            countInStock,
            category,
            brand,
            sizes: Array.isArray(sizes) && sizes.length ? sizes : ["One Size"],
            colors: Array.isArray(colors) ? colors : [],
            collections: effectiveCollections,
            material,
            gender: gender || "Unisex",
            images,
            isFeatured,
            isPublished,
            tags,
            keywords: Array.isArray(keywords) ? keywords : [],
            dimensions,
            weight,
            sku,
            user: req.user._id,
        });

        const createdProduct = await product.save();
        runCatalogSyncInBackground(createdProduct, "product_create");
        res.status(201).json(createdProduct);
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: "Server Error" });
    }
});

//update products
router.put("/:id", protect, admin, async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await Product.findById(productId);

        if (product) {
            // Update product fields
            const {
                name,
                description,
                price,
                discountPrice,
                countInStock,
                category,
                brand,
                sizes,
                colors,
                collections,
                material,
                gender,
                images,
                isFeatured,
                isPublished,
                tags,
                keywords,
                dimensions,
                weight,
                sku,
            } = req.body;

            product.name = name ?? product.name;
            product.description = description ?? product.description;
            product.price = price ?? product.price;
            product.discountPrice = discountPrice ?? product.discountPrice;
            product.countInStock = countInStock ?? product.countInStock;
            product.category = category ?? product.category;
            product.brand = brand ?? product.brand;
            product.sizes = sizes ?? product.sizes;
            product.colors = colors ?? product.colors;
            product.collections = collections ?? product.collections;
            product.material = material ?? product.material;
            product.gender = gender ?? product.gender;
            product.images = images ?? product.images;
            product.isFeatured = isFeatured !== undefined ? isFeatured : product.isFeatured;
            product.isPublished = isPublished !== undefined ? isPublished : product.isPublished;
            product.tags = tags ?? product.tags;
            product.keywords = keywords ?? product.keywords;
            product.dimensions = dimensions ?? product.dimensions;
            product.weight = weight ?? product.weight;
            product.sku = sku ?? product.sku;

            const updatedProduct = await product.save();
            runCatalogSyncInBackground(updatedProduct, "product_update");
            res.json(updatedProduct);
        } else {
            res.status(404).json({ msg: "Product not found" });
        }
    } catch (error) {
        console.log("Update error:", error);
        res.status(500).json({ msg: "Server error" });
    }
});

// deleting product
router.delete("/:id", protect, admin, async (req, res) => {
    try {
        const mongoose = require("mongoose");
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ msg: "Invalid product ID" });
        }
        const product = await Product.findById(req.params.id);
        if (product) {
            const deletedProductSnapshot = product.toObject();
            deletedProductSnapshot.isPublished = false;
            deletedProductSnapshot.countInStock = 0;
            deletedProductSnapshot.updatedAt = new Date();

            await product.deleteOne();
            runCatalogSyncInBackground(deletedProductSnapshot, "product_delete");
            res.json({ msg: "Product deleted" });
        } else {
            res.status(404).json({ msg: "Product not found." });
        }
    } catch (error) {
        console.error("Delete product error:", error.message);
        res.status(500).json({ msg: "Server Error" });
    }
});

// get products
router.get("/", async (req, res) => {
    try {
        const { sortBy, limit } = req.query;
        const query = buildProductQuery(req.query);
        const safeLimit = getSafeLimit(limit);

        let products;
        if (sortBy === "priceAsc" || sortBy === "priceDesc") {
            const sortOrder = sortBy === "priceAsc" ? 1 : -1;
            const pipeline = [
                { $match: query },
                {
                    $addFields: {
                        effectivePrice: {
                            $cond: {
                                if: { $and: [{ $gt: ["$discountPrice", 0] }, { $ne: ["$discountPrice", null] }] },
                                then: "$discountPrice",
                                else: "$price"
                            }
                        }
                    }
                },
                { $sort: { effectivePrice: sortOrder } }
            ];
            if (safeLimit) pipeline.push({ $limit: safeLimit });
            products = await Product.aggregate(pipeline);
        } else {
            const sort = buildSort(sortBy);
            let productQuery = Product.find(query).sort(sort);
            if (safeLimit) {
                productQuery = productQuery.limit(safeLimit);
            }
            products = await productQuery;
        }

        res.json(products);

    } catch (error) {
        console.log("err on get product", error);
        res.status(500).json({ msg: "Server error" });
    }
});

// get products by collection
router.get("/collection/:collection", async (req, res) => {
    try {
        const { sortBy, limit } = req.query;
        const query = buildProductQuery(req.query, req.params.collection);
        const safeLimit = getSafeLimit(limit);

        let products;
        if (sortBy === "priceAsc" || sortBy === "priceDesc") {
            const sortOrder = sortBy === "priceAsc" ? 1 : -1;
            const pipeline = [
                { $match: query },
                {
                    $addFields: {
                        effectivePrice: {
                            $cond: {
                                if: { $and: [{ $gt: ["$discountPrice", 0] }, { $ne: ["$discountPrice", null] }] },
                                then: "$discountPrice",
                                else: "$price"
                            }
                        }
                    }
                },
                { $sort: { effectivePrice: sortOrder } }
            ];
            if (safeLimit) pipeline.push({ $limit: safeLimit });
            products = await Product.aggregate(pipeline);
        } else {
            const sort = buildSort(sortBy);
            let productQuery = Product.find(query).sort(sort);
            if (safeLimit) {
                productQuery = productQuery.limit(safeLimit);
            }
            products = await productQuery;
        }

        res.json({
            collection: req.params.collection,
            count: products.length,
            products,
        });
    } catch (error) {
        console.error("Products by collection error:", error.message);
        res.status(500).json({ msg: "Internal Server Error." });
    }
});

// get all unique collections
router.get("/collections", async (req, res) => {
    try {
        const allowedCollections = getAllowedCollections();
        const collections = await Product.distinct("collections", { collections: { $ne: null } });
        const normalized = collections
            .map((name) => String(name || "").trim())
            .filter(Boolean)
            .filter((name) => name.toLowerCase() !== "all")
            .filter((name) => !allowedCollections.size || allowedCollections.has(name.toLowerCase()))
            .sort((a, b) => a.localeCompare(b));
        const collectionsWithAll = ["all", ...normalized];

        res.json({
            count: collectionsWithAll.length,
            collections: collectionsWithAll,
        });
    } catch (error) {
        console.error("Collections fetch error:", error.message);
        res.status(500).json({ msg: "Internal Server Error." });
    }
});

//best seller route
router.get("/best-seller", async (req, res) => {
    try {
        const bestSeller = await Product.findOne().sort({ rating: -1 });
        if (bestSeller) {
            res.json(bestSeller);
        } else {
            res.status(404).json({ msg: "No bestseller products" });
        }
    } catch (error) {
        console.log("error on similar products", error);
        res.status(500).json({ msg: "Internal Server Error." });
    }
});

//new arrivals
router.get("/new-arrivals", async (req, res) => {
    try {
        const newArrival = await Product.find().sort({ createdAt: -1 }).limit(8);
        if (newArrival) {
            res.json(newArrival);
        } else {
            res.status(404).json({ msg: "No products" });
        }
    } catch (error) {
        console.log("error on similar products", error);
        res.status(500).json({ msg: "Internal Server Error." });
    }
});

//to get single product
router.get('/:id', async (req, res) => {
    try {
        const mongoose = require("mongoose");
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ msg: "Invalid product ID" });
        }
        const product = await Product.findById(req.params.id);
        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ msg: "No product found" });
        }
    } catch (error) {
        console.error("Product fetch error:", error.message);
        res.status(500).json({ msg: "Internal Server Error." });
    }
});

router.get("/similar/:id", async (req, res) => {
    const { id } = req.params;
    const mongoose = require("mongoose");
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ msg: "Invalid product ID" });
    }

    try {
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ msg: "Product not found" });
        }

        const similarProduct = await Product.find({
            _id: { $ne: id },
            gender: product.gender,
            category: product.category,
        }).limit(4);

        res.json(similarProduct);
    } catch (error) {
        console.error("Similar products error:", error.message);
        res.status(500).json({ msg: "Internal Server Error." });
    }
});

module.exports = router;