# EventHub — Local Events Discovery Website

A website that helps people discover local events — student activities,
hobby gatherings, fandom events, pop-up sales, warehouse sales, and flea
markets.

**Stack:** Node.js, Express, EJS (server-rendered views), MySQL.

## Getting started

### 1. Install dependencies
```
npm install
```

### 2. Set up the database
Create a MySQL database and apply the schema:
```
mysql -u root -p -e "CREATE DATABASE eventhub"
mysql -u root -p eventhub < database/schema.sql
run the commands in migration_add_password_resets.sql. Its in the database folder. Run it in workbench
```

### 3. Configure environment variables
```
cp .env.example .env
```
Edit `.env` with your MySQL credentials and a session secret.

### 4. Seed demo data (recommended)
```
npm run seed
```
This creates an admin account, two organiser accounts, a visitor account,
six sample events (including one pre-flagged spam listing), and a couple of
open reports — so the Admin Portal has something to moderate right away.

```
Admin login:     admin@eventhub.local / admin123
Organiser login: contact@rpanimesoc.edu.sg / password123
Visitor login:   jamie.tan@example.com / password123
```

### 5. Run the app
```
npm run dev     # with nodemon, auto-restarts on changes
npm start        # plain node
```
Visit `http://localhost:3000`.

## Folder structure

```
eventhub-server/
├── server.js                  ← app entry point (SHARED)
├── config/db.js                ← MySQL connection pool (SHARED)
├── middleware/auth.js           ← login/role guards (SHARED)
├── database/
│   ├── schema.sql               ← table definitions
│   └── seed.js                  ← demo data script
├── routes/
│   ├── index.js                 Homepage (SHARED)
│   ├── auth.js                   Feature 1 — Account creation & login
│   ├── account.js                Feature 2 — Account webpage
│   ├── events.js                 Feature 3 — Event detail, reviews, reporting
│   ├── email.js                  Feature 4 — Email system
│   ├── notifications.js          Feature 5 — Notifications / reminders
│   ├── ticketing.js              Feature 6 — Ticketing
│   └── admin.js                  Feature 7 — Admin portal
├── views/
│   ├── partials/                ← header, footer, nav, event-card (SHARED)
│   ├── auth/                    Feature 1 views
│   ├── admin/                   Feature 7 views
│   └── *.ejs                    one view per other feature
└── public/
    ├── css/                     one stylesheet per feature + style.css (SHARED)
    └── js/                      one client script per feature + main.js (SHARED)
```

## Feature ownership (fill in your names)

| # | Feature | Files you own | Owner |
|---|---------|----------------|-------|
| 1 | Account creation | `routes/auth.js`, `views/auth/*.ejs`, `public/css/register.css`, `public/js/register.js` | |
| 2 | Account webpage | `routes/account.js`, `views/account.ejs`, `public/css/account.css`, `public/js/account.js` | |
| 3 | Reviews & comments | `routes/events.js`, `views/event-detail.ejs`, `public/css/reviews.css`, `public/js/reviews.js` | |
| 4 | Email system | `routes/email.js`, `views/email-preferences.ejs`, `public/css/email.css`, `public/js/email.js` | |
| 5 | Notifications (calendar reminders) | `routes/notifications.js`, `views/notifications.ejs`, `public/css/notifications.css`, `public/js/notifications.js` | |
| 6 | Ticketing | `routes/ticketing.js`, `views/ticketing.ejs`, `public/css/ticketing.css`, `public/js/ticketing.js` | |
| 7 | Admin portal | `routes/admin.js`, `views/admin/*.ejs`, `public/css/admin.css` | |

Each feature owns its **route file + view(s) + CSS + client JS**. Stick to
editing only your files whenever possible — that's what keeps everyone
pushing to the same repo from constantly hitting merge conflicts.

**Shared files** (`server.js`, `config/db.js`, `middleware/auth.js`,
`database/schema.sql`, `views/partials/*`, `public/css/style.css`,
`public/js/main.js`) are the common foundation every feature depends on. If
you need to change one, open a PR and tag the team rather than editing
directly.

## What Feature 7 (Admin Portal) covers

- **Dashboard** — account/listing counts, flagged events, open reports, a
  log of recent admin actions.
- **Manage Events** — approve, flag, or remove any event listing (handles
  "suspicious events").
- **Manage Accounts** — suspend or reactivate any account (handles "spam
  accounts"). Admins can't suspend themselves.
- **Reports queue** — every "Report" button on an event or review (Feature
  3) writes into the `reports` table; admins resolve or dismiss from here.

Access is gated by `requireRole("admin")` in `middleware/auth.js` — only
accounts with `role = 'admin'` in the database can reach `/admin/*`. There's
no self-serve way to become an admin; promote a user by updating their row
directly in MySQL (`UPDATE users SET role = 'admin' WHERE email = '...'`).

## Git workflow

1. **Branch per feature:**
   ```
   git checkout -b feature/account-creation
   git checkout -b feature/admin-portal
   ```
2. Work only inside your feature's files. Commit often with clear messages:
   ```
   git commit -m "feat(admin): add event moderation actions"
   ```
3. Push and open a Pull Request into `main`:
   ```
   git push -u origin feature/account-creation
   ```
4. Get at least one teammate to review before merging.
5. If you need to touch a shared file, call it out in your PR description.

## What's real vs. what's simplified

- **Real:** MySQL persistence for every feature, password hashing (bcrypt),
  session-based auth, role-based access control, server-rendered
  search/filter, star ratings, a working `.ics` calendar download, the
  browser Notification permission flow, and a fully functional admin
  moderation workflow.
- **Simplified for the prototype:** the "verified organisation email" check
  is a domain heuristic, not real email verification; ticketing hands off to
  an external link rather than processing payment; a suspended user's
  active session isn't force-logged-out until they log in again (each login
  re-checks status, but an existing session doesn't).

## Next steps for Phase 2 (DevOps)

- **Docker:** containerise the Node app; use a second container (or managed
  service) for MySQL; wire them together with Docker Compose.
- **CI/CD:** GitHub Actions can run `npm install` + a lint/test step on
  every PR, then deploy `main` automatically.
- **Config:** `.env` is already separated from code, so environment-specific
  secrets can be injected by the pipeline instead of committed.
