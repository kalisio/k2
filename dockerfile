FROM node:16.17-bullseye-slim
LABEL maintainer "<contact@kalisio.xyz>"

# In case you use an apt proxy somewhere
# RUN printf "Acquire::http::Proxy \"http://pwaite:3142\";" > /etc/apt/apt.conf.d/01local-proxy

# Install curl for healthechk purpose
RUN apt-get -y update && apt-get -y install curl gdal-bin

EXPOSE 8080

ENV HOME /k2
RUN mkdir ${HOME}

COPY . ${HOME}

WORKDIR ${HOME}

RUN yarn

CMD yarn run start
