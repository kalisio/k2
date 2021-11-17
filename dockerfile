FROM node:12.22-bullseye-slim
LABEL maintainer "<contact@kalisio.xyz>"

# Install curl for healthechk purpose
RUN apt-get -y update && apt-get -y install curl gdal-bin

EXPOSE 8080

ENV HOME /k2
RUN mkdir ${HOME}

COPY . ${HOME}

WORKDIR ${HOME}

RUN yarn

CMD yarn run start
