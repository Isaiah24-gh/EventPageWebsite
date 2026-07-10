/* ==========================================================================
   EventHub — Shared Utilities & Mock Data
   OWNERSHIP: shared file. Coordinate with the team before editing.
   Provides a fake localStorage "database" so every feature page can work
   independently before a real backend/API exists.
   ========================================================================== */

const EventHub = (() => {

  const SEED_EVENTS = [
    {
      id: "evt-001",
      title: "Campus Anime & Manga Fandom Meet",
      category: "Fandom",
      date: "2026-07-12",
      time: "14:00",
      venue: "Republic Polytechnic, Hub Level 2",
      description: "Cosplay, swap-market, and a fan-art showcase for anime and manga fans.",
      organiser: "RP Anime Society",
      externalUrl: "https://example.com/rp-anime-meet",
      price: 0
    },
    {
      id: "evt-002",
      title: "Weekend Warehouse Clearance Sale",
      category: "Warehouse Sale",
      date: "2026-07-18",
      time: "10:00",
      venue: "Sungei Kadut Warehouse 7",
      description: "Up to 70% off overstocked apparel, homeware, and electronics.",
      organiser: "ClearStock SG",
      externalUrl: "https://example.com/clearstock-sale",
      price: 0
    },
    {
      id: "evt-003",
      title: "Handmade Flea & Vintage Market",
      category: "Flea Market",
      date: "2026-07-19",
      time: "11:00",
      venue: "Somerset Skate Park",
      description: "Local makers selling handmade crafts, vintage clothing, and vinyl.",
      organiser: "Somerset Makers Collective",
      externalUrl: "https://example.com/handmade-flea",
      price: 0
    },
    {
      id: "evt-004",
      title: "Beginner Pottery Hobby Workshop",
      category: "Hobby",
      date: "2026-07-25",
      time: "16:30",
      venue: "Studio Clay, Tiong Bahru",
      description: "Hands-on wheel-throwing session for absolute beginners. Materials included.",
      organiser: "Studio Clay",
      externalUrl: "https://example.com/pottery-workshop",
      price: 38
    },
    {
      id: "evt-005",
      title: "Student Startup Demo Night",
      category: "Student Activity",
      date: "2026-08-02",
      time: "18:30",
      venue: "LaunchLab Auditorium",
      description: "Student teams pitch their semester projects to a live audience.",
      organiser: "LaunchLab Studio",
      externalUrl: "https://example.com/demo-night",
      price: 0
    },
    {
      id: "evt-006",
      title: "Pop-Up Bubble Tea Tasting Bar",
      category: "Pop-up Sale",
      date: "2026-08-05",
      time: "12:00",
      venue: "Orchard Central Atrium",
      description: "Limited-run flavour tastings from five indie bubble tea brands.",
      organiser: "Brew Collective",
      externalUrl: "https://example.com/bbt-popup",
      price: 5
    }
  ];

  function seedIfEmpty(key, seed) {
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, JSON.stringify(seed));
    }
  }

  function init() {
    seedIfEmpty("eh_events", SEED_EVENTS);
    seedIfEmpty("eh_users", []);
    seedIfEmpty("eh_reviews", {});      // { eventId: [ {name, rating, comment, date} ] }
    seedIfEmpty("eh_favourites", []);   // array of event ids (current session user)
    seedIfEmpty("eh_reminders", []);    // array of event ids
    seedIfEmpty("eh_email_prefs", { subscribed: false, categories: [], reminders: true });
  }

  function getEvents() {
    return JSON.parse(localStorage.getItem("eh_events") || "[]");
  }

  function getEventById(id) {
    return getEvents().find(e => e.id === id);
  }

  function getCurrentUser() {
    const raw = localStorage.getItem("eh_current_user");
    return raw ? JSON.parse(raw) : null;
  }

  function setCurrentUser(user) {
    localStorage.setItem("eh_current_user", JSON.stringify(user));
  }

  function logout() {
    localStorage.removeItem("eh_current_user");
  }

  function formatDate(isoDate) {
    const d = new Date(isoDate + "T00:00:00");
    return d.toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" });
  }

  function monthShort(isoDate) {
    const d = new Date(isoDate + "T00:00:00");
    return d.toLocaleDateString("en-SG", { month: "short" }).toUpperCase();
  }

  function dayNum(isoDate) {
    const d = new Date(isoDate + "T00:00:00");
    return d.getDate();
  }

  function toast(message) {
    let el = document.querySelector(".toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "toast";
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.remove("show"), 2600);
  }

  function eventCardHTML(evt, opts = {}) {
    const href = opts.href || `event-detail.html?id=${evt.id}`;
    const priceLabel = evt.price > 0 ? `$${evt.price.toFixed(2)}` : "Free";
    return `
      <a class="event-card" href="${href}">
        <div class="event-card-date">
          <span class="month">${monthShort(evt.date)}</span>
          <span class="day">${dayNum(evt.date)}</span>
        </div>
        <div class="event-card-body">
          <span class="event-card-tag">${evt.category}</span>
          <h3 class="event-card-title">${evt.title}</h3>
          <p class="event-card-meta">${evt.venue} · ${evt.time} · ${priceLabel}</p>
        </div>
      </a>`;
  }

  function qs(param) {
    return new URLSearchParams(window.location.search).get(param);
  }

  return {
    init, getEvents, getEventById, getCurrentUser, setCurrentUser, logout,
    formatDate, monthShort, dayNum, toast, eventCardHTML, qs, SEED_EVENTS
  };
})();

EventHub.init();
