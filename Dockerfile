FROM node:20-slim

WORKDIR /app
COPY dist ./dist

VOLUME /app/data
ENV DATABASE_PATH=/app/data/infraview.db

EXPOSE 5000

CMD ["node", "dist/index.cjs"]
