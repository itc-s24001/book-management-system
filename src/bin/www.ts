#!/usr/bin/env node

import app from '../app.js'
import debug from 'debug'
import http from 'node:http'

const logger = debug('book-management-system:server')

const port = await normalizePort(process.env.PORT || '3000')
app.set('port', port)

const server = http.createServer(app)

server.listen(port)
server.on('error', onError)
server.on('listening', onListening)

async function normalizePort(val: string) {
    const port = parseInt(val, 10)

    if (isNaN(port)) {
        return val
    }

    if (port >= 0) {
        return port
    }

    return false
}

async function onError<T extends Object>(error: T & Error) {
    if ('syscall' in error && error.syscall !== 'listen') {
        throw error
    }

    const bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`

    switch ('code' in error && error.code) {
        case 'EACCES':
            console.error(`${bind} requires elevated privileges`)
            process.exit(1)
            break
        case 'EADDRINUSE':
            console.error(`${bind} is already in use`)
            process.exit(1)
            break
        default:
            throw error
    }
}

async function onListening() {
    const addr = server.address()
    const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr?.port}`
    logger(`Listening on ${bind}`)
    console.log(`Server running on http://localhost:${addr?.port}`)
}