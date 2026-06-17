require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const axios = require("axios");

const Order = require("./models/Order");
const sendOrderEmail = require("./utils/email");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

/*
==================================
MongoDB Connection
==================================
*/

mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log("✅ MongoDB Connected");
})
.catch((err) => {
    console.log("❌ MongoDB Error:", err.message);
});

/*
==================================
Public Config
==================================
*/

app.get("/config", (req, res) => {

    res.json({
        publicKey: process.env.FLW_PUBLIC_KEY
    });

});

/*
==================================
Verify Payment + Save Order
==================================
*/

app.post("/verify-payment", async (req, res) => {

    try {

        const {
            transaction_id,

            customerName,
            email,
            phone,
            address,

            latitude,
            longitude,

            item,
            quantity,
            amount

        } = req.body;

        const verifyResponse = await axios.get(
            `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`,
            {
                headers: {
                    Authorization:
                    `Bearer ${process.env.FLW_SECRET_KEY}`
                }
            }
        );

        const paymentData = verifyResponse.data;

        if (
            paymentData.status === "success" &&
            paymentData.data.status === "successful"
        ) {

           const locationLink =
(latitude && longitude)
?
`https://www.google.com/maps?q=${latitude},${longitude}`
:
"Location unavailable";

            const trackingId =
"SR-" +
Math.floor(
100000 + Math.random() * 900000
);

const order = await Order.create({

    trackingId,

    customerName,
    email,
    phone,
    address,

    latitude,
    longitude,

    locationLink,

    item,
    quantity,
    amount,

    transactionId: transaction_id,

    paymentStatus:"Paid",

    status:"Pending"

});

           try {

    await sendOrderEmail(
        email,
        customerName,
        trackingId
    );

} catch (emailError) {

    console.log(
        "Email Error:",
        emailError.message
    );

}return res.json({

    success:true,

    trackingId: trackingId,

    message:"Payment verified successfully",

    order

});

        }

        return res.status(400).json({

            success: false,

            message:
            "Payment verification failed"

        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({

            success: false,

            error: error.message

        });

    }

});

/*
==================================
All Orders
==================================
*/

app.get("/orders", async (req, res) => {

    try {

        const orders =
        await Order.find()
        .sort({ createdAt: -1 });

        res.json(orders);

    } catch (error) {

        res.status(500).json({

            error: error.message

        });

    }

});

/*
==================================
Single Order
==================================
*/

app.get("/orders/:id", async (req, res) => {

    try {

        const order =
        await Order.findById(req.params.id);

        res.json(order);

    } catch (error) {

        res.status(500).json({

            error: error.message

        });

    }

});

/*
==================================
Update Order Status
==================================
*/

app.put("/orders/:id/status", async (req, res) => {

    try {

        const { status } = req.body;

        const order =
        await Order.findByIdAndUpdate(

            req.params.id,

            {
                status
            },

            {
                new: true
            }

        );

        res.json(order);

    } catch (error) {

        res.status(500).json({

            error: error.message

        });

    }

});

/*
==================================
Dashboard Statistics
==================================
*/

app.get("/dashboard-stats", async (req, res) => {

    try {

        const totalOrders =
        await Order.countDocuments();

        const pendingOrders =
        await Order.countDocuments({
            status: "Pending"
        });

        const deliveredOrders =
        await Order.countDocuments({
            status: "Delivered"
        });

        const revenueData =
        await Order.aggregate([
            {
                $group: {
                    _id: null,
                    totalRevenue: {
                        $sum: "$amount"
                    }
                }
            }
        ]);

        const totalRevenue =
        revenueData.length > 0
        ? revenueData[0].totalRevenue
        : 0;

        res.json({

            totalOrders,

            pendingOrders,

            deliveredOrders,

            totalRevenue

        });

    } catch (error) {

        res.status(500).json({

            error: error.message

        });

    }

});

/*
==================================
Health Check
==================================
*/

app.get("/", (req, res) => {

    res.send("SR Bites API Running");

});

/*
==================================
Server
==================================
*/

const PORT =
process.env.PORT || 5000;

app.listen(PORT, () => {

    console.log(
        `🚀 Server Running On Port ${PORT}`
    );

});