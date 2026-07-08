/* ==========================================================================
   Feature 4: Email System — client-side script
   OWNERSHIP: [teammate name]
   ========================================================================== */

(() => {
  const subscribeToggle = document.getElementById("subscribe-toggle");
  const categoryBlock = document.getElementById("category-block");
  if (!subscribeToggle) return;

  subscribeToggle.addEventListener("change", () => {
    categoryBlock.style.display = subscribeToggle.checked ? "block" : "none";
  });
})();
