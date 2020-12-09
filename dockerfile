FROM node:12.16-buster-slim
LABEL maintainer "<contact@kalisio.xyz>"

RUN apt-get -y update && apt-get -y install curl

EXPOSE 8080

ENV HOME /k2
RUN mkdir ${HOME}

COPY . ${HOME}

WORKDIR ${HOME}

RUN yarn

CMD npm run start
