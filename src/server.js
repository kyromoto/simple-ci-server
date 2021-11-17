require('dotenv').config()

const http = require('http')
const express = require('express')
const helmet = require('helmet')

const api = require('./api')
const logger = require('./logger')

const SERVER_HOST = process.env.SERVER_HOST || '0.0.0.0'
const SERVER_PORT = process.env.SERVER_PORT || 3000

const serverLogger = logger.getServiceLogger('server')
const app = express()
const server = http.createServer(app)

app.use(helmet())
app.use(express.json())

app.use('/api', api)

server.listen(SERVER_PORT, SERVER_HOST, () => serverLogger.info(`Server listen on ${SERVER_HOST}:${SERVER_PORT}`))