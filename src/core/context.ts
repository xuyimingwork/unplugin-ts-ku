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
    print(this.options.entries, { root: this.root })
      .then(results => writeFiles(results))
  }
}