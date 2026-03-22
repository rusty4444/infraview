# ─── Build Stage (Debian for reliable npm ci) ────
FROM node:20-slim AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --maxsockets 5

COPY . .
RUN node script/build.mjs

# ─── Runtime Stage (Alpine for small image) ──────
FROM node:20-alpine AS runtime

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json

RUN npm ci --omit=dev --maxsockets 5 && npm cache clean --force

VOLUME /app/data
ENV DATABASE_PATH=/app/data/infraview.db

EXPOSE 5000

CMD ["node", "dist/index.cjs"]
