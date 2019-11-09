FROM node:8-buster-slim
LABEL maintainer "<contact@kalisio.xyz>"

EXPOSE 8888

ENV HOME /k2
RUN mkdir ${HOME}

COPY . ${HOME}

WORKDIR ${HOME}

RUN npm install

CMD npm run start
