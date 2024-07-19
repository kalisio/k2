ARG DEBIAN_VERSION=bookworm
ARG NODE_VERSION=20

# Build
FROM node:${NODE_VERSION}-${DEBIAN_VERSION}-slim AS builder
ENV HOME /k2
COPY . ${HOME}
WORKDIR ${HOME}
RUN yarn

# Copy to slim image
FROM node:${NODE_VERSION}-${DEBIAN_VERSION}-slim
LABEL maintainer "<contact@kalisio.xyz>"

# In case you use an apt proxy somewhere
# RUN printf "Acquire::http::Proxy \"http://pwaite:3142\";" > /etc/apt/apt.conf.d/01local-proxy
# Install curl for healthechk purpose
# gdal-bin is required for elevation service
RUN \
  DEBIAN_FRONTEND=noninteractive && \
  apt-get update && \
  apt-get --no-install-recommends --yes install \
    curl \
    ca-certificates \
    gdal-bin && \
  apt-get clean && \
  rm -rf /var/lib/apt/lists/*

ENV HOME /k2
COPY --from=builder --chown=node:node ${HOME} ${HOME}
WORKDIR ${HOME}

EXPOSE 8080
USER node
CMD yarn run start
