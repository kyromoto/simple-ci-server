const fs = require('fs/promises');
const path = require('path');
const childProcess = require('child_process')
const yaml = require('js-yaml');
const logger = require('./logger')

const processorLogger = logger.getServiceLogger('jobexec')

const run = function (config, projectName, jobName, correlationId, callback) {
    let loggerMetadata = { project: projectName, job: jobName, correlationId: correlationId }
    let steps = config.projects[projectName].jobs[jobName].steps
    let startStep = 0
    
    processorLogger.info(`ExecJob ${projectName}:${jobName}`, loggerMetadata)

    let onMessageHandler = (currentStepIndex, stderr, stdout) => {
        let loggerMetadataCombined = { ... loggerMetadata, stepName: steps[currentStepIndex].name, currentStep: currentStepIndex + 1, totlalSteps: steps.length }
        if(stderr !== undefined) {
            processorLogger.warn(stderr, loggerMetadataCombined)
        }

        if(stdout !== undefined) {
            processorLogger.info(stdout, loggerMetadataCombined)
        }
    }

    let doneHandler = err => callback(err)

    execJobStep(steps, startStep, onMessageHandler, doneHandler)
}

const execJobStep = function(steps = [], step = 0, messageHandler, done) {
    if(step >= steps.length) {
        return done(null)
    }

    let process = childProcess.exec(steps[step].exec)

    process.stdout.on('data', data => messageHandler(step, undefined, data))
    process.stderr.on('data', data => messageHandler(step, data, undefined))
    process.on('error', err => done(err))
    process.on('exit', code => {
        if(code !== 0) {
            return done(new Error(`Job exit code ${code}`))
        } else {
            return execJobStep(steps, step + 1, messageHandler, done)
        }
    })
}

module.exports = {
   run : run
}