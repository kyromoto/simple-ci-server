const fs = require('fs/promises');
const path = require('path');
const childProcess = require('child_process')
const yaml = require('js-yaml');
const logger = require('./logger')

const CONFIG_PATH = path.normalize(process.env.CONFIG_PATH || 'configs')

const processorLogger = logger.getServiceLogger('processor')

const exec = function (config, projectName, jobName, loggerMetadata, callback) {
    execJobStep(
        config.jobs[jobName],
        config.jobs[jobName].length,
        data => processorLogger.info(data.msg, { ...loggerMetadata, ...data.meta }),
        err => callback(err)
    )
}

const execJobStep = function(steps, stepsTotal, msg, callback) {
    if(steps.length <= 0) {
        return callback(null)
    }

    let stepsDeepCopy = [...steps]
    let process = childProcess.exec(stepsDeepCopy.shift())
    let currentStep = stepsTotal - stepsDeepCopy.length

    process.on('error', err => {
        return callback(err)
    })

    const loggerMetadata =  { meta: { jobCurrentStep: currentStep, jobTotalsSteps: stepsTotal } }

    process.stdout.on('data', data => msg({ ...loggerMetadata, msg: data}))
    process.stderr.on('data', data => msg({ ...loggerMetadata, msg: data}))

    process.on('exit', code => {
        msg({ ...loggerMetadata, msg: `step exit code: ${code}`})

        if(code !== 0) {
            return callback(new Error(`step exit code: ${code}`))
        } else {
            return execJobStep(stepsDeepCopy, stepsTotal, msg, callback)
        }
    })
}

const getConfig = async function(projectName, callback) {
    try {
        let dirEntrys = await fs.readdir(CONFIG_PATH)
        let filename = dirEntrys.find(entry => path.parse(entry).name === projectName)
    
        if(filename === undefined) {
            return callback(null, undefined)
        }
    
        let filecontent = await fs.readFile(path.normalize(path.join(CONFIG_PATH, filename)))
        let config = yaml.load(filecontent)
    
        return callback(null, config)
    } catch(err) {
        return callback(err)
    }
}

const isConfigValid = function(config) {
    if(config === undefined) {
        processorLogger.info('config is undefined')
        return false
    }

    if(config.jobs === undefined) {
        processorLogger.info('config.jobs is undefined')
        return false
    }

    Object.keys(config.jobs).forEach(key => {
        if(!Array.isArray(config.jobs[key])) {
            processorLogger.info(`config.jobs.${key} is not an array`)
            return false
        }
    })

    return true
}

module.exports = {
    exec : exec,
    getConfig : getConfig,
    isConfigValid : isConfigValid
}