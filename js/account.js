/* ==========================================================================
   Feature 2: Account Webpage — page logic
   OWNERSHIP: [teammate name]
   Prototype only: reads/writes localStorage. Swap with real API calls
   (GET /api/me, GET /api/favourites, POST /api/listings) later.
   ========================================================================== */

(() => {
  const user = EventHub.getCurrentUser();
  const signedOut = document.getElementById("signed-out-view");
  const signedIn = document.getElementById("signed-in-view");

  if (!user) {
    signedOut.style.display = "block";
    return;
  }
  signedIn.style.display = "block";

  document.getElementById("user-name").textContent = user.name;
  document.getElementById("user-email").textContent = user.email;
  document.getElementById("user-role-badge").textContent = user.role;
  document.getElementById("avatar-initials").textContent = user.name.charAt(0).toUpperCase();

  document.getElementById("logout-btn").addEventListener("click", () => {
    EventHub.logout();
    window.location.href = "../index.html";
  });

  // ---- Favourites ----
  const favIds = JSON.parse(localStorage.getItem("eh_favourites") || "[]");
  const events = EventHub.getEvents();
  const favEvents = events.filter(e => favIds.includes(e.id));

  const favGrid = document.getElementById("favourites-grid");
  const favEmpty = document.getElementById("favourites-empty");

  if (favEvents.length) {
    favGrid.innerHTML = favEvents.map(evt => EventHub.eventCardHTML(evt, { href: `event-detail.html?id=${evt.id}` })).join("");
  } else {
    favEmpty.style.display = "block";
  }

  // ---- Organiser listings ----
  if (user.role === "organiser") {
    const organiserSection = document.getElementById("organiser-section");
    organiserSection.style.display = "block";

    const listingForm = document.getElementById("listing-form");
    const newListingBtn = document.getElementById("new-listing-btn");
    const listingsGrid = document.getElementById("listings-grid");

    newListingBtn.addEventListener("click", () => {
      listingForm.style.display = listingForm.style.display === "none" ? "grid" : "none";
    });

    function renderListings() {
      const all = EventHub.getEvents();
      const mine = all.filter(e => e.organiser === (user.orgName || user.name));
      listingsGrid.innerHTML = mine.length
        ? mine.map(evt => EventHub.eventCardHTML(evt, { href: `event-detail.html?id=${evt.id}` })).join("")
        : `<div class="empty-state"><h3>No listings yet</h3><p>Create your first event listing above.</p></div>`;
    }

    listingForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const all = EventHub.getEvents();
      const newEvent = {
        id: "evt-" + Date.now(),
        title: document.getElementById("l-title").value.trim(),
        category: document.getElementById("l-category").value.trim(),
        date: document.getElementById("l-date").value,
        time: document.getElementById("l-time").value,
        venue: document.getElementById("l-venue").value.trim(),
        description: document.getElementById("l-desc").value.trim(),
        organiser: user.orgName || user.name,
        externalUrl: document.getElementById("l-url").value.trim(),
        price: 0
      };
      all.push(newEvent);
      localStorage.setItem("eh_events", JSON.stringify(all));
      listingForm.reset();
      listingForm.style.display = "none";
      EventHub.toast("Listing published!");
      renderListings();
    });

    renderListings();
  }
})();
