# simple-ci-server

## Introduction

This is my own CI server to run on my web server. It was written to trigger build tasks of a static site generator from git hooks.

## Configuration

### Server

```
# .env
SERVER_HOST=0.0.0.0
SERVER_PORT=3000
CONFIG_PATH=configs
```

### Project

Use a seperate file for each project in your config folder. The filename reflects the projectname (case sensitive).

```
---
# sample.yaml
  jobs:
    build:
      - echo 'Hello World!'
      - echo 'Build project'
```

## Usage

### Trigger Tasks

```
curl -X POST http://localhost:3000/api/exec/sample/build
```