const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth:{
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function sendOrderEmail(customerEmail, customerName,  trackingId){

  await transporter.sendMail({
    from: `"SR Bites" <${process.env.SMTP_USER}>`,
    to: customerEmail,
    subject: "SR Bites Order Confirmation",
   html:`

<h2>Hello ${customerName}</h2>

<p>
Thank you for ordering from SR Bites.
</p>

<p>
Your payment has been verified successfully.
</p>

<div style="background:#fff3e0;padding:15px;border-radius:8px;">
<h3 style="color:#ff6600;margin:0;">
Tracking ID: ${trackingId}
</h3>
</div>
<p>
Please keep this Tracking ID safe as it will be used to monitor your order status and delivery progress.
</p>

<p>
Our kitchen is now preparing your order.
</p>

<p>
Delivery will begin shortly.
</p>

<p>
Thank you for choosing SR Bites.
</p>

`
  });
}

module.exports = sendOrderEmail;