const express = require('express')
const queue = require('fastq')

const processor = require('./processor')

const api = express.Router()
const jobQueue = queue((args, done) => processor.exec(args.config, args.projectName, args.jobName, err => done(err, undefined)), 1)

api.post('/exec/:project/:job', (req, res) => {
    const projectName = req.params.project
    const jobName = req.params.job

    processor.getConfig(projectName, (err, config) => {
        if(err !== null) {
            console.error(err)
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
            jobName: jobName
        }

        jobQueue.push(workerArgs, (err, result) => {
            if(err !== null) {
                return console.error(`[${projectName}:${jobName}] error:\n${err.toString()}`)
            } else {
                return console.log(`[${projectName}:${jobName}] done`)
            }
        })

        return res.status(200).json({ msg: 'Job will be executed asap.'})
    })
})

module.exports = api