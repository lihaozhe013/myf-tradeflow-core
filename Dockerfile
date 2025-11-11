FROM node:24-slim

WORKDIR /app

ENV NODE_ENV=development

COPY package*.json ./

RUN apt update \
    && apt install -y --no-install-recommends \
    python3 \
    curl \
    git \
    && apt clean \
    && rm -rf /var/lib/apt/lists/*

COPY . .

EXPOSE 8000
EXPOSE 5173