FROM node:20-slim

RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY dist ./dist

# Only install better-sqlite3 (the sole native runtime dependency)
WORKDIR /app/dist
RUN npm install
WORKDIR /app

VOLUME /app/data
ENV DATABASE_PATH=/app/data/infraview.db

EXPOSE 5000

CMD ["node", "dist/index.cjs"]
