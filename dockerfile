FROM node:8-stretch

MAINTAINER Kalisio <contact@kalisio.xyz>

ARG VERSION
ENV BRANCH=v$VERSION

RUN echo "Building K2 $BRANCH"

EXPOSE 8888

ENV HOME /k2
RUN mkdir ${HOME}

COPY . ${HOME}

WORKDIR ${HOME}

RUN npm install

CMD npm run start
