# EventHub — Local Events Discovery Website

A prototype/skeleton for a website that helps people discover local events —
student activities, hobby gatherings, fandom events, pop-up sales, warehouse
sales, and flea markets.

This is a **static HTML/CSS/JS prototype**. There's no real backend yet —
data is mocked and stored in the browser's `localStorage` so every feature is
clickable and demoable. Swap in a real API/database in Phase 2 without
changing the page structure.

## Running it locally

No build step needed. Either:
- Open `index.html` directly in a browser, or
- Serve it locally so relative paths behave consistently:
  ```
  python3 -m http.server 8000
  ```
  then visit `http://localhost:8000`

## Folder structure

```
eventhub/
├── index.html                 ← homepage (browse/search/filter events)
├── css/
│   ├── style.css               ← shared design system (SHARED — see below)
│   ├── register.css             Feature 1
│   ├── account.css              Feature 2
│   ├── reviews.css               Feature 3
│   ├── email.css                Feature 4
│   ├── notifications.css        Feature 5
│   └── ticketing.css            Feature 6
├── js/
│   ├── main.js                 ← shared utils + mock data (SHARED)
│   ├── event-detail.js         ← shared event page renderer (SHARED)
│   ├── register.js              Feature 1
│   ├── account.js               Feature 2
│   ├── reviews.js                Feature 3
│   ├── email.js                Feature 4
│   ├── notifications.js         Feature 5
│   └── ticketing.js             Feature 6
└── pages/
    ├── register.html            Feature 1 — Account creation
    ├── account.html             Feature 2 — Account webpage
    ├── event-detail.html        Feature 3 — Reviews & comments live here
    ├── email-preferences.html   Feature 4 — Email system
    ├── notifications.html       Feature 5 — Notifications / calendar reminders
    └── ticketing.html           Feature 6 — Ticketing
```

## Feature ownership (fill in your names)

| # | Feature | Files you own | Owner |
|---|---------|----------------|-------|
| 1 | Account creation | `pages/register.html`, `css/register.css`, `js/register.js` | |
| 2 | Account webpage | `pages/account.html`, `css/account.css`, `js/account.js` | |
| 3 | Reviews & comments | `pages/event-detail.html`, `css/reviews.css`, `js/reviews.js` | |
| 4 | Email system | `pages/email-preferences.html`, `css/email.css`, `js/email.js` | |
| 5 | Notifications (calendar reminders) | `pages/notifications.html`, `css/notifications.css`, `js/notifications.js` | |
| 6 | Ticketing | `pages/ticketing.html`, `css/ticketing.css`, `js/ticketing.js` | |

Each feature gets its **own HTML page + its own CSS file + its own JS file**.
Stick to editing only your three files whenever possible — that's what keeps
six people pushing to the same repo from constantly hitting merge conflicts.

**Shared files** (`index.html`, `css/style.css`, `js/main.js`,
`js/event-detail.js`) are the common foundation everyone's pages depend on
(design tokens, nav/footer, buttons, the event card component, mock data).
Whoever's on homepage/foundation duty owns edits here — if anyone else needs
a change, open a PR and tag them rather than editing directly.

## Git workflow

1. **Branch per feature**, not per person-in-general:
   ```
   git checkout -b feature/account-creation
   git checkout -b feature/reviews
   git checkout -b feature/ticketing
   ```
2. Work only inside your feature's three files. Commit often with clear
   messages:
   ```
   git commit -m "feat(register): add organiser email validation"
   ```
3. Push your branch and open a Pull Request into `main`:
   ```
   git push -u origin feature/account-creation
   ```
4. Get at least one teammate to review before merging — this is what your
   rubric means by "demonstrate proper use of commits / branching / pull
   requests."
5. If you *do* need to touch a shared file, call it out in your PR
   description so the team knows to double check nothing broke elsewhere.

## What's mocked vs. real right now

- **Real:** all UI, forms, validation, filtering/search, star ratings,
  review posting, calendar `.ics` file download, browser Notification API
  permission prompt.
- **Mocked (swap for a backend later):** account creation/login (no real
  auth), event storage (`localStorage` instead of a database), the
  "organisation email" check (a simple domain heuristic, not real
  verification), ticketing (hands off to an external link rather than
  processing payment).

## Next steps for Phase 2 (DevOps)

This structure is deliberately simple so it's easy to:
- Containerise with Docker (a single static-file server, e.g. `nginx`, can
  serve the whole `eventhub/` folder)
- Wire into a CI/CD pipeline (GitHub Actions can lint/build on every PR,
  then deploy `main` automatically)
- Later split into real services (auth API, events API, email service) once
  each feature owner is ready to replace their `localStorage` calls with
  real `fetch()` calls to a backend.
