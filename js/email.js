/* ==========================================================================
   Feature 4: Email System — page logic
   OWNERSHIP: [teammate name]
   Prototype only: saves preferences to localStorage. Swap with real API
   calls (POST /api/email-preferences) and an actual email service
   (e.g. SendGrid/SES) when the backend is ready.
   ========================================================================== */

(() => {
  const subscribeToggle = document.getElementById("subscribe-toggle");
  const reminderToggle = document.getElementById("reminder-toggle");
  const categoryBlock = document.getElementById("category-block");
  const categoryContainer = document.getElementById("category-checkboxes");
  const emailInput = document.getElementById("email-address");
  const form = document.getElementById("email-form");
  const previewEvents = document.getElementById("preview-events");

  const user = EventHub.getCurrentUser();
  if (user) emailInput.value = user.email;

  const events = EventHub.getEvents();
  const categories = [...new Set(events.map(e => e.category))].sort();

  categoryContainer.innerHTML = categories.map(cat => `
    <label><input type="checkbox" value="${cat}" class="cat-checkbox"> ${cat}</label>
  `).join("");

  previewEvents.innerHTML = events.slice(0, 3).map(e => `<li>${e.title} — ${EventHub.formatDate(e.date)}</li>`).join("");

  const prefs = JSON.parse(localStorage.getItem("eh_email_prefs") || "{}");
  subscribeToggle.checked = !!prefs.subscribed;
  reminderToggle.checked = prefs.reminders !== false;
  categoryBlock.style.display = subscribeToggle.checked ? "block" : "none";
  document.querySelectorAll(".cat-checkbox").forEach(cb => {
    cb.checked = (prefs.categories || []).includes(cb.value);
  });

  subscribeToggle.addEventListener("change", () => {
    categoryBlock.style.display = subscribeToggle.checked ? "block" : "none";
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const selectedCategories = [...document.querySelectorAll(".cat-checkbox:checked")].map(cb => cb.value);

    const newPrefs = {
      subscribed: subscribeToggle.checked,
      categories: selectedCategories,
      reminders: reminderToggle.checked,
      email: emailInput.value.trim()
    };

    localStorage.setItem("eh_email_prefs", JSON.stringify(newPrefs));
    EventHub.toast("Email preferences saved!");
  });
})();
