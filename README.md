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

Use a seperate yaml-file (.yml or .yaml) for each project in your config folder. All files including subfolders will be loaded for each request.

```
---
# sample.yaml
projects:
    myproject:
        jobs:
            build:
                - name: First Step
                  exec: echo 'Hello World!'
                - name: Second Step
                  exec: Build project'
```

## Usage

### Trigger Tasks

```
curl -X POST http://localhost:3000/api/exec/myproject/build
```