/* ==========================================================================
   Feature 1: Account Creation — page logic
   OWNERSHIP: [teammate name]
   Prototype only: stores accounts in localStorage. Swap with a real API
   call (POST /api/register) when the backend is ready.
   ========================================================================== */

(() => {
  const roleButtons = document.querySelectorAll(".role-btn");
  const orgField = document.getElementById("org-name-field");
  const orgInput = document.getElementById("org-name");
  const emailHint = document.getElementById("email-hint");
  const submitBtn = document.getElementById("submit-btn");
  const form = document.getElementById("register-form");

  let currentRole = "visitor";

  roleButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      roleButtons.forEach(b => { b.classList.remove("is-active"); b.setAttribute("aria-selected", "false"); });
      btn.classList.add("is-active");
      btn.setAttribute("aria-selected", "true");
      currentRole = btn.dataset.role;

      const isOrganiser = currentRole === "organiser";
      orgField.hidden = !isOrganiser;
      orgInput.required = isOrganiser;
      emailHint.textContent = isOrganiser
        ? "Organisers must sign up with a verified organisation or business email."
        : "We'll send a confirmation link to this address.";
      submitBtn.textContent = isOrganiser ? "Create Organiser Account" : "Create Visitor Account";
    });
  });

  function looksLikeOrgEmail(email) {
    // very simple heuristic for the prototype: reject common free providers
    const freeProviders = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com"];
    const domain = email.split("@")[1]?.toLowerCase() || "";
    return domain && !freeProviders.includes(domain);
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.getElementById("full-name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirm = document.getElementById("confirm-password").value;

    const emailError = document.getElementById("email-error");
    const matchError = document.getElementById("match-error");
    emailError.style.display = "none";
    matchError.style.display = "none";

    let valid = true;

    if (currentRole === "organiser" && !looksLikeOrgEmail(email)) {
      emailError.textContent = "Please use a verified organisation or business email address.";
      emailError.style.display = "block";
      valid = false;
    }

    if (password !== confirm) {
      matchError.style.display = "block";
      valid = false;
    }

    if (!valid) return;

    const users = JSON.parse(localStorage.getItem("eh_users") || "[]");
    const newUser = {
      id: "user-" + Date.now(),
      name,
      email,
      role: currentRole,
      orgName: currentRole === "organiser" ? orgInput.value.trim() : null,
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    localStorage.setItem("eh_users", JSON.stringify(users));
    EventHub.setCurrentUser(newUser);

    EventHub.toast("Account created! Redirecting to your account…");
    setTimeout(() => { window.location.href = "account.html"; }, 900);
  });
})();
