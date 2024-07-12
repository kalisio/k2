# k2

[![Latest Release](https://img.shields.io/github/v/tag/kalisio/k2?sort=semver&label=latest)](https://github.com/kalisio/k2/releases)
[![CI](https://github.com/kalisio/k2/actions/workflows/main.yaml/badge.svg)](https://github.com/kalisio/k2/actions/workflows/main.yaml)
[![Code Climate](https://codeclimate.com/github/kalisio/k2/badges/gpa.svg)](https://codeclimate.com/github/kalisio/k2)
[![Test Coverage](https://codeclimate.com/github/kalisio/k2/badges/coverage.svg)](https://codeclimate.com/github/kalisio/k2/coverage)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

![Image](./k2.png)

A docker container that runs a 3D terrain tiles server stored as quantized meshes in MBTiles for Cesium.

## API

### /healthcheck (GET)

Check for service's health, return a json object with a single member `isRunning`.

### /:z/:x/:y.terrain (GET)

Get an individual tile from the MBTile table (ie. the tile located at `x`,`y`,`z`).

### /layer.json (GET)

Return layer metadata in json format.

### /elevation?resolution=res (POST)

Request an elevation profile computation over the given GeoJSON feature.
The `POST` body must contain the GeoJSON to use as elevation profile source. If the GeoJSON is a `FeatureCollection`, then only the first feature will be used in the computation.

The following query parameters are available :

| Name            | Description                                                                                                                                                       | Default value |
|-----------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------|
| `resolution`    | Interval, in meters, between two elevation samples over the profile source.                                                                                       | `30` meters   |
| `concurrency`   | How many segments will be computed in parallel server side.                                                                                                       | `4`           |
| `demOverride`   | The name of an elevation dataset to use. k2 will auto select a dataset if empty.                                                                                  | `""`          |
| `corridorWidth` | The width, in meters, of an imaginary corridor to consider while sampling elevation. The computed elevation will be the max elevation of all the covered samples. | `0`           |

> [!IMPORTANT]
> The elevation computation will set to `0` any source sample whith a `nodata` value.

## Building

### Manual build 

You can build the image with the following command:

```bash
docker build -t <your-image-name> .
```

### Automatic build using Travis CI

This project is configured to use Travis to build and push the image on the Kalisio's Docker Hub.
The built image is tagged using the `version` property in the `package.json` file.

To enable Travis to do the job, you must define the following variable in the corresponding Travis project:

| Variable  | Description |
|-----------| ------------|
| `DOCKER_USER` | your username |
| `DOCKER_PASSWORD` | your password |

## Deploying

This image is designed to be deployed using the [Kargo](https://kalisio.github.io/kargo/) project.

Check out the [compose file](https://github.com/kalisio/kargo/blob/master/deploy/k2.yml) to have an overview on how the container is deployed.

## Contributing

Please read the [Contributing file](./.github/CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

## Versioning

We use [SemVer](https://semver.org/) for versioning. For the versions available, see the tags on this repository.

When releasing a patch, minor or major version, i.e. the following tasks have to be done:
- increase the package version number in the package.json file
- create a tag accordingly in the git repository and push it

The command `npm run release:<type>`, where  `<type>` is either `patch`, `minor` or `major`, will do the job for you ! 

## Authors

This project is sponsored by 

![Kalisio](https://s3.eu-central-1.amazonaws.com/kalisioscope/kalisio/kalisio-logo-black-256x84.png)

## License

This project is licensed under the MIT License - see the [license file](./LICENSE.md) for details
