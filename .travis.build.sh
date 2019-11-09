#!/bin/bash
source .travis.env.sh

echo Building K2 $TAG

docker build -t kalisio/k2:$TAG .

docker login -u="$DOCKER_USER" -p="$DOCKER_PASSWORD"
docker push kalisio/k2:$VERSION
