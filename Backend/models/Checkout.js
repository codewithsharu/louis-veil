const mongoose = require("mongoose")

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
);

const checkoutItemSchema = new mongoose.Schema({
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
    quantity:{
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
},
{_id:false}
);

const checkoutSchema = new mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required:true
    },
    checkoutItems: [checkoutItemSchema],
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
        verifiedPhone: {
            type: String,
            trim: true,
        },
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: ["COD", "shiprocket", "razorpay"],
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
    paymentStatus:{
        type:String,
        default: "Pending",
    },
    paymentDetails: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },
    isFinalized:{
        type:Boolean,
        default:false
    },
    finalizedAt:{
        type:Date,
    },
},
{timestamps:true}
)

module.exports = mongoose.model("Checkout",checkoutSchema)