# syntax=docker/dockerfile:1
# ==========================================================================
# EventHub — Production image
# OWNERSHIP: Member 2 (Dockerisation)
#
# Multi-stage build:
#   Stage 1 (deps)    installs production dependencies only
#   Stage 2 (runtime) copies them into a clean Alpine image and runs as
#                     a non-root user
#
# Build:  docker build -t eventhub:dev .
# ==========================================================================

# ---------- Stage 1: dependencies ----------
FROM node:20-alpine AS deps

WORKDIR /app

# Copy ONLY the manifests first. This layer is cached and only rebuilds when
# package.json or package-lock.json change — not on every source edit.
COPY package.json package-lock.json ./

# `npm ci` installs the exact versions pinned in package-lock.json and is
# reproducible. `npm install` can silently resolve different versions.
# `--omit=dev` skips nodemon/jest etc, which do not belong in production.
RUN npm ci --omit=dev


# ---------- Stage 2: runtime ----------
FROM node:20-alpine AS runtime

ENV NODE_ENV=production \
    PORT=3000

WORKDIR /app

# Bring in the pre-built production dependency tree from the deps stage.
# The npm cache and build tooling from stage 1 are left behind.
COPY --from=deps /app/node_modules ./node_modules

# Copy application source (see .dockerignore for what is excluded)
COPY --chown=node:node . .

# Avatar uploads are written at runtime, so this directory must exist and be
# writable by the non-root user.
RUN mkdir -p /app/public/uploads/avatars \
    && chown -R node:node /app/public/uploads

# The official node images ship an unprivileged `node` user (uid 1000).
# Running as root inside a container is a real privilege-escalation risk.
USER node

EXPOSE 3000

# Docker marks the container healthy/unhealthy based on this probe.
# docker-compose uses it for `depends_on: condition: service_healthy`.
# Shell form so ${PORT} is expanded at runtime (platforms like Railway
# inject their own PORT value).
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --spider -q "http://127.0.0.1:${PORT:-3000}/healthz" || exit 1

CMD ["node", "server.js"]
