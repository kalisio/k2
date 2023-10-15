# k2

[![Build Status](https://app.travis-ci.com/kalisio/k2.png?branch=master)](https://travis-ci.com/kalisio/k2)

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
