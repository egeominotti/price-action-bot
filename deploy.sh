#! /bin/bash

docker system prune -af

docker image build -t egeominotti/bot-price-action-v2:latest .
docker push egeominotti/bot-price-action-v2:latest

docker build -t egeominotti/bot-price-action-frontend:latest ./frontend
docker push egeominotti/bot-price-action-frontend:latest

ssh root@188.34.189.183 /home/erase_engine.sh
ssh root@188.34.189.183 /home/deploy_backend.sh
ssh root@188.34.189.183 /home/deploy_frontend.sh
ssh root@188.34.189.183 docker logs bot -f
