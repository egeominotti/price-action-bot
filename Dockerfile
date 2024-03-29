# https://hub.docker.com/r/mhart/alpine-node
FROM node:lts
WORKDIR /bot
RUN chown -R node:node /bot
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD node engine/bot.js
