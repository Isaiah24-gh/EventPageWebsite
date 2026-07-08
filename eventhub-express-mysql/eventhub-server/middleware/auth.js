/* ==========================================================================
   Auth middleware
   OWNERSHIP: shared/foundation file.
   ========================================================================== */

function attachUser(req, res, next) {
  res.locals.currentUser = req.session.user || null;
  res.locals.flashSuccess = req.flash("success");
  res.locals.flashError = req.flash("error");
  next();
}

function requireLogin(req, res, next) {
  if (!req.session.user) {
    req.flash("error", "Please log in to continue.");
    return res.redirect("/login");
  }
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.session.user) {
      req.flash("error", "Please log in to continue.");
      return res.redirect("/login");
    }
    if (!roles.includes(req.session.user.role)) {
      req.flash("error", "You don't have permission to view that page.");
      return res.redirect("/");
    }
    next();
  };
}

module.exports = { attachUser, requireLogin, requireRole };
