FROM node:24-alpine

RUN mkdir -p /app/data

WORKDIR /app

ENV NODE_ENV=production

COPY dist/ .

VOLUME /app/data

EXPOSE 8000

CMD [ "node", "backend/server.js" ]