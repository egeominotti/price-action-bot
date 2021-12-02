

# Stop script on first error
set -e

IMAGE_NAME="egeominotti/bot-price-action"
IMAGE_TAG=$(git rev-parse --short HEAD) # first 7 characters of the current commit hash

echo "Building Docker image ${IMAGE_NAME}:${IMAGE_TAG}, and tagging as latest"
docker build -t "${IMAGE_NAME}:${IMAGE_TAG}" .
docker tag "${IMAGE_NAME}:${IMAGE_TAG}" "${IMAGE_NAME}:latest"

echo "Authenticating and pushing image to Docker Hub"
echo "${DOCKER_PASSWORD}" | docker login -u "${DOCKER_USERNAME}" --password-stdin
docker push "${IMAGE_NAME}:${IMAGE_TAG}"
docker push "${IMAGE_NAME}:latest"

echo "Deploying via remote SSH"
ssh root@65.21.251.19 \
  "docker pull ${IMAGE_NAME}:${IMAGE_TAG} \
  && docker stop `docker ps -qa` \
  && docker rm `docker ps -qa` \
  && docker rmi -f `docker images -qa ` \
  && docker volume rm $(docker volume ls -qf) \
  && docker network rm `docker network ls -q` \
  && docker run --restart unless-stopped -d ${IMAGE_NAME}:${IMAGE_TAG} \

echo "Successfully deployed"
