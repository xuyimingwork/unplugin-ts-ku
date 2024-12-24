import { readFile, writeFile as _writeFile, access } from 'node:fs/promises'
import pkg from '../../package.json'

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
  const _content = `// 本文件由 ${pkg.name} 自动生成，请勿手动修改\n\n${content}`
  return isSameFile(file, _content)
    .then(isSame => {
      if (isSame) return
      return _writeFile(file, _content)
    })
}

export function writeFiles(files: Array<{ file: string, content: string, deps?: string[] }>) {
  const done = new Set()
  const error = new Set()
  function getNextFiles() {
    if (!done.size) return files.filter(({ deps }) => !deps || !deps.length)
    return files.filter(({ deps, file }) => !done.has(file) && !error.has(file) && deps?.every(dep => done.has(dep)))
  }
  return new Promise((resolve, reject) => {
    function next() {
      const nextFiles = getNextFiles()
      if (!nextFiles.length) return resolve({
        done: Array.from(done),
        error: Array.from(error),
        ok: done.size === files.length
      })
      Promise.all(nextFiles.map(({ file, content }) => {
        return writeFile(file, content)
          .then(() => {
            done.add(file)
          })
          .catch((err) => error.add(file))
      }))
        .finally(next)
    }
    next()
  })
}