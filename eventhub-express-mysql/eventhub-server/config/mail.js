const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function sendWelcomeEmail(toEmail, name) {
    await transporter.sendMail({
        from: `"EventHub Team" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: "Welcome to EventHub!",
        html: `
            <h2>Welcome to EventHub!</h2>

            <p>Hi ${name},</p>

            <p>Your EventHub account has been successfully created.</p>

            <p>We're excited to have you with us. You can now log in and start discovering events!</p>

            <br>

            <p>Regards,<br><strong>EventHub Team</strong></p>
        `
    });
}

module.exports = { sendWelcomeEmail };