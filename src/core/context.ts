import process from 'node:process'
import { Options, ResolvedOptions } from '../types'
import { slash, toArray, throttle } from '@antfu/utils'
import { relative, resolve } from 'node:path'
import fg from 'fast-glob'
import { readFile } from 'node:fs/promises'
import { groupBy } from 'lodash-es'
import { createCodeKeyData } from './code-key-data'
import { createCodeIndex } from './code-index'
import { writeFile } from './file'
import { FILE_NAME_KEY_DATA_DEFAULT, FILE_NAME_TYPES } from './code/name'
import { createCodeSample } from './code-sample'

function resolveOptions(rawOptions: Options, root: string): ResolvedOptions {
  const alias = rawOptions.alias
  return {
    alias,
    entries: toArray(rawOptions.entry).map(item => {
      const entry = item
      const globs = toArray(item.globs).map(glob => slash(resolveGlobsExclude(root, glob)))
      const outDir = resolve(root, item.outDir)
      const resolver = item.resolver
      const name = item.name
      return {
        name,
        resolver,
        outDir, globs,
        generate: throttle(500, () => {
          return fg.async(globs, {
            ignore: ['node_modules'],
            onlyFiles: true,
            cwd: root,
            absolute: true
          }).then(files => {
            return Promise.all(files.map(file => {
              return readFile(file, 'utf-8')
                .then(raw => {
                  const content = JSON.parse(raw)
                  return { file, content }
                })
            }))
          }).then(items => {
            const resolved = items.map(({ file: file, content }) => {
              const fileRelative = relative(root, file)
              const result = toArray(resolver({ file: fileRelative, content }))
              return result.map(item => {
                if (!item) return
                if (typeof item === 'string') return { 
                  key: item, 
                  output: resolve(outDir, FILE_NAME_KEY_DATA_DEFAULT),
                  file
                }
                return {
                  key: item.key,
                  file,
                  output: resolve(outDir, item.output || FILE_NAME_KEY_DATA_DEFAULT)
                }
              }).filter(item => !!item)
            }).flat(1)
            const set = new Set()
            return resolved.filter(item => {
              if (set.has(item.key)) {
                // 重复提示
                return false
              }
              set.add(item.key)
              return true
            })
          }).then(items => {
            const itemsByOutput = groupBy(items, item => item.output)
            const codeIndex = createCodeIndex(name)
            const indexFilePath = resolve(outDir, FILE_NAME_TYPES)
            const sampleFilePath = resolve(outDir, 'index.ts.sample')
            const codeSample = createCodeSample({ outDir, name, globs }, { alias })
            return Promise.all([
              writeFile(indexFilePath, codeIndex),
              writeFile(sampleFilePath, codeSample),
              ...(Object.keys(itemsByOutput).map(output => {
                const outputAbsoluteByAlias = alias && indexFilePath.startsWith(alias.replacement) 
                  ? indexFilePath.replace(alias.replacement, alias.find)
                  : undefined
                const outputRelative = `${relative(output, outDir).slice(0, -1)}/${FILE_NAME_TYPES.replace(/\.d\.ts$/, '')}`
                const _output = (outputAbsoluteByAlias || outputRelative).replace(/\.d\.ts$/, '')
                const code = createCodeKeyData(_output, name, itemsByOutput[output].map(item => ({ key: item.key, value: relative(root, item.file) })))
                return writeFile(output, code)
              }))
            ])
          })
        })
      }
    })
  }
} 

function resolveGlobsExclude(root: string, glob: string) {
  const excludeReg = /^!/
  return `${excludeReg.test(glob) ? '!' : ''}${resolve(root, glob.replace(excludeReg, ''))}`
}

export class Context {
  rawOptions: Options
  options: ResolvedOptions
  root = process.cwd()

  constructor(rawOptions: Options) {
    this.rawOptions = rawOptions
    this.options = resolveOptions(this.rawOptions, this.root)
  }

  setRoot(root: string) {
    if (this.root === root) return
    this.root = root
    this.options = resolveOptions(this.rawOptions, this.root)
  }
}