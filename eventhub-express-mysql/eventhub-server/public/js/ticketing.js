/* ==========================================================================
   Feature 6: Ticketing — client-side quantity/total calculation
   OWNERSHIP: [teammate name]
   ========================================================================== */

(() => {
  const qtyInput = document.getElementById("qty-input");
  const qtyDisplay = document.getElementById("qty-display");
  const totalDisplay = document.getElementById("total-display");
  if (!qtyInput) return;

  const price = Number(totalDisplay.dataset.price || 0);

  qtyInput.addEventListener("input", () => {
    const qty = Math.max(1, Math.min(10, Number(qtyInput.value) || 1));
    qtyDisplay.textContent = `${qty} ticket${qty === 1 ? "" : "s"}`;
    const total = price * qty;
    totalDisplay.textContent = total > 0 ? `$${total.toFixed(2)}` : "Free";
  });
})();
