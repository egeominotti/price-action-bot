#! /bin/bash

docker system prune -af

docker image build -t egeominotti/bot-price-action:latest .
docker push egeominotti/bot-price-action:latest

docker build -t egeominotti/bot-price-action-frontend:latest ./frontend
docker push egeominotti/bot-price-action-frontend:latest

ssh root@49.12.78.119 /home/erase_engine.sh
ssh root@49.12.78.119 /home/deploy_backend.sh
ssh root@49.12.78.119 /home/deploy_frontend.sh
ssh root@49.12.78.119 docker logs bot -f
