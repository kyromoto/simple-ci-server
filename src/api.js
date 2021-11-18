const express = require('express')
const queue = require('fastq')
const uuid = require('uuid').v4

const logger = require('./logger')
const jobExecutor = require('./jobExecutor')
const configlib = require('./configlib')

const jobQueueHandler = function (args, done) {
    jobExecutor.run(
        args.config,
        args.projectName,
        args.jobName,
        args.correlationId,
        err => done(err, undefined)
    )
}

const jobQueue = queue(jobQueueHandler, 1)
const api = express.Router()

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

    requestLogger.info(`New job request for ${projectName}:${jobName}`, loggerMetadata)

    configlib.getAllConfigs((err, config) => {
        if(err !== null) {
            requestLogger.error(err.message)
            return res.status(500).json({ error: 'Internal error occured' })
        }

        try {
            config.validate(config)
        } catch(validationError) {
            requestLogger.error("config validation error: " + validationError.message)
            return res.status(500).json({ error: 'Internal error occured' })
        }

        if(config.projects[projectName] === undefined) {
            const ProjectNotFoundError = new Error('Project not found')
            requestLogger.warn(ProjectNotFoundError.message)
            return res.status(404).json({ error: ProjectNotFoundError.message })
        }

        if(config.projects[projectName].jobs[jobName] === undefined) {
            const JobNotFoundError = new Error('Job not found')
            requestLogger.warn(JobNotFoundError.message)
            return res.status(404).json({ error: JobNotFoundError.message })
        }

        let workerArgs = {
            config: config,
            projectName: projectName,
            jobName: jobName,
            correlationId: correlationId
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