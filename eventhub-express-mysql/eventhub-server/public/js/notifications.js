/* ==========================================================================
   Feature 5: Notifications — client-side browser notification permission
   OWNERSHIP: [teammate name]
   A production build would pair this with a backend job that fires
   reminders on schedule; this demonstrates the permission flow.
   ========================================================================== */

(() => {
  const permissionStatus = document.getElementById("permission-status");
  const enableBtn = document.getElementById("enable-notif-btn");
  if (!enableBtn) return;

  function refresh() {
    if (!("Notification" in window)) {
      permissionStatus.textContent = "Not supported in this browser";
      enableBtn.disabled = true;
      return;
    }
    const perm = Notification.permission;
    permissionStatus.textContent = perm === "granted" ? "Enabled ✓" : perm === "denied" ? "Blocked — check browser settings" : "Not enabled";
    enableBtn.textContent = perm === "granted" ? "Send Test Notification" : "Enable Notifications";
  }

  enableBtn.addEventListener("click", async () => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") {
      new Notification("EventHub", { body: "This is what a reminder notification looks like!" });
      return;
    }
    const result = await Notification.requestPermission();
    refresh();
    if (result === "granted") {
      new Notification("EventHub", { body: "Notifications enabled — we'll remind you before your saved events." });
    }
  });

  refresh();
})();
