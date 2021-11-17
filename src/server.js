require('dotenv').config()

const http = require('http')
const express = require('express')
const helmet = require('helmet')

const api = require('./api')

const SERVER_PORT = process.env.SERVER_PORT || 3000

const app = express()
const server = http.createServer(app)

app.use(helmet())
app.use(express.json())

app.use('/api', api)

server.listen(SERVER_PORT, () => console.log(`Server listen on port ${SERVER_PORT}`))