import { slash, toArray } from "@antfu/utils"
import { Options, ResolvedOptions } from "./type"
import { resolve } from "node:path"
import { getNameOfBase } from "./code/name"

function resolveGlobsExclude(root: string, glob: string) {
  const excludeReg = /^!/
  return `${excludeReg.test(glob) ? '!' : ''}${resolve(root, glob.replace(excludeReg, ''))}`
}

export function resolveOptionEntry(entry, root: string) {
  const name = getNameOfBase(entry.name)
  const output = entry.output || `${name}.d.ts`
  const rootOutput = resolve(root, output)
  return {
    name,
    output: rootOutput,
    globs: toArray(entry.globs).map(glob => slash(resolveGlobsExclude(root, glob))),
    resolver: (params) => {
      const result = entry.resolver(params)
      if (!result) return []
      return toArray(result).map(item => {
        if (!item) return
        if (typeof item === 'string') return { key: item, output: rootOutput }
        return {
          key: item.key,
          output: typeof item.output === 'string' ? resolve(root, item.output) : rootOutput
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
