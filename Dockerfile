# https://hub.docker.com/r/mhart/alpine-node
FROM node:lts-alpine
WORKDIR /app
COPY ./package.json ./
RUN npm install
COPY ./ ./
RUN chmod +x  ./entrypoint.sh
ENTRYPOINT ["./entrypoint.sh"]
