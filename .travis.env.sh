#!/bin/bash

# Build docker with version number only on release
if [[ -z "$TRAVIS_TAG" ]]
then
	export TAG=latest
else
	export TAG=$(node -p -e "require('./package.json').version")
fi