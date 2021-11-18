const fs = require('fs/promises')
const path = require('path')
const yaml = require('js-yaml')

const EXTENSIONS = ['.yml', '.yaml']
const CONFIGS_DIR_PATH = 'configs/test'

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

const loadAllConfigs = async function (fileList) {
    return fileList.reduce(async (config, filepath) => {
        let content = await fs.readFile(filepath)
        let parsedConfig = yaml.load(content)
        return { projects : { ... (await config).projects, ... (await parsedConfig).projects } }
    }, {})

}

async function main () {
    try {
        let fileList = await getFileList(CONFIGS_DIR_PATH)
        fileList = filterFileListByExtensions(fileList, EXTENSIONS)
        let config = await loadAllConfigs(fileList)

        console.log(JSON.stringify(config, null, 2))
    } catch(err) {
        console.error(err)
    }
}

main()