const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// ---- Small formatting helpers, shared by the templates below ----
function formatMoney(value) {
    const amount = Number(value) || 0;
    return amount > 0 ? `$${amount.toFixed(2)}` : "Free";
}

function formatEventDate(value) {
    return new Date(value).toLocaleDateString("en-SG", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC"
    });
}

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

/**
 * Purchase confirmation for Feature 6 (Ticketing).
 * order = { event, quantity, totalPaid, transactionId }
 */
async function sendTicketConfirmationEmail(toEmail, name, order) {
    const { event, quantity, totalPaid, transactionId } = order;

    const rowStyle = "padding:10px 0;border-bottom:1px solid #eeeeee;font-family:Arial,sans-serif;font-size:14px;";
    const labelStyle = `${rowStyle}color:#666666;`;
    const valueStyle = `${rowStyle}text-align:right;font-weight:600;color:#1a1a1a;`;

    await transporter.sendMail({
        from: `"EventHub Team" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: `Your tickets for ${event.title}`,
        html: `
            <div style="font-family:Arial,sans-serif;max-width:560px;color:#1a1a1a;">
              <h2 style="margin-bottom:8px;">Thanks for your purchase!</h2>

              <p>Hi ${name},</p>

              <p>Your payment went through and your tickets are confirmed.
                 Here's what you booked:</p>

              <div style="border:1px solid #e0e0e0;border-radius:8px;padding:20px;margin:24px 0;">
                <h3 style="margin:0 0 4px 0;font-size:18px;">${event.title}</h3>
                <p style="margin:0 0 16px 0;color:#666666;font-size:13px;">${event.category}</p>

                <table style="width:100%;border-collapse:collapse;">
                  <tr>
                    <td style="${labelStyle}">Date</td>
                    <td style="${valueStyle}">${formatEventDate(event.event_date)}</td>
                  </tr>
                  <tr>
                    <td style="${labelStyle}">Time</td>
                    <td style="${valueStyle}">${String(event.event_time).slice(0, 5)}</td>
                  </tr>
                  <tr>
                    <td style="${labelStyle}">Venue</td>
                    <td style="${valueStyle}">${event.venue}</td>
                  </tr>
                  <tr>
                    <td style="${labelStyle}">Quantity</td>
                    <td style="${valueStyle}">${quantity} ticket${quantity === 1 ? "" : "s"}</td>
                  </tr>
                  <tr>
                    <td style="${labelStyle}">Price per ticket</td>
                    <td style="${valueStyle}">${formatMoney(event.price)}</td>
                  </tr>
                  <tr>
                    <td style="${labelStyle}">Transaction ID</td>
                    <td style="${valueStyle}">${transactionId}</td>
                  </tr>
                  <tr>
                    <td style="padding:14px 0 0 0;font-family:Arial,sans-serif;font-size:15px;">Total paid</td>
                    <td style="padding:14px 0 0 0;text-align:right;font-family:Arial,sans-serif;font-size:18px;font-weight:700;">${formatMoney(totalPaid)}</td>
                  </tr>
                </table>
              </div>

              <p>Show this email at the door. See you there!</p>

              <br>

              <p>Regards,<br><strong>EventHub Team</strong></p>
            </div>
        `
    });
}

module.exports = {
    sendWelcomeEmail,
    sendPasswordResetEmail,
    sendTicketConfirmationEmail
};
