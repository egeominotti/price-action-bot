# https://hub.docker.com/r/mhart/alpine-node
FROM node:lts
WORKDIR /app
RUN chown -R node:node /app
COPY package*.json ./
RUN npm install
COPY . /app
CMD node manager.js
