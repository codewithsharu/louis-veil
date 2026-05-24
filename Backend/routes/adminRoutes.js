const express = require("express");
const User = require("../models/user");
const { protect, admin } = require("../middleware/authMiddleware");
const mongoose = require("mongoose");
const validator = require("validator");

const router = express.Router();

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Get all users
router.get("/", protect, admin, async (req, res) => {
    try {
        const users = await User.find({}).select("-password -otp -otpExpiry -otpAttempts -otpLockedUntil");
        res.json(users);
    } catch (error) {
        console.error("Fetch users error:", error.message);
        res.status(500).json({ msg: "Server Error" });
    }
});

// Add a new user
router.post("/", protect, admin, async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ msg: "Name, email, and password are required" });
    }
    if (!validator.isEmail(email)) {
        return res.status(400).json({ msg: "Valid email is required" });
    }
    if (password.length < 6) {
        return res.status(400).json({ msg: "Password must be at least 6 characters" });
    }

    const validRoles = ["customer", "admin"];
    const userRole = validRoles.includes(role) ? role : "customer";

    try {
        let user = await User.findOne({ email: email.toLowerCase() });
        if (user) {
            return res.status(400).json({ msg: "User already exists" });
        }

        user = new User({
            name: name.trim().slice(0, 50),
            email: email.toLowerCase().trim(),
            password,
            role: userRole,
            isVerified: true,
        });
        await user.save();

        const safeUser = { _id: user._id, name: user.name, email: user.email, role: user.role };
        res.status(201).json({ msg: "User created successfully.", user: safeUser });
    } catch (error) {
        console.error("Create user error:", error.message);
        res.status(500).json({ msg: "Server Error" });
    }
});

// Update user info
router.put("/:id", protect, admin, async (req, res) => {
    if (!isValidObjectId(req.params.id)) {
        return res.status(400).json({ msg: "Invalid user ID" });
    }

    try {
        const user = await User.findById(req.params.id);
        if (user) {
            if (req.body.name) user.name = req.body.name.trim().slice(0, 50);
            if (req.body.email && validator.isEmail(req.body.email)) {
                user.email = req.body.email.toLowerCase().trim();
            }
            if (req.body.role && ["customer", "admin"].includes(req.body.role)) {
                user.role = req.body.role;
            }

            const updatedUser = await user.save();
            const safeUser = { _id: updatedUser._id, name: updatedUser.name, email: updatedUser.email, role: updatedUser.role };
            res.json({ msg: "User updated successfully", user: safeUser });
        } else {
            res.status(404).json({ msg: "User not found" });
        }
    } catch (error) {
        console.error("Update user error:", error.message);
        res.status(500).json({ msg: "Server Error" });
    }
});

// Delete a user
router.delete("/:id", protect, admin, async (req, res) => {
    if (!isValidObjectId(req.params.id)) {
        return res.status(400).json({ msg: "Invalid user ID" });
    }

    try {
        // Prevent admin from deleting themselves
        if (req.params.id === req.user._id.toString()) {
            return res.status(400).json({ msg: "Cannot delete your own account" });
        }

        const user = await User.findById(req.params.id);
        if (user) {
            await user.deleteOne();
            res.json({ msg: "User deleted successfully" });
        } else {
            res.status(404).json({ msg: "User not found" });
        }
    } catch (error) {
        console.error("Delete user error:", error.message);
        res.status(500).json({ msg: "Server Error" });
    }
});

module.exports = router;