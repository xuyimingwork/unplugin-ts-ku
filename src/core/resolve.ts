import { slash, toArray } from "@antfu/utils"
import { OptionEntry, Options, ResolvedOptionEntry, ResolvedOptions } from "./type"
import { relative, resolve } from "node:path"
import { getNameOfBase } from "./name"
import { trim } from "lodash-es"
import { ENTRY_NAME_DEFAULT } from "./static"

function resolveGlobsExclude(root: string, glob: string) {
  const excludeReg = /^!/
  return `${excludeReg.test(glob) ? '!' : ''}${resolve(root, glob.replace(excludeReg, ''))}`
}

export function resolveOptionEntry(entry: OptionEntry, root: string): ResolvedOptionEntry {
  const names = toArray(entry.name).map(name => getNameOfBase(name)).filter(name => !!name)
  if (!names.length) names.push(ENTRY_NAME_DEFAULT)
  const output = trim(entry.output) || `${ENTRY_NAME_DEFAULT}.d.ts`
  const rootOutput = resolve(root, output)
  return {
    names,
    output: rootOutput,
    globs: toArray(entry.globs).map(glob => slash(resolveGlobsExclude(root, glob))),
    skipContent: !!entry.skipContent,
    resolver: (params) => {
      try {
        const result = entry.resolver({ 
          ...params, 
          file: relative(root, params.file) 
        })
        if (!result) return []
        return toArray(result).map(item => {
          if (!item) return
          if (typeof item === 'string') return { key: item, output: rootOutput, name: names[0] }
          const output = trim(item.output)
          const ext = '.d.ts'
          return {
            key: item.key,
            name: getNameOfBase(item.name, names[0]),
            output: output && output.length > ext.length && output.endsWith(ext) ? resolve(root, item.output) : rootOutput
          }
        }).filter(item => !!item)
      } catch (e) {
        // 执行用户侧 resolver 失败，本次不生成内容
        // TODO: 输出错误日志
        return []
      }
    }
  }
}

export function resolveOptions(options: Options, root: string): ResolvedOptions {
  return {
    entries: toArray(options.entry).map(entry => resolveOptionEntry(entry, root))
  }
}
