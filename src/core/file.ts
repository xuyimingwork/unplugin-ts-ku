import { readFile, writeFile as _writeFile, access } from 'node:fs/promises'

export function isFileExists(file) {
  return access(file).then(() => true).catch(() => false)
}

export function isSameFile(file: string, content: string) {
  return isFileExists(file)
    .then(exists => {
      if (!exists) return false
      return readFile(file, 'utf-8')
        .then(_content => _content === content)
    })
}

export function writeFile(file: string, content: string) {
  const _content = `// 本文件由 json-mapx 自动生成，请勿手动修改\n\n${content}`
  return isSameFile(file, _content)
    .then(isSame => {
      if (isSame) return
      return _writeFile(file, _content)
    })
}