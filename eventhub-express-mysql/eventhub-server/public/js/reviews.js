/* ==========================================================================
   Feature 3: Reviews & Comments — client-side star rating input
   OWNERSHIP: [teammate name]
   ========================================================================== */

(() => {
  const starButtons = document.querySelectorAll("#star-input .star");
  const ratingInput = document.getElementById("rating-input");
  const reviewForm = document.getElementById("review-form");
  if (!starButtons.length) return;

  let selected = 0;

  starButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      selected = Number(btn.dataset.value);
      ratingInput.value = selected;
      starButtons.forEach(b => b.classList.toggle("is-filled", Number(b.dataset.value) <= selected));
    });
  });

  reviewForm.addEventListener("submit", (e) => {
    if (selected === 0) {
      e.preventDefault();
      alert("Please select a star rating.");
    }
  });
})();
