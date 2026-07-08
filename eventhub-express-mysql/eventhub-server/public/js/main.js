/* ==========================================================================
   EventHub — Shared client-side script
   OWNERSHIP: shared/foundation file.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".flash").forEach(el => {
    setTimeout(() => { el.style.display = "none"; }, 4000);
  });
});
