/* ==========================================================================
   Feature 3: Reviews & Comments — page logic
   OWNERSHIP: [teammate name]
   Prototype only: stores reviews in localStorage keyed by event id.
   Swap with real API calls (GET/POST /api/events/:id/reviews) later.
   ========================================================================== */

(() => {
  const id = EventHub.qs("id");
  if (!id) return;

  const starButtons = document.querySelectorAll("#star-input .star");
  const reviewForm = document.getElementById("review-form");
  const reviewList = document.getElementById("review-list");
  const reviewEmpty = document.getElementById("review-empty");
  const reviewSummary = document.getElementById("review-summary");

  let selectedRating = 0;

  starButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      selectedRating = Number(btn.dataset.value);
      starButtons.forEach(b => b.classList.toggle("is-filled", Number(b.dataset.value) <= selectedRating));
    });
  });

  function getReviews() {
    const all = JSON.parse(localStorage.getItem("eh_reviews") || "{}");
    return all[id] || [];
  }

  function saveReviews(list) {
    const all = JSON.parse(localStorage.getItem("eh_reviews") || "{}");
    all[id] = list;
    localStorage.setItem("eh_reviews", JSON.stringify(all));
  }

  function render() {
    const reviews = getReviews();

    if (!reviews.length) {
      reviewList.innerHTML = "";
      reviewEmpty.style.display = "block";
      reviewSummary.textContent = "No reviews yet";
      return;
    }

    reviewEmpty.style.display = "none";
    const avg = (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1);
    reviewSummary.textContent = `★ ${avg} · ${reviews.length} review${reviews.length === 1 ? "" : "s"}`;

    reviewList.innerHTML = reviews.slice().reverse().map(r => `
      <div class="review-item">
        <div class="review-meta">
          <span>${escapeHtml(r.name)}</span>
          <span class="review-date">${new Date(r.date).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })}</span>
        </div>
        <div class="review-stars">${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}</div>
        <p style="margin:6px 0 0 0;">${escapeHtml(r.comment)}</p>
      </div>
    `).join("");
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  reviewForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("rev-name").value.trim();
    const comment = document.getElementById("rev-comment").value.trim();

    if (!selectedRating) {
      EventHub.toast("Please select a star rating");
      return;
    }

    const reviews = getReviews();
    reviews.push({ name, rating: selectedRating, comment, date: new Date().toISOString() });
    saveReviews(reviews);

    reviewForm.reset();
    selectedRating = 0;
    starButtons.forEach(b => b.classList.remove("is-filled"));
    EventHub.toast("Review posted!");
    render();
  });

  render();
})();
