# Price Action Bot

    ## Init bot iterate all time frame and spawn for each bot
    - node Manager.js

# Docker Compile DockerFile

    - Enable watchtower
         
        docker run --restart unless-stopped -d  \
            --name watchtower \
            -e REPO_USER=egeominotti \
            -e REPO_PASS=cevfag12 \
            -v /var/run/docker.sock:/var/run/docker.sock \
            containrrr/watchtower --interval 300 -c --include-restarting

    - Run bot

        docker run --restart unless-stopped -d  egeominotti/bot-price-action:latest

    - Compiling and Push

        docker build -t egeominotti/bot-price-action .
        docker push egeominotti/bot-price-action:latest
