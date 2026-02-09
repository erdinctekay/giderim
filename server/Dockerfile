FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY index.js ./

RUN mkdir -p /data
WORKDIR /data

ENV NODE_ENV=production

EXPOSE 4000

CMD ["node", "/app/index.js"]
