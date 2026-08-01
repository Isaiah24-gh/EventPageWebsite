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

async function sendPasswordResetEmail(toEmail, name, resetUrl, expiryMinutes) {
    await transporter.sendMail({
        from: `"EventHub Team" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: "Reset your EventHub password",
        html: `
            <h2>Reset your password</h2>

            <p>Hi ${name},</p>

            <p>We got a request to reset the password for your EventHub account.
               Click the button below to choose a new one.</p>

            <p style="margin:28px 0;">
              <a href="${resetUrl}"
                 style="background:#1a1a1a;color:#ffffff;text-decoration:none;
                        padding:14px 28px;border-radius:8px;font-weight:600;
                        display:inline-block;font-family:Arial,sans-serif;">
                Reset Password
              </a>
            </p>

            <p>This link expires in ${expiryMinutes} minutes and can only be used once.</p>

            <p>If the button doesn't work, paste this into your browser:<br>
               <a href="${resetUrl}">${resetUrl}</a></p>

            <p>Didn't request this? You can ignore this email — your password stays the same.</p>

            <br>

            <p>Regards,<br><strong>EventHub Team</strong></p>
        `
    });
}

module.exports = { sendWelcomeEmail, sendPasswordResetEmail };
