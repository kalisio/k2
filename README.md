# k-maputnik

[![Build Status](https://travis-ci.org/kalisio/k-maputnik.png?branch=master)](https://travis-ci.org/kalisio/k-maputnik)

A docker container that runs the [Maputnik](https://github.com/maputnik/editor) application, notably allows for version management and fixes [this issue](https://github.com/maputnik/editor/issues/301).

> This project is influenced by the project docker recipe

## Building

### Manual build 

To build the image, you are required to define the following variables:

| Variable  | Description |
|-----------| ------------|
| `MAPUTNIK_VERSION` | the Maputnik version you want to build |

Then you can build the image with the following command:

```bash
export MAPUTNIK_VERSION=1.4.0
docker build --build-arg VERSION=$MAPUTNIK_VERSION -t <your-image-name> .
```

### Automatic build using Travis CI

This project is configured to use Travis to build and push the image on the Kalisio's Docker Hub.
The built image is tagged using the `version` property in the `package.json` file.

To enable Travis to do the job, you must define the following variable in the corresponding Travis project:

| Variable  | Description |
|-----------| ------------|
| `MAPUTNIK_VERSION` | `1.4.0` |
| `DOCKER_USER` | your username |
| `DOCKER_PASSWORD` | your password |

## Deploying

This image is designed to be deployed using the [Kargo](https://kalisio.github.io/kargo/) project.

Check out the [compose file](https://github.com/kalisio/kargo/blob/master/deploy/maputnik.yml) to have an overview on how the container is deployed.

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
