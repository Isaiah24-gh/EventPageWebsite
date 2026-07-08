/* ==========================================================================
   Feature 1: Account Creation — client-side role toggle
   OWNERSHIP: [teammate name]
   ========================================================================== */

(() => {
  const roleButtons = document.querySelectorAll(".role-btn");
  const roleInput = document.getElementById("role-input");
  const orgField = document.getElementById("org-name-field");
  const orgInput = document.getElementById("orgName");
  const emailHint = document.getElementById("email-hint");
  const submitBtn = document.getElementById("submit-btn");

  if (!roleButtons.length) return;

  roleButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      roleButtons.forEach(b => { b.classList.remove("is-active"); b.setAttribute("aria-selected", "false"); });
      btn.classList.add("is-active");
      btn.setAttribute("aria-selected", "true");

      const role = btn.dataset.role;
      roleInput.value = role;

      const isOrganiser = role === "organiser";
      orgField.hidden = !isOrganiser;
      orgInput.required = isOrganiser;
      emailHint.textContent = isOrganiser
        ? "Organisers must sign up with a verified organisation or business email."
        : "We'll send a confirmation link to this address.";
      submitBtn.textContent = isOrganiser ? "Create Organiser Account" : "Create Visitor Account";
    });
  });
})();
