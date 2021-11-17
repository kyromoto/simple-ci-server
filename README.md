# simple-ci-server

## .env

```SERVER_PORT=3000
CONFIG_PATH=configs
```

## project configuration

Use a seperate file for each project in your config folder. The filename reflects the projectname (case sensitive).

```---
# sample.yaml
  jobs:
    build:
      - echo 'Hello World!'
      - echo 'Build project'
```