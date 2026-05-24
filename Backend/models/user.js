const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/.+\@.+\..+/, "Please enter a valid email address."],
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      match: [/^\+[1-9]\d{7,14}$/, "Please enter a valid phone number in E.164 format."],
    },
    phoneVerifiedAt: {
      type: Date,
    },
    authProvider: {
      type: String,
      enum: ["email", "shiprocket_phone", "google"],
      default: "email",
    },
    googleId: {
      type: String,
      sparse: true,
      trim: true,
    },
    profileImage: {
      type: String,
      trim: true,
      default: "",
    },
    password: {
      type: String,
      required: false,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
    },
    otpExpiry: {
      type: Date,
    },
    otpAttempts: {
      type: Number,
      default: 0,
    },
    otpLockedUntil: {
      type: Date,
    },
    wishlist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wishlist",
    },
    savedAddresses: [
      {
        label: {
          type: String,
          default: "Home",
          trim: true,
          maxlength: 30,
        },
        firstName: {
          type: String,
          required: true,
          trim: true,
          maxlength: 50,
        },
        lastName: {
          type: String,
          required: true,
          trim: true,
          maxlength: 50,
        },
        address: {
          type: String,
          required: true,
          trim: true,
          maxlength: 250,
        },
        city: {
          type: String,
          required: true,
          trim: true,
          maxlength: 80,
        },
        postalCode: {
          type: String,
          required: true,
          trim: true,
          maxlength: 20,
        },
        country: {
          type: String,
          required: true,
          trim: true,
          maxlength: 80,
        },
        phone: {
          type: String,
          required: true,
          trim: true,
          maxlength: 25,
        },
        isDefault: {
          type: Boolean,
          default: false,
        },
        lastUsedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

// Password hash middleware
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate OTP method - hash before storing
userSchema.methods.generateOTP = function () {
  // Check if OTP is locked
  if (this.otpLockedUntil && this.otpLockedUntil > new Date()) {
    return null; // Locked
  }

  // Generate a 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Hash OTP before storing
  const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");

  // Set OTP expiry (10 minutes from now)
  const otpExpiry = new Date();
  otpExpiry.setMinutes(otpExpiry.getMinutes() + 10);

  this.otp = hashedOTP;
  this.otpExpiry = otpExpiry;
  this.otpAttempts = 0;

  return otp; // Return plain OTP to send via email
};

// Verify OTP method - compare hashed values
userSchema.methods.verifyOTP = function (enteredOTP) {
  // Check if locked out
  if (this.otpLockedUntil && this.otpLockedUntil > new Date()) {
    return false;
  }

  // Increment attempts
  this.otpAttempts = (this.otpAttempts || 0) + 1;

  // Lock after 5 failed attempts for 30 minutes
  if (this.otpAttempts > 5) {
    const lockUntil = new Date();
    lockUntil.setMinutes(lockUntil.getMinutes() + 30);
    this.otpLockedUntil = lockUntil;
    return false;
  }

  const hashedEnteredOTP = crypto.createHash("sha256").update(enteredOTP).digest("hex");

  return (
    this.otp === hashedEnteredOTP &&
    this.otpExpiry > new Date()
  );
};

module.exports = mongoose.model("User", userSchema);