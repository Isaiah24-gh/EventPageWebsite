/* ==========================================================================
   Event Detail — base event rendering
   OWNERSHIP: shared/foundation file (site structure), not one of the 6
   assigned features. Renders the core event info; reviews.js (Feature 3)
   and the ticketing link below both depend on the #event-container markup.
   ========================================================================== */

(() => {
  const container = document.getElementById("event-container");
  const id = EventHub.qs("id");
  const evt = EventHub.getEventById(id);

  if (!evt) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>Event not found</h3>
        <p>This event may have been removed. <a href="../index.html">Back to Browse</a></p>
      </div>`;
    return;
  }

  const favIds = JSON.parse(localStorage.getItem("eh_favourites") || "[]");
  const isFav = favIds.includes(evt.id);
  const priceLabel = evt.price > 0 ? `$${evt.price.toFixed(2)}` : "Free";

  container.innerHTML = `
    <span class="event-card-tag">${evt.category}</span>
    <h1>${evt.title}</h1>
    <p style="color:var(--ink-soft);">
      ${EventHub.formatDate(evt.date)} · ${evt.time} · ${evt.venue}
    </p>
    <p>${evt.description}</p>
    <p><strong>Organiser:</strong> ${evt.organiser} &nbsp;·&nbsp; <strong>Price:</strong> ${priceLabel}</p>

    <div style="display:flex;gap:12px;flex-wrap:wrap;margin:24px 0;">
      <a class="btn" href="${evt.externalUrl}" target="_blank" rel="noopener noreferrer">Visit Organiser Page</a>
      <a class="btn btn-accent" href="ticketing.html?id=${evt.id}">Get Tickets</a>
      <button class="btn btn-secondary" id="fav-btn">${isFav ? "★ Saved" : "☆ Save Event"}</button>
      <a class="btn btn-secondary" href="notifications.html?id=${evt.id}">🔔 Remind Me</a>
    </div>
  `;

  document.getElementById("fav-btn").addEventListener("click", (e) => {
    let favs = JSON.parse(localStorage.getItem("eh_favourites") || "[]");
    if (favs.includes(evt.id)) {
      favs = favs.filter(x => x !== evt.id);
      e.target.textContent = "☆ Save Event";
      EventHub.toast("Removed from favourites");
    } else {
      favs.push(evt.id);
      e.target.textContent = "★ Saved";
      EventHub.toast("Saved to favourites");
    }
    localStorage.setItem("eh_favourites", JSON.stringify(favs));
  });
})();
