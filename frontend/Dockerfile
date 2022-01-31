# https://hub.docker.com/r/mhart/alpine-node
# Nodejs
FROM node:lts-alpine AS build-stage
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install
COPY . .
RUN yarn build --mode production && yarn cache clean

# https://hub.docker.com/r/yobasystems/alpine-nginx/

FROM nginx:stable-alpine AS production-stage
WORKDIR /usr/share/nginx/html
RUN rm -rf ./*
COPY --from=build-stage /app/dist .
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
EXPOSE 80
ENTRYPOINT ["/entrypoint.sh"]
