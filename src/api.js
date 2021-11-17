const express = require('express')
const queue = require('fastq')
const uuid = require('uuid').v4
const winston = require('winston')

const logger = require('./logger')
const processor = require('./processor')

const api = express.Router()
const jobQueue = queue((args, done) => processor.exec(args.config, args.projectName, args.jobName, args.loggerMetadata, err => done(err, undefined)), 1)

api.post('/exec/:project/:job', (req, res) => {
    const projectName = req.params.project
    const jobName = req.params.job

    const correlationId = uuid()
    const loggerMetadata = {
        project: projectName,
        job: jobName,
        correlationId: correlationId
    }
    const requestLogger = logger.getServiceLogger('api', loggerMetadata)

    requestLogger.info(`New job request for ${projectName}:${jobName}`)

    processor.getConfig(projectName, (err, config) => {
        if(err !== null) {
            requestLogger.error(err.message)
            return res.status(500).json({ error: 'Internal error occured' })
        }

        if(config === undefined) {
            return res.status(404).json({ error: 'Project not found' })
        }

        if(!processor.isConfigValid(config)) {
            return res.status(500).json({ error: 'Project config not valid' })
        }

        if(config.jobs[jobName] === undefined) {
            return res.status(404).json({ error: 'Job not found' })
        }

        let workerArgs = {
            config: config,
            projectName: projectName,
            jobName: jobName,
            loggerMetadata: loggerMetadata
        }

        jobQueue.push(workerArgs, (err, result) => {
            if(err !== null) {
                return requestLogger.error(err.message);
            } else {
                return requestLogger.info('done')
            }
        })

        return res.status(200).json({ msg: 'Job will be executed asap.'})
    })
})

module.exports = api