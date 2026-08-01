# EventHub — CI/CD Pipeline

**Owner:** Member 3 (CI/CD) · **Platform:** GitHub Actions · **Registry:** GitHub Container Registry (GHCR)

## Pipeline

```
                  ┌─────────┐
   PR or push ───▶│  lint   │──┐
                  └─────────┘  │   ┌─────────────────────┐
                               ├──▶│  build              │
                  ┌─────────┐  │   │  · docker build     │
              ───▶│  test   │──┘   │  · boot + smoke     │
                  └─────────┘      │  · Trivy scan       │
                                   │  · push to GHCR ⁽¹⁾  │
                                   └──────────┬──────────┘
                                              │ main only
                                   ┌──────────▼──────────┐
                                   │  deploy             │
                                   │  · ssh + pull       │
                                   │  · restart          │
                                   │  · auto-rollback    │
                                   └──────────┬──────────┘
                                   ┌──────────▼──────────┐
                                   │  verify             │
                                   │  · GET /healthz     │
                                   └─────────────────────┘
```

⁽¹⁾ Push, deploy and verify are skipped on pull requests. A PR proves the code is
mergeable; it never touches production.

## What each stage catches

| Stage | Catches | Typical runtime |
|---|---|---|
| `lint` | Undefined variables, duplicate object keys, unreachable code, broken EJS syntax, a committed `.env` | ~40s |
| `test` | Broken routes, broken SQL, broken auth guards — run against a real MySQL 8 container | ~90s |
| `build` | Images that build but don't boot; wrong `CMD`; app bound to loopback; missing runtime file; HIGH/CRITICAL CVEs in the base image | ~2min |
| `deploy` | — (this is the action) | ~40s |
| `verify` | Container healthy on the box but unreachable from outside (firewall, port mapping, reverse proxy) | ~10s |

## Why these choices

**A real MySQL service container, not a mock.** Every route in this project writes raw
SQL. A mocked database would let a typo in a `JOIN` sail through CI and 500 in production.
The service container is disposable and fresh on every run, so tests can't pass because of
leftover state from last time.

**Smoke test the built image, not just the source.** `npm test` proves the *code* works.
It says nothing about whether the *image* works — wrong `CMD`, a file excluded by
`.dockerignore`, or the app binding to `127.0.0.1` inside the container all pass unit tests
and fail in production. The build job starts the real image and curls it.

**Tag by commit SHA, not `latest`.** `latest` is ambiguous — you can't tell what's running
or what to go back to. The deploy pulls `ghcr.io/<org>/<repo>:<sha>`, so rollback is
`docker run` with the previous SHA, and the running container's tag tells you exactly which
commit is live.

**Automatic rollback.** `deploy.sh` records the currently running image before swapping,
waits for the new container's `HEALTHCHECK` to go green, and restores the previous image if
it doesn't. Worst case is a brief blip, not an outage that lasts until someone notices.

**Least-privilege token.** `permissions: contents: read` at the top of the workflow;
`packages: write` is granted only to the job that pushes. A compromised dependency in the
test job cannot publish an image.

## One-time setup

### 1. Repository secrets
`Settings → Secrets and variables → Actions → Secrets`

| Secret | Value |
|---|---|
| `DEPLOY_HOST` | Server IP or hostname |
| `DEPLOY_USER` | SSH user, must be in the `docker` group |
| `DEPLOY_SSH_KEY` | Private key, full PEM including `-----BEGIN`/`-----END` lines |
| `GHCR_PAT` | Classic PAT with `read:packages` — used by the *server* to pull |

`GITHUB_TOKEN` is provided automatically; it's what pushes the image.

### 2. Repository variable
`Settings → Secrets and variables → Actions → Variables`

| Variable | Value |
|---|---|
| `APP_URL` | e.g. `http://203.0.113.10` — no trailing slash |

### 3. Environment
`Settings → Environments → New environment → production`.
Add required reviewers here if you want deploys to pause for manual approval.

### 4. Server prerequisites
```bash
# Docker installed, deploy user in the docker group
sudo usermod -aG docker "$USER"

# Production config, injected at runtime — never baked into the image
sudo mkdir -p /opt/eventhub
sudo install -m 600 -o "$USER" /dev/null /opt/eventhub/.env
# then populate DB_HOST, DB_USER, DB_PASSWORD, DB_NAME,
# EMAIL_USER, EMAIL_PASS, SESSION_SECRET, PORT=3000
```

### 5. Branch protection
`Settings → Branches → Add rule` on `main`:
- Require a pull request before merging (1 approval)
- Require status checks to pass: `Lint & static checks`, `Unit & integration tests`,
  `Build, smoke test & scan image`
- Require branches to be up to date before merging

Without this, the pipeline is advisory — anyone can push straight to `main` and skip it.

## Running the pipeline locally

```bash
npm run ci        # lint + view check + tests, exactly as CI runs them
```

The tests need a database:

```bash
docker run -d --name eventhub-mysql -p 3306:3306 \
  -e MYSQL_ROOT_PASSWORD=ci-root-password -e MYSQL_DATABASE=eventhub mysql:8.0

mysql -h 127.0.0.1 -uroot -pci-root-password < database/schema.sql
mysql -h 127.0.0.1 -uroot -pci-root-password < database/migration_add_gender_field.sql
mysql -h 127.0.0.1 -uroot -pci-root-password < database/migration_add_orders_table.sql
npm run seed
```

## Manual rollback

```bash
ssh user@host
docker ps --format '{{.Image}}'                        # what's live now
docker images ghcr.io/<org>/<repo> --format '{{.Tag}}'  # what's available
docker rm -f eventhub
docker run -d --name eventhub --restart unless-stopped \
  -p 80:3000 --env-file /opt/eventhub/.env \
  ghcr.io/<org>/<repo>:<previous-sha>
```

Or re-run the workflow on the previous good commit from the Actions tab.

## Known gaps / next steps

- **Deploy is recreate, not zero-downtime.** There's a ~5 second gap while the old
  container stops and the new one starts. Fixing it properly means two containers behind
  nginx or Traefik with a health-gated cutover.
- **No database migration step in the pipeline.** Schema changes are applied by hand.
  A `migrations` table plus a runner script would close this; right now a deploy that
  needs a new column will fail its healthcheck and roll back.
- **`schema.sql` is out of date.** It doesn't contain the `gender` column or the `orders`
  table, so a fresh install from `schema.sql` alone cannot run the app. CI works around
  this by applying the two migrations explicitly. Folding them into `schema.sql` would
  remove the workaround.
- **Trivy is report-only.** `exit-code: "0"` means CVEs are listed but don't block. Flip
  to `"1"` once the base image is clean.
