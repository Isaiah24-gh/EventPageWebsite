/* ==========================================================================
   Feature 2: Account Webpage — client-side script
   OWNERSHIP: [teammate name]
   ========================================================================== */

(() => {
  const btn = document.getElementById("new-listing-btn");
  const form = document.getElementById("listing-form");
  if (!btn || !form) return;

  btn.addEventListener("click", () => {
    form.style.display = form.style.display === "none" ? "grid" : "none";
  });
})();
