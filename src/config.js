const fs = require('fs/promises');
const path = require('path');
const yaml = require('js-yaml');

const CONFIG_PATH = path.normalize(process.env.CONFIG_PATH || 'configs')
const EXTENSIONS = ['.yml', '.yaml']

const getFileList = async function (dir) {
    let dirContent = await fs.readdir(dir, { withFileTypes: true })

    return dirContent.reduce(async (prev, curr) => {
        let resolved = path.resolve(dir, curr.name)
        let p = await prev

        if(curr.isFile()) {
            return [... p, resolved]
        } else if(curr.isDirectory()) {
            return [... p, ... await getFileList(resolved)]
        } else {
            return [... p]
        }
    }, [])
}

const filterFileListByExtensions = function (fileList = [], extensions = []) {
    return fileList.filter(file => extensions.indexOf(path.parse(file).ext.toLowerCase()) !== -1)
}

const loadConfigsFromFiles = async function (fileList) {
    return fileList.reduce(async (config, filepath) => {
        let content = await fs.readFile(filepath)
        let parsedConfig = yaml.load(content)
        return { projects : { ... (await config).projects, ... (await parsedConfig).projects } }
    }, {})
}

const getAllConfigs = function(callback) {
    getFileList(CONFIG_PATH)
        .then(fileList => filterFileListByExtensions(fileList, EXTENSIONS))
        .then(filteredFileList => loadConfigsFromFiles(filteredFileList))
        .then(config => callback(null, config))
        .catch(err => callback(err))
}

const validate = function(config) {
    if(config === undefined) {
        throw new Error('config is undefined')
    }

    if(config.projects === undefined) {
        throw new Error('config.projects is undefined')
    }

    Object.keys(config.projects).forEach(projectName => {
        if(config.projects[projectName].jobs === undefined) {
            throw new Error(`config.projects.${projectName}.jobs is undefined`)
        }

        Object.keys(config.projects[projectName].jobs).forEach(jobName => {
            if(config.projects[projectName].jobs[jobName].steps === undefined) {
                throw new Error(`config.projects.${projectName}.jobs.${jobName}.steps is undefined`)
            }

            if(!Array.isArray(config.projects[projectName].jobs[jobName].steps)) {
                throw new Error(`config.projects.${projectName}.jobs.${jobName}.steps is not an array`)
            }

            config.projects[projectName].jobs[jobName].steps.forEach((step, index) => {
                if(config.projects[projectName].jobs[jobName].steps[index].name === undefined) {
                    throw new Error(`config.projects.${projectName}.jobs.${jobName}.steps[${index}].name is undefined`)
                }

                if(config.projects[projectName].jobs[jobName].steps[index].exec === undefined) {
                    throw new Error(`config.projects.${projectName}.jobs.${jobName}.steps[${index}].exec is undefined`)
                }
            })
        })
    })
}

module.exports = {
    getAllConfigs : getAllConfigs,
    validate : validate
}