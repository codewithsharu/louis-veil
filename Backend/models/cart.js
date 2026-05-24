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
{_id: false}
);

const cartItemSchema =new mongoose.Schema({
    productId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required:true
    },
    name:String,
    image:String,
    price:Number,
    originalPrice:Number,
    countInStock:Number,
    size:String,
    color:String,
    customMeasurementKey: {
        type: String,
        default: "",
    },
    customMeasurements: customMeasurementSchema,
    quantity:{
        type: Number,
        default:1,
    },
},
{_id: false}
);

const cartSchema = new mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"User",
    },
    guestId:{
        type: String,
    },
    products: [cartItemSchema],
    totalPrice:{
        type:Number,
        required:true,
        default: 0,
    },
},
{timestamps:true},
);

module.exports = mongoose.model("Cart",cartSchema)
