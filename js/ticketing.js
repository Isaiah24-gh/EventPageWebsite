/* ==========================================================================
   Feature 6: Ticketing — page logic
   OWNERSHIP: [teammate name]
   Prototype only: this does not process payments. It confirms the order
   summary, then hands off to the organiser's external, secure ticketing
   link (evt.externalUrl). Swap with a real payment gateway integration
   (e.g. Stripe Checkout) only if the team decides to process payments
   in-house later.
   ========================================================================== */

(() => {
  const container = document.getElementById("ticket-container");
  const id = EventHub.qs("id");
  const evt = EventHub.getEventById(id);

  if (!evt) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>No event selected</h3>
        <p>Head back and choose an event to get tickets for. <a href="../index.html">Browse Events</a></p>
      </div>`;
    return;
  }

  const priceLabel = evt.price > 0 ? `$${evt.price.toFixed(2)}` : "Free";

  container.innerHTML = `
    <div class="ticket-summary">
      <div class="ticket-summary-top">
        <span class="event-card-tag">${evt.category}</span>
        <h2 style="margin:8px 0 4px 0;">${evt.title}</h2>
        <p style="color:var(--ink-soft);margin:0;">${EventHub.formatDate(evt.date)} · ${evt.time} · ${evt.venue}</p>
      </div>
      <div class="ticket-summary-divider"></div>
      <div class="ticket-summary-bottom">
        <div>
          <div class="ticket-row"><span>Quantity</span><span id="qty-display">1 ticket</span></div>
          <div class="ticket-row"><span>Price per ticket</span><span>${priceLabel}</span></div>
        </div>
        <div style="text-align:right;">
          <p style="font-family:var(--font-label);font-size:0.78rem;color:var(--ink-soft);margin:0;">Total</p>
          <p id="total-display" style="font-family:var(--font-display);font-size:1.4rem;margin:0;">${priceLabel}</p>
        </div>
      </div>
    </div>

    <div class="field" style="max-width:200px;">
      <label for="qty-input">Number of tickets</label>
      <input type="number" id="qty-input" min="1" max="10" value="1">
    </div>

    <a class="btn btn-accent btn-block" id="checkout-btn" href="${evt.externalUrl}" target="_blank" rel="noopener noreferrer">
      Continue to Secure Checkout →
    </a>

    <div class="security-note" style="margin-top:16px;">
      <span>🔒</span>
      <span>You'll be redirected to <strong>${new URL(evt.externalUrl).hostname}</strong>, the organiser's official ticketing page, to complete payment securely. EventHub does not store your payment details.</span>
    </div>
  `;

  const qtyInput = document.getElementById("qty-input");
  const qtyDisplay = document.getElementById("qty-display");
  const totalDisplay = document.getElementById("total-display");

  qtyInput.addEventListener("input", () => {
    const qty = Math.max(1, Math.min(10, Number(qtyInput.value) || 1));
    qtyDisplay.textContent = `${qty} ticket${qty === 1 ? "" : "s"}`;
    const total = evt.price * qty;
    totalDisplay.textContent = total > 0 ? `$${total.toFixed(2)}` : "Free";
  });
})();
