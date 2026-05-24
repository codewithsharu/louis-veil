const mongoose = require("mongoose");

const customMeasurementSchema = new mongoose.Schema({
    bustChest: Number,
    waist: Number,
    hips: Number,
    shoulderWidth: Number,
    sleeveLength: Number,
    armhole: Number,
    bicepSize: Number,
},
{_id:false}
)

const orderItemSchema = new mongoose.Schema({
    productId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required:true,
        },
        name:{
            type:String,
            required:true
        },
        image: {
            type:String,
            required:true
        },
        price:{
            type:Number,
            required:true
        },
        size:String,
        color:String,
        customMeasurementKey: {
            type: String,
            default: "",
        },
        customMeasurements: customMeasurementSchema,
        quantity:{
            type:Number,
            required:true
        },
},
{_id:false}
)

const orderSchema = new mongoose.Schema({
    user:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required:true
        },
    orderItems: [orderItemSchema],
    shippingAddress:{
        firstName: {
            type: String,
            trim: true,
        },
        lastName: {
            type: String,
            trim: true,
        },
        address:{
            type:String,
            required:true
        },
        city:{
            type:String,
            required:true
        },
        state: {
            type: String,
            trim: true,
        },
        postalCode:{
            type:String,
            required:true
        },
        country:{
            type:String,
            required:true
        },
        phone: {
            type: String,
            trim: true,
        },
        phoneNumber: {
            type: String,
            trim: true,
        },
        verifiedPhone: {
            type: String,
            trim: true,
        },
    },
    paymentMethod:{
        type:String,
        required:true
    },
    paymentId:{
        type:String,
        required:false
    },
    paymentDetails: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },
    totalPrice:{
        type:Number,
        required:true
    },
    promoCode: {
        type: String,
        default: null
    },
    promoCodeDiscount: {
        type: Number,
        default: 0
    },
    isPaid:{
        type:Boolean,
        default:false,
    },
    paidAt:{
            type:Date
    },
    isDelivered:{
        type:Boolean,
        default:false
    },
    deliveredAt:{
        type:Date,
    },
    paymentStatus:{
        type:String,
        enum: ["pending", "paid", "failed", "refunded"],
        default:"pending",
    },
    status:{
        type:String,
        enum:["Processing","Shipped","Delivered","Cancelled"],
        default:"Processing"
    },
    shiprocketOrderId: {
        type: String,
        default: "",
    },
    shiprocketShipmentId: {
        type: String,
        default: "",
    },
    shiprocketAwbCode: {
        type: String,
        default: "",
    },
    shiprocketCourierName: {
        type: String,
        default: "",
    },
    shiprocketTrackingUrl: {
        type: String,
        default: "",
    },
    shiprocketStatus: {
        type: String,
        default: "",
    },
    shiprocketSyncedAt: {
        type: Date,
    },
    shiprocketLastWebhookAt: {
        type: Date,
    },
    shiprocketPayload: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
    },
},
{timestamps:true}
);

module.exports = mongoose.model("order",orderSchema)
