/* ==========================================================================
   Feature 1: Account Creation & Login
   OWNERSHIP: Isaiah
   ========================================================================== */

const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const pool = require("../config/db");
const { sendWelcomeEmail, sendPasswordResetEmail } = require("../config/mail");

const FREE_EMAIL_PROVIDERS = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com"];

// How long a reset link stays valid.
const RESET_TOKEN_TTL_MINUTES = 60;

function looksLikeOrgEmail(email) {
  const domain = (email.split("@")[1] || "").toLowerCase();
  return domain && !FREE_EMAIL_PROVIDERS.includes(domain);
}

// The raw token goes in the email; only its hash is stored. If the database
// leaks, the stored hashes can't be turned back into working reset links.
function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// Looks up a reset row that is unused and not yet expired.
async function findValidReset(token) {
  if (!token) return null;
  const [rows] = await pool.query(
    `SELECT pr.id, pr.user_id, u.email, u.name
       FROM password_resets pr
       JOIN users u ON u.id = pr.user_id
      WHERE pr.token_hash = ?
        AND pr.used_at IS NULL
        AND pr.expires_at > NOW()
      LIMIT 1`,
    [hashToken(token)]
  );
  return rows[0] || null;
}

// ---- Register ----
router.get("/register", (req, res) => {
  res.render("auth/register", { title: "Sign Up", pageCss: "register", pageJs: "register" });
});

router.post("/register", async (req, res, next) => {
  try {
    const { role, fullName, orgName, email, password, confirmPassword, gender } = req.body;
    const errors = [];

    if (password !== confirmPassword) errors.push("Passwords do not match.");
    if (password.length < 8) errors.push("Password must be at least 8 characters.");
    if (role === "organiser" && !looksLikeOrgEmail(email)) {
      errors.push("Organisers must sign up with a verified organisation or business email address.");
    }
    if (gender && !["male", "female"].includes(gender)) {
      errors.push("Please select a valid gender.");
    }

    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length) errors.push("An account with that email already exists.");

    if (errors.length) {
      req.flash("error", errors.join(" "));
      return res.redirect("/register");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, org_name, gender, status) VALUES (?, ?, ?, ?, ?, ?, 'active')`,
      [fullName, email, passwordHash, role, role === "organiser" ? orgName : null, gender || null]
    );
    try {
      await sendWelcomeEmail(email, fullName);
    } catch (err) {
      console.error("Failed to send welcome email:", err);
    }

    req.session.user = { id: result.insertId, name: fullName, email, role, orgName: orgName || null };
    req.flash("success", "Account created! Welcome to EventHub.");
    res.redirect("/account");
  } catch (err) {
    next(err);
  }
});

// ---- Login ----
router.get("/login", (req, res) => {
  res.render("auth/login", { title: "Log In", pageCss: "register", pageJs: null });
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    const user = rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      req.flash("error", "Incorrect email or password.");
      return res.redirect("/login");
    }
    if (user.status === "suspended") {
      req.flash("error", "This account has been suspended. Contact support if you think this is a mistake.");
      return res.redirect("/login");
    }

    req.session.user = { id: user.id, name: user.name, email: user.email, role: user.role, orgName: user.org_name };
    req.flash("success", `Welcome back, ${user.name}!`);
    res.redirect(user.role === "admin" ? "/admin" : "/account");
  } catch (err) {
    next(err);
  }
});

// ---- Forgot password: ask for the email ----
router.get("/forgot-password", (req, res) => {
  res.render("auth/forgot-password", {
    title: "Forgot Password",
    pageCss: "register",
    pageJs: null,
    expiryMinutes: RESET_TOKEN_TTL_MINUTES
  });
});

router.post("/forgot-password", async (req, res, next) => {
  try {
    const email = (req.body.email || "").trim();

    const [rows] = await pool.query("SELECT id, name, email, status FROM users WHERE email = ?", [email]);
    const user = rows[0];

    // Stay on the same page when there's no account with that address.
    if (!user) {
      req.flash("error", "That email doesn't exist. Check the spelling or create an account.");
      return res.redirect("/forgot-password");
    }

    if (user.status === "suspended") {
      req.flash("error", "This account has been suspended. Contact support if you think this is a mistake.");
      return res.redirect("/forgot-password");
    }

    // One live link per account — issuing a new one retires any older ones.
    await pool.query("DELETE FROM password_resets WHERE user_id = ?", [user.id]);

    const token = crypto.randomBytes(32).toString("hex");
    await pool.query(
      `INSERT INTO password_resets (user_id, token_hash, expires_at)
       VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))`,
      [user.id, hashToken(token), RESET_TOKEN_TTL_MINUTES]
    );

    const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
    const resetUrl = `${baseUrl}/reset-password/${token}`;

    try {
      await sendPasswordResetEmail(user.email, user.name, resetUrl, RESET_TOKEN_TTL_MINUTES);
    } catch (err) {
      console.error("Failed to send password reset email:", err);
      req.flash("error", "We couldn't send the email just now. Try again in a moment.");
      return res.redirect("/forgot-password");
    }

    req.flash("success", `Reset link sent to ${user.email}. It expires in ${RESET_TOKEN_TTL_MINUTES} minutes.`);
    res.redirect("/login");
  } catch (err) {
    next(err);
  }
});

// ---- Reset password: the page the email button opens ----
router.get("/reset-password/:token", async (req, res, next) => {
  try {
    const reset = await findValidReset(req.params.token);
    if (!reset) {
      req.flash("error", "That reset link has expired or has already been used. Request a new one.");
      return res.redirect("/forgot-password");
    }

    res.render("auth/reset-password", {
      title: "Set a New Password",
      pageCss: "register",
      pageJs: null,
      token: req.params.token,
      email: reset.email
    });
  } catch (err) {
    next(err);
  }
});

router.post("/reset-password/:token", async (req, res, next) => {
  try {
    const token = req.params.token;
    const { password, confirmPassword } = req.body;

    const reset = await findValidReset(token);
    if (!reset) {
      req.flash("error", "That reset link has expired or has already been used. Request a new one.");
      return res.redirect("/forgot-password");
    }

    const errors = [];
    if (!password || password.length < 8) errors.push("Password must be at least 8 characters.");
    if (password !== confirmPassword) errors.push("Passwords do not match.");

    if (errors.length) {
      req.flash("error", errors.join(" "));
      return res.redirect(`/reset-password/${token}`);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await pool.query("UPDATE users SET password_hash = ? WHERE id = ?", [passwordHash, reset.user_id]);
    await pool.query("UPDATE password_resets SET used_at = NOW() WHERE id = ?", [reset.id]);

    req.flash("success", "Password updated. Log in with your new password.");
    res.redirect("/login");
  } catch (err) {
    next(err);
  }
});

// ---- Logout ----
router.post("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

module.exports = router;
