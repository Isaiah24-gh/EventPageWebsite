/* ==========================================================================
   Feature 2: Account Webpage — client-side script
   OWNERSHIP: Isaiah
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

  // Bio: plain-text display with an Edit button that reveals the textarea.
  const bioDisplay = document.getElementById("bio-display");
  const bioEditWrap = document.getElementById("bio-edit-wrap");
  const editBioBtn = document.getElementById("edit-bio-btn");
  const cancelBioBtn = document.getElementById("cancel-bio-btn");
  const bioTextarea = document.getElementById("bio");

  if (bioDisplay && bioEditWrap && editBioBtn) {
    const originalBio = bioTextarea.value;

    editBioBtn.addEventListener("click", () => {
      bioDisplay.hidden = true;
      editBioBtn.hidden = true;
      bioEditWrap.hidden = false;
      bioTextarea.focus();
    });

    if (cancelBioBtn) {
      cancelBioBtn.addEventListener("click", () => {
        bioTextarea.value = originalBio; // discard unsaved changes
        bioEditWrap.hidden = true;
        bioDisplay.hidden = false;
        editBioBtn.hidden = false;
      });
    }
  }
})();