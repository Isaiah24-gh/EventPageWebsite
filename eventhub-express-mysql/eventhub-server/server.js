/* ==========================================================================
   EventHub — Server Entry Point
   OWNERSHIP: shared/foundation file. Coordinate with the team before editing.
   ========================================================================== */

require("dotenv").config();
const express = require("express");
const session = require("express-session");
const flash = require("connect-flash");
const methodOverride = require("method-override");
const path = require("path");

const { attachUser } = require("./middleware/auth");
const pool = require("./config/db");   // used by the /healthz probe

const app = express();

app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));

// ---- Health check (Member 2: Dockerisation) ----------------------------
// Deliberately declared BEFORE the session/flash middleware so it stays
// cheap and has no dependency on session state.
// Used by: Dockerfile HEALTHCHECK, docker-compose depends_on, Ansible
// post-deploy verification, and the CI/CD post-deploy smoke test.
app.get("/healthz", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({ status: "ok", db: "up", uptime: process.uptime() });
  } catch (err) {
    // App is running but cannot reach the database — report unhealthy so
    // orchestrators do not send traffic here.
    res.status(503).json({ status: "degraded", db: "down" });
  }
});

app.use(session({
  secret: process.env.SESSION_SECRET || "dev-secret-change-me",
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 8 } // 8 hours
}));
app.use(flash());
app.use(attachUser);

// ---- Feature routes ----
app.use("/", require("./routes/index"));          // homepage: browse/search/filter
app.use("/", require("./routes/auth"));            // Feature 1: account creation + login
app.use("/account", require("./routes/account"));  // Feature 2: account webpage
app.use("/events", require("./routes/events"));    // Feature 3: event detail + reviews
app.use("/email-preferences", require("./routes/email")); // Feature 4: email system
app.use("/notifications", require("./routes/notifications")); // Feature 5: reminders
app.use("/ticketing", require("./routes/ticketing"));         // Feature 6: ticketing
app.use("/admin", require("./routes/admin"));       // Feature 7: admin portal

// ---- 404 ----
app.use((req, res) => {
  res.status(404).render("404", { title: "Page Not Found" });
});

// ---- Error handler ----
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render("500", { title: "Something Went Wrong", message: err.message });
});

const PORT = process.env.PORT || 3000;

// Only start listening when this file is run directly (`node server.js`).
// When it is imported — e.g. by Supertest in the Member 4 test suite — the
// app is returned without binding a port, so tests never collide.
if (require.main === module) {
  // 0.0.0.0 (not 127.0.0.1) so the process is reachable from outside the
  // container. Binding to loopback is the classic "container runs but I
  // cannot reach it" bug.
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`EventHub running on port ${PORT}`);
  });
}

module.exports = app;
