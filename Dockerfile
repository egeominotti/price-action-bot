# https://hub.docker.com/r/mhart/alpine-node
FROM node:lts-alpine3.14
WORKDIR /bot
RUN chown -R node:node /bot
COPY package*.json ./
RUN npm install
COPY . .
CMD node manager.js
