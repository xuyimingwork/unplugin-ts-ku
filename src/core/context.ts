import process from 'node:process'
import Debug from 'debug'
import { Options, ResolvedOptions } from './type'
import { resolveOptions } from './resolve'
import { match } from './globs'
import pkg from '../../package.json'
import { readFile } from 'node:fs/promises'
import { query } from './entry'

const debug = {
  root: Debug(`${pkg.name}:context:root`),
  refresh: Debug(`${pkg.name}:context:refresh`)
}

// function resolveOptions(rawOptions: Options, root: string): ResolvedOptions {
//   const alias = rawOptions.alias
//   return {
//     alias,
//     entries: toArray(rawOptions.entry).map(item => {
//       const entry = item
//       const globs = toArray(item.globs).map(glob => slash(resolveGlobsExclude(root, glob)))
//       const outDir = resolve(root, item.outDir)
//       const resolver = item.resolver
//       const name = item.name
//       return {
//         name,
//         resolver,
//         outDir, globs,
//         generate: throttle(500, () => {
//           debug.generate('start', root)
//           return fg.async(globs, {
//             ignore: ['node_modules'],
//             onlyFiles: true,
//             cwd: root,
//             absolute: true
//           })
//             .then(files => {
//               console.log('match files', files.length)
//               debug.generate('match files', files.length)
//               return Promise.all(files.map(file => {
//                 return readFile(file, 'utf-8')
//                   .then(raw => {
//                     const content = JSON.parse(raw)
//                     return { file, content }
//                   })
//               }))
//             })
//             .then(items => {
//               const resolved = items.map(({ file: file, content }) => {
//                 const fileRelative = relative(root, file)
//                 const result = toArray(resolver({ file: fileRelative, content }))
//                 return result.map(item => {
//                   if (!item) return
//                   if (typeof item === 'string') return { 
//                     key: item, 
//                     output: resolve(outDir, FILE_NAME_KEY_DATA_DEFAULT),
//                     file
//                   }
//                   return {
//                     key: item.key,
//                     file,
//                     output: resolve(outDir, item.output || FILE_NAME_KEY_DATA_DEFAULT)
//                   }
//                 }).filter(item => !!item)
//               }).flat(1)
//               const set = new Set()
//               return resolved.filter(item => {
//                 if (set.has(item.key)) {
//                   // 重复提示
//                   return false
//                 }
//                 set.add(item.key)
//                 return true
//               })
//             })
//             .then(items => {
//               const itemsByOutput = groupBy(items, item => item.output)
//               const codeIndex = createCodeIndex(name)
//               const indexFilePath = resolve(outDir, FILE_NAME_TYPES)
//               const sampleFilePath = resolve(outDir, 'index.ts.sample')
//               return Promise.all([
//                 writeFile(indexFilePath, codeIndex),
//                 ...(Object.keys(itemsByOutput).map(output => {
//                   const outputAbsoluteByAlias = alias && indexFilePath.startsWith(alias.replacement) 
//                     ? indexFilePath.replace(alias.replacement, alias.find)
//                     : undefined
//                   const outputRelative = `${relative(output, outDir).slice(0, -1)}/${FILE_NAME_TYPES.replace(/\.d\.ts$/, '')}`
//                   const _output = (outputAbsoluteByAlias || outputRelative).replace(/\.d\.ts$/, '')
//                   const code = createCodeKeyData(_output, name, itemsByOutput[output].map(item => ({ key: item.key, value: relative(root, item.file) })))
//                   return writeFile(output, code)
//                 }))
//               ])
//             })
//             .finally(() => {
//               console.log('end')
//               debug.generate('end')
//             })
//             .catch(e => {
//               console.log('error', e)
//               debug.generate('error', e)
//             })
//         })
//       }
//     })
//   }
// } 





/**
 * entry 应该配置什么东西
 * 
 * - output 用于定义输出文件的位置，相对于 root
 * 
 * 0. entry.name => name 用于生成 ts 类型：eg. api will be ApiKey and ApiKeyMeta
 *   - name 省略，以 ku 为默认名？
 * 1. entry.output => 输出 d.ts 的位置，应该以 .d.ts 结尾
 *   - 默认以 `${name}.d.ts` 为 output，可省
 * 2. entry.globs => 需要匹配抓取的文件
 *   - 必传
 * 3. entry.resolver => 某文件应该如何生成结果
 *   - 必传
 *   - 输入 file、content、dirname、filename
 *   - 输出 key、output => output 应该以 .d.ts 结尾
 *     - key 不可省略
 *     - output 可省，省略情况下生成同名 .d.ts 文件
 * 
 * - 假定监控 api.json
 * - 生成 api.d.ts => a ts file need to be inhanced
 * - outDir 是否有必要？
 * 
 * hello.api.json
 * hello.ku.d.ts
 */



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
    if (!this.options.entries.length) {
      debug.refresh('skip', 'no entries')
      return
    }
    if (path && this.options.entries.every((entry) => !match(path, entry.globs))) {
      debug.refresh('skip', 'not matched', path, mode)
      return
    }
    debug.refresh('start', ...[path, mode].filter(Boolean))
    // 依据配置生成文件 or skip
    // 1. 总共要生成哪些文件
    // - 根类型文件 => 由 entry.output 和 entry.name
    // - meta 类型文件 => 由 entry.globs 匹配的文件产生
    // 2. 生成这些文件相关的配置

    /**
     * 步骤：
     * - 优先解析根类型文件
     * - 如果同个根类型文件有多个 entry，应该合并
     *   - 是否可以合并？Yes
     */
    /**
     * 需要划分到文件维度
     * - 文件 & 内容 & 文件间存在依赖关系
     * - 更新判断 => root 写入失败，后续是否有必要继续？无必要
     * 
     * - 多个 entry 有可能生成同一份文件
     * - 只能多个 entry 生成多个文件，不可以逐个 entry 生成
     */
    debug.refresh('output', this.options.entries.map(entry => entry.output))
    this.options.entries.forEach(entry => {
      debug.refresh('globs', entry.globs, this.root)
      query(entry, { root: this.root })
        .then(results => {
          results.map(result => debug.refresh('result', result))
        })
    })
  }
}