# https://hub.docker.com/r/mhart/alpine-node
FROM node:lts
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . /usr/src/app
#COPY entrypoint.sh /entrypoint.sh
RUN chmod +x ./entrypoint.sh
ENTRYPOINT ["./entrypoint.sh"]
