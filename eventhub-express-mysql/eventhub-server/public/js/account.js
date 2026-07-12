/* ==========================================================================
   Feature 2: Account Webpage — client-side script
   OWNERSHIP: [teammate name]
   ========================================================================== */

(() => {
  const btn = document.getElementById("new-listing-btn");
  const form = document.getElementById("listing-form");
  if (btn && form) {
    btn.addEventListener("click", () => {
      form.style.display = form.style.display === "none" ? "grid" : "none";
    });
  }

  const avatarInput = document.getElementById("avatar-input");
  if (avatarInput) {
    avatarInput.addEventListener("change", () => {
      if (avatarInput.files[0]) {
        document.getElementById("profile-form").requestSubmit(); // auto-save on pick
      }
    });
  }
})();
