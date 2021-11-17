const fs = require('fs/promises');
const path = require('path');
const childProcess = require('child_process')
const yaml = require('js-yaml');

const CONFIG_PATH = path.normalize(process.env.CONFIG_PATH || 'configs')

const exec = function (config, projectName, jobName, callback) {
    execJobStep(
        config.jobs[jobName],
        config.jobs[jobName].length,
        data => console.log(`[${projectName}:${jobName}] ${data}`),
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

    process.stdout.on('data', data => msg(`[${currentStep}/${stepsTotal}] ${data}`))
    process.stderr.on('data', data => msg(`[${currentStep}/${stepsTotal}] ${data}`))

    process.on('exit', code => {
        msg(`[${currentStep}/${stepsTotal}] exit ${code}`)

        if(code !== 0) {
            return callback(new Error(`exit code ${code}`))
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
        console.log('config is undefined')
        return false
    }

    if(config.jobs === undefined) {
        console.log('config.jobs is undefined')
        return false
    }

    Object.keys(config.jobs).forEach(key => {
        if(!Array.isArray(config.jobs[key])) {
            console.log(`config.jobs.${key} is not an array`)
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