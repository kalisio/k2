FROM node:8-buster-slim
LABEL maintainer "<contact@kalisio.xyz>"

EXPOSE 8080

ENV HOME /k2
RUN mkdir ${HOME}

COPY . ${HOME}

WORKDIR ${HOME}

RUN yarn

CMD npm run start
