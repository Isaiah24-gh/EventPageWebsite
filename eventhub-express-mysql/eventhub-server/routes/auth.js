/* ==========================================================================
   Feature 1: Account Creation & Login
   OWNERSHIP: [teammate name]
   ========================================================================== */

const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const pool = require("../config/db");

const FREE_EMAIL_PROVIDERS = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com"];

function looksLikeOrgEmail(email) {
  const domain = (email.split("@")[1] || "").toLowerCase();
  return domain && !FREE_EMAIL_PROVIDERS.includes(domain);
}

// ---- Register ----
router.get("/register", (req, res) => {
  res.render("auth/register", { title: "Sign Up", pageCss: "register", pageJs: "register" });
});

router.post("/register", async (req, res, next) => {
  try {
    const { role, fullName, orgName, email, password, confirmPassword } = req.body;
    const errors = [];

    if (password !== confirmPassword) errors.push("Passwords do not match.");
    if (password.length < 8) errors.push("Password must be at least 8 characters.");
    if (role === "organiser" && !looksLikeOrgEmail(email)) {
      errors.push("Organisers must sign up with a verified organisation or business email address.");
    }

    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length) errors.push("An account with that email already exists.");

    if (errors.length) {
      req.flash("error", errors.join(" "));
      return res.redirect("/register");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, org_name, status) VALUES (?, ?, ?, ?, ?, 'active')`,
      [fullName, email, passwordHash, role, role === "organiser" ? orgName : null]
    );

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

// ---- Logout ----
router.post("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

module.exports = router;
