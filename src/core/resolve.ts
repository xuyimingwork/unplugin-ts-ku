import { slash, toArray } from "@antfu/utils"
import { Options, ResolvedOptions } from "./type"
import { basename, dirname, extname, resolve } from "node:path"

function resolveGlobsExclude(root: string, glob: string) {
  const excludeReg = /^!/
  return `${excludeReg.test(glob) ? '!' : ''}${resolve(root, glob.replace(excludeReg, ''))}`
}

export function resolveOptionEntry(entry, root: string) {
  const DEFAULT_ENTRY_NAME = 'ku'
  const name = entry.name || DEFAULT_ENTRY_NAME
  const output = entry.output || `${name}.d.ts`
  return {
    name,
    output: resolve(root, output),
    globs: toArray(entry.globs).map(glob => slash(resolveGlobsExclude(root, glob))),
    resolver: (params) => {
      const { file } = params
      const result = entry.resolver(params)
      const _filename = resolve(root, file)
      const _dirname = dirname(_filename)
      const _basename = basename(_filename, extname(_filename))
      const output = resolve(_dirname, `${_basename}.d.ts`)
      if (!result) return []
      return toArray(result).map(item => {
        if (!item) return
        if (typeof item === 'string') return { key: item, output }
        return {
          key: item.key,
          output: item.output ? resolve(root, item.output) : output
        }
      }).filter(item => !!item)
    }
  }
}

export function resolveOptions(options: Options, root: string): ResolvedOptions {
  return {
    entries: toArray(options.entry).map(entry => resolveOptionEntry(entry, root))
  }
}
