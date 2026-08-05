/* ==========================================================================
   Homepage — Browse / Search / Filter Events
   OWNERSHIP: shared/foundation file (site structure), not one of the 7
   assigned features.
   ========================================================================== */

const express = require("express");
const router = express.Router();
const pool = require("../config/db");



router.get("/", async (req, res, next) => {
  try {
    const { search = "", category = "", date = "", price = "" } = req.query;

    let sql = `SELECT e.*, u.name AS organiser_name
               FROM events e
               JOIN users u ON u.id = e.organiser_id
               WHERE e.status = 'active'`;
    const params = [];

    if (search) {
      sql += ` AND (e.title LIKE ? OR e.venue LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }
    if (category) {
      sql += ` AND e.category = ?`;
      params.push(category);
    }
    if (date) {
      sql += ` AND e.event_date = ?`;
      params.push(date);
    }
    if (price === "free") sql += ` AND e.price = 0`;
    if (price === "paid") sql += ` AND e.price > 0`;

    sql += ` ORDER BY e.event_date ASC`;

    const [events] = await pool.query(sql, params);
    const [categoryRows] = await pool.query(
      `SELECT DISTINCT category FROM events WHERE status = 'active' ORDER BY category`
    );

    res.render("index", {
      title: "Browse Events",
      active: "browse",
      pageCss: null,
      events,
      categories: categoryRows.map(r => r.category),
      filters: { search, category, date, price }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
