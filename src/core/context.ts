import process from 'node:process'
import Debug from 'debug'
import { Options, ResolvedOptions } from './type'
import { resolveOptions } from './resolve'
import { match, preview, print } from './entry'
import { writeFiles } from './file'
import { PACKAGE_NAME } from './static'

const debug = {
  root: Debug(`${PACKAGE_NAME}:context:root`),
  refresh: Debug(`${PACKAGE_NAME}:context:refresh`)
}

export class Context {
  rawOptions: Options
  options: ResolvedOptions
  root = process.cwd()

  constructor(options: Options) {
    this.rawOptions = options
    this.options = resolveOptions(this.rawOptions, this.root)
    debug.root('setup', this.root)
  }

  setRoot(root: string) {
    if (this.root === root) return
    debug.root('change', root)
    this.root = root
    this.options = resolveOptions(this.rawOptions, this.root)
  }

  /**
   * 1. 依据当前配置，全量扫描生成
   * 2. 依据传入文件配置生成
   */
  refresh(path?: string, mode?: 'create' | 'update' | 'delete') {
    if (path && !match(path, this.options.entries)) {
      debug.refresh('skip', 'not matched', path)
      return Promise.resolve()
    }
    debug.refresh('start', ...[path, mode].filter(Boolean))
    return print(this.options.entries, { root: this.root })
      .then(results => {
        const target = results.find(({ file }) => match(file, this.options.entries))
        if (target) {
          debug.refresh('error', `recursive call detected`, target.file)
          throw Error()
        }
        return results
      })
      .then(results => writeFiles(results))
      .then(({ done, error, cache, ok }: any) => {
        debug.refresh('done', ok 
          ? `files: ${done?.length}, updated: ${done?.length - cache.length}` 
          : `error: ${error?.length}, files: ${done?.length}, updated: ${done?.length - cache.length}`
        )
        if (error?.length) debug.refresh('done error', ...error)
      })
      .catch(() => {})
  }
}