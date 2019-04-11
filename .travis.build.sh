#!/bin/bash
source .travis.env.sh

echo Building K2 $VERSION

docker build -t kalisio/k2 .
docker tag kalisio/k2 kalisio/k2:$VERSION
docker login -u="$DOCKER_USER" -p="$DOCKER_PASSWORD"
docker push kalisio/k2:$VERSION
