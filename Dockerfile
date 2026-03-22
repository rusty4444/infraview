FROM node:20

WORKDIR /app

COPY dist ./dist

WORKDIR /app/dist
RUN npm install
WORKDIR /app

VOLUME /app/data
ENV DATABASE_PATH=/app/data/infraview.db

EXPOSE 5000

CMD ["node", "dist/index.cjs"]
