# https://hub.docker.com/r/mhart/alpine-node
FROM node:lts-alpine
WORKDIR /bot
COPY app/package.json app/yarn.lock ./
RUN npm install
COPY /bot .


