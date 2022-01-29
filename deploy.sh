#! /bin/bash

docker build -t egeominotti/bot-price-action .
docker push egeominotti/bot-price-action:latest
ssh root@49.12.78.119 /home/deploy.sh
ssh root@49.12.78.119 docker ps
ssh root@49.12.78.119
