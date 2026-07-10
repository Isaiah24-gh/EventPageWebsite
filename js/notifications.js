/* ==========================================================================
   Feature 5: Notifications — page logic
   OWNERSHIP: [teammate name]
   Prototype only: reminders stored in localStorage. The .ics download is
   fully functional (real calendar files). Browser push notifications use
   the standard Notification API for a demo permission prompt; a production
   build would pair this with a backend job that fires reminders on schedule.
   ========================================================================== */

(() => {
  const list = document.getElementById("reminder-list");
  const empty = document.getElementById("reminder-empty");
  const count = document.getElementById("reminder-count");
  const permissionStatus = document.getElementById("permission-status");
  const enableBtn = document.getElementById("enable-notif-btn");

  // if arriving from an event's "Remind Me" link, auto-add it
  const incomingId = EventHub.qs("id");
  if (incomingId) {
    const reminders = JSON.parse(localStorage.getItem("eh_reminders") || "[]");
    if (!reminders.includes(incomingId)) {
      reminders.push(incomingId);
      localStorage.setItem("eh_reminders", JSON.stringify(reminders));
      EventHub.toast("Reminder added!");
    }
  }

  function refreshPermissionUI() {
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
    refreshPermissionUI();
    if (result === "granted") {
      new Notification("EventHub", { body: "Notifications enabled — we'll remind you before your saved events." });
    }
  });

  refreshPermissionUI();

  function buildICS(evt) {
    const [year, month, day] = evt.date.split("-").map(Number);
    const [hour, minute] = evt.time.split(":").map(Number);
    const start = new Date(year, month - 1, day, hour, minute);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // assume 2hr duration

    const fmt = (d) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    return [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//EventHub//Prototype//EN",
      "BEGIN:VEVENT",
      `UID:${evt.id}@eventhub.local`,
      `DTSTAMP:${fmt(new Date())}`,
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:${evt.title}`,
      `LOCATION:${evt.venue}`,
      `DESCRIPTION:${evt.description}`,
      "BEGIN:VALARM",
      "TRIGGER:-P1D",
      "ACTION:DISPLAY",
      "DESCRIPTION:Event reminder",
      "END:VALARM",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");
  }

  function downloadICS(evt) {
    const blob = new Blob([buildICS(evt)], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${evt.title.replace(/[^a-z0-9]+/gi, "-")}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function render() {
    const reminderIds = JSON.parse(localStorage.getItem("eh_reminders") || "[]");
    const events = EventHub.getEvents();
    const reminderEvents = events.filter(e => reminderIds.includes(e.id))
      .sort((a, b) => a.date.localeCompare(b.date));

    count.textContent = `${reminderEvents.length} reminder${reminderEvents.length === 1 ? "" : "s"}`;

    if (!reminderEvents.length) {
      list.innerHTML = "";
      empty.style.display = "block";
      return;
    }
    empty.style.display = "none";

    list.innerHTML = reminderEvents.map(evt => `
      <div class="reminder-card">
        <span class="event-card-tag">${evt.category}</span>
        <h3 class="event-card-title">${evt.title}</h3>
        <p class="event-card-meta">${EventHub.formatDate(evt.date)} · ${evt.time} · ${evt.venue}</p>
        <div class="reminder-card-actions">
          <button class="btn btn-sm" data-action="ics" data-id="${evt.id}">Add to Calendar</button>
          <button class="btn btn-secondary btn-sm" data-action="remove" data-id="${evt.id}">Remove</button>
        </div>
      </div>
    `).join("");

    list.querySelectorAll('[data-action="ics"]').forEach(btn => {
      btn.addEventListener("click", () => downloadICS(EventHub.getEventById(btn.dataset.id)));
    });

    list.querySelectorAll('[data-action="remove"]').forEach(btn => {
      btn.addEventListener("click", () => {
        const remaining = JSON.parse(localStorage.getItem("eh_reminders") || "[]").filter(id => id !== btn.dataset.id);
        localStorage.setItem("eh_reminders", JSON.stringify(remaining));
        EventHub.toast("Reminder removed");
        render();
      });
    });
  }

  render();
})();
