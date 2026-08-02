#!/usr/bin/env bash
# ==========================================================================
# EventHub — remote rollout script
# OWNERSHIP: Member 3 (CI/CD)
#
# This runs ON THE SERVER, piped in over SSH by the deploy job:
#
#   ssh user@host "IMAGE=... GHCR_USER=... GHCR_TOKEN=... bash -s" < deploy.sh
#
# It is a separate file rather than a heredoc inside the YAML so that it can
# be read, reviewed, and — importantly — run by hand when a deploy goes
# wrong at 2am.
#
# Server prerequisites (one-time, done by Member 2 / Ansible):
#   - Docker installed, deploy user in the `docker` group
#   - /opt/eventhub/.env exists with the production DB and SMTP settings,
#     owned by the deploy user, chmod 600
# ==========================================================================
set -euo pipefail

CONTAINER=eventhub
ENV_FILE=/opt/eventhub/.env
HOST_PORT=80          # container's 3000 is published here
HEALTH_TIMEOUT=60     # seconds to wait for the healthcheck to go green

: "${IMAGE:?IMAGE not set}"
: "${GHCR_USER:?GHCR_USER not set}"
: "${GHCR_TOKEN:?GHCR_TOKEN not set}"

echo "==> Deploying ${IMAGE}"

# ---- 1. Remember what is currently running, so we can go back ------------
# .Config.Image is the tag the running container was started from. If nothing
# is running (first ever deploy) we record "none".
PREVIOUS=$(docker inspect --format='{{.Config.Image}}' "$CONTAINER" 2>/dev/null || echo none)
echo "==> Current image: ${PREVIOUS}"

# ---- 2. Pull the new image ----------------------------------------------
echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin
docker pull "$IMAGE"

start_container() {
  docker run -d \
    --name "$CONTAINER" \
    --restart unless-stopped \
    -p "${HOST_PORT}:3000" \
    --env-file "$ENV_FILE" \
    "$1"
}

# ---- 3. Swap ------------------------------------------------------------
docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
start_container "$IMAGE"

# ---- 4. Wait for the Dockerfile HEALTHCHECK to go green -----------------
# We trust the image's own healthcheck rather than re-inventing one here.
echo "==> Waiting for healthcheck (up to ${HEALTH_TIMEOUT}s)"
HEALTHY=0
for _ in $(seq 1 $((HEALTH_TIMEOUT / 2))); do
  STATE=$(docker inspect --format='{{.State.Health.Status}}' "$CONTAINER" 2>/dev/null || echo starting)
  if [ "$STATE" = "healthy" ]; then HEALTHY=1; break; fi
  if [ "$STATE" = "unhealthy" ]; then break; fi
  sleep 2
done

# ---- 5. Roll back if it never came up ------------------------------------
if [ "$HEALTHY" -ne 1 ]; then
  echo "!!! New container did not become healthy. Last 50 log lines:"
  docker logs --tail 50 "$CONTAINER" 2>&1 || true

  docker rm -f "$CONTAINER" >/dev/null 2>&1 || true

  if [ "$PREVIOUS" != "none" ]; then
    echo "==> Rolling back to ${PREVIOUS}"
    start_container "$PREVIOUS"
  else
    echo "!!! No previous image to roll back to — the site is DOWN."
  fi
  exit 1
fi

# ---- 6. Success ---------------------------------------------------------
echo "==> Healthy. Deploy complete: ${IMAGE}"

# Keep the previous image around for a manual rollback; prune anything older.
docker image prune -f --filter "until=168h" >/dev/null 2>&1 || true
docker logout ghcr.io >/dev/null 2>&1 || true
