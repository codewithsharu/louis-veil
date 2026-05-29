const mongoose = require("mongoose")

const productSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        trim:true
    },
    description:{
        type:String,
        required:true,
    },
    price:{
        type:Number,
        required:true
    },
    discountPrice:{
        type:Number,
    },
    countInStock:{
        type:Number,
        required:true,
        default:0,
    },
    sku:{
        type:String,
        unique:true,
        required:true
    },
    category:{
        type:String,
        required:true,
    },
    brand:{
        type:String,
    },
    sizes:{
        type:[String],
        default:["One Size"],
    },
    colors:{
        type:[String],
        default:[],
    },
    collections:{
        type:String,
        required:true,
    },
    material:{
        type:String
    },
    gender:{
        type:String,
        enum:["Men","Women","Unisex"],
        default:"Unisex",
    },
    images: [{ url: String }],
    isFeatured:{
        type:Boolean,
        default:false,
    },
    isPublished:{
        type:Boolean,
        default:false,
    },
    rating:{
        type:Number, 
        default:0,
    },
    numReviews:{
        type:Number,
        default:0
    },
    tags:[String],
    keywords:[String],
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },
    metaTitle:{
        type:String,
    },
    metaDecription:{
        type:String,
    },
    metaKeywords :{
        type:String
    },
    dimensions:{
        length:Number,
        width:Number,
        height:Number
    },
    weight:Number,
},

{timestamps: true}
);

module.exports = mongoose.model("Product",productSchema)