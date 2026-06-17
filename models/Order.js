const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({

    trackingId:{
        type:String,
        unique:true
    },

    customerName:String,
    email:String,
    phone:String,
    address:String,

    latitude:Number,
    longitude:Number,

    locationLink:String,

    item:String,
    quantity:Number,
    amount:Number,

    transactionId:String,

    paymentStatus:{
        type:String,
        default:"Paid"
    },

    status:{
        type:String,
        default:"Pending"
    }

},{
    timestamps:true
});

module.exports = mongoose.model("Order", OrderSchema);