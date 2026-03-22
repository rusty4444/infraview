FROM node:20-alpine

WORKDIR /app

COPY dist ./dist
COPY package.json package-lock.json ./

RUN npm ci --omit=dev --maxsockets 5 && npm cache clean --force

VOLUME /app/data
ENV DATABASE_PATH=/app/data/infraview.db

EXPOSE 5000

CMD ["node", "dist/index.cjs"]
