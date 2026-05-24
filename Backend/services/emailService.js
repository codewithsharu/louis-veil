const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
    },
});

// HTML-escape to prevent XSS in emails
const escapeHtml = (str) => {
    if (typeof str !== "string") return "";
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

const isPhonePlaceholderEmail = (value) =>
    String(value || "").trim().toLowerCase().endsWith("@otp.local");

const isLikelyEmail = (value) => /.+@.+\..+/.test(String(value || "").trim());

async function sendOTP(email, otp, purpose = "verification") {
    try {
        if (!process.env.EMAIL || !process.env.EMAIL_PASSWORD) {
            throw new Error("Email transport credentials are missing");
        }

        const safeOtp = escapeHtml(String(otp || ""));
        const safePurpose = escapeHtml(purpose || "verification");
        const subject = safePurpose === "password reset" ? "Your Password Reset OTP" : "Your Verification OTP";

        await transporter.sendMail({
            from: `"LOUIS VEIL" <${process.env.EMAIL}>`,
            to: email,
            subject,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 540px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden;">
                    <div style="padding: 16px 20px; background: #111827; color: #f9fafb; font-size: 14px; letter-spacing: 0.08em; text-transform: uppercase;">LOUIS VEIL</div>
                    <div style="padding: 20px;">
                        <h2 style="margin: 0 0 10px; color: #111827;">OTP for ${safePurpose}</h2>
                        <p style="margin: 0 0 12px; color: #4b5563; font-size: 14px;">Use the code below to continue. This OTP is valid for 10 minutes.</p>
                        <div style="display: inline-block; padding: 10px 16px; border-radius: 8px; background: #f3f4f6; border: 1px dashed #9ca3af; font-size: 24px; letter-spacing: 0.25em; color: #111827; font-weight: 700;">
                            ${safeOtp}
                        </div>
                        <p style="margin: 14px 0 0; color: #6b7280; font-size: 12px;">If you did not request this, you can ignore this email.</p>
                    </div>
                </div>
            `,
        });

        console.log(`OTP sent for ${purpose} to ${email}`);
    } catch (error) {
        console.error(`Error sending OTP for ${purpose}:`, error.message);
        throw new Error(`Error sending OTP for ${purpose}`);
    }
}

// Generic function to send emails
async function sendEmail(to, subject, message) {
    try {
        let info = await transporter.sendMail({
            from: `"Your Store" <${process.env.EMAIL}>`,
            to,
            subject: escapeHtml(subject),
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <h2 style="color: #333;">Hello,</h2>
                    <p style="font-size: 16px; color: #555;">${message}</p>
                    <hr style="border: none; border-top: 1px solid #ddd;">
                    <p style="font-size: 14px; color: #777;">Thank you for shopping with us!<br> <strong>Your Store Team</strong></p>
                </div>
            `,
        });
        console.log(`Email sent to ${to}`);
    } catch (error) {
        console.error("Error sending email");
        throw new Error("Email sending failed");
    }
}

// Function to send order confirmation emails
async function sendOrderConfirmation(user, order) {
    const adminEmail = process.env.ADMIN_EMAIL;
    const userEmail = String(user?.email || "").trim();

    const orderDetailsHtml = order.orderItems.map(item => `
        <p><strong>${escapeHtml(item.name)}</strong> - ${item.quantity} x ₹${item.price} (${escapeHtml(item.size)}, ${escapeHtml(item.color)})</p>
    `).join("");

    const safeAddress = {
        address: escapeHtml(order.shippingAddress.address),
        city: escapeHtml(order.shippingAddress.city),
        postalCode: escapeHtml(order.shippingAddress.postalCode),
    };

    const userMessage = `
        <p>Dear ${escapeHtml(user.name)},</p>
        <p>Thank you for your order! Your order has been successfully placed.</p>
        <p><strong>Order Details:</strong></p>
        ${orderDetailsHtml}
        <p><strong>Total Price:</strong> ₹${order.totalPrice}</p>
        <p><strong>Shipping Address:</strong> ${safeAddress.address}, ${safeAddress.city}, ${safeAddress.postalCode}</p>
    `;

    const adminMessage = `
        <p>Hello Admin,</p>
        <p>A new order has been placed by ${escapeHtml(user.name)}.</p>
        <p><strong>Order Details:</strong></p>
        ${orderDetailsHtml}
        <p><strong>Total Price:</strong> ₹${order.totalPrice}</p>
        <p><strong>Shipping Address:</strong> ${safeAddress.address}, ${safeAddress.city}, ${safeAddress.postalCode}</p>
    `;

    try {
        if (isLikelyEmail(userEmail) && !isPhonePlaceholderEmail(userEmail)) {
            await sendEmail(userEmail, "Order Placed Successfully", userMessage);
        }

        if (isLikelyEmail(adminEmail)) {
            await sendEmail(adminEmail, "New Order Received", adminMessage);
        }
    } catch (error) {
        console.error("Error sending order confirmation emails");
    }
}

module.exports = { sendOTP, sendEmail, sendOrderConfirmation };
