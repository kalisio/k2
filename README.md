# k2

[![Latest Release](https://img.shields.io/github/v/tag/kalisio/k2?sort=semver&label=latest)](https://github.com/kalisio/k2/releases)
[![CI](https://github.com/kalisio/k2/actions/workflows/main.yaml/badge.svg)](https://github.com/kalisio/k2/actions/workflows/main.yaml)
[![Code Climate](https://codeclimate.com/github/kalisio/k2/badges/gpa.svg)](https://codeclimate.com/github/kalisio/k2)
[![Test Coverage](https://codeclimate.com/github/kalisio/k2/badges/coverage.svg)](https://codeclimate.com/github/kalisio/k2/coverage)
[![Dependency Status](https://img.shields.io/david/kalisio/k2.svg?style=flat-square)](https://david-dm.org/kalisio/k2)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

![Image](./k2.png)

A docker container that runs a 3D terrain tiles server stored as quantized meshes in MBTiles for Cesium.

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
