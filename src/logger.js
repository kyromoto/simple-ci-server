const winston = require('winston')

const logger = winston.createLogger({
    level: 'info',
    format:  winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console()
    ]
})

const info = function (msg, correlationId) {
    logger.info(msg, { correlationId: correlationId })
}

const warn = function (msg, correlationId) {
    logger.warn(msg, { correlationId: correlationId })
}

const error = function (msg, correlationId) {
    logger.error(msg, { correlationId: correlationId })
}

const getServiceLogger = function (serviceName, defaultMeta = {}) {
    const childLogger = logger.child()
    childLogger.defaultMeta = { service: serviceName, ...defaultMeta }
    return winston.createLogger(childLogger)
}

module.exports = {
    info : info,
    warn : warn,
    error : error,
    getServiceLogger : getServiceLogger
}