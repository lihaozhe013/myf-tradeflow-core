FROM node:24-alpine

WORKDIR /app

ENV NODE_ENV=development

COPY package*.json ./

RUN apk add --no-cache python3 build-base sqlite-dev

COPY . .

EXPOSE 8000
EXPOSE 5173

CMD [ "npm", "run", "dev" ]