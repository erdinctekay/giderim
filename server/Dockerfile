FROM node:24-alpine AS deps

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:24-alpine

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json index.js ./

RUN mkdir -p /data
WORKDIR /data

ENV NODE_ENV=production

EXPOSE 4000

CMD ["node", "/app/index.js"]
