const express = require('express');
const Subscriber = require("../models/Subscriber");
const validator = require("validator");

const router = express.Router();

// Handle newsletter subscription
router.post("/subscribe", async (req, res) => {
    const { email } = req.body;

    if (!email || !validator.isEmail(email)) {
        return res.status(400).json({ msg: "Valid email is required" });
    }

    try {
        let subscriber = await Subscriber.findOne({ email: email.toLowerCase() });

        if (subscriber) {
            return res.status(400).json({ msg: "Email is already subscribed" });
        }

        subscriber = new Subscriber({ email: email.toLowerCase() });
        await subscriber.save();

        res.status(201).json({ msg: "Successfully subscribed to the newsletter." });
    } catch (error) {
        console.error("Subscribe error:", error.message);
        res.status(500).json({ msg: "Internal Server Error." });
    }
});

module.exports = router;